# Test Rehabilitation Backlog

Last updated: 2026-04-02

## Objective

Track the highest-risk test quality gaps after structural cleanup so maintenance work can proceed with predictable, high-signal gates.

## Priority Queue

### P0 - Completed in this tranche

- [x] Web unit/integration determinism unblock:
  - Remove dependency on deleted historical spec path in `apps/web/tests/unit/web-container-overlay.test.ts`.
  - Align applicants navigation assertion with current UI heading in `apps/web/tests/integration/navigation-phase1.test.tsx`.
- [x] Revalidate full test path:
  - `tooling/scripts/check-cleanup-gate.sh`
  - `./gradlew --no-daemon :services:api:test :services:api:openApiValidate`
  - `pnpm -r test`

### P1 - High-signal follow-ups

- [ ] Reduce test-output noise from React Router future-flag warnings in web tests so real failures stand out.
- [ ] Normalize i18next test bootstrap in mobile suites to eliminate repeated missing-instance warnings.
- [ ] Add a documented policy for warning budgets in CI logs (which warnings fail PRs vs informational only).

### P2 - Scenario and mutation quality depth

- [ ] Raise low mutation-kill domains from `0` in `tests/registry.yaml` (starting with analytics scenarios).
- [ ] Add a recurring check that compares registry risk tiers vs actual scenario coverage drift.
- [ ] Define mutation-floor targets per domain and wire them into a maintenance KPI dashboard.

### P3 - Package-level signal quality

- [ ] Replace placeholder SDK/package test scripts with meaningful assertions for generated API invariants.
- [ ] Add smoke-level contract tests for `@tasky/core` integration boundaries with `@tasky/sdk`.

## Exit Criteria

- No deterministic red tests in default workspace suite (`pnpm -r test`).
- Cleanup gate and backend gates remain green for two consecutive runs.
- Rehab backlog items have owners and target milestones in maintenance planning.
