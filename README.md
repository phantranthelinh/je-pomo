# JeFocus: Ambient Focus Workspace

![JeFocus Hero](public/hero.png)

JeFocus is an ambient sound workspace with a Pomodoro timer built in. The core
product value is helping people shape a calm, personal work environment through
multi-channel sound mixing, reusable presets, and focus-session tracking.

Pomodoro supports the experience. The sound workspace is the product.

## Product Direction

- **Mixer-first workspace**: The main interface should make ambient sound
  selection, layered playback, and volume control feel primary.
- **Personal sound presets**: Users should be able to save, edit, and reuse
  named mixes for contexts like deep work, study, reading, or relaxed work.
- **Focus sessions**: Timer controls should remain fast and visible, but they
  should support the active sound environment rather than dominate it.
- **Statistics and history**: Tracking should help users understand focus time,
  session patterns, and frequently used presets.
- **Guest-friendly start**: Guests can start a timer and use default sounds
  without account setup. Authenticated users get saved presets, history, and
  sync.

## MVP Scope

Included:

- Authentication
- Pomodoro timer
- Multi-channel sound mixer
- Custom sound presets
- Session tracking
- Statistics dashboard

Not in MVP:

- AI features
- Community sharing
- Team features
- Native mobile application
- Social leaderboard as a core product goal

## Technology Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand, TanStack Query, tRPC
- **Database**: Prisma and PostgreSQL
- **Audio**: Howler.js today; product target is Web Audio API behavior for
  smooth fades, seamless loops, and multi-track playback
- **Authentication**: NextAuth.js today; product spec target is Clerk
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Create a `.env` file based on `.env.example`.

3. Run the development server:

   ```bash
   yarn dev
   ```

4. Build for production:

   ```bash
   yarn build
   yarn start
   ```

## UI Goal

The first viewport should feel like a focused audio workspace: sound controls,
active preset context, and the running session should be immediately legible.
The visual system should stay calm and low-distraction, with focus mode
available when the user wants only current time, remaining time, and preset
name.
