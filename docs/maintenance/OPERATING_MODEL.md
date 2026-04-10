# Maintenance Operating Model

Last updated: 2026-04-09

## Scope

Tasky is now operated as a maintenance-and-extension monorepo, not a greenfield task-queue project.

## Source Of Truth

- Product: `docs/PRD.md`
- Technical: `docs/ARCHITECTURE.md`, `docs/API.yaml`
- Design: canonical sources under `docs/design/`
- Operational runbooks: `docs/maintenance/STAGING_RUNBOOK.md`, `docs/maintenance/STAGING_TOGGLE_POSTURE.md`,
  `docs/maintenance/STAGING_SEED_DATA.md`
- Quality canonical: `docs/quality/document-taxonomy.md`, `docs/quality/document-inventory-2026-04.md`
- Quality derived-active: `docs/quality/README.md`, `docs/quality/verification-matrix.md`,
  `docs/quality/cleanup-gate.md`, and other maintained controls under `docs/quality/`
- Active execution plans: `docs/plans/`
- Historical plans/specs: `archive/greenfield-docs/`

## Read Order

When a maintenance task spans multiple document families, read them in this order:

1. Product intent and constraints from `docs/PRD.md`.
2. Technical baseline from `docs/ARCHITECTURE.md`, then the API contract in `docs/API.yaml`.
3. Design authority from canonical `docs/design/` sources.
4. Quality classification and inventory from `docs/quality/document-taxonomy.md` and
   `docs/quality/document-inventory-2026-04.md`.
5. Derived-active operating docs such as `docs/ARCHITECTURE_INDEX.md`, `docs/quality/README.md`, and `docs/plans/`
   only after the canonical sources above.

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
- Use the document taxonomy and inventory to decide whether a `docs/` surface is canonical, derived-active,
  historical, or generated-local before reclassifying or editing it.
- When a doc is archived, update references in root guidance (`README.md`, `AGENTS.md`, `CLAUDE.md`).

## Archive Policy

- Archive is read-only context for history and audits.
- No new active requirements should be introduced in archive paths.
- If archived content becomes active again, it must be copied/re-authored back into live `docs/` locations.
