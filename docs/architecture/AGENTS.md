# Tasky Architecture Router

Routes to the smallest authoritative architecture surface for the change.

| Working area       | Read                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| `services/api/**`  | `services/api/AGENTS.md`, `docs/architecture/common.md`, affected module `AGENTS.md`  |
| `apps/web/**`      | `apps/web/AGENTS.md`, `docs/architecture/web.md`, `docs/architecture/common.md`       |
| `apps/mobile/**`   | `apps/mobile/AGENTS.md`, `docs/architecture/mobile.md`, `docs/architecture/common.md` |
| `packages/**`      | `docs/architecture/common.md` + nearest consumer surface (`web.md` or `mobile.md`)    |
| `tooling/agent/**` | `tooling/agent/AGENTS.md`                                                             |

Also read `docs/API.yaml` when the task touches request/response contracts.

New structural guidance belongs in the architecture documents above, not in this router.
