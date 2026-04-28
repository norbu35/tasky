# Maintenance Operating Model

## Scope

Tasky is operated as a maintenance-and-extension monorepo, not as a greenfield task queue.

## Core references

- Product requirements: `docs/PRD.md`
- Market and launch strategy: `docs/STRATEGY.md`
- Phase 1 KPI formulas and launch decision thresholds: `docs/METRICS.md`
- Operating policy: relevant `docs/maintenance/*.md`
- Architecture routing: `docs/architecture/AGENTS.md`, then the smallest relevant architecture doc
- Active API contract: `docs/openapi/openapi.yaml`
- Bundled API artifact: `docs/API.yaml`
- Brand and UX detail: `docs/BRAND.md`, `docs/design/**`
- Historical reference: `archive/**`

Design does not define product scope. `docs/API.yaml` is a bundle, not a maintained source.

## Read order

When a task spans multiple document families, read them in this order:

1. Product requirements and launch constraints from `docs/PRD.md`
2. Market and launch strategy from `docs/STRATEGY.md`
3. KPI formulas, thresholds, and denominator rules from `docs/METRICS.md` when launch metrics or dashboards are implicated
4. Relevant maintenance policies for governance, readiness, or operational posture
5. The smallest relevant architecture document routed by `docs/architecture/AGENTS.md`
6. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` when request or response contracts change
7. Design docs for UX detail only
8. Archive material for history only

## Planning workflow

1. Capture the request, constraint, or bug clearly.
2. Confirm the governing requirements and operating policy before proposing structural changes.
3. Write or update a scoped execution brief in the active work surface used by the team.
4. Define entry criteria, exit criteria, and verification commands.
5. Execute in resumable checkpoints with reviewable commits.

## Implementation workflow

1. Pick the next approved task from the active issue or execution brief.
2. Apply changes across the required layers, contract-first when request or response behavior changes.
3. Verify locally at the appropriate baseline before claiming completion.
4. Record the evidence that matches the gate being used.

## Branch workflow

1. Build and validate changes on a feature branch.
2. Merge to `staging` for shared integration and CI feedback.
3. Promote `staging` to `main` only when the full local push gate is green.

Operational rules:

- Do not bypass git hooks with `--no-verify` when pushing to `staging` or `main`.
- `.husky/pre-push` is branch-aware: full gate on pushes to `main`, lightweight path on non-`main` branches.
- `quality-gates.yml` runs on pushes to `staging` and `main`; feature branches do not trigger it by default.

## Verification model

### Local baseline

```bash
pnpm verify:cleanup
./gradlew --no-daemon :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
```

### Boundary and parity checks

```bash
./gradlew --no-daemon :services:api:architectureTest
pnpm repo:workspace:boundaries
pnpm contract:sdk:drift
python3 tooling/scripts/governance/validate-schema-parity.py
```

### CI and release gates

- Merge CI: `quality-gates.yml` on pushes to `main` and `staging`
- Release gate: `release-gate.yml`
- Nightly extended regression: `nightly-regression` when manually dispatched plus `./gradlew gateRegression`
- Full extended suite: `./gradlew gateFull`

Merge CI includes the docs lane through `quality-gates.yml` -> `pnpm verify:cleanup` -> `pnpm repo:docs:check`,
which covers journey validation through `pnpm repo:design:check` and screen-spec traceability through
`python3 tooling/scripts/governance/validate-screen-spec-traceability.py`.
Ops wiring validation runs through `pnpm verify:ops`, which checks `tooling/config/ops-registry.yaml` and verifies
that `docs/maintenance/generated/OPS_INVENTORY.md` is fresh. Refresh mechanical ops inventory drift with
`pnpm repo:ops:sync --fix`.
Frontend merge quality runs `pnpm verify:frontend:affected`, which includes `pnpm verify:i18n` before affected lint,
typecheck, and tests.

`gateSmoke` remains useful locally as a fast critical-scenario smoke gate, but it is not the only verification surface.

## Documentation policy

- Keep live governing docs in `docs/`.
- Keep live architecture guidance split by responsibility under `docs/architecture/`.
- Keep live design detail under `docs/design/`.
- Refresh generated artifacts in the same change as their maintained source.
- Move superseded plan or spec material to `archive/greenfield-docs/`.
- When a doc is archived or replaced, update discovery surfaces in the same change.

## Archive policy

- Archive is reference material for history and audits.
- Do not introduce new active requirements in archive paths.
- If archived content becomes active again, copy or re-author it back into a live `docs/` location.
