# Cleanup Gate

Last updated: 2026-04-02

## Purpose

`tooling/scripts/check-cleanup-gate.sh` is the trusted gate for structural-realignment work. It should stay fast, deterministic, and strongly coupled to contract and type integrity.

## Current Commands

```bash
./gradlew --no-daemon openApiValidate gateSmoke
pnpm -r typecheck
```

## Why These Checks

- `openApiValidate`: protects API contract integrity.
- `gateSmoke`: validates critical backend scenario coverage and smoke policy.
- `pnpm -r typecheck`: catches cross-workspace typing and import breakage quickly.

## Temporarily Excluded Checks

- `pnpm -r test` is currently excluded from the cleanup gate because deterministic `@tasky/web` failures are present and tracked in `docs/quality/test-trust-audit.md`.
- Full regression checks (`gateRegression`, `gateFull`) remain milestone/nightly-level checks.

## Promotion Rules

A check can be promoted into the cleanup gate when:

- it passes consistently on repeated local/CI runs
- failures indicate actionable regressions in current code, not stale doc/path assumptions
- runtime cost keeps the gate usable for structural iteration

## Demotion Rules

A check is demoted when:

- it becomes flaky under unchanged revision and environment
- it fails for known non-structural debt already captured in the trust audit
- it materially slows cleanup iteration without increasing signal
