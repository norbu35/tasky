# Tasky Architecture Router

Routes to the smallest authoritative architecture surface for the change.

| Working area                      | Read                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `services/api/**`                 | `services/api/AGENTS.md`, `api.md`, `common.md`, affected module `AGENTS.md` |
| `apps/web/**`                     | `apps/web/AGENTS.md`, `web.md`, `shared-frontend.md`, `common.md`            |
| `apps/mobile/**`                  | `apps/mobile/AGENTS.md`, `mobile.md`, `shared-frontend.md`, `common.md`      |
| `packages/design-tokens/**`       | `shared-frontend.md`, nearest consumer surface doc                           |
| `packages/sdk/**`                 | `docs/openapi/AGENTS.md`, `api.md`                                           |
| `packages/**` (other)             | `common.md` + nearest consumer surface doc                                   |
| `docs/openapi/**`, `API.yaml`     | `docs/openapi/AGENTS.md`, `api.md`                                           |
| `tooling/agent/**`                | `tooling/agent/AGENTS.md`                                                    |
| `tooling/**` (other)              | `common.md` §Dev Workflow                                                    |
| Root infra (`docker-compose`, CI) | `common.md` §Shared Tech Decisions, `common.md` §Dev Workflow                |

Also read `docs/openapi/AGENTS.md` and `docs/openapi/openapi.yaml` when the task touches request/response contracts. Use `docs/API.yaml` only when you need the bundled single-file artifact.

## What each doc owns

- **`common.md`** — system context, cross-cutting tech decisions, runtime patterns (events/outbox, async, i18n), NFR baseline, dev workflow, cross-reference index.
- **`api.md`** — backend module layout, request-path architecture, data schemas and flows, API/security contracts, backend runtime concerns, backend testing.
- **`web.md`** — web-only structural contract; thin by design.
- **`mobile.md`** — mobile structural contract (layer rules, screen-family contract, enforcement).
- **`shared-frontend.md`** — tokens, parity baseline, intake renderer contract, TID test-naming rule.

New structural guidance belongs in the doc whose scope matches — not in this router.
