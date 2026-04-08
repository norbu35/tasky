# Flaky Or Ceremonial Checks

Last updated: 2026-04-09

This file captures checks that should not be hard blockers for structural cleanup until fixed.

## Current Entries

- `pnpm -r test` is currently blocked by deterministic `@tasky/web` failures (not flaky):
- `tests/unit/web-container-overlay.test.ts` reads a missing design document path (formerly `docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md`, now archived).
- `tests/integration/navigation-phase1.test.tsx` expects heading `Task applicants` and does not find it.
- `packages/sdk` test script (`echo 'No SDK tests configured yet.'`) is ceremonial and does not validate runtime behavior.
- Non-blocking warning noise to track:
- mobile `act(...)` warnings in `BookingConfirmedScreen` tests
- mobile i18next-instance warning in `SubscriptionScreen` tests
- repeated React Router future-flag warnings in web tests

## Classification Rules

- **Flaky:** same revision, same environment, inconsistent result.
- **Ceremonial:** passes reliably but does not materially validate runtime or contract behavior.
- **Deferred blocker:** expensive/slow checks that should run at wider milestones, not on every structural commit.
