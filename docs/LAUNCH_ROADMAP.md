# Phase 0-1 Launch Roadmap

## What Shipped (Phase 0-1 Launch Minimum)

The verified product commitment is the Phase 1 launch baseline: zero monetization, founder-as-concierge backstop, and
later-phase capabilities kept dormant unless they are individually promoted after evidence review.

This roadmap no longer claims the repo is already production-ratified. Current program status after the SDLC audit:

- product and documentation truth have been re-aligned to Phase 1
- verification trust is materially stronger
- private VPS staging is now repo-supported
- production is still blocked on live staging rehearsal, release-grade OAuth rehearsal, and a small set of missing
  blocker-grade backend scenario families

### Core Flow

- Task creation with structured intake forms (category-specific 3-5 question schemas)
- Deterministic scope summary generation with key-value fallback
- Task draft system with server-bound schema version
- Application flow (APPLIED → SELECTED → ACCEPTED → DECLINED → EXPIRED)
- Booking lifecycle (ASSIGNED → COMPLETED | CANCELLED | NO_SHOW)
- Reschedule request/accept/decline flow with immutable schedule events
- No-show reminder + adjudication flow
- Liability disclaimer enforcement on booking acceptance

### Trust & Identity

- Facebook OAuth login (Phase 0-1 primary auth)
- Verification with mandatory consent tracking (policy version + timestamp)
- Pro Badge auto-assignment at 15+ completed tasks and 4.5+ rating
- 5-category granular reviews (role-specific: 3 ratings per direction)
- Dispute creation and admin resolution

### Infrastructure

- Feature toggles (DB-backed, runtime-switchable, audit-logged)
- Idempotency on critical state-changing endpoints
- Transactional outbox for async side-effects
- Structured logging with correlation IDs
- Cursor-based pagination on all list endpoints
- AES-256-GCM phone encryption with blind indexing
- Facebook OAuth circuit-breaker status endpoint and outage posture
- Firebase Cloud Messaging push provider with topic subscription

### Admin

- Verification queue (pending list, approve/reject)
- Category management with intake schema versioning (create/activate/rollback)
- Feature toggle management
- User ban/unban
- Dispute resolution

---

## Deferred Items

Every item below was intentionally deferred from launch. Each has a trigger condition — not a calendar date — for when it should be built. The founder manually handles these cases during the controlled pilot.

### Tier 1 — Fast-Follow Week 1-2

Build as soon as live traffic reveals the need.

| Item                                      | PRD Requirement              | Trigger                                                                              | Founder Workaround                                   |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| ~~NO_SHOW status + adjudication~~         | ~~REQ-BOOK-11, REQ-TASK-02~~ | **DONE** — booking and task now transition to `NO_SHOW` with reminder and flag rules | Founder fallback no longer primary path              |
| Dispute evidence upload + 24h auto-close  | REQ-SAFE-10                  | First dispute where chat logs are insufficient                                       | Founder reviews chat history directly in admin panel |
| Review enforcement soft gates (reminders) | REQ-SAFE-02, REQ-SAFE-11     | Review completion rate drops below 70%                                               | Founder sends manual reminder messages               |

### Tier 2 — Fast-Follow Week 3-4

Build once core flow is stable and founder ops patterns are established.

| Item                                          | PRD Requirement              | Trigger                                                             |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| ~~Reschedule request/accept/decline flow~~    | ~~REQ-BOOK-12, REQ-BOOK-13~~ | **DONE** — canonical reschedule workflow is implemented             |
| ~~Booking timeline events (immutable audit)~~ | ~~REQ-BOOK-13~~              | **DONE** — immutable booking timeline is implemented                |
| No-applicant rescue flow (120min detection)   | REQ-BOOK-09                  | >3 tasks with zero applicants in a week                             |
| Phone leak detection in messages              | REQ-LEAK-04                  | Baseline leakage rate measurement begins                            |
| Repeat booking shortcut                       | REQ-BOOK-07                  | First repeat customer (30-day cohort data)                          |
| ~~Concierge dispatch endpoint~~               | ~~REQ-ADMIN-07~~             | **DONE** — implemented as `POST /admin/tasks/{id}/concierge-assign` |

### Tier 3 — Pre-Phase-2

Build before Phase 2 monetization gate (200+ completed bookings, 40% repeat customer rate).

| Item                                           | PRD Requirement              | Trigger                                                             |
| ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| ~~Reliability score computation~~              | ~~REQ-SAFE-06~~              | **DONE** — reliability scoring service is implemented               |
| ~~Tasker badges table (persistent Pro badge)~~ | ~~REQ-SAFE-04~~              | **DONE** — badge persistence and evaluation service are implemented |
| ~~Facebook OAuth circuit breaker~~             | ~~REQ-AUTH-09, REQ-AUTH-10~~ | **DONE** — status endpoint and outage handling are implemented      |
| ~~Verification access audit logging~~          | ~~REQ-SAFE-08~~              | **DONE** — verification media views write audit events              |
| ~~Identity data lifecycle / deletion~~         | ~~REQ-SAFE-09~~              | **DONE** — retention and anonymization service is implemented       |
| ~~Actual FCM/APNs push integration~~           | ~~REQ-NOTIF-01~~             | **DONE** — Firebase push provider is implemented and configured     |
| Actual SMS sending integration                 | REQ-NOTIF-02                 | Phase 2 OTP requirement                                             |
| Task rescue events persistence                 | REQ-BOOK-09                  | Alongside rescue flow                                               |
| Review enforcement hard locks                  | REQ-SAFE-02                  | Review rate still below 85% after soft gates                        |

---

## Readiness Ladder

The authoritative readiness posture now lives in:

- `docs/maintenance/STAGING_RUNBOOK.md`
- `docs/maintenance/PRODUCTION_READINESS.md`
- `docs/quality/final-launch-readiness-report-2026-04.md`

Current recommendation:

| Decision               | Current status                    | Notes                                                                                                                |
| ---------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `not ready`            | No longer accurate at repo level. | Documentation, capability truth, and repo-side staging path now exist.                                               |
| `ready for staging`    | Current state.                    | The repo is ready for the private VPS sandbox path and should be exercised there next.                               |
| `ready for production` | Not yet.                          | Blocked on live staging rehearsal, release-grade OAuth rehearsal, and remaining blocker-grade backend evidence gaps. |

## Production Gate Summary

Before first real user, all of the following still need to be true:

- release-grade staging exists with `dev-auth` disabled and real Facebook callback reachability
- staging rehearsal evidence is attached
- Phase 1 launch toggles remain in the dormant posture
- launch KPI dashboards and alert thresholds are live
- rollback and backup posture are rehearsed
- the remaining missing blocker-grade backend scenario families are resolved or explicitly waived
