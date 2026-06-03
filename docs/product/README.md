# Product Docs

This directory contains the living product contract for JeFocus. The supplied
V1 product spec has been decomposed into smaller docs instead of becoming a
permanent monolithic plan.

Current docs:

- `overview.md`: product vision, users, MVP scope, and current implementation
  notes.
- `ui-goals.md`: UI north star, first-viewport priorities, navigation, and
  focus-mode expectations.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
