# Phase 1 Launch Roadmap

**Status:** Derived  
**Last updated:** 2026-04-22

This roadmap reflects the current Phase 1 launch baseline. Product truth lives in `docs/PRD.md`; strategy truth lives
in `docs/STRATEGY.md`.

## 1. Current Launch Posture

- Bayangol is the only live posting district in Phase 1.
- Supply may be citywide, but taskers must declare willingness to serve Bayangol before applying.
- Launch categories are home cleaning, furniture assembly, moving help / lifting help, and minor handyman.
- Phase 1 uses fixed category templates plus `I have a budget` / `I want quotes`.
- No customer-facing payment hold, payment protection, or escrow promise is allowed.
- Launch control requires real dashboarding for the approved seven KPIs.

## 2. What Counts As Launch-Live

### Core flow

- category-template task creation with schema-bound drafts and deterministic scope summaries (`REQ-P1-TASK-01` to `REQ-P1-TASK-04`)
- Bayangol posting gate plus out-of-area waitlist capture (`REQ-P1-TASK-05`)
- open application flow with customer selection and tasker acceptance SLA (`REQ-P1-BOOK-01` to `REQ-P1-BOOK-03`)
- booking lifecycle, reschedule timeline, no-show handling, and completion flow (`REQ-P1-BOOK-05` to `REQ-P1-BOOK-07`)
- verification, reviews, moderation, and admin operations (`REQ-P1-SAFE-*`, `REQ-P1-ADMIN-*`)

### Readiness posture

- truthful docs
- truthful toggle posture
- truthful dashboarding and alerting
- staging rehearsal and rollback evidence before production

## 3. Remaining Fast-Follow Work

| Item                                                 | Canonical requirement                                                    | Trigger                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Backend assisted-distribution module and persistence | `REQ-P1-ASSIST-03`, `REQ-P1-ASSIST-03A`, `REQ-P1-ADMIN-08`               | Native matching shows repeated Bayangol failures |
| Review enforcement hard locks tuning                 | `REQ-P1-SAFE-02`                                                         | Review obligation compliance is materially weak  |
| Verification and moderation ops hardening            | `REQ-P1-SAFE-01`, `REQ-P1-SAFE-06`, `REQ-P1-ADMIN-01`, `REQ-P1-ADMIN-04` | Operational volume requires tighter tooling      |
| KPI dashboard and alert ratification on real host    | KPI policy in `docs/PRD.md` / `docs/METRICS.md`                          | Required before production                       |

## 4. Readiness Ladder

The authoritative readiness posture lives in:

- `docs/maintenance/OPERATING_MODEL.md`
- `docs/maintenance/PRODUCTION_READINESS.md`

Current recommendation:

| Decision               | Current status                   | Notes                                                                                  |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `not ready`            | No longer accurate at repo level | Repo truth and private staging path exist                                              |
| `ready for staging`    | Current state                    | Use the private VPS sandbox next                                                       |
| `ready for production` | Not yet                          | Blocked on staging rehearsal, dashboarding, alert routing, and remaining evidence gaps |
