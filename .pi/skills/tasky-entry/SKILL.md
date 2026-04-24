---
name: tasky-entry
description: Stage-driven Tasky repo entry workflow. Use for any Tasky request that should follow request -> PRD -> requirement/clarification -> downstream docs update -> scenario -> validation -> test -> implementation -> verification -> docs review -> commit.
---

# Tasky Entry

Use this as the default entry skill for work in this repository.

## Stage contract

Follow these stages in order:

1. `request`
2. `prd`
3. `requirement_clarification`
4. `downstream_docs_update`
5. `scenario`
6. `validation`
7. `test`
8. `implementation`
9. `verification`
10. `docs_review`
11. `commit`

At every checkpoint:

- state the current stage
- state the next gate before moving forward
- do not skip stages silently
- if a stage is genuinely not needed, mark it `n/a` with a one-sentence reason

Allowed stop conditions:

- `requirement_clarification` when the request is ambiguous enough that PRD, contract, or scenario handling would be risky
- `scenario` when no matching scenario exists and you are not explicitly the designated scenario curator for the current execution brief

## Governing read order

Read in this order unless a more specific local `AGENTS.md` narrows the surface:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/STRATEGY.md`
4. relevant `docs/maintenance/*.md`
5. the smallest routed architecture doc from `docs/architecture/AGENTS.md`
6. `docs/openapi/AGENTS.md` plus `docs/openapi/openapi.yaml` only when request/response contract behavior changes

Architecture describes implementation design; it does not override product intent.

## Stage details

### 1. request

- Start from the active issue, approved execution brief, or user request.
- If none exists, create a short execution brief before changing code or docs.
- Record the requested outcome, affected surface, and likely task lane.

### 2. prd

- Read PRD, strategy, and relevant maintenance policy first.
- Decide whether the request changes product behavior, launch scope, KPI semantics, trust promises, booking/review policy, public copy, or API behavior.

### 3. requirement_clarification

- If the change is implementation-only, state that explicitly.
- If behavior or contract changes, load and follow `tooling/skills/intake-to-prd/SKILL.md`.
- If `docs/PRD.md` changes, run the narrowest matching `pnpm repo:prd:diff-ids` mode and identify the affected `REQ-P1-*` or `NFR-*` IDs.
- If the request is ambiguous, stop here and report the exact clarification needed.

### 4. downstream_docs_update

When product or contract behavior changes, move the derivative surfaces in this order:

1. maintenance policy
2. architecture docs
3. `docs/openapi/**`
4. design docs
5. SDK generation inputs and derived artifacts

Use repo-owned skills as needed:

- `tooling/skills/doc-claims-remediation/SKILL.md`
- `tooling/skills/design-surface-drift/SKILL.md`

If contract behavior changes:

- update `docs/openapi/**`
- run `pnpm openapi:bundle`
- run `pnpm sdk:generate`

### 5. scenario

Before backend tests or frontend behavioral integration/E2E tests:

- check `tests/registry.yaml`
- read the relevant `tests/scenarios/<domain>.md`

Rules:

- implementation agents do not rewrite scenarios by default
- when a touched frontend behavioral test has a clean scenario match, use `SCN-XXX-NNN: <exact title from scenario file>` naming
- keep `TID-*` only for frontend-specific technical checks such as parity, accessibility, token binding, and API-client boundary tests
- if no scenario covers the behavior and you are not explicitly the designated scenario curator, stop and report the gap
- if scenario files change, run `./services/api/scripts/sync-registry.sh`

### 6. validation

Run the smallest validation set needed before test-writing or implementation proceeds.

Common examples:

- `pnpm repo:prd:diff-ids` when `docs/PRD.md` changed
- `pnpm repo:docs:check` when docs or contracts moved
- `pnpm repo:design:check` for structural design-doc edits
- `./services/api/scripts/sync-registry.sh` after scenario changes
- `pnpm openapi:bundle`
- `pnpm sdk:generate`
- `./gradlew --no-daemon :services:api:openApiValidate`

### 7. test

- Write or update tests against existing scenario coverage.
- Backend `@DisplayName` must be exactly `SCN-XXX-NNN: <title>` for scenario-backed tests.
- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`.
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`.

### 8. implementation

- Follow the nearest local `AGENTS.md`.
- For backend work, follow `docs/architecture/api.md` section 1.1 patterns.
- For API changes, remain contract-first.
- Keep changes vertical and reviewable.

### 9. verification

Run the smallest verification lane that matches the claim.

Typical lanes:

- `pnpm repo:docs:check`
- `pnpm verify:scenario:smoke`
- `./gradlew --no-daemon :services:api:test :services:api:openApiValidate`
- `pnpm verify:backend`
- `pnpm verify:frontend`
- `pnpm verify:drift`

Record the command evidence before claiming completion.

### 10. docs_review

Do a final docs and instruction-surface review for any task that changed behavior, contracts, architecture, maintenance
policy, or agent-facing docs.

Use:

- `pnpm repo:docs:check`
- `pnpm repo:docs:claims:audit` when editing architecture docs, maintenance docs, or backend module `AGENTS.md` files naming live repo surfaces

Confirm no downstream doc remains stale relative to the final implementation.

### 11. commit

Only commit after verification and docs review pass.

Rules:

- commit message must match `type(scope): summary`
- do not use `--no-verify`
- commit only the intended task scope

## Required output at stage boundaries

Before moving to the next stage, summarize:

- what changed in the current stage
- what gate was satisfied
- what remains for the next stage

If blocked, state the block instead of pretending the workflow is complete.
