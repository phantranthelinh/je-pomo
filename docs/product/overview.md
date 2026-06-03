# JeFocus Product Overview

## Vision

JeFocus is an ambient sound workspace for focused work, studying, writing, and
reading. Users combine multiple looping sounds, save personal mixes, and run
focus sessions inside the environment they create.

The Pomodoro timer is a supporting workflow. The ambient sound experience is the
primary product.

## Primary Users

- Software developers
- Designers
- Students
- Writers
- Remote workers

## Core Use Cases

- **Deep work**: Long 50-90 minute sessions with a stable sound environment.
- **Study session**: Gentle masking of distracting background noise.
- **Relaxed working**: Natural or cafe-like ambience that makes work feel less
  sterile.

## MVP Product Contract

JeFocus MVP includes:

- Guest access to timer, default presets, and sound mixer.
- Authenticated access to saved presets, editable presets, session history,
  statistics, and cross-device sync.
- Multi-track ambient playback with independent volume and master volume.
- Focus sessions that can apply a selected preset and record session data.
- Browser and audio notifications at session boundaries.

JeFocus MVP excludes:

- AI-generated presets.
- Public/community preset sharing.
- Team or workspace collaboration.
- Native mobile applications.
- Social competition as a primary product loop.

## Current Implementation Notes

- The repository currently uses Next.js 16, React 19, NextAuth.js, Prisma,
  tRPC, Zustand, Tailwind CSS, and Howler.js.
- The supplied product spec names Clerk and Web Audio API as target product
  directions. Treat migration from current auth/audio choices as separate
  high-risk implementation work, not as part of this UI-goal alignment.
