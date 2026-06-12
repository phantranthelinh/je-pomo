'use client';

// Provider-safe wrappers around Clerk's client hooks.
//
// When `clerkEnabled` is false, `<ClerkProvider>` is not mounted, so calling
// Clerk's real hooks would throw ("can only be used within ClerkProvider").
// Because `clerkEnabled` is a build-time constant, we pick the implementation
// once at module load — components always call the same stable function, so the
// rules-of-hooks invariant (same hook every render) holds either way.
import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { clerkEnabled } from './clerk-config';

export const useAuthSafe: typeof useAuth = clerkEnabled
  ? useAuth
  : (() => ({ isSignedIn: false, userId: null }) as ReturnType<typeof useAuth>);

export const useUserSafe: typeof useUser = clerkEnabled
  ? useUser
  : (() => ({ isSignedIn: false, user: null }) as ReturnType<typeof useUser>);

export const useClerkSafe: typeof useClerk = clerkEnabled
  ? useClerk
  : (() => ({ openSignIn: () => {} }) as unknown as ReturnType<typeof useClerk>);
