# Tasky Architecture Index

Purpose: fast routing to the right architecture document without duplicating content.

This file is intentionally non-normative. It does not redefine contracts; it points to canonical sources.
When documents conflict, precedence from `AGENTS.md` applies.
Derived-active docs are operational aids only: they can summarize, route, or mirror canonical truth, but they do not
share authority with canonical sources.

## 1. Reading Chain (No-Duplicate)

1. Read `AGENTS.md` for doctrine, governance, and precedence.
2. Use this index to choose the authoritative source set for the question.
3. Read the canonical source first, then consult derived-active support docs only for routing, summaries, or execution
   context.

For current launch posture and activation readiness, start with `docs/maintenance/PRODUCTION_READINESS.md` and
`docs/maintenance/FEATURE_ACTIVATION_POLICY.md`.

## 2. Authoritative Read Order

Use this order when a topic spans multiple doc families:

1. Product: `docs/PRD.md`, then product companions such as `docs/METRICS.md` and `docs/STRATEGY.md`.
2. Technical: `docs/ARCHITECTURE.md`, then `docs/API.yaml`, then module `AGENTS.md` files.
3. Design: canonical design sources under `docs/design/`, especially `docs/design/journey-catalog.yaml` and
   `docs/design/screen-specs/`.
4. Operational readiness: `docs/maintenance/PRODUCTION_READINESS.md`, `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`.

When a derived-active doc conflicts with a canonical source, the canonical source wins.

## 3. Source-of-Truth Matrix

| Topic                                                                 | Canonical Source                            | Supplementary                                   |
|-----------------------------------------------------------------------|---------------------------------------------|-------------------------------------------------|
| Product scope, MVP boundaries, success metrics                        | `docs/PRD.md`                               | `docs/METRICS.md`, `docs/STRATEGY.md`           |
| API contract (request/response schema, endpoint shape)                | `docs/API.yaml`                             | Module `AGENTS.md` for implementation notes     |
| System architecture baseline (stack, data architecture, NFR approach) | `docs/ARCHITECTURE.md`                      | `docs/design/domain-lifecycles.yaml`, `docs/design/journey-catalog.yaml` |
| Current launch posture and activation readiness                        | `docs/maintenance/PRODUCTION_READINESS.md`, `docs/maintenance/FEATURE_ACTIVATION_POLICY.md` | `docs/PRD.md`, `docs/STRATEGY.md` |
| Module runtime behavior (auth, errors, idempotency, side effects)     | `services/api/src/main/java/mn/tasky/<module>/AGENTS.md` | Module controllers/services                     |
| Quality gates and self-verification guidance                          | `docs/maintenance/OPERATING_MODEL.md`       | `AGENTS.md`                                     |
| Agent workflow and maintenance execution                              | `AGENTS.md`                                 | `docs/plans/`, `archive/legacy-task-system/`    |
| Project policy and conflict resolution                                | `AGENTS.md`                                 | ADRs under `docs/adr/`                          |

## 4. Module Contract Index

Repository zones:
- Runtime: `apps/`, `services/`, `packages/`
- Support: `tooling/`, `research/`, `archive/`, `docs/`

Each file below is the canonical contract for that backend module:

- `services/api/src/main/java/mn/tasky/auth/AGENTS.md`
- `services/api/src/main/java/mn/tasky/user/AGENTS.md`
- `services/api/src/main/java/mn/tasky/verification/AGENTS.md`
- `services/api/src/main/java/mn/tasky/task/AGENTS.md`
- `services/api/src/main/java/mn/tasky/booking/AGENTS.md`
- `services/api/src/main/java/mn/tasky/payment/AGENTS.md`
- `services/api/src/main/java/mn/tasky/wallet/AGENTS.md`
- `services/api/src/main/java/mn/tasky/dispute/AGENTS.md`
- `services/api/src/main/java/mn/tasky/review/AGENTS.md`
- `services/api/src/main/java/mn/tasky/messaging/AGENTS.md`
- `services/api/src/main/java/mn/tasky/notification/AGENTS.md`
- `services/api/src/main/java/mn/tasky/admin/AGENTS.md`
- `services/api/src/main/java/mn/tasky/category/AGENTS.md`
- `services/api/src/main/java/mn/tasky/analytics/AGENTS.md`
- `services/api/src/main/java/mn/tasky/security/AGENTS.md`
- `services/api/src/main/java/mn/tasky/common/AGENTS.md`

## 5. Cross-Module Flow Map (Pointer-Only)

Use these docs for end-to-end flow understanding; this index intentionally avoids restating flow logic:

- Marketplace, booking, verification, dispute, and user state machines: `docs/design/domain-lifecycles.yaml`
- Journey-level business flow and alternate paths: `docs/design/journey-catalog.yaml`
- Screen and navigation graph: `docs/design/screen-graph.yaml`
- State coverage and screen-level parity context: `docs/design/state-matrix.yaml`, `docs/design/screen-inventory.yaml`
- Implementation-specific flow details: module `AGENTS.md` + `common/AGENTS.md` (outbox/idempotency/security)

## 6. Anti-Duplication Rule

When updating docs:

1. Update the canonical source for the topic.
2. In non-canonical docs, replace repeated details with links/pointers instead of duplicating authority.
3. Keep this index as a routing table only (no duplicated endpoint tables or full flow specs).
