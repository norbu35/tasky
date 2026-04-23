# Tasky Architecture Router

Routes to the smallest derived architecture surface for the change.

Architecture docs describe implementation reality and design. They do not govern intended product behavior. Product
behavior lives in `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, and the relevant maintenance policy docs.

## Read Order Before Architecture

For non-trivial work, read in this order:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md`
4. relevant `docs/maintenance/*.md`
5. the smallest relevant architecture doc below
6. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` only for contract work

## Routing Table

| Working area                      | Read                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `services/api/**`                 | `services/api/AGENTS.md`, `api.md`, `common.md`, affected module `AGENTS.md` |
| `apps/web/**`                     | `apps/web/AGENTS.md`, `web.md`, `shared-frontend.md`, `common.md`            |
| `apps/mobile/**`                  | `apps/mobile/AGENTS.md`, `mobile.md`, `shared-frontend.md`, `common.md`      |
| `docs/openapi/**`, `API.yaml`     | `docs/openapi/AGENTS.md`, `api.md`                                           |
| `packages/core/**`                | `packages/core/AGENTS.md`, `shared-frontend.md`                              |
| `packages/design-tokens/**`       | `packages/design-tokens/AGENTS.md`, `shared-frontend.md`                     |
| `packages/sdk/**`                 | `packages/sdk/AGENTS.md`, `docs/openapi/AGENTS.md`, `api.md`                 |
| `packages/test-utils/**`          | `packages/test-utils/AGENTS.md`, `shared-frontend.md`                        |
| `packages/**` (other)             | `common.md` plus the nearest consumer surface doc                            |
| `tooling/**` (other)              | `common.md` §Dev Workflow                                                    |
| Root infra (`docker-compose`, CI) | `common.md` §Shared Tech Decisions, `common.md` §Dev Workflow                |

Use `docs/API.yaml` only when you need the bundled single-file artifact. It is generated output, not an independent
maintained source.

## What Each Doc Owns

- `common.md` — system context, cross-cutting tech decisions, runtime patterns, NFR baseline, dev workflow, cross-reference index
- `api.md` — backend module layout, request-path architecture, data schemas and flows, API/security contracts, backend runtime concerns, backend testing
- `web.md` — web-only structural contract
- `mobile.md` — mobile structural contract
- `shared-frontend.md` — tokens, parity baseline, intake renderer contract, TID test-naming rule

New structural guidance belongs in the doc whose scope matches, not in this router.

## Authority Model

### Product requirements and policy

When architecture prose conflicts with product intent, precedence is:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md` for deferred-phase sequencing that does not override the active Phase 1 baseline
4. relevant `docs/maintenance/*.md`
5. architecture prose

If runtime behavior differs from PRD or strategy without an explicit document change, treat it as a code-and-doc mismatch and record the fix.

### Backend implementation order

When backend architecture docs conflict with code or tests about current implementation reality, this is the resolution
order:

1. ArchUnit tests (`services/api/src/test/java/mn/tasky/architecture/`)
2. Flyway migrations (`services/api/src/main/resources/db/migration/`)
3. Runtime code (package structure, public ports, composition services)
4. Architecture prose (`api.md`, `common.md`, module `AGENTS.md`)

If prose says X but code/tests say Y, code/tests win for implementation reality. File a doc fix.
