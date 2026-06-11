# Stack Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace NextAuth.js with Clerk (Google + GitHub + Email/password) and replace Howler.js with Web Audio API (parity + smooth 300ms fades).

**Architecture:** Sequential two-part migration in one branch. Part 1 (Clerk) completes and builds cleanly before Part 2 (Web Audio API) begins. tRPC context changes from `{ session, user }` to `{ userId: string | null }`. A singleton `AudioEngine` class owns all Web Audio nodes; Zustand store and hook only call its methods.

**Tech Stack:** `@clerk/nextjs`, `Web Audio API` (browser-native), Next.js 16 App Router, tRPC, Prisma + PostgreSQL, Zustand, TypeScript

**Verification commands:**
- Type-check: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`

---

## PART 1 — CLERK MIGRATION

---

### Task 1: Install Clerk, remove NextAuth dependencies

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install Clerk and remove NextAuth packages**

```bash
npm install @clerk/nextjs
npm uninstall next-auth @auth/prisma-adapter
```

- [ ] **Step 2: Update `.env.example`**

Replace the `# NextAuth` block with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jefocus?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

- [ ] **Step 3: Verify no stale next-auth imports (should be empty)**

```bash
grep -r "next-auth\|@auth/prisma" src/ --include="*.ts" --include="*.tsx"
```

Expected: only `src/lib/auth.ts` and `src/app/api/auth` and `src/app/providers.tsx` and `src/components/ui/nav-bar.tsx` — those are handled in later tasks.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: swap next-auth for @clerk/nextjs, update env template"
```

---

### Task 2: Update Prisma schema — remove NextAuth tables

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` with Clerk-compatible schema**

Remove `Account`, `Session`, `VerificationToken` models. Simplify `User` (drop `emailVerified`, `accounts`, `sessions` relations):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String   @id
  name      String?
  email     String?  @unique
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  timerSessions TimerSession[]
  soundMixes    SoundMix[]
}

model TimerSession {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  preset        String
  focusMin      Int
  breakMin      Int
  rounds        Int
  totalFocusSec Int
  completedAt   DateTime @default(now())

  @@index([userId, completedAt])
}

model SoundMix {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  channels  SoundChannel[]
  isDefault Boolean        @default(false)
  createdAt DateTime       @default(now())

  @@index([userId])
}

