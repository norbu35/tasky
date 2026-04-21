# Tasky Architecture Router

Purpose: route humans and agents to the smallest authoritative architecture surface that answers the question.

## Read Order

1. Read `AGENTS.md` for repo-wide doctrine and discovery rules.
2. Read this file to choose the right architecture document.
3. Read `docs/API.yaml` when the task touches request/response contracts.
4. Read the nearest local `AGENTS.md` for the surface being edited.

## Canonical Architecture Surfaces

| Topic                                                       | Canonical source              |
| ----------------------------------------------------------- | ----------------------------- |
| System context, backend stack, data model, API policy, NFRs | `docs/architecture/common.md` |
| Shared frontend contracts                                   | `docs/architecture/common.md` |
| Web-specific architecture                                   | `docs/architecture/web.md`    |
| Mobile-specific architecture and structural contract        | `docs/architecture/mobile.md` |
| API schema and endpoint contracts                           | `docs/API.yaml`               |

## Path-Based Routing

| Working area       | Read next                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `services/api/**`  | `services/api/AGENTS.md`, then `docs/architecture/common.md`, then the affected module `AGENTS.md` |
| `apps/web/**`      | `apps/web/AGENTS.md`, then `docs/architecture/web.md`, then `docs/architecture/common.md`          |
| `apps/mobile/**`   | `apps/mobile/AGENTS.md`, then `docs/architecture/mobile.md`, then `docs/architecture/common.md`    |
| `packages/**`      | `docs/architecture/common.md` plus the nearest consumer surface (`web.md` or `mobile.md`)          |
| `tooling/agent/**` | `tooling/agent/AGENTS.md`                                                                          |

New structural guidance should be added to the split documents above.
