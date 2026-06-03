# UI Goals

## North Star

The UI should present JeFocus as an ambient sound workspace with focus-session
support. A user should understand the active sound environment before they think
about dashboards, social features, or mascot progression.

## First Viewport

The first screen should prioritize:

- Current sound preset or unsaved mix state.
- Enabled sounds and their independent volume levels.
- Master volume and mute.
- Timer state, remaining time, and session controls.
- A calm focus entry point.

The first screen should not feel like:

- A marketing landing page.
- A social leaderboard.
- A mascot-first game screen.
- A timer-only utility with audio as a side panel.

## Navigation

Primary product routes should map to the MVP:

- Workspace or mixer
- Presets
- History
- Statistics
- Settings

Timer controls may live in the workspace rather than requiring a separate
timer-first route. Social leaderboard behavior is not part of the MVP product
goal unless a future decision reintroduces it.

## Focus Mode

Focus mode removes distraction and shows only:

- Current time.
- Remaining time.
- Active preset name.
- Minimal session controls.

Focus mode should hide navigation, dashboards, settings, and nonessential
decoration. It should support browser fullscreen.

## Visual Direction

The UI should feel calm, functional, and workspace-oriented:

- Prioritize readability and stable controls over decorative density.
- Keep motion subtle and tied to state changes.
- Use glass styling only where it clarifies layered surfaces.
- Avoid letting the mascot compete with mixer controls or session state.

## Implementation Implications

- Future UI refactors should move the mixer from secondary panel to primary
  workspace control.
- Timer display should be compact enough to coexist with sound controls.
- Preset creation/editing should become a core workflow.
- Dashboard and history should report preset usage, session duration, and focus
  trends.
