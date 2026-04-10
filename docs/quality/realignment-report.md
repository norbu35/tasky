# Maintenance Mode Realignment Report

Date: 2026-04-02

## Summary

The repository has been realigned from greenfield multi-agent generation workflow to maintenance-and-extension monorepo operation with explicit boundaries, archive hygiene, and trusted verification gates.

The capability matrix at `docs/quality/capability-matrix.md` is now the central audit ledger and working truth artifact for capability status and discrepancies pending canonical rewrites.

## Structural Realignment Completed

- Runtime service structure consolidated under `services/api`.
- Contributor infrastructure consolidated under `tooling/` (`tooling/agent`, `tooling/config`, `tooling/scripts`).
- Research and scraping surfaces separated under `research/`.
- Generated artifact policy codified and drift checks wired.

## Enforcement Added

- Backend architecture guardrails:
  - `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`
- Workspace dependency-edge checks:
  - `tooling/scripts/validate-workspace-boundaries.mjs`
  - root script `pnpm workspace:boundaries`
- CI quality gate wiring:
  - SDK drift check
  - workspace boundary check
  - trusted cleanup gate execution

## Test Rehabilitation Outcome

- Resolved deterministic `@tasky/web` failures blocking trust:
  - removed deleted-doc coupling in `web-container-overlay` test
  - aligned navigation heading assertion to current UI contract
- Post-rehab command set passed:

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
```

## Documentation Realignment

- Added maintenance operating model:
  - `docs/maintenance/OPERATING_MODEL.md`
- Added document taxonomy:
  - `docs/quality/document-taxonomy.md`
- Added central capability truth artifact:
  - `docs/quality/capability-matrix.md`
- Archived superseded plan/spec surfaces:
  - `docs/superpowers/plans/*` -> `archive/greenfield-docs/docs/superpowers/plans/`
  - `docs/superpowers/specs/*` -> `archive/greenfield-docs/docs/superpowers/specs/`
- Added archive intent documentation:
  - `archive/greenfield-docs/README.md`

## Deferred Items

- Warning-noise cleanup in web/mobile tests (React Router future flags, i18next/act warnings).
- Mutation-depth improvements for low-signal domains (starting analytics scenarios).
- Package-level test signal upgrades for SDK/core packages.

See `docs/quality/test-rehab-backlog.md` for ordered follow-up items.
