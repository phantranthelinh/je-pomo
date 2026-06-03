# US-001 Align UI Goal With Ambient Workspace

## Status

implemented

## Lane

normal

## Product Contract

JeFocus is positioned as an ambient sound workspace with Pomodoro support, not a
timer-first or social-first application. Product docs and top-level project
copy must make mixer, presets, focus sessions, and statistics the core MVP
surface.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/ui-goals.md`
- `README.md`

## Acceptance Criteria

- The project overview states that ambient sound mixing is the primary product
  value.
- UI goals describe a mixer-first workspace and focus mode.
- Social leaderboard behavior is explicitly outside the MVP product loop unless
  reintroduced by a later decision.
- Current implementation mismatches, including NextAuth vs Clerk and Howler.js
  vs Web Audio API target behavior, are called out as future implementation
  decisions rather than silently changed.

## Design Notes

- Commands: none.
- Queries: none.
- API: no API change in this story.
- Tables: no schema change in this story.
- Domain rules: sound workspace is the product center; timer supports it.
- UI surfaces: workspace/mixer, presets, history, statistics, settings, focus
  mode.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-001 --unit 0 --integration 0 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Not required for docs-only goal alignment. |
| Integration | Not required for docs-only goal alignment. |
| E2E | Future UI refactor should verify first viewport and focus mode. |
| Platform | Future fullscreen support should receive browser/platform proof. |
| Release | Not required for docs-only goal alignment. |

## Harness Delta

Harness CLI is referenced by `AGENTS.md` but `scripts/bin/harness-cli.exe` is
missing in this workspace, so durable intake/story/trace records could not be
created through the required CLI.

No destructive database migration was created for the removed friendship model.
The runtime schema no longer exposes friendships, but dropping an existing table
should be handled as a separate migration decision if needed.

## Evidence

- Product docs created for overview and UI goals.
- README repositioned the product around ambient sound workspace behavior.
- Removed leaderboard/friend runtime surfaces from navigation, tRPC root, and
  Prisma schema so social competition is no longer part of the active app
  contract.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed; the built app routes are `/`, `/dashboard`,
  `/api/auth/[...nextauth]`, and `/api/trpc/[trpc]`.
