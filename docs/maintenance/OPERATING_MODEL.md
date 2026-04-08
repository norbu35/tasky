# Maintenance Operating Model

Last updated: 2026-04-09

## Scope

Tasky is now operated as a maintenance-and-extension monorepo, not a greenfield task-queue project.

## Source Of Truth

- Product/architecture: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API.yaml`
- Active execution plans: `docs/plans/`
- Quality and gates: `docs/quality/`
- Historical plans/specs: `archive/greenfield-docs/`

## Planning Workflow

1. Capture requirement and constraints from user/product direction.
2. Write or update a tranche-based implementation plan in `docs/plans/`.
3. Define entry/exit criteria and explicit verification commands per tranche.
4. Execute tranches in resumable checkpoints (small, reviewable commits).

## Implementation Workflow

1. Pick the next tranche from active `docs/plans/`.
2. Apply changes across required layers (API-first when contracts change).
3. Verify locally before claiming completion.
4. Commit with explicit scope and evidence-backed verification notes.

## Verification Baseline

Trusted maintenance gates:

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
```

Boundary enforcement additions:

```bash
./gradlew --no-daemon :services:api:test --tests '*ArchitectureTest'
pnpm workspace:boundaries
pnpm sdk:drift
```

## Documentation Policy

- Keep live operational docs in `docs/`.
- Move superseded plan/spec material to `archive/greenfield-docs/`.
- When a doc is archived, update references in root guidance (`README.md`, `AGENTS.md`, `CLAUDE.md`).

## Archive Policy

- Archive is read-only context for history and audits.
- No new active requirements should be introduced in archive paths.
- If archived content becomes active again, it must be copied/re-authored back into live `docs/` locations.
