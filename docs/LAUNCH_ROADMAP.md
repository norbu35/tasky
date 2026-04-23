# Phase 1 Launch Roadmap

This roadmap summarizes the current launch baseline. Product behavior is defined in `docs/PRD.md`. Market posture and operating priorities are defined in `docs/STRATEGY.md`.

## 1. Launch posture

- Live posting is available across all of Ulaanbaatar.
- Supply is citywide, with tasker service-area preferences used for targeting and notifications.
- Launch categories are home cleaning, furniture assembly, moving help / lifting help, and minor handyman.
- Phase 1 uses fixed category templates with two pricing paths: `I have a budget` and `I want quotes`.
- The product makes no customer-facing promise of payment hold, payment protection, or escrow.
- Launch control requires real dashboarding for the approved seven KPIs.

## 2. What counts as launch-ready

### Core flow

- category-template task creation with schema-bound drafts and deterministic scope summaries (`REQ-P1-TASK-01` to `REQ-P1-TASK-04`)
- citywide posting with Ulaanbaatar-wide task eligibility (`REQ-P1-TASK-05`)
- open application flow with customer selection and tasker acceptance SLA (`REQ-P1-BOOK-01` to `REQ-P1-BOOK-03`)
- booking lifecycle, reschedule timeline, no-show handling, and completion flow (`REQ-P1-BOOK-05` to `REQ-P1-BOOK-07`)
- verification, reviews, moderation, and admin operations (`REQ-P1-SAFE-*`, `REQ-P1-ADMIN-*`)

### Readiness posture

- aligned governing docs and derived docs
- correct toggle posture for the environment being exercised
- real dashboarding and alert routing for launch metrics
- staging rehearsal and rollback evidence before production

## 3. Remaining fast-follow work

| Item                                                 | Canonical requirement                                                    | Trigger                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Backend assisted-distribution module and persistence | `REQ-P1-ASSIST-03`, `REQ-P1-ASSIST-03A`, `REQ-P1-ADMIN-08`               | Native matching shows repeated citywide failures |
| Review enforcement hard-lock tuning                  | `REQ-P1-SAFE-02`                                                         | Review obligation compliance is materially weak  |
| Verification and moderation ops hardening            | `REQ-P1-SAFE-01`, `REQ-P1-SAFE-06`, `REQ-P1-ADMIN-01`, `REQ-P1-ADMIN-04` | Operational volume requires tighter tooling      |
| KPI dashboard and alert ratification on real host    | KPI policy in `docs/PRD.md` / `docs/METRICS.md`                          | Required before production                       |

## 4. Readiness ladder

The operating decision lives in:

- `docs/maintenance/OPERATING_MODEL.md`
- `docs/maintenance/PRODUCTION_READINESS.md`

Current recommendation:

| Decision               | Current status         | Notes                                                                                  |
| ---------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `not ready`            | No longer accurate     | The repo and private sandbox are usable                                                |
| `ready for staging`    | Current recommendation | Use the private VPS sandbox next                                                       |
| `ready for production` | Not yet                | Blocked on staging rehearsal, dashboarding, alert routing, and remaining evidence gaps |
