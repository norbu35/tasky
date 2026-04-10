# Source, Generated, And Archive Policy

Last updated: 2026-04-09

## Purpose

Define what counts as source, what counts as reproducible output, and what is preserved only as historical evidence.
This policy applies to `docs/` as well as the rest of the repository.

## Core Principle

`docs/` is a mixed-authority tree. It contains canonical sources and derived-active operational documents alongside
historical evidence and generated-local artifacts. Do not treat every file under `docs/` as equal authority.

## Artifact Classes

### 1. Source, versioned

These are authoritative inputs that establish product, technical, or operational truth:

- Application/runtime source under `services/`, `apps/`, and `packages/`
- Canonical documentation under `docs/` such as `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API.yaml`, `docs/design/component-contract.yaml`, and canonical
  design sources under `docs/design/`
- Maintained derived-active operational docs that are intentionally part of the live control surface, such as
  `docs/plans/`, `docs/ARCHITECTURE_INDEX.md`, `docs/LAUNCH_ROADMAP.md`, `docs/quality/README.md`, `docs/quality/verification-matrix.md`, `docs/quality/cleanup-gate.md`, and the synchronized design summaries that mirror canonical design
  sources
- Maintained contributor tooling under `tooling/`

### 2. Generated-local, reproducible

These artifacts are outputs of canonical inputs or local execution. They are not source, even if versioned for
convenience:

- Design prompt outputs such as the archived pack under `archive/greenfield-docs/docs/design/prompts/` and any newly
  regenerated local prompt files
- Prompt manifests and other reproducible generator outputs
- TypeScript SDK output: `packages/sdk/src/generated/api-types.ts` generated from `docs/API.yaml`
- Design token build output: `packages/design-tokens/dist/` generated from `packages/design-tokens/src/`
- Java/Gradle build outputs under `build/` and module `build/` directories
- Test result dumps such as `test-results.json`, coverage exports, and similar local verification artifacts

If a file can be recreated from canonical inputs, it belongs here even if the repository currently keeps a copy.

### 3. Historical evidence, versioned

These artifacts are kept for traceability, audit history, or research context, not as implementation authority:

- ADRs under `docs/adr/`
- Debate notes and idea scratchpads under `archive/greenfield-docs/docs/`
- Research syntheses and source summaries under `docs/research/`
- Historical audits, baselines, backlogs, and reports under `docs/quality/`
- Retired process/workflow assets under `archive/`

### 4. Local scratch, not versioned

These artifacts are temporary and must stay out of source control:

- `.superpowers/`
- Local caches and virtual environments
- Ad hoc editor or OS metadata

### Removal candidates

`delete-candidate` is a removal disposition, not a source class and not part of the authority ladder. Use it for junk,
obsolete duplicates, or misleading outputs that should be removed when safe:

- OS metadata and stray local files such as `docs/.DS_Store`
- Reproducible outputs that no longer have a consumer
- Duplicated summaries that conflict with canonical sources

## Explicit Decisions

- `test-results.json` and similar generated result dumps are local evidence, not source.
- `docs/design/prompts/README.md` is derived-active operational guidance.
- `docs/design/prompts/global-context.yaml` is canonical design-context authority.
- The committed prompt-output pack now lives under `archive/greenfield-docs/docs/design/prompts/`; prompt outputs
  should be regenerated from canonical design inputs rather than hand-edited into a competing authority.
- `docs/quality/README.md` is derived-active operational guidance, while audit/backlog/baseline/report artifacts under
  `docs/quality/` are historical evidence.
- The repository should not classify `delete-candidate` as an authority class; it is a temporary removal label only.
- `archive/` is historical context only. If archived material becomes active again, re-author it into live `docs/`
  surfaces instead of promoting the archive copy.
- The repository should never rely on `docs/` alone to decide whether an artifact is source. Use the taxonomy in
  `docs/quality/document-taxonomy.md`.

## Reproducibility Commands

```bash
pnpm sdk:generate
pnpm --filter @tasky/design-tokens build
pnpm -r typecheck
```

## CI Enforcement

`quality-gates.yml` runs SDK drift validation to ensure generated SDK output matches `docs/API.yaml` and committed
sources.
