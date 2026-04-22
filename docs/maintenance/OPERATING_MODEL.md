# Maintenance Operating Model

**Status:** Canonical operational policy

Last updated: 2026-04-22

## Scope

Tasky is operated as a maintenance-and-extension monorepo, not a greenfield task-queue project.

## Source Of Truth

- Product truth: `docs/PRD.md`
- Strategy and pilot truth: `docs/STRATEGY.md`
- Governance and operational policy: relevant `docs/maintenance/*.md`
- Derived implementation design: `docs/architecture/AGENTS.md`, then the smallest relevant architecture doc
- Active API contract: `docs/openapi/openapi.yaml`
- Generated compatibility contract: `docs/API.yaml`
- Derived brand and UX detail: `docs/BRAND.md`, `docs/design/**`
- Historical reference only: `archive/**`

Design is not canonical. `docs/API.yaml` is generated-only and carries no independent authority.

## Read Order

When a maintenance task spans multiple document families, read them in this order:

1. Product intent and launch constraints from `docs/PRD.md`.
2. Market and pilot strategy from `docs/STRATEGY.md`.
3. Relevant maintenance policy docs for governance, readiness, or operational posture.
4. The smallest relevant derived architecture document routed by `docs/architecture/AGENTS.md`.
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` only when the request changes request/response contracts.
6. Design docs only for derived UX detail.
7. Archive material only for history, never as live authority.

## Planning Workflow

1. Capture requirement and constraints from the user, product direction, or issue tracker.
2. Confirm governing truth in PRD, strategy, and the relevant maintenance policy before proposing structural changes.
3. Write or update a scoped execution brief in the active work surface used by the team.
4. Define entry criteria, exit criteria, and explicit verification commands.
5. Execute in resumable checkpoints with reviewable commits.

## Implementation Workflow

1. Pick the next approved task from the active issue or execution brief.
2. Apply changes across required layers, contract-first when request/response behavior changes.
3. Verify locally at the appropriate baseline before claiming completion.
4. Record the evidence that matches the gate you are invoking.

## Verification Model

### Local baseline

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
```

### Boundary and drift checks

```bash
./gradlew --no-daemon :services:api:architectureTest
pnpm workspace:boundaries
pnpm sdk:drift
python3 tooling/scripts/validate-schema-parity.py
```

### CI and release gates

- PR CI truth: `quality-gates.yml`
- Release gate truth: `release-gate.yml`
- Nightly extended regression: `nightly-regression` plus `./gradlew gateRegression`
- Full extended suite: `./gradlew gateFull`

`gateSmoke` remains a useful local smoke command, but it is not the singular governing verification surface.

## Documentation Policy

- Keep live governing docs in `docs/`.
- Keep live derived architecture split by responsibility under `docs/architecture/`.
- Keep live derived design detail under `docs/design/`.
- Mark generated artifacts as generated and refresh them in the same change as their source.
- Move superseded plan/spec material to `archive/greenfield-docs/`.
- When a doc is archived or replaced, update root guidance and local discovery surfaces in the same change.

## Archive Policy

- Archive is read-only context for history and audits.
- No new active requirements should be introduced in archive paths.
- If archived content becomes active again, copy or re-author it back into a live `docs/` location.
