import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function createTRPCContext(_opts: FetchCreateContextFnOptions) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
