# Source, Generated, And Archive Policy

Last updated: 2026-04-09

## Purpose

Define what is treated as source-of-truth vs reproducible output vs historical evidence.

## Artifact Classes

1. Source (versioned)
- Application/runtime source under `services/`, `apps/`, `packages/`
- Contracts and design docs under `docs/`
- Maintained contributor tooling under `tooling/`

2. Generated (reproducible, generally not versioned)
- TypeScript SDK output: `packages/sdk/src/generated/api-types.ts` (generated from `docs/API.yaml`)
- Design token build output: `packages/design-tokens/dist/` (generated from `packages/design-tokens/src/`)
- Java/Gradle build outputs under `build/` and module `build/` directories

3. Durable Evidence (versioned)
- Verification/audit reports under `docs/quality/`
- Policy-controlled JSON evidence under `artifacts/`

Note: test result dumps (e.g. `test-results.json`) are generated local evidence, not source. They must not be committed.

4. Research Inputs (versioned)
- Market datasets and scraper assets under `research/`

5. Local Scratch (not versioned)
- Temporary local session output (for example `.superpowers/`)
- Local caches and virtual environments

6. Archive (versioned, read-only intent)
- Retired process/workflow assets under `archive/`

## Explicit Decisions

- `packages/design-tokens/dist/` is generated output and is not tracked.
- `bin/` is treated as local build output and is not tracked.
- SDK drift is enforced through `tooling/scripts/validate-sdk-contract-drift.sh`.

## Reproducibility Commands

```bash
pnpm sdk:generate
pnpm --filter @tasky/design-tokens build
pnpm -r typecheck
```

## CI Enforcement

`quality-gates.yml` runs SDK drift validation to ensure generated SDK output matches `docs/API.yaml` and committed sources.
