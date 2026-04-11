# AI Greenfield Cleanup Design

**Status:** approved
**Date:** 2026-04-11
**Scope:** repo-wide evidence-based cleanup of dead code, duplicate code, and low-signal AI-generated artifacts

## Goal

Reduce maintenance drag from the greenfield build-out without deleting intentionally deferred Phase 2/3 surfaces.
The cleanup targets code that is provably unused, semantically duplicated, or clearly low-value generated residue.

## Constraints

- Keep documented deferred and dormant feature shells intact.
- Prefer evidence over aesthetics: delete or consolidate only when references, imports, tests, and runtime paths agree.
- Avoid broad refactors that change user-facing behavior.
- Preserve existing package and domain boundaries.

## Evidence Sources

- Serena repo discovery and symbol/reference analysis
- TypeScript package-local unused-code analysis (`knip`, compiler, eslint)
- Duplicate-code detection (`jscpd`)
- Backend static analysis (`PMD`, `SpotBugs`, compiler warnings)
- Direct reference confirmation with `rg`

## In Scope

- Unused TypeScript exports, files, helpers, aliases, and stale wrapper code
- Duplicate components/utilities where one implementation is clearly canonical
- Stray generated artifacts committed to the repo when they are not part of the product
- Backend dead/sloppy code patterns surfaced by static analysis when the fix is behavior-preserving

## Out Of Scope

- Removing future-phase feature shells retained for later implementation
- Re-architecting active features
- Rewriting tests or docs unless needed to keep cleanup coherent
- Broad styling or naming churn without dead-code payoff

## Initial Signals

- `PMD` already flags locale-unsafe string normalization in `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`.
- Workspace state contains likely non-product artifacts:
  - `.serena/`
  - `apps/mobile/Simulator Screenshot - iPhone 17 Pro - 2026-04-10 at 23.13.33.png`
- Package-level unused-code analysis needs to be run in local package contexts because repo-root execution currently trips over the mobile Tailwind/Metro config chain.

## Cleanup Strategy

### 1. TypeScript unused surface

Run package-local analysis in `apps/web`, `apps/mobile`, `packages/core`, and `packages/design-tokens`. Remove only exports,
files, or aliases with no runtime or test consumers. When a duplicate wrapper exists, keep the version that aligns with the
current app architecture and delete the shadow copy.

### 2. Duplicate implementation consolidation

Use clone detection plus targeted search to find near-identical helpers/components. Consolidate only when call sites can move
to a single implementation without changing behavior or design-system conventions.

### 3. Backend dead/slop cleanup

Fix static-analysis issues that indicate generated-code slop or low-signal mistakes, starting with clearly safe cases such as
locale-sensitive normalization and obviously redundant code paths.

## Verification

- Targeted package checks for every touched area
- `pnpm --filter <pkg> typecheck`
- `pnpm --filter <pkg> test`
- `pnpm --filter <pkg> lint` where practical
- `./gradlew :services:api:test` or narrower verification for backend-only cleanup
- Re-run the analysis command that motivated each deletion or consolidation when feasible

## Success Criteria

- Repo contains fewer obviously dead or duplicate code paths
- No deferred feature shell was removed
- Static analysis findings addressed in touched areas
- All touched packages pass relevant targeted verification
