# Maintenance Operating Model

Last updated: 2026-04-21

## Scope

Tasky is operated as a maintenance-and-extension monorepo, not a greenfield task-queue project.

## Source Of Truth

- Product: `docs/PRD.md`
- Technical: `docs/architecture/README.md`, `docs/architecture/common.md`, `docs/API.yaml`
- Design: canonical sources under `docs/design/`
- Operational runbooks: `docs/maintenance/STAGING_RUNBOOK.md`, `docs/maintenance/STAGING_TOGGLE_POSTURE.md`, `docs/maintenance/STAGING_SEED_DATA.md`
- Launch readiness: `docs/maintenance/PRODUCTION_READINESS.md`, `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`
- Historical plans/specs: `archive/greenfield-docs/`

## Read Order

When a maintenance task spans multiple document families, read them in this order:

1. Product intent and constraints from `docs/PRD.md`.
2. Technical baseline from `docs/architecture/README.md`, then the smallest relevant split architecture document, then `docs/API.yaml`.
3. Design authority from canonical `docs/design/` sources.
4. Launch readiness from `docs/maintenance/PRODUCTION_READINESS.md` and `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`.
5. Archive material only for historical context, never as live authority.

## Planning Workflow

1. Capture requirement and constraints from user, product, or issue-tracker direction.
2. Write or update a scoped execution brief in the active work surface used by the team.
3. Define entry/exit criteria and explicit verification commands.
4. Execute in resumable checkpoints with reviewable commits.

## Implementation Workflow

1. Pick the next approved task from the active issue or execution brief.
2. Apply changes across required layers, API-first when contracts change.
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
- Keep live architecture split by responsibility under `docs/architecture/`.
- Move superseded plan/spec material to `archive/greenfield-docs/`.
- Decide whether a document is canonical, local-router, compatibility alias, operational, or archive before editing it.
- When a doc is archived or replaced, update root guidance and local agent discovery surfaces in the same change.

## Archive Policy

- Archive is read-only context for history and audits.
- No new active requirements should be introduced in archive paths.
- If archived content becomes active again, copy or re-author it back into a live `docs/` location.
