# Tasky Architecture Index

Purpose: fast routing to the right architecture document without duplicating content.

This file is intentionally non-normative. It does not redefine contracts; it points to canonical sources.
When documents conflict, precedence from `AGENTS.md` applies.

## 1. Reading Chain (No-Duplicate)

1. Read `AGENTS.md` for doctrine, governance, and precedence.
2. Use this index to choose the single canonical doc for your question.
3. Read only that canonical doc first; open supplementary docs only if needed.

## 2. Source-of-Truth Matrix

| Topic                                                                 | Canonical Source                            | Supplementary                                   |
|-----------------------------------------------------------------------|---------------------------------------------|-------------------------------------------------|
| Product scope, MVP boundaries, success metrics                        | `docs/PRD.md`                               | `docs/METRICS.md`, `docs/STRATEGY.md`           |
| API contract (request/response schema, endpoint shape)                | `docs/API.yaml`                             | Module `AGENTS.md` for implementation notes     |
| System architecture baseline (stack, data architecture, NFR approach) | `docs/ARCHITECTURE.md`                      | `docs/diagrams/*`                               |
| Module runtime behavior (auth, errors, idempotency, side effects)     | `src/main/java/mn/tasky/<module>/AGENTS.md` | Module controllers/services                     |
| Quality gates and self-verification contract                          | `docs/quality/SELF_VERIFY_CONTRACT.md`      | `docs/quality/risk-checks.json`                 |
| Agent operating workflow and ticket coordination                      | `docs/agent/RUNBOOK.md`                     | `tickets/STATUS.json`, `docs/agent/WORK_LOG.md` |
| Project policy and conflict resolution                                | `AGENTS.md`                                 | ADRs under `docs/adr/`                          |

## 3. Module Contract Index

Each file below is the canonical contract for that backend module:

- `src/main/java/mn/tasky/auth/AGENTS.md`
- `src/main/java/mn/tasky/user/AGENTS.md`
- `src/main/java/mn/tasky/verification/AGENTS.md`
- `src/main/java/mn/tasky/task/AGENTS.md`
- `src/main/java/mn/tasky/booking/AGENTS.md`
- `src/main/java/mn/tasky/payment/AGENTS.md`
- `src/main/java/mn/tasky/wallet/AGENTS.md`
- `src/main/java/mn/tasky/dispute/AGENTS.md`
- `src/main/java/mn/tasky/review/AGENTS.md`
- `src/main/java/mn/tasky/messaging/AGENTS.md`
- `src/main/java/mn/tasky/notification/AGENTS.md`
- `src/main/java/mn/tasky/admin/AGENTS.md`
- `src/main/java/mn/tasky/category/AGENTS.md`
- `src/main/java/mn/tasky/analytics/AGENTS.md`
- `src/main/java/mn/tasky/security/AGENTS.md`
- `src/main/java/mn/tasky/common/AGENTS.md`

## 4. Cross-Module Flow Map (Pointer-Only)

Use these docs for end-to-end flow understanding; this index intentionally avoids restating flow logic:

- Marketplace and booking state transitions: `docs/diagrams/marketplace-state-machines.md`
- Business lifecycle narrative: `docs/diagrams/marketplace-business-flow.md`
- Domain interactions: `docs/diagrams/domain-interaction-map.md`
- Trust/safety lifecycle: `docs/diagrams/trust-safety-lifecycle.md`
- Implementation-specific flow details: module `AGENTS.md` + `common/AGENTS.md` (outbox/idempotency/security)

## 5. Anti-Duplication Rule

When updating docs:

1. Update the canonical source for the topic.
2. In non-canonical docs, replace repeated details with links/pointers.
3. Keep this index as a routing table only (no duplicated endpoint tables or full flow specs).
