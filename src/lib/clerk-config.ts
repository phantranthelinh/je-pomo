// Single source of truth for whether Clerk is active.
//
// Clerk runs a *development-instance* dev-browser handshake that redirects the
// whole tab to `*.accounts.dev` on first load. The Claude Code preview sandbox
// only allows localhost navigations, so that redirect turns the page into a
// chrome-error screen. Setting `NEXT_PUBLIC_DISABLE_CLERK=true` turns Clerk off
// so the UI renders inside the preview (auth is inert while disabled — test auth
// in a real browser with the flag unset).
//
// Plain module (no 'use client'): imported by the layout, middleware, the tRPC
// context, and client hooks. Both env vars are NEXT_PUBLIC_* → inlined at build
// time, so this constant is available in edge, server, and client bundles.
export const clerkEnabled =
  process.env.NEXT_PUBLIC_DISABLE_CLERK !== 'true' &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