model SoundChannel {
  id       String   @id @default(cuid())
  mixId    String
  mix      SoundMix @relation(fields: [mixId], references: [id], onDelete: Cascade)
  soundKey String
  volume   Float
  enabled  Boolean  @default(true)
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Create migration (dev only — no production users)**

```bash
npx prisma migrate dev --name remove-nextauth-tables
```

Expected: migration file created, schema applied.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: remove NextAuth tables from Prisma schema"
```

---

### Task 3: Add Clerk middleware and ClerkProvider

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx`
- Delete: `src/lib/auth.ts`
- Delete: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
```

- [ ] **Step 2: Update `src/app/layout.tsx` — wrap with ClerkProvider**

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/ui/nav-bar";
import { ClerkProvider } from "@clerk/nextjs";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JeFocus — Focus Timer with Ambient Sounds",
  description: "A Pomodoro timer with multi-channel ambient audio mixer",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-[#F8F9FA] text-foreground transition-colors duration-500">
          <Providers>
            <NavBar />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Delete NextAuth files**

```bash
rm src/lib/auth.ts
rm -rf src/app/api/auth
```

- [ ] **Step 4: Type-check (will fail — context.ts still imports auth.ts)**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors about missing `@/lib/auth` — that's correct, fixed in next task.

- [ ] **Step 5: Commit partial**

```bash
git add src/middleware.ts src/app/layout.tsx
git rm src/lib/auth.ts src/app/api/auth/\[...nextauth\]/route.ts
git commit -m "feat: add Clerk middleware and ClerkProvider, remove NextAuth config"
```

---

### Task 4: Rewrite tRPC context and protectedProcedure

**Files:**
- Modify: `src/server/context.ts`
- Modify: `src/server/trpc.ts`

- [ ] **Step 1: Rewrite `src/server/context.ts`**

```ts
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  const { userId } = await auth();

  if (userId) {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
  }

  return { prisma, userId };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
```

- [ ] **Step 2: Rewrite `src/server/trpc.ts`**

```ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors in router files about `ctx.user` — fixed in next task.

- [ ] **Step 4: Commit**

```bash
git add src/server/context.ts src/server/trpc.ts
git commit -m "feat: rewrite tRPC context and protectedProcedure for Clerk"
```

---

### Task 5: Update all tRPC routers to use `ctx.userId`

**Files:**
- Modify: `src/server/routers/timer.ts`
- Modify: `src/server/routers/sound.ts`
- Modify: `src/server/routers/user.ts`

- [ ] **Step 1: Update `src/server/routers/timer.ts` — replace all `ctx.user.id!` with `ctx.userId`**

```ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const timerRouter = router({
  complete: protectedProcedure
    .input(
      z.object({
        preset: z.string(),
        focusMin: z.number().int().positive(),
        breakMin: z.number().int().nonnegative(),
        rounds: z.number().int().positive(),
        totalFocusSec: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timerSession.create({
        data: {
          userId: ctx.userId,
          preset: input.preset,
          focusMin: input.focusMin,
          breakMin: input.breakMin,
          rounds: input.rounds,
          totalFocusSec: input.totalFocusSec,
        },
      });
    }),

  history: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.timerSession.findMany({
        where: { userId: ctx.userId },
        orderBy: { completedAt: 'desc' },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month, total] = await Promise.all([
      ctx.prisma.timerSession.aggregate({
        where: { userId, completedAt: { gte: startOfDay } },
        _sum: { totalFocusSec: true },
        _count: true,
      }),
      ctx.prisma.timerSession.aggregate({
        where: { userId, completedAt: { gte: startOfWeek } },
        _sum: { totalFocusSec: true },
        _count: true,
      }),
      ctx.prisma.timerSession.aggregate({
        where: { userId, completedAt: { gte: startOfMonth } },
        _sum: { totalFocusSec: true },
        _count: true,
      }),
      ctx.prisma.timerSession.aggregate({
        where: { userId },
        _sum: { totalFocusSec: true },
        _count: true,
      }),
    ]);

    const recentSessions = await ctx.prisma.timerSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
      take: 365,
    });

    let streak = 0;
    const checkDate = new Date(startOfDay);

    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasSession = recentSessions.some(
        (s) => s.completedAt >= dayStart && s.completedAt < dayEnd
      );

      if (!hasSession) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      today: { sessions: today._count, totalSec: today._sum.totalFocusSec ?? 0 },
      week: { sessions: week._count, totalSec: week._sum.totalFocusSec ?? 0 },
      month: { sessions: month._count, totalSec: month._sum.totalFocusSec ?? 0 },
      total: { sessions: total._count, totalSec: total._sum.totalFocusSec ?? 0 },
      streak,
    };
  }),

  dailyChart: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const now = new Date();
      const result: Array<{ date: string; sessions: number; totalSec: number }> = [];

      for (let i = input.days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStart = new Date(d);
        const dayEnd = new Date(d);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const agg = await ctx.prisma.timerSession.aggregate({
          where: { userId, completedAt: { gte: dayStart, lt: dayEnd } },
          _sum: { totalFocusSec: true },
          _count: true,
        });

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        result.push({
          date: `${y}-${m}-${day}`,
          sessions: agg._count,
          totalSec: agg._sum.totalFocusSec ?? 0,
        });
      }

      return result;
    }),
});
```

- [ ] **Step 2: Update `src/server/routers/sound.ts` — replace all `ctx.user.id!` with `ctx.userId`**

```ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const soundChannelSchema = z.object({
  soundKey: z.string(),
  volume: z.number().min(0).max(1),
  enabled: z.boolean(),
});

export const soundRouter = router({
  saveMix: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        channels: z.array(soundChannelSchema).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.soundMix.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          channels: {
            create: input.channels,
          },
        },
        include: { channels: true },
      });
    }),

  getMixes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.soundMix.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      include: { channels: true },
    });
  }),

  deleteMix: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mix = await ctx.prisma.soundMix.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!mix) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Mix not found' });
      }

      if (mix.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.soundMix.delete({ where: { id: input.id } });
      return { success: true };
    }),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const mix = await ctx.prisma.soundMix.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!mix) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Mix not found' });
      }

      if (mix.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.soundMix.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        }),
        ctx.prisma.soundMix.update({
          where: { id: input.id },
          data: { isDefault: true },
        }),
      ]);

      return { success: true };
    }),
});
```

- [ ] **Step 3: Update `src/server/routers/user.ts` — replace `ctx.user.id!` with `ctx.userId`**

```ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            timerSessions: true,
            soundMixes: true,
          },
        },
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.image !== undefined && { image: input.image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          updatedAt: true,
        },
      });
    }),
});
```

- [ ] **Step 4: Type-check — should pass server layer**

```bash
npx tsc --noEmit 2>&1 | grep "server\|routers"
```

Expected: no errors in server/ or routers/

- [ ] **Step 5: Commit**

```bash
git add src/server/routers/timer.ts src/server/routers/sound.ts src/server/routers/user.ts
git commit -m "feat: update tRPC routers to use ctx.userId (Clerk)"
```

---

### Task 6: Update providers, create sign-in/sign-up pages

**Files:**
- Modify: `src/app/providers.tsx`
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Update `src/app/providers.tsx` — remove SessionProvider**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '@/lib/trpc-client';
import { useState } from 'react';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

- [ ] **Step 2: Create `src/app/sign-in/[[...sign-in]]/page.tsx`**

```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
```

- [ ] **Step 3: Create `src/app/sign-up/[[...sign-up]]/page.tsx`**

```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/providers.tsx src/app/sign-in/ src/app/sign-up/
git commit -m "feat: remove SessionProvider, add Clerk sign-in/sign-up pages"
```

---

### Task 7: Update NavBar to use Clerk components

**Files:**
- Modify: `src/components/ui/nav-bar.tsx`

- [ ] **Step 1: Rewrite `src/components/ui/nav-bar.tsx`**

Replace `useSession`/`signIn`/`signOut` from next-auth with Clerk's `useUser` and `UserButton`:

```tsx
'use client';

import { cn } from '@/lib/utils';
import { Timer, BarChart3 } from 'lucide-react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Timer', icon: <Timer size={20} /> },
  { href: '/dashboard', label: 'Stats', icon: <BarChart3 size={20} /> },
];

export function NavBar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-brand-text">
        JeFocus
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all',
              pathname === item.href
                ? 'glass-strong text-brand-text font-medium'
                : 'text-brand-text/60 hover:text-brand-text hover:bg-brand-light/30'
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <SignInButton mode="modal">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-brand-text/60 hover:text-brand-text hover:bg-brand-light/30 transition-all">
              <span className="hidden sm:inline">Sign in</span>
            </button>
          </SignInButton>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Full type-check — should be clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds. Routes: `/`, `/dashboard`, `/sign-in`, `/sign-up`, `/api/trpc/[trpc]`

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/nav-bar.tsx
git commit -m "feat: migrate NavBar from next-auth hooks to Clerk components"
```

---

## PART 2 — WEB AUDIO API MIGRATION

> Start only after Part 1 builds cleanly.

---

### Task 8: Remove Howler, create AudioEngine

**Files:**
- Modify: `package.json`
- Create: `src/lib/audio-engine.ts`

- [ ] **Step 1: Remove howler packages**

```bash
npm uninstall howler @types/howler
```

- [ ] **Step 2: Create `src/lib/audio-engine.ts`**

```ts
import { SOUND_CATALOG } from './sounds';

const FADE_DURATION = 0.3; // seconds

type ChannelState = {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private channels: Map<string, ChannelState> = new Map();
  private _masterVolume = 1;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async preload(): Promise<void> {
    const ctx = this.getCtx();
    await Promise.all(
      SOUND_CATALOG.map(async (sound) => {
        if (this.buffers.has(sound.id)) return;
        const res = await fetch(sound.src);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(sound.id, audioBuffer);
      })
    );
  }

  isSuspended(): boolean {
    return this.ctx?.state === 'suspended';
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  isPlaying(soundId: string): boolean {
    return this.channels.has(soundId);
  }

  async play(soundId: string, targetVolume = 1): Promise<void> {
    const ctx = this.getCtx();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const buffer = this.buffers.get(soundId);
    if (!buffer) return;

    // Crossfade: fade out existing source while new one fades in
    const existing = this.channels.get(soundId);
    if (existing) {
      const { source, gainNode } = existing;
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + FADE_DURATION);
      setTimeout(() => {
        try { source.stop(); } catch { /* already stopped */ }
      }, FADE_DURATION * 1000);
    }

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.masterGain!);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start(0);

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, targetVolume)), now + FADE_DURATION);

    this.channels.set(soundId, { source, gainNode });
  }

  stop(soundId: string): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const channel = this.channels.get(soundId);
    if (!channel) return;

    const { source, gainNode } = channel;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + FADE_DURATION);
    setTimeout(() => {
      try { source.stop(); } catch { /* already stopped */ }
    }, FADE_DURATION * 1000);

    this.channels.delete(soundId);
  }

  setVolume(soundId: string, volume: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const channel = this.channels.get(soundId);
    if (!channel) return;

    const { gainNode } = channel;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), now + 0.05);
  }

  setMasterVolume(volume: number): void {
    this._masterVolume = Math.max(0, Math.min(1, volume));
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this._masterVolume, now + 0.05);
  }

  dispose(): void {
    for (const { source } of this.channels.values()) {
      try { source.stop(); } catch { /* ok */ }
    }
    this.channels.clear();
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
  }
}

export const audioEngine = new AudioEngine();
```

- [ ] **Step 3: Type-check the new file**

```bash
npx tsc --noEmit 2>&1 | grep "audio-engine"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
npm uninstall howler @types/howler
git add src/lib/audio-engine.ts package.json package-lock.json
git commit -m "feat: add AudioEngine (Web Audio API), remove howler"
```

---

### Task 9: Create AudioUnlockPrompt component

**Files:**
- Create: `src/components/audio/AudioUnlockPrompt.tsx`

- [ ] **Step 1: Create `src/components/audio/AudioUnlockPrompt.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';

export function AudioUnlockPrompt() {
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    // Check after a short delay — AudioContext may not exist yet
    const timer = setTimeout(() => {
      setNeedsUnlock(audioEngine.isSuspended());
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!needsUnlock) return null;

  const handleUnlock = async () => {
    await audioEngine.resume();
    setNeedsUnlock(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={handleUnlock}
        className="glass px-4 py-2 rounded-full text-sm text-brand-text shadow-lg hover:glass-strong transition-all"
      >
        Click to enable audio
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add AudioUnlockPrompt to `src/app/layout.tsx`**

Add import and render inside `<Providers>`:

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/ui/nav-bar";
import { ClerkProvider } from "@clerk/nextjs";
import { AudioUnlockPrompt } from "@/components/audio/AudioUnlockPrompt";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JeFocus — Focus Timer with Ambient Sounds",
  description: "A Pomodoro timer with multi-channel ambient audio mixer",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-[#F8F9FA] text-foreground transition-colors duration-500">
          <Providers>
            <NavBar />
            {children}
            <AudioUnlockPrompt />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/audio/AudioUnlockPrompt.tsx src/app/layout.tsx
git commit -m "feat: add AudioUnlockPrompt for browser autoplay policy"
```

---

### Task 10: Rewrite use-audio-mixer.ts to use AudioEngine

**Files:**
- Modify: `src/hooks/use-audio-mixer.ts`

- [ ] **Step 1: Rewrite `src/hooks/use-audio-mixer.ts`**

```ts
'use client';

import { useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { useAudioStore } from '@/stores/audio-store';
import { useShallow } from 'zustand/react/shallow';

export function useAudioMixer() {
  const store = useAudioStore(
    useShallow((s) => ({
      channels: s.channels,
      masterVolume: s.masterVolume,
      isMuted: s.isMuted,
      setVolume: s.setVolume,
      toggleChannel: s.toggleChannel,
      setMasterVolume: s.setMasterVolume,
      toggleMute: s.toggleMute,
      loadMix: s.loadMix,
      resetMix: s.resetMix,
    }))
  );

  // Preload all audio buffers once on mount
  useEffect(() => {
    audioEngine.preload();
  }, []);

  // Sync store state → AudioEngine
  useEffect(() => {
    const { channels, masterVolume, isMuted } = store;

    for (const [id, channel] of Object.entries(channels)) {
      if (channel.enabled && !isMuted) {
        if (!audioEngine.isPlaying(id)) {
          audioEngine.play(id, channel.volume);
        } else {
          audioEngine.setVolume(id, channel.volume);
        }
      } else {
        audioEngine.stop(id);
      }
    }

    audioEngine.setMasterVolume(isMuted ? 0 : masterVolume);
  }, [store.channels, store.masterVolume, store.isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  return {
    channels: store.channels,
    masterVolume: store.masterVolume,
    isMuted: store.isMuted,
    setVolume: store.setVolume,
    toggleChannel: store.toggleChannel,
    setMasterVolume: store.setMasterVolume,
    toggleMute: store.toggleMute,
    loadMix: store.loadMix,
    resetMix: store.resetMix,
  };
}
```

- [ ] **Step 2: Full type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Full build**

```bash
npm run build
```

Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-audio-mixer.ts
git commit -m "feat: rewrite use-audio-mixer to use Web Audio API via AudioEngine"
```

---

### Task 11: Final verification

- [ ] **Step 1: Confirm no howler or next-auth references remain**

```bash
grep -r "howler\|next-auth\|SessionProvider\|getServerSession\|PrismaAdapter" src/ --include="*.ts" --include="*.tsx"
```

Expected: 0 matches

- [ ] **Step 2: Confirm no `ctx.user` references remain in routers**

```bash
grep -r "ctx\.user" src/server/ --include="*.ts"
```

Expected: 0 matches

- [ ] **Step 3: Final build**

```bash
npm run build
```

Expected: clean build, 0 TypeScript errors

- [ ] **Step 4: Commit summary tag**

```bash
git tag migration/clerk-web-audio
git log --oneline -10
```

---

## File Map Summary

| File | Action | Task |
|------|--------|------|
| `package.json` | remove next-auth/howler, add @clerk/nextjs | 1, 8 |
| `.env.example` | replace NextAuth vars with Clerk vars | 1 |
| `prisma/schema.prisma` | remove Account/Session/VerificationToken | 2 |
| `src/middleware.ts` | create with clerkMiddleware | 3 |
| `src/app/layout.tsx` | add ClerkProvider, AudioUnlockPrompt | 3, 9 |
| `src/lib/auth.ts` | delete | 3 |
| `src/app/api/auth/[...nextauth]/route.ts` | delete | 3 |
| `src/server/context.ts` | use Clerk auth(), lazy upsert | 4 |
| `src/server/trpc.ts` | protectedProcedure uses ctx.userId | 4 |
| `src/server/routers/timer.ts` | ctx.user.id! → ctx.userId | 5 |
| `src/server/routers/sound.ts` | ctx.user.id! → ctx.userId | 5 |
| `src/server/routers/user.ts` | ctx.user.id! → ctx.userId | 5 |
| `src/app/providers.tsx` | remove SessionProvider | 6 |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | create Clerk SignIn page | 6 |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | create Clerk SignUp page | 6 |
| `src/components/ui/nav-bar.tsx` | use Clerk useUser/UserButton | 7 |
| `src/lib/audio-engine.ts` | create AudioEngine singleton | 8 |
| `src/components/audio/AudioUnlockPrompt.tsx` | create unlock prompt | 9 |
| `src/hooks/use-audio-mixer.ts` | rewrite using AudioEngine | 10 |
