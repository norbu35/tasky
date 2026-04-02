# Test Trust Audit

Last updated: 2026-04-02

## Objective

Establish which existing checks can be trusted as blockers for structural cleanup and identify gaps, flaky behavior, and low-signal tests.

## Runtime Audit Log

### Batch A: Primary local gate sequence

Command:

```bash
./gradlew --no-daemon test openApiValidate gateSmoke && pnpm -r typecheck && pnpm -r test
```

Result: `FAIL (deterministic web test failures after backend/type gates pass)`

Observations:

- `./gradlew --no-daemon test` passed.
- `./gradlew --no-daemon openApiValidate` passed.
- `./gradlew --no-daemon gateSmoke` passed.
- `pnpm -r typecheck` passed.
- `pnpm -r test` failed in `@tasky/web` with deterministic failures:
- `tests/unit/web-container-overlay.test.ts > TID-TASK-111-DOC-GENERIC-CONTAINER-RUNBOOK` (`ENOENT` for `docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md`)
- `tests/integration/navigation-phase1.test.tsx > routes the customer applicants surface through the real app shell` (missing heading `Task applicants`)
- Non-failing warnings observed:
- mobile test warnings about React `act(...)` wrapping on `BookingConfirmedScreen`
- mobile test warnings for missing i18next instance in `SubscriptionScreen` tests
- repeated React Router v7 future-flag warnings in web tests

### Batch B: Determinism rerun

Command:

```bash
./gradlew --no-daemon gateSmoke && pnpm -r test
```

Result: `FAIL (same deterministic web test failures)`

Observations:

- `./gradlew --no-daemon gateSmoke` passed again.
- `pnpm -r test` failed again with the same two `@tasky/web` tests and same failure signatures.
- This indicates deterministic failure, not flaky behavior, for the current failing checks.

### Batch C: Cleanup-critical rehab + full rerun

Command:

```bash
tooling/scripts/check-cleanup-gate.sh && ./gradlew --no-daemon :services:api:test :services:api:openApiValidate && pnpm -r test
```

Result: `PASS`

Observations:

- Cleanup-critical web test failures were repaired by:
  - removing dependency on deleted historical spec file in `apps/web/tests/unit/web-container-overlay.test.ts`
  - aligning applicants heading expectation with current UI contract in `apps/web/tests/integration/navigation-phase1.test.tsx`
- `tooling/scripts/check-cleanup-gate.sh` passed.
- `./gradlew --no-daemon :services:api:test :services:api:openApiValidate` passed.
- `pnpm -r test` passed across workspaces.
- Residual warning noise remains (React Router future flags, i18next/act warnings), but no deterministic failing assertions remained in this run.

## Early Risk Signals (Pre-execution)

- `tests/registry.yaml` contains zero mutation kill-rate entries in multiple domains, so coverage quality is uneven.
- `packages/sdk` uses placeholder lint/test scripts, so workspace-wide pass does not imply strong package-level behavior checks.
- The gate scripts include path-coupled shell/python references that may become brittle during repo restructuring.

## Trust Decisions

| Check | Status | Notes |
|---|---|---|
| `./gradlew test` | Trusted | Passed in Batch A |
| `./gradlew openApiValidate` | Trusted | Passed in Batch A |
| `./gradlew gateSmoke` | Trusted | Passed in Batch A and Batch B |
| `pnpm -r typecheck` | Trusted | Passed in Batch A |
| `pnpm -r test` | Trusted (with warning noise) | Passed in Batch C after deterministic web test rehab |
