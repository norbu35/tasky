# Phase 0-1 Launch Roadmap

## What Shipped (Phase 0-1 Launch Minimum)

The backend is production-ready for a controlled pilot with zero monetization and founder-as-concierge backstop.

### Core Flow
- Task creation with structured intake forms (category-specific 3-5 question schemas)
- Deterministic scope summary generation with key-value fallback
- Task draft system with server-bound schema version
- Application flow (APPLIED → SELECTED → ACCEPTED → DECLINED → EXPIRED)
- Booking lifecycle (ASSIGNED → COMPLETED | CANCELLED)
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

| Item | PRD Requirement | Trigger | Founder Workaround |
|---|---|---|---|
| NO_SHOW status + adjudication | REQ-BOOK-11, REQ-TASK-02 | First reported no-show incident | Founder manually marks booking as cancelled and records incident |
| Dispute evidence upload + 24h auto-close | REQ-SAFE-10 | First dispute where chat logs are insufficient | Founder reviews chat history directly in admin panel |
| Review enforcement soft gates (reminders) | REQ-SAFE-02, REQ-SAFE-11 | Review completion rate drops below 70% | Founder sends manual reminder messages |

### Tier 2 — Fast-Follow Week 3-4

Build once core flow is stable and founder ops patterns are established.

| Item | PRD Requirement | Trigger |
|---|---|---|
| Reschedule request/accept/decline flow | REQ-BOOK-12, REQ-BOOK-13 | First customer-reported scheduling conflict |
| Booking timeline events (immutable audit) | REQ-BOOK-13 | Needed alongside reschedule flow |
| No-applicant rescue flow (120min detection) | REQ-BOOK-09 | >3 tasks with zero applicants in a week |
| Phone leak detection in messages | REQ-LEAK-04 | Baseline leakage rate measurement begins |
| Repeat booking shortcut | REQ-BOOK-07 | First repeat customer (30-day cohort data) |
| ~~Concierge dispatch endpoint~~ | ~~REQ-ADMIN-07~~ | **DONE** — implemented as `POST /admin/tasks/{id}/concierge-assign` |

### Tier 3 — Pre-Phase-2

Build before Phase 2 monetization gate (200+ completed bookings, 40% repeat customer rate).

| Item | PRD Requirement | Trigger |
|---|---|---|
| Reliability score computation | REQ-SAFE-06 | Needed for Phase 2 algorithm-assisted ranking |
| Tasker badges table (persistent Pro badge) | REQ-SAFE-04 | >15 taskers eligible for Pro badge |
| Facebook OAuth circuit breaker | REQ-AUTH-09, REQ-AUTH-10 | First Facebook outage incident |
| Verification access audit logging | REQ-SAFE-08 | Before first compliance review |
| Identity data lifecycle / deletion | REQ-SAFE-09 | Before first user deletion request or compliance review |
| Actual FCM/APNs push integration | REQ-NOTIF-01 | Before scaling beyond founder's personal outreach |
| Actual SMS sending integration | REQ-NOTIF-02 | Phase 2 OTP requirement |
| Task rescue events persistence | REQ-BOOK-09 | Alongside rescue flow |
| Review enforcement hard locks | REQ-SAFE-02 | Review rate still below 85% after soft gates |

---

## Production Readiness Checklist

Before first real user:

- [ ] All Flyway migrations (V1-V11) run cleanly on fresh database
- [ ] Migrations run cleanly on existing dev database
- [ ] 3 seed category intake schemas deployed (Cleaning, Moving & Hauling, Handyman)
- [ ] Feature toggles seeded (all monetization = false)
- [ ] Full test suite green (`./gradlew test`)
- [ ] Docker Compose local dev environment works end-to-end
- [ ] Admin can: create/approve verification, manage categories + schemas, resolve disputes, toggle features
- [ ] Core flow manual walkthrough: post task with intake → tasker applies → customer accepts → booking completes → both submit granular reviews
