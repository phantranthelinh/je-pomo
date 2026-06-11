# Stack Migration Design: NextAuth → Clerk + Howler.js → Web Audio API

**Date:** 2026-06-11  
**Status:** Approved  
**Approach:** Sequential in one branch — Clerk first, Web Audio API second

---

## Scope

Two independent migrations executed sequentially in a single feature branch:

1. **Auth**: NextAuth.js → Clerk (Google + GitHub + Email/password)
2. **Audio**: Howler.js → Web Audio API (parity + smooth fades)

---

## Part 1: Clerk Migration

### Auth Methods

- Google OAuth
- GitHub OAuth
- Email/password (Clerk native)

### Architecture

**ClerkProvider** wraps the app in `src/app/layout.tsx` replacing `<SessionProvider>`.

**Middleware** (`src/middleware.ts`): Clerk's `clerkMiddleware()` replaces NextAuth middleware. Protect authenticated routes (`/dashboard`). Public routes: `/`, `/sign-in`, `/sign-up`.

**tRPC context** (`src/server/trpc.ts`): Replace `getServerSession()` with `auth()` from `@clerk/nextjs/server`. Context shape stays `{ userId: string | null }` — routers need no changes.

**Auth UI**: Use Clerk hosted components — `<SignIn />`, `<SignUp />`, `<UserButton />`. No custom login form.

### User Table Strategy

Keep `User` table in Prisma. Lazy sync on first authenticated tRPC call:

```ts
// In tRPC context creation
const { userId } = auth()
if (userId) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  })
}
```

All other tables (`Session`, `Preset`, etc.) keep `userId` as FK referencing `User.id`.

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Remove `next-auth`, add `@clerk/nextjs` |
| `src/app/layout.tsx` | Wrap with `<ClerkProvider>` |
| `src/middleware.ts` | Replace NextAuth middleware with `clerkMiddleware()` |
| `src/server/trpc.ts` | Replace `getServerSession()` with `auth()` |
| `src/app/api/auth/[...nextauth]/route.ts` | Delete |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | New — Clerk `<SignIn />` page |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | New — Clerk `<SignUp />` page |
| `prisma/schema.prisma` | Remove NextAuth tables (Account, VerificationToken), keep User with Clerk userId |
| `.env.example` | Add Clerk env vars |

### Env Vars

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Prisma Migration

Remove NextAuth-managed tables: `Account`, `Session`, `VerificationToken`. Keep `User` table with `id` as Clerk userId string. Generate and run migration.

---

## Part 2: Web Audio API Migration

### Architecture

A singleton `AudioEngine` class owns the `AudioContext` and all audio nodes. Zustand `audio-store` calls engine methods — no store code touches Web Audio nodes directly.

**Per-channel node graph:**
```
AudioBufferSourceNode (loop=true)
  → GainNode (channel volume)
    → GainNode (master volume)
      → AudioContext.destination
```

### AudioEngine Interface

```ts
class AudioEngine {
  play(soundId: string): Promise<void>
  stop(soundId: string): void
  setVolume(soundId: string, volume: number): void  // 0–1
  setMasterVolume(volume: number): void              // 0–1
  dispose(): void
}
```

### Smooth Fades

- **Play**: gain ramps 0 → target volume over 300ms (`linearRampToValueAtTime`)
- **Stop/pause**: gain ramps target → 0 over 300ms, then `stop()` source node
- **Switch sound in channel**: crossfade — old source fades out (300ms) while new source fades in (300ms) simultaneously

### Preload Strategy

On app init, fetch all sound files from `/public/sounds/` and decode into `AudioBuffer` cache via `AudioContext.decodeAudioData()`. Play calls are instant — no network fetch at play time.

### Autoplay Policy Handling

If `AudioContext.state === 'suspended'` on first play attempt, surface a one-time "Click to enable audio" UI prompt. Resume context on user gesture.

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Remove `howler` (and `@types/howler`) |
| `src/lib/audio-engine.ts` | New — `AudioEngine` singleton |
| `src/hooks/use-audio-mixer.ts` | Replace Howler calls with `AudioEngine` methods |
| `src/stores/audio-store.ts` | Remove Howler instances, keep state shape |
| `src/components/AudioUnlockPrompt.tsx` | New — one-time autoplay unlock UI |

---

## Implementation Order

1. `feat/clerk-migration` work (Clerk install, middleware, tRPC context, UI pages, Prisma migration)
2. Verify auth works end-to-end
3. `feat/web-audio-migration` work (AudioEngine, hook rewire, store cleanup)
4. Verify audio plays, fades, and switches correctly

Both done in one branch. Two logical commits.

---

## Out of Scope

- EQ/filter per channel
- Webhook-based Clerk→Prisma sync (lazy upsert is sufficient for MVP)
- Migrating existing user data (no production users yet)
- Native mobile support
