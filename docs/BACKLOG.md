# MVP Backlog (Atomic, Testable, Gate-Ready)

## Scope

This backlog is derived from:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/API.yaml`

Rules:

1. Each ticket is atomic and independently verifiable.
2. Each ticket has explicit PRD/NFR references.
3. Each ticket must be implemented on `agent/<ticket>-<slug>`.
4. Each ticket must include `tickets/<TICKET-ID>.json` before implementation.
5. Each ticket must pass risk-tier self-verification before merge.

## Ticket Index

| Ticket   | Slice                                                                | Risk   | PRD/NFR Coverage                                                                                                                                                       | Depends On                                                                                         |
|----------|----------------------------------------------------------------------|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| TASK-000 | Project scaffold + workspace bootstrap                               | high   | REQ-AUTH-01, NFR-RELI-01, NFR-API-01                                                                                                                                   | -                                                                                                  |
| TASK-001 | Platform bootstrap hardening                                         | low    | NFR-RELI-01                                                                                                                                                            | -                                                                                                  |
| TASK-002 | OpenAPI + SDK CI pipeline                                            | medium | NFR-API-01                                                                                                                                                             | TASK-001                                                                                           |
| TASK-003 | Observability baseline                                               | medium | NFR-RELI-01                                                                                                                                                            | TASK-001                                                                                           |
| TASK-004 | Security baseline (RBAC, banned check, rate limit)                   | high   | REQ-ADMIN-03, NFR-SEC-01                                                                                                                                               | TASK-001                                                                                           |
| TASK-010 | Facebook OAuth auth + token lifecycle                                | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03                                                                                                                                  | TASK-001, TASK-004                                                                                 |
| TASK-011 | Profile + avatar upload                                              | medium | REQ-AUTH-01                                                                                                                                                            | TASK-010                                                                                           |
| TASK-012 | Tasker role activation + verification submit/status                  | high   | REQ-AUTH-04, REQ-SAFE-01                                                                                                                                               | TASK-010, TASK-011                                                                                 |
| TASK-013 | Admin verification queue + approve/reject                            | high   | REQ-SAFE-01, REQ-AUTH-04                                                                                                                                               | TASK-012                                                                                           |
| TASK-020 | Categories public/admin management                                   | medium | REQ-TASK-05                                                                                                                                                            | TASK-001                                                                                           |
| TASK-021 | Task CRUD + task photo upload                                        | high   | REQ-TASK-01, REQ-TASK-04                                                                                                                                               | TASK-020                                                                                           |
| TASK-022 | Open task feed filters + privacy + pagination                        | high   | REQ-TASK-03, REQ-TASK-05, NFR-API-01, NFR-PERF-01                                                                                                                      | TASK-021, TASK-065                                                                                 |
| TASK-023 | Task applications + accept                                           | high   | REQ-BOOK-01, REQ-BOOK-02, REQ-TASK-02                                                                                                                                  | TASK-021                                                                                           |
| TASK-030 | Booking aggregate + status guardrails                                | high   | REQ-BOOK-03, REQ-BOOK-05                                                                                                                                               | TASK-023                                                                                           |
| TASK-031 | QPay payment initiate + callback idempotency (Post-MVP deferred)     | high   | REQ-PAY-31, NFR-API-03                                                                                                                                                 | TASK-030, TASK-064                                                                                 |
| TASK-032 | Cancellation policy + strike logic                                   | high   | REQ-BOOK-04, REQ-BOOK-06, NFR-RELI-01                                                                                                                                  | TASK-030                                                                                           |
| TASK-033 | Escrow completion settlement + wallet credit/fee (Post-MVP deferred) | high   | REQ-PAY-33, REQ-PAY-34                                                                                                                                                 | TASK-030, TASK-031                                                                                 |
| TASK-034 | Payout request + admin processing + schedule (Post-MVP deferred)     | high   | REQ-PAY-35, REQ-PAY-36, REQ-PAY-37                                                                                                                                     | TASK-033                                                                                           |
| TASK-040 | Reviews + rating rollup + pro badge                                  | medium | REQ-SAFE-02, REQ-SAFE-04                                                                                                                                               | TASK-030                                                                                           |
| TASK-041 | Dispute lifecycle + admin resolve                                    | high   | REQ-SAFE-03, REQ-ADMIN-02, REQ-MSG-02, NFR-RELI-01                                                                                                                     | TASK-030, TASK-042                                                                                 |
| TASK-042 | Conversations + REST messaging persistence                           | high   | REQ-MSG-01, REQ-MSG-02                                                                                                                                                 | TASK-023                                                                                           |
| TASK-043 | Real-time messaging (STOMP)                                          | medium | REQ-MSG-01                                                                                                                                                             | TASK-042                                                                                           |
| TASK-044 | Push + SMS fallback notification orchestration                       | high   | REQ-NOTIF-01, REQ-NOTIF-02                                                                                                                                             | TASK-023, TASK-030, TASK-032                                                                       |
| TASK-045 | Admin user search + ban/unban enforcement                            | high   | REQ-ADMIN-01, REQ-ADMIN-03                                                                                                                                             | TASK-004, TASK-010                                                                                 |
| TASK-060 | PII encryption + secure storage controls                             | high   | NFR-SEC-01                                                                                                                                                             | TASK-004                                                                                           |
| TASK-061 | Localization baseline (mn default)                                   | medium | NFR-LOC-01                                                                                                                                                             | TASK-002                                                                                           |
| TASK-062 | Mobile offline read-only cache for My Tasks                          | medium | NFR-RELI-02                                                                                                                                                            | TASK-022, TASK-030                                                                                 |
| TASK-063 | Open task feed performance tuning + perf tests                       | high   | NFR-PERF-01                                                                                                                                                            | TASK-022                                                                                           |
| TASK-064 | Liability disclaimer gate before booking confirmation                | high   | NFR-LEGAL-01                                                                                                                                                           | TASK-030                                                                                           |
| TASK-065 | Cursor pagination consistency across list APIs                       | medium | NFR-API-01                                                                                                                                                             | TASK-002                                                                                           |
| TASK-070 | Web design system foundation (`shadcn/ui`)                           | medium | REQ-UI-01, NFR-UI-01                                                                                                                                                   | TASK-002                                                                                           |
| TASK-071 | Mobile token adapter + component parity baseline                     | medium | REQ-UI-02, NFR-UI-01                                                                                                                                                   | TASK-070                                                                                           |
| TASK-072 | Cross-platform UI parity and web accessibility gate                  | medium | NFR-UI-02                                                                                                                                                              | TASK-070, TASK-071                                                                                 |
| TASK-080 | Web customer/tasker MVP flow integration                             | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03, REQ-TASK-01, REQ-TASK-03, REQ-BOOK-01, REQ-BOOK-02                                                                              | TASK-010, TASK-011, TASK-021, TASK-022, TASK-023, TASK-061, TASK-070                               |
| TASK-081 | Web booking/safety MVP flow integration                              | high   | REQ-BOOK-03, REQ-BOOK-04, REQ-BOOK-05, REQ-BOOK-06, REQ-SAFE-02, REQ-SAFE-03, REQ-NOTIF-01, REQ-NOTIF-02, REQ-MSG-01, REQ-PAY-01, REQ-PAY-02, REQ-PAY-03, NFR-LEGAL-01 | TASK-030, TASK-032, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-064, TASK-070           |
| TASK-082 | Mobile customer/tasker MVP flow integration                          | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03, REQ-TASK-01, REQ-TASK-03, REQ-BOOK-01, REQ-BOOK-02                                                                              | TASK-010, TASK-011, TASK-021, TASK-022, TASK-023, TASK-061, TASK-071                               |
| TASK-083 | Mobile booking/safety MVP flow integration                           | high   | REQ-BOOK-03, REQ-BOOK-04, REQ-BOOK-05, REQ-BOOK-06, REQ-SAFE-02, REQ-SAFE-03, REQ-NOTIF-01, REQ-NOTIF-02, REQ-MSG-01, REQ-PAY-01, REQ-PAY-02, REQ-PAY-03, NFR-LEGAL-01 | TASK-030, TASK-032, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-062, TASK-064, TASK-071 |
| TASK-090 | Product analytics and KPI instrumentation                            | medium | NFR-OBS-01                                                                                                                                                             | TASK-003, TASK-080, TASK-081, TASK-082, TASK-083                                                   |
| TASK-091 | [PATCH] Auth outage posture + OTP migration readiness                | high   | REQ-AUTH-05, REQ-AUTH-06, REQ-AUTH-07, REQ-AUTH-08, REQ-AUTH-09, REQ-AUTH-10                                                                                           | TASK-010, TASK-044                                                                                 |
| TASK-092 | [PATCH] Structured intake forms + schema-bound draft flow            | high   | REQ-TASK-00, REQ-TASK-06, REQ-TASK-07, REQ-TASK-09, REQ-TASK-10, REQ-TASK-11, REQ-ADMIN-05, NFR-OBS-06                                                                 | TASK-020, TASK-021                                                                                 |
| TASK-093 | [PATCH] No-show adjudication + reschedule authority                  | high   | REQ-BOOK-11, REQ-BOOK-12, REQ-BOOK-13, NFR-API-03                                                                                                                      | TASK-030, TASK-032, TASK-041                                                                       |
| TASK-094 | Repeat booking + rescue + phase-based match timeout                  | high   | REQ-BOOK-07, REQ-BOOK-08, REQ-BOOK-09, REQ-BOOK-10                                                                                                                     | TASK-023, TASK-030, TASK-044                                                                       |
| TASK-095 | [PATCH] Information controls + in-app anti-leak guardrails           | high   | REQ-LEAK-01, REQ-LEAK-02, REQ-LEAK-03, REQ-LEAK-04, REQ-LEAK-05, REQ-MSG-03, NFR-OBS-02                                                                                | TASK-022, TASK-042, TASK-043                                                                       |
| TASK-096 | [PATCH] Trust/safety expansion (consent, reliability, evidence)      | high   | REQ-SAFE-05, REQ-SAFE-06, REQ-SAFE-07, REQ-SAFE-08, REQ-SAFE-09, REQ-SAFE-10, REQ-SAFE-11, REQ-ADMIN-04                                                                | TASK-012, TASK-013, TASK-040, TASK-041                                                             |
| TASK-097 | [PATCH] Admin operations expansion (toggle + concierge controls)     | high   | REQ-ADMIN-06, REQ-ADMIN-07                                                                                                                                             | TASK-020, TASK-045                                                                                 |
| TASK-098 | Phase 2 lead-unlock policy + applicant economy                       | high   | REQ-PAY-10, REQ-PAY-11, REQ-PAY-12, REQ-PAY-13, REQ-PAY-14, REQ-PAY-15, REQ-PAY-16, REQ-PAY-17, REQ-PAY-18                                                             | TASK-023, TASK-030, TASK-044                                                                       |
| TASK-099 | Phase 2 credit packs + wallet balance UX                             | high   | REQ-PAY-19, REQ-PAY-20, REQ-PAY-21, REQ-PAY-22                                                                                                                         | TASK-031, TASK-098                                                                                 |
| TASK-100 | Phase 3 subscription + escrow lifecycle                              | high   | REQ-PAY-30, REQ-PAY-32, REQ-PAY-33, REQ-PAY-34, REQ-PAY-38                                                                                                             | TASK-031, TASK-033                                                                                 |
| TASK-101 | Referral attribution + reward and anti-fraud                         | medium | REQ-REF-01, REQ-REF-02, REQ-REF-03, REQ-REF-04                                                                                                                         | TASK-010, TASK-090                                                                                 |
| TASK-102 | [PATCH] API contract hardening (versioning, idempotency, errors)     | medium | NFR-API-02, NFR-API-03, NFR-API-04                                                                                                                                     | TASK-002, TASK-030, TASK-065                                                                       |
| TASK-103 | [PATCH] Observability expansion beyond MVP funnel                    | medium | NFR-OBS-03, NFR-OBS-04, NFR-OBS-05                                                                                                                                     | TASK-090, TASK-096, TASK-098, TASK-101                                                             |
| TASK-104 | [PATCH] Privacy/legal compliance controls                            | high   | NFR-SEC-02, NFR-SEC-03, NFR-SEC-04, NFR-SEC-05, NFR-LEGAL-02, NFR-LEGAL-03                                                                                             | TASK-060, TASK-096                                                                                 |
| TASK-105 | Phase 4 monetization rails + customer/business plans                 | high   | REQ-PAY-40, REQ-PAY-41, REQ-PAY-42                                                                                                                                     | TASK-031, TASK-100                                                                                 |
| TASK-106 | Optional async AI scope summary polish (Phase 3+)                    | medium | REQ-TASK-08                                                                                                                                                            | TASK-092                                                                                           |

### Deferred Post-MVP Tracks

The following tickets remain defined but are not release-gating for phase-1 MVP:

1. `TASK-031`
2. `TASK-033`
3. `TASK-034`
4. `TASK-098`
5. `TASK-099`
6. `TASK-100`
7. `TASK-101`
8. `TASK-105`
9. `TASK-106`

## Codebase Diff Validation Snapshot (2026-03-04)

Validation baseline against current backend implementation:

1. `docs/API.yaml` path contracts: `73`
2. Controller-resolved implemented paths (`src/main/java/**/api/*Controller.java`): `56`
3. Missing contract paths in code: `21`
4. Implemented but undocumented paths: `4`

### Missing API Contract Paths Mapped to Patch Tickets

| Missing Contract Path(s)                                                                                                                    | Backlog Patch Ticket | Required Codebase Patch Surface                                                                                                                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/verification/dan/verify`                                                                                                                  | `TASK-096`           | Add endpoint + provider fallback orchestration in verification module (`verification/api`, `auth                                                                               |verification/application`, DAO audit trail updates). |
| `/tasks/drafts`, `/tasks/drafts/{id}`, `/admin/categories/{id}/schemas`, `/admin/categories/{id}/schemas/{version}/activate`                | `TASK-092`           | Add draft + schema-version lifecycle controllers/services/DAOs and Flyway migrations for `task_drafts`, `category_schema_versions`, plus intake schema metadata columns.       |
| `/bookings/{id}/schedule-events`, `/bookings/{id}/reschedule`, `/bookings/{id}/reschedule/{eventId}/respond`, `/bookings/{id}/no-show/flag` | `TASK-093`           | Extend booking/task state machine and persistence with `NO_SHOW`, `booking_schedule_events`, `booking_timeline_events`, transactional dual-state updates, idempotent handlers. |
| `/tasks/{id}/instant-match`                                                                                                                 | `TASK-094`           | Add instant-match orchestration endpoint and timeout/fallback engine with persistence for offer attempts and fallback transitions.                                             |
| `/admin/tasks/{id}/concierge-assign`, `/admin/features/toggles`                                                                             | `TASK-097`           | Add admin controller/service surfaces for concierge assignment and runtime feature toggles with immutable audit events.                                                        |
| `/bookings/{id}/lead-unlock`, `/admin/lead-unlock-prices`                                                                                   | `TASK-098`           | Add lead-unlock decision endpoint, pricing admin APIs, and credit debit/refund policy integration in booking/monetization modules.                                             |
| `/credits/balance`, `/credits/transactions`, `/credits/packs`, `/credits/purchase`                                                          | `TASK-099`           | Add credits controller/service/DAO stack and QPay purchase flow persistence (`credit_balances`, `credit_transactions`, `credit_packs`).                                        |
| `/subscriptions/tasker`                                                                                                                     | `TASK-100`           | Add subscription activation API with entitlement checks and persistence (`tasker_subscriptions`).                                                                              |
| `/referrals/me`                                                                                                                             | `TASK-101`           | Add referral summary API and referral attribution/reward persistence (`referrals`, `referral_rewards`).                                                                        |
| `/business/accounts`                                                                                                                        | `TASK-105`           | Add business-account API and tenant-scoped persistence surface for Phase 4 B2B rails.                                                                                          |

### Undocumented Implemented Paths (Contract Drift)

| Implemented in Code                                                        | Drift Type                                      | Backlog Patch Ticket | Required Action                                                                                                                                                        |
|----------------------------------------------------------------------------|-------------------------------------------------|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/auth/dev/login`                                                          | Public controller path not declared in OpenAPI  | `TASK-102`           | Either document as non-production-only contract path with explicit environment gating, or move behind internal profile-only route and exclude from public API surface. |
| `/security/customer/ping`, `/security/tasker/ping`, `/security/admin/ping` | Public controller paths not declared in OpenAPI | `TASK-102`           | Either add contract entries as internal diagnostics or restrict endpoints to non-public profile and remove from public runtime exposure.                               |

## Ticket Definitions

### TASK-000 Project Scaffold + Workspace Bootstrap

- Objective: Establish monorepo workspace, frontend shells, SDK contract wiring, and autonomous agent tooling.
- Acceptance criteria:
    1. Web shell renders successfully with typed SDK contract wiring.
    2. Mobile shell renders successfully with typed SDK contract wiring.
- Required tests:
    - `TID-TASK-000-WEB-UNIT`
    - `TID-TASK-000-WEB-E2E-SMOKE`
    - `TID-TASK-000-MOBILE-UNIT`

### TASK-001 Platform Bootstrap Hardening

- Objective: Establish deterministic local runtime and health/version contract.
- Acceptance criteria:
    1. `docker compose` boots Postgres + PostGIS + MinIO successfully.
    2. Backend exposes `/actuator/health` and `/api/v1/system/version`.
    3. `./gradlew --no-daemon check` runs in clean clone.
- Required tests:
    - `TID-TASK-001-BE-HEALTH-CHECK`
    - `TID-TASK-001-ENV-DOCKER-UP`
    - `TID-TASK-001-BE-GRADLE-CHECK`

### TASK-002 OpenAPI + SDK CI Pipeline

- Objective: Make API contract authoritative and SDK generation reproducible.
- Acceptance criteria:
    1. `docs/API.yaml` validates in local and CI.
    2. SDK generation command produces typed client consumed by web and mobile.
    3. Contract drift fails CI.
- Required tests:
    - `TID-TASK-002-API-VALIDATE`
    - `TID-TASK-002-SDK-GENERATE`
    - `TID-TASK-002-CI-CONTRACT-DRIFT`

### TASK-003 Observability Baseline

- Objective: Add structured logs, trace/correlation ID propagation, and core metrics.
- Acceptance criteria:
    1. All API requests emit correlation ID in logs.
    2. Error responses include trace ID.
    3. Prometheus metrics endpoint includes request latency metrics.
- Required tests:
    - `TID-TASK-003-BE-CORRELATION-ID`
    - `TID-TASK-003-BE-ERROR-TRACE-ID`
    - `TID-TASK-003-BE-PROMETHEUS-METRICS`

### TASK-004 Security Baseline (RBAC + Banned User + Rate Limit)

- Objective: Establish minimum security boundary for all subsequent slices.
- Acceptance criteria:
    1. Route-level RBAC enforced for user/tasker/admin scopes.
    2. Banned and suspended users are denied even with valid JWT.
    3. Facebook OAuth endpoint is rate-limited.
- Required tests:
    - `TID-TASK-004-SEC-RBAC-GUARD`
    - `TID-TASK-004-SEC-BANNED-USER-BLOCK`
    - `TID-TASK-004-SEC-SUSPENDED-USER-BLOCK`
    - `TID-TASK-004-SEC-OAUTH-RATE-LIMIT`

### TASK-010 Facebook OAuth Auth + Token Lifecycle

- Objective: Implement identity bootstrap via Facebook OAuth and JWT refresh.
- Acceptance criteria:
    1. Facebook OAuth flow creates or authenticates user via `facebook_id`.
    2. Same `facebook_id` presented twice returns the same user (no duplicate).
    3. Refresh endpoint rotates tokens and validates lifecycle.
    4. Banned user is rejected at Facebook OAuth login.
    5. Dev auth bypass is available in non-production environments and rejects unsupported roles.
- Required tests:
    - `TID-TASK-010-API-FACEBOOK-AUTH`
    - `TID-TASK-010-API-FACEBOOK-DEDUP`
    - `TID-TASK-010-API-TOKEN-REFRESH`
    - `TID-TASK-010-API-FACEBOOK-AUTH-BANNED`
    - `TID-TASK-010-DEV-AUTH-BYPASS`
    - `TID-TASK-010-DEV-AUTH-VALIDATION`

### TASK-011 Profile + Avatar Upload

- Objective: Complete core profile management and avatar upload flow.
- Acceptance criteria:
    1. `GET/PUT /users/me` supports profile retrieval/update.
    2. Avatar presigned upload endpoint returns constrained upload URL and storage key.
- Required tests:
    - `TID-TASK-011-API-PROFILE-GET-PUT`
    - `TID-TASK-011-API-AVATAR-UPLOAD-URL`

### TASK-012 Tasker Activation + Verification Submit/Status

- Objective: Support role transition and verification submission lifecycle.
- Acceptance criteria:
    1. User can activate tasker role while verification is pending.
    2. Verification upload/submit/status flow persists and returns correct state.
- Required tests:
    - `TID-TASK-012-API-TASKER-ACTIVATE`
    - `TID-TASK-012-API-VERIFICATION-SUBMIT`
    - `TID-TASK-012-API-VERIFICATION-STATUS`

### TASK-013 Admin Verification Review

- Objective: Enable manual approval/rejection workflow for taskers.
- Acceptance criteria:
    1. Admin can list pending verifications.
    2. Admin approve/reject transitions user verification status correctly.
- Required tests:
    - `TID-TASK-013-API-ADMIN-VERIFICATION-LIST`
    - `TID-TASK-013-API-ADMIN-VERIFICATION-APPROVE`
    - `TID-TASK-013-API-ADMIN-VERIFICATION-REJECT`

### TASK-020 Category Management

- Objective: Implement category lifecycle for marketplace taxonomy.
- Acceptance criteria:
    1. Public endpoint returns only active categories.
    2. Admin can create/update/deactivate categories.
    3. On a clean database startup, at least 5 MVP categories are present and active.
- Required tests:
    - `TID-TASK-020-API-CATEGORIES-PUBLIC`
    - `TID-TASK-020-API-CATEGORIES-ADMIN-CRUD`
    - `TID-TASK-020-API-CATEGORIES-SEED-PRESENT`

### TASK-021 Task CRUD + Photos

- Objective: Implement task create/update/cancel and photo key workflows.
- Acceptance criteria:
    1. Task creation validates required fields and max 3 photo keys.
    2. Task photo upload URL endpoints return constrained signed URLs.
    3. Cancel endpoint transitions task to `CANCELLED` with guards.
    4. Customer can update their own OPEN task's editable fields.
- Required tests:
    - `TID-TASK-021-API-TASK-CREATE`
    - `TID-TASK-021-API-TASK-PHOTO-UPLOAD`
    - `TID-TASK-021-API-TASK-CANCEL`
    - `TID-TASK-021-API-TASK-UPDATE`

### TASK-022 Open Task Feed (Filters + Privacy + Pagination)

- Objective: Deliver queryable task feed aligned with location/privacy rules.
- Acceptance criteria:
    1. Feed returns only `OPEN` tasks.
    2. Category/distance filters work with cursor pagination.
    3. Exact address is hidden in public feed; approximate/fuzzed coordinates exposed.
    4. Cursor pagination returns deterministic results with correct next cursor and has_more flag.
    5. Task detail endpoint returns full details to owner/accepted tasker; public view to others; 404 for missing task.
- Required tests:
    - `TID-TASK-022-API-TASK-LIST-OPEN`
    - `TID-TASK-022-API-TASK-LIST-FILTERS`
    - `TID-TASK-022-API-TASK-LIST-PRIVACY`
    - `TID-TASK-022-API-TASK-LIST-LOCATION`
    - `TID-TASK-022-API-TASK-LIST-CURSOR`
    - `TID-TASK-022-API-TASK-DETAILS`

### TASK-023 Applications + Accept

- Objective: Implement demand/supply matching handshake.
- Acceptance criteria:
    1. Tasker can apply only to open tasks.
    2. Customer can list applicants and accept exactly one.
    3. Accept action creates booking in `ASSIGNED` after liability disclaimer acceptance.
- Required tests:
    - `TID-TASK-023-API-APPLY-OPEN-TASK`
    - `TID-TASK-023-API-APPLICANT-LIST`
    - `TID-TASK-023-API-ACCEPT-CREATES-BOOKING`

### TASK-030 Booking Aggregate + State Guardrails

- Objective: Enforce valid booking state transitions and invariants.
- Acceptance criteria:
    1. Booking entity enforces allowed transitions only.
    2. Booking details/list endpoints reflect consistent status.
    3. Booking completion transitions booking to COMPLETED and task to COMPLETED.
    4. Booking state-transition endpoints are idempotent: duplicate request with same Idempotency-Key replays the cached
       result; missing key is rejected.
- Required tests:
    - `TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE`
    - `TID-TASK-030-API-BOOKING-READS`
    - `TID-TASK-030-API-BOOKING-COMPLETE`
    - `TID-TASK-030-RELI-IDEMPOTENT-CANCEL`
    - `TID-TASK-030-RELI-IDEMPOTENT-HEADER`

### TASK-031 QPay Payment Initiate + Callback Idempotency

- Objective: Post-MVP payment rail path for QR/deeplink initiation and idempotent callback transitions.
- Acceptance criteria:
    1. Initiation endpoint returns valid QPay payment payload (QR/deeplink) with traceable reference.
    2. Callback endpoint is idempotent and signature-validated.
    3. Failed payload generation leaves booking state unchanged and returns retryable provider error code.
    4. When the monetization feature flag is disabled, the payment initiation endpoint returns FEATURE_DEFERRED (503).
- Required tests:
    - `TID-TASK-031-API-QPAY-INITIATE`
    - `TID-TASK-031-SEC-QPAY-SIGNATURE`
    - `TID-TASK-031-RELI-CALLBACK-IDEMPOTENT`
    - `TID-TASK-031-API-MONETIZATION-DEFERRED`

### TASK-032 Cancellation + Strike Policy

- Objective: Implement cancellation trust policy and tasker accountability.
- Acceptance criteria:
    1. Customer late-cancel records a reliability incident and audit evidence; early cancel applies no fee.
    2. Tasker cancellation reopens task and records strike.
    3. Three strikes in 30 days triggers 7-day suspension; repeat offenders receive escalating suspension duration.
- Required tests:
    - `TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE`
    - `TID-TASK-032-DOMAIN-CUSTOMER-CANCEL`
    - `TID-TASK-032-DOMAIN-TASKER-CANCEL-STRIKE`
    - `TID-TASK-032-DOMAIN-TASKER-CANCEL`
    - `TID-TASK-032-DOMAIN-STRIKE-SUSPENSION`
    - `TID-TASK-032-DOMAIN-REPEAT-OFFENSE`

### TASK-033 Escrow Completion Settlement + Wallet Credit/Fee

- Objective: Post-MVP monetization path to create pending wallet credit and fee deduction on escrow completion.
- Acceptance criteria:
    1. Escrow completion creates one `PENDING_CREDIT` wallet entry per booking and links it to booking transaction ID.
    2. Platform fee is deducted using active configurable fee profile before net pending credit is stored.
    3. Ledger entries are immutable and auditable.
- Required tests:
    - `TID-TASK-033-DOMAIN-WALLET-CREDIT`
    - `TID-TASK-033-DOMAIN-FEE-DEDUCTION`
  - `TID-TASK-033-DOMAIN-PENDING-CREDIT-ONCE`

### TASK-034 Payout Request + Processing Schedule

- Objective: Post-MVP monetization path for payout request and admin settlement cycle.
- Acceptance criteria:
    1. Tasker can request payout only up to available balance.
    2. Admin can list/process pending payouts.
    3. Processing enforces Tue/Fri schedule policy and writes ledger entries.
    4. When the monetization feature flag is disabled, wallet endpoints return FEATURE_DEFERRED (503).
    5. Duplicate booking completion credit events for the same booking are idempotent: only one credit is applied to the
       tasker's balance.
- Required tests:
    - `TID-TASK-034-API-PAYOUT-REQUEST`
    - `TID-TASK-034-API-ADMIN-PAYOUT-PROCESS`
    - `TID-TASK-034-DOMAIN-PAYOUT-SCHEDULE`
    - `TID-TASK-034-API-MONETIZATION-DEFERRED`
    - `TID-TASK-034-DOMAIN-WALLET-DEDUP`

### TASK-040 Reviews + Pro Badge

- Objective: Build trust score loop for completed work.
- Acceptance criteria:
    1. Reviews allowed only on completed bookings by booking participants.
    2. User review listing is paginated and consistent.
    3. Pro badge assignment follows completed-count and rating thresholds.
- Required tests:
    - `TID-TASK-040-API-REVIEW-SUBMIT`
    - `TID-TASK-040-API-REVIEW-LIST`
    - `TID-TASK-040-DOMAIN-PRO-BADGE`

### TASK-041 Disputes + Admin Resolution

- Objective: Implement dispute handling and admin resolution path.
- Acceptance criteria:
    1. Dispute can be raised only for eligible booking states/window.
    2. Active dispute blocks booking closure actions until resolution.
    3. Admin resolution supports customer-favor, tasker-favor, and escalation outcomes with audit trail.
    4. Raise-dispute endpoint is idempotent: same Idempotency-Key replays the original dispute result.
    5. Dispute can only be raised within 24 hours of booking completion; attempts after the window return
       DISPUTE_WINDOW_EXPIRED.
    6. Admin dispute resolution is idempotent: replaying the resolve request with the same Idempotency-Key binds to the
       original dispute resource.
- Required tests:
    - `TID-TASK-041-API-DISPUTE-RAISE`
    - `TID-TASK-041-DOMAIN-PAYOUT-HOLD`
    - `TID-TASK-041-API-ADMIN-DISPUTE-RESOLVE`
    - `TID-TASK-041-RELI-IDEMPOTENT-DISPUTE`
    - `TID-TASK-041-DOMAIN-DISPUTE-WINDOW`
    - `TID-TASK-041-RELI-IDEMPOTENT-ADMIN-RESOLVE`

### TASK-042 Conversations + REST Messaging Persistence

- Objective: Persisted messaging baseline with access control.
- Acceptance criteria:
    1. Conversations are created when tasker applies.
    2. Message send/list endpoints enforce participant access.
    3. Message history persists and is retrievable.
- Required tests:
    - `TID-TASK-042-API-CONVERSATION-LIST`
    - `TID-TASK-042-API-MESSAGE-SEND`
    - `TID-TASK-042-API-MESSAGE-LIST`

### TASK-043 Real-Time Messaging (STOMP)

- Objective: Enable low-latency conversation updates.
- Acceptance criteria:
    1. Authenticated clients can subscribe/send to authorized conversation channels.
    2. Messages delivered in real-time and persisted once.
- Required tests:
    - `TID-TASK-043-WS-SUBSCRIBE-AUTHZ`
    - `TID-TASK-043-WS-REALTIME-DELIVERY`

### TASK-044 Notifications (Push + SMS Fallback)

- Objective: Deliver event notifications for matching and booking milestones.
- Acceptance criteria:
    1. Device register/unregister endpoints manage notification targets.
    2. Push notifications emitted for required events, including tasker mark-done notifying the customer.
    3. SMS fallback sent for hired/booking-confirmed events when app inactive.
- Required tests:
    - `TID-TASK-044-API-DEVICE-REGISTER`
    - `TID-TASK-044-DOMAIN-PUSH-EVENTS`
    - `TID-TASK-044-DOMAIN-TASKER-DONE-NOTIFY`
    - `TID-TASK-044-DOMAIN-SMS-FALLBACK`

### TASK-045 Admin User Search + Ban/Unban Enforcement

- Objective: Deliver minimum moderation capabilities.
- Acceptance criteria:
    1. Admin can search users by name and Facebook ID in Phase 0-1, and by phone once Phase 2 auth is active.
    2. Ban/unban endpoints mutate user status with audit trail.
    3. Banned users are blocked across authenticated APIs.
    4. Admin can view and update the strike/suspension moderation policy.
    5. Expired suspensions are automatically lifted when next detected.
- Required tests:
    - `TID-TASK-045-API-ADMIN-USER-SEARCH`
    - `TID-TASK-045-API-ADMIN-BAN-UNBAN`
    - `TID-TASK-045-SEC-BAN-ENFORCEMENT`
    - `TID-TASK-045-API-ADMIN-MODERATION-POLICY`
    - `TID-TASK-045-DOMAIN-AUTO-UNSUSPEND`

### TASK-060 PII Encryption + Secure Storage Controls

- Objective: Enforce encryption and secure handling for PII and ID assets.
- Acceptance criteria:
    1. Sensitive columns/fields are encrypted at rest.
    2. ID assets remain private and are accessible only via short-lived signed URLs.
    3. Production PII access is auditable.
- Required tests:
    - `TID-TASK-060-SEC-PII-ENCRYPTION`
    - `TID-TASK-060-SEC-ID-ASSET-PRIVATE`
    - `TID-TASK-060-SEC-PII-AUDIT-ACCESS`

### TASK-061 Localization Baseline (mn default)

- Objective: Ensure Mongolian-first UX and backend localization.
- Acceptance criteria:
    1. Backend resolves localized error/template messages by locale with `mn` fallback.
    2. Web and mobile apps load `mn` as default locale.
    3. Cyrillic input/rendering is validated in critical flows.
- Required tests:
    - `TID-TASK-061-BE-LOCALE-RESOLUTION`
    - `TID-TASK-061-WEB-MN-DEFAULT`
    - `TID-TASK-061-MOBILE-MN-DEFAULT`

### TASK-062 Mobile Offline Read-Only Cache

- Objective: Provide resilient read-only view of My Tasks while offline.
- Acceptance criteria:
    1. Mobile persists last successful My Tasks payload locally.
    2. Offline mode renders cached data with stale indicator.
    3. Offline mode blocks mutating actions.
- Required tests:
    - `TID-TASK-062-MOBILE-CACHE-PERSIST`
    - `TID-TASK-062-MOBILE-OFFLINE-READ`
    - `TID-TASK-062-MOBILE-OFFLINE-MUTATION-BLOCK`

### TASK-063 Open Task Feed Performance (<1s)

- Objective: Meet feed latency target under representative load.
- Acceptance criteria:
    1. Feed query plan uses appropriate indexes (including geospatial).
    2. p95 latency for `GET /tasks` remains under target in perf smoke profile.
    3. Regression budget enforced in CI performance smoke.
- Required tests:
    - `TID-TASK-063-PERF-TASK-FEED-P95`
    - `TID-TASK-063-PERF-INDEX-PLAN`
    - `TID-TASK-063-PERF-CI-REGRESSION-BUDGET`

### TASK-064 Liability Disclaimer Enforcement

- Objective: Enforce legal acceptance before booking confirmation.
- Acceptance criteria:
    1. Booking acceptance rejects requests without `liability_disclaimer_accepted=true`.
    2. Acceptance is captured in auditable booking metadata.
- Required tests:
    - `TID-TASK-064-API-DISCLAIMER-REQUIRED`
    - `TID-TASK-064-AUDIT-DISCLAIMER-RECORDED`

### TASK-065 Cursor Pagination Consistency

- Objective: Standardize and validate cursor pagination across list APIs.
- Acceptance criteria:
    1. All list endpoints return common envelope with `cursor.next` and `cursor.has_more`.
    2. Cursor pagination is deterministic under stable sort order.
    3. Contract and integration tests cover each list endpoint.
- Required tests:
    - `TID-TASK-065-API-CURSOR-ENVELOPE`
    - `TID-TASK-065-API-CURSOR-DETERMINISM`
    - `TID-TASK-065-CONTRACT-LIST-ENDPOINTS`

### TASK-070 Web Design System Foundation (`shadcn/ui`)

- Objective: Establish web UI base components on `shadcn/ui` and shared tokens.
- Acceptance criteria:
    1. `shadcn/ui` is initialized and base primitives exist under `apps/web/src/components/ui`.
    2. Web theme tokens are defined in a shared token source and consumed by Tailwind/theme variables.
    3. At least one feature screen is migrated to use `shadcn/ui` primitives only.
- Required tests:
    - `TID-TASK-070-WEB-SHADCN-PRIMITIVES`
    - `TID-TASK-070-WEB-TOKEN-BINDING`
    - `TID-TASK-070-WEB-COMPONENT-USAGE-COMPLIANCE`

### TASK-071 Mobile Token Adapter + Component Parity Baseline

- Objective: Build mobile-native component layer aligned with shared web tokens and behaviors.
- Acceptance criteria:
    1. Mobile consumes shared design tokens through a platform adapter.
    2. Core components (Button, Input, FormField, Modal/Sheet, Toast) have mobile equivalents with matching state
       semantics.
    3. Parity matrix is documented and linked from architecture docs.
- Required tests:
    - `TID-TASK-071-MOBILE-TOKEN-ADAPTER`
    - `TID-TASK-071-MOBILE-COMPONENT-PARITY-BASE`
    - `TID-TASK-071-MOBILE-STATE-SEMANTIC-PARITY`

### TASK-072 Cross-Platform UI Parity and Web Accessibility Gate

- Objective: Enforce ongoing visual/behavior parity and accessibility quality gates.
- Acceptance criteria:
    1. Web UI flows touched by changes pass keyboard navigation checks.
    2. Web UI flows touched by changes meet WCAG 2.1 AA contrast.
    3. Cross-platform parity checks validate token usage and expected component state behavior.
- Required tests:
    - `TID-TASK-072-WEB-A11Y-KEYBOARD`
    - `TID-TASK-072-WEB-A11Y-CONTRAST-AA`
    - `TID-TASK-072-CROSS-PLATFORM-PARITY-CHECK`

### TASK-080 Web Customer/Tasker MVP Flow Integration

- Objective: Ensure the web client can execute end-to-end MVP flows against production contracts.
- Acceptance criteria:
    1. Web supports Facebook OAuth login/signup and profile setup/update with avatar upload.
    2. Customer can create task, browse task feed with filters/privacy behavior, and tasker can apply.
    3. Route guards enforce auth state, role-specific access, and banned-user UX handling.
- Required tests:
    - `TID-TASK-080-WEB-AUTH-OAUTH-FLOW`
    - `TID-TASK-080-WEB-TASK-APPLICATION-FLOW`
    - `TID-TASK-080-WEB-AUTHZ-GUARDS`

### TASK-081 Web Booking/Safety MVP Flow Integration

- Objective: Deliver complete web booking lifecycle behavior including trust and communication touchpoints.
- Acceptance criteria:
    1. Customer can accept applicant and acknowledge liability disclaimer before booking confirmation.
    2. Booking status transitions, cancellation outcomes, completion, review, and dispute actions are usable from web.
    3. Messaging and notification surfaces for booking milestones are integrated in web UX.
- Required tests:
    - `TID-TASK-081-WEB-BOOKING-PAYMENT-FLOW`
    - `TID-TASK-081-WEB-BOOKING-SAFETY-FLOW`
    - `TID-TASK-081-WEB-MSG-NOTIF-INTEGRATION`

### TASK-082 Mobile Customer/Tasker MVP Flow Integration

- Objective: Ensure mobile supports end-to-end task posting/discovery/application user journeys.
- Acceptance criteria:
    1. Mobile supports Facebook OAuth login/signup and profile setup/update with avatar upload.
    2. Customer can create task and tasker can discover/filter/apply to eligible open tasks.
    3. Mobile route/access handling enforces auth state, role gating, and banned-user behavior.
- Required tests:
    - `TID-TASK-082-MOBILE-AUTH-OAUTH-FLOW`
    - `TID-TASK-082-MOBILE-TASK-APPLICATION-FLOW`
    - `TID-TASK-082-MOBILE-AUTHZ-GUARDS`

### TASK-083 Mobile Booking/Safety MVP Flow Integration

- Objective: Deliver complete mobile booking lifecycle behavior including trust and communication touchpoints.
- Acceptance criteria:
    1. Mobile allows applicant acceptance and disclaimer acknowledgment before booking confirmation.
    2. Booking transitions, cancellation policies, completion, reviews, and disputes are usable from mobile.
    3. Messaging and booking notification touchpoints are integrated and testable in mobile flows.
- Required tests:
    - `TID-TASK-083-MOBILE-BOOKING-PAYMENT-FLOW`
    - `TID-TASK-083-MOBILE-BOOKING-SAFETY-FLOW`
    - `TID-TASK-083-MOBILE-MSG-NOTIF-INTEGRATION`

### TASK-090 Product Analytics and KPI Instrumentation

- Objective: Add deterministic instrumentation to measure MVP funnel health and trust outcomes.
- Acceptance criteria:
    1. Backend emits canonical analytics events for funnel milestones with correlation IDs and booking/task references.
    2. Web and mobile emit aligned client events with `platform`, `locale`, and actor role dimensions.
    3. KPI validation queries or reports can compute conversion, fulfillment, and dispute rate from emitted events.
- Required tests:
    - `TID-TASK-090-OBS-EVENT-EMISSION`
    - `TID-TASK-090-OBS-CLIENT-EVENTS`
    - `TID-TASK-090-OBS-KPI-VALIDATION`

### TASK-091 [PATCH] Auth Outage Posture + OTP Migration Readiness

- Objective: Extend auth architecture for Phase 2 OTP migration while preserving Phase 0-1 outage guarantees.
- Acceptance criteria:
    1. OTP request/verify endpoints are feature-toggled and enforce per-phone and per-source rate limits.
    2. Facebook-era users are hard-gated to phone verification before non-auth product actions and receive
       `OTP_MIGRATION_REQUIRED` until completed.
    3. Phase 2 new users can register/login with OTP without requiring Facebook linkage; migrated users keep
       `facebook_id` as secondary identity metadata.
    4. During OAuth outage in Phase 0-1, login/signup fails closed with provider-unavailable errors while existing valid
       sessions remain usable until expiry; outage state is surfaced for clients/ops.
- Required tests:
    - `TID-TASK-091-API-OTP-RATE-LIMIT`
    - `TID-TASK-091-API-MIGRATION-GATE`
    - `TID-TASK-091-API-OTP-PRIMARY-AUTH`
    - `TID-TASK-091-RELI-OAUTH-OUTAGE-POSTURE`

### TASK-092 [PATCH] Structured Intake Forms + Schema-Bound Draft Flow

- Objective: Add schema-driven intake renderer contracts, draft version binding, and deterministic summary generation.
- Acceptance criteria:
    1. Category schema activation enforces fixed-form constraints (3-5 required questions, supported field primitives),
       supports canary activation, and supports rollback to last-known-good schema version.
    2. Draft create/update binds `intake_schema_version`; submit validation executes against bound version with
       field-level validation errors for missing/invalid required answers.
    3. Task creation persists and returns `intake_answers_json` and `intake_schema_version` in customer/tasker/admin
       detail payloads.
    4. Deterministic job scope summary is prefilled and editable before submit; summary-render failures fail open to
       canonical key-value fallback and emit observability events with `category_id`, `intake_schema_version`, and
       `client_app_version`.
    5. Deactivated categories reject new drafts/posts while existing tasks remain operable through lifecycle endpoints.
    6. API surfaces are implemented for draft and schema lifecycle contracts: `POST /tasks/drafts`,
       `GET /tasks/drafts/{id}`, `PUT /tasks/drafts/{id}`, `GET/POST /admin/categories/{id}/schemas`,
       `POST /admin/categories/{id}/schemas/{version}/activate`.
- Required tests:
    - `TID-TASK-092-API-SCHEMA-ACTIVATE-GUARDS`
    - `TID-TASK-092-API-DRAFT-SCHEMA-BINDING`
    - `TID-TASK-092-API-TASK-INTAKE-PERSISTENCE`
    - `TID-TASK-092-DOMAIN-SUMMARY-FALLBACK`
    - `TID-TASK-092-OBS-INTAKE-DIMENSIONS`
    - `TID-TASK-092-API-CATEGORY-DEACTIVATE-BLOCK`

### TASK-093 [PATCH] No-Show Adjudication + Reschedule Authority

- Objective: Implement deterministic no-show adjudication and schedule-authority rules in booking lifecycle.
- Acceptance criteria:
    1. System emits +10 minute reminder events and accepts +15 minute no-show flag only when no accepted future
       reschedule exists and neither party has status/check-in activity in trailing 30 minutes.
    2. Successful no-show adjudication updates both booking and task to `NO_SHOW` in one transaction and appends
       immutable timeline + audit events.
    3. Reschedule request/accept/decline/expiry actions are immutable timeline events; accepted reschedule updates
       canonical schedule and resets enforcement timers.
    4. Chat-only schedule mentions do not alter policy timers; no-show and late-cancel checks always use latest accepted
       in-app schedule.
    5. No-show and reschedule state-changing endpoints are idempotent on duplicate retries.
    6. API surfaces are implemented for no-show and reschedule contracts: `GET /bookings/{id}/schedule-events`,
       `POST /bookings/{id}/reschedule`, `POST /bookings/{id}/reschedule/{eventId}/respond`,
       `POST /bookings/{id}/no-show/flag`.
- Required tests:
    - `TID-TASK-093-API-NOSHOW-ELIGIBILITY`
    - `TID-TASK-093-DOMAIN-NOSHOW-DUAL-STATE-TRANSITION`
    - `TID-TASK-093-API-RESCHEDULE-LIFECYCLE`
    - `TID-TASK-093-DOMAIN-SCHEDULE-AUTHORITY`
    - `TID-TASK-093-RELI-IDEMPOTENT-NOSHOW`

### TASK-094 Repeat Booking + Rescue + Phase-Based Match Timeout

- Objective: Deliver new matching controls for rebooking, no-applicant rescue, and timeout/fallback behavior.
- Acceptance criteria:
    1. Completed-booking history exposes one-tap rebook action that pre-fills a new task in the same category.
    2. Tasks with zero eligible applicants at 120 minutes during 08:00-22:00 local time trigger rescue actions (budget/
       schedule prompt, broadened push fanout, concierge queueing) and persist rescue events.
    3. Selected-applicant confirmation timeout is phase-configured (15m Phase 2, 5m instant match path); after 3
       declines/timeouts flow falls back to open-application.
    4. Instant match path is available only for categories meeting liquidity threshold and falls back safely when offers
       expire/decline.
    5. API surface is implemented for instant match contract: `POST /tasks/{id}/instant-match`.
- Required tests:
    - `TID-TASK-094-API-REBOOK-PREFILL`
    - `TID-TASK-094-JOB-RESCUE-TRIGGER`
    - `TID-TASK-094-DOMAIN-PHASED-TIMEOUT`
    - `TID-TASK-094-DOMAIN-INSTANT-MATCH-FALLBACK`

### TASK-095 [PATCH] Information Controls + In-App Anti-Leak Guardrails

- Objective: Enforce contact/address reveal policy and leakage controls across feed, booking, and messaging.
- Acceptance criteria:
    1. Tasker phone fields are excluded from all customer-facing payloads and UI contracts.
    2. Customer phone is masked until selected tasker accepts booking and paid lead unlock succeeds in paid phases.
    3. Exact address reads are blocked until allowed lifecycle/payment milestone and unauthorized requests return
       `ADDRESS_LOCKED`.
    4. Message pipeline flags phone-sharing patterns and emits admin alert events; Phase 0-1 actions remain advisory.
    5. Booking confirmation and dispute intake explicitly surface no-recourse notice for off-platform arrangements.
    6. Messaging payloads preserve in-app-first communication policy and hide tasker contact in all phases.
- Required tests:
    - `TID-TASK-095-API-TASKER-PHONE-HIDDEN`
    - `TID-TASK-095-API-CUSTOMER-PHONE-MASKING`
    - `TID-TASK-095-API-ADDRESS-LOCK`
    - `TID-TASK-095-DOMAIN-MESSAGE-LEAKAGE-FLAG`
    - `TID-TASK-095-API-NO-RECOURSE-NOTICE`

### TASK-096 [PATCH] Trust/Safety Expansion (Consent, Reliability, Evidence)

- Objective: Add new trust/safety controls for verification operations, reliability scoring, and review/dispute policy.
- Acceptance criteria:
    1. Verification queue exposes SLA countdown and daily throughput exports, ordered by oldest pending submissions.
    2. DAN fast-path verification can approve identity without blocking manual-review fallback when provider fails.
    3. ID upload is blocked until consent is captured with policy version and timestamp.
    4. Admin reads/downloads of verification media produce immutable audit logs and identity data retention/deletion
       jobs
       run per policy with completion evidence logs.
    5. Reliability score computation is deterministic and consumed by ranking/recommendation services in paid phases.
    6. Dispute creation enforces minimum evidence or starts grace timer then auto-closes as insufficient evidence.
    7. Review cadence is immediate +24h +72h with hard lock only for configured risk triggers.
    8. API surface is implemented for DAN verification contract with graceful fallback: `POST /verification/dan/verify`.
- Required tests:
    - `TID-TASK-096-API-VERIFICATION-QUEUE-SLA`
    - `TID-TASK-096-API-DAN-FALLBACK`
    - `TID-TASK-096-SEC-CONSENT-REQUIRED`
    - `TID-TASK-096-SEC-VERIFICATION-AUDIT-IMMUTABLE`
    - `TID-TASK-096-DOMAIN-RELIABILITY-SCORE`
    - `TID-TASK-096-DOMAIN-DISPUTE-EVIDENCE-GRACE`
    - `TID-TASK-096-DOMAIN-REVIEW-CADENCE`

### TASK-097 [PATCH] Admin Operations Expansion (Toggle + Concierge Controls)

- Objective: Add admin feature-toggle governance and concierge-dispatch override behavior.
- Acceptance criteria:
    1. Feature toggle panel can enable/disable lead-fee, subscription, and escrow without redeploy and writes actor/time
       audit records.
    2. Concierge dispatch can manually assign eligible verified tasker to task with mandatory override reason and actor.
    3. Toggle effects are applied at runtime without restart and are observable in system status endpoints.
    4. API surfaces are implemented for admin operations contracts: `GET/PUT /admin/features/toggles` and
       `POST /admin/tasks/{id}/concierge-assign`.
- Required tests:
    - `TID-TASK-097-API-FEATURE-TOGGLE-RUNTIME`
    - `TID-TASK-097-AUDIT-FEATURE-TOGGLE`
    - `TID-TASK-097-API-CONCIERGE-ASSIGN`

### TASK-098 Phase 2 Lead-Unlock Policy + Applicant Economy

- Objective: Implement Phase 2 lead-unlock flow and policy controls around applicant economics.
- Acceptance criteria:
    1. Browse/apply actions never debit credits and remain available with zero-credit balance.
    2. Selected-tasker accept flow uses 15-minute timer and debits credits exactly once on accepted lead unlock.
    3. Customer retains free selection agency across eligible applicants regardless of ranking position.
    4. Decline/timeout creates no debit, prompts select-next-applicant flow, and prevents stale auto-unlock.
    5. Customer cancel after unlock triggers exact credit refund transaction linked to booking.
    6. Lead unlock pricing is versioned by category/district/effective window with minimum start value enforcement.
    7. Application cap default is 10 and admin-configurable; cap violations return deterministic domain error.
    8. Tasker analytics exposes success-rate and unlock-conversion metrics on trailing 28-day window.
    9. API surfaces are implemented for lead-unlock and pricing contracts: `POST /bookings/{id}/lead-unlock` and
       `GET/POST /admin/lead-unlock-prices`.
- Required tests:
    - `TID-TASK-098-DOMAIN-UNLOCK-DEBIT-IDEMPOTENT`
    - `TID-TASK-098-API-NEXT-APPLICANT-ON-TIMEOUT`
    - `TID-TASK-098-DOMAIN-CREDIT-REFUND`
    - `TID-TASK-098-API-LEAD-PRICE-RESOLUTION`
    - `TID-TASK-098-API-APPLICATION-CAP`
    - `TID-TASK-098-API-TASKER-CONVERSION-METRICS`

### TASK-099 Phase 2 Credit Packs + Wallet Balance UX

- Objective: Implement credit commerce baseline for Phase 2 with purchase, bonus, and balance surfaces.
- Acceptance criteria:
    1. QPay credit-pack purchase creates immutable purchase transaction and increments balance exactly by pack amount.
    2. Signup bonus grants exactly 5 credits once per eligible tasker and is idempotent on retries.
    3. Current balance is visible in tasker home/billing screens and low-balance alert triggers at `<=1` credits.
    4. Credits are non-expiring and cannot be withdrawn as cash.
    5. API surfaces are implemented for credit economy contracts: `GET /credits/balance`,
       `GET /credits/transactions`, `GET /credits/packs`, `POST /credits/purchase`.
- Required tests:
    - `TID-TASK-099-API-CREDIT-PACK-PURCHASE`
    - `TID-TASK-099-DOMAIN-SIGNUP-BONUS-IDEMPOTENT`
    - `TID-TASK-099-API-BALANCE-SURFACE`
    - `TID-TASK-099-DOMAIN-NONCASHABLE-CREDITS`

### TASK-100 Phase 3 Subscription + Escrow Lifecycle

- Objective: Implement Phase 3 monetization model for subscriptions, escrow states, and payout-prep accounting.
- Acceptance criteria:
    1. Eligible Pro taskers can activate monthly subscription that suppresses lead-fee debits and enables premium
       ranking visibility.
    2. Escrow lifecycle persists `PAID -> HELD -> RELEASED` with default release at completion+4h and audited manual
       early-release override.
    3. Completion under escrow creates one pending wallet credit per booking with configured platform-fee deduction.
    4. Exact address remains locked until payment commitment succeeds when escrow is active.
    5. API surface is implemented for subscription activation contract: `POST /subscriptions/tasker`.
- Required tests:
    - `TID-TASK-100-API-SUBSCRIPTION-ACTIVATE`
    - `TID-TASK-100-DOMAIN-ESCROW-STATE-MACHINE`
    - `TID-TASK-100-DOMAIN-PLATFORM-FEE-DEDUCTION`
    - `TID-TASK-100-API-ESCROW-ADDRESS-GATE`

### TASK-101 Referral Attribution + Reward and Anti-Fraud

- Objective: Deliver referral linking, conversion attribution, phase-aware rewards, and fraud cap enforcement.
- Acceptance criteria:
    1. Profiles expose unique referral link/code for both customer and tasker roles.
    2. Referral attribution captures referrer/referred/attributed-at/converted-at and is immutable after conversion.
    3. Reward engine applies phase-specific rewards only after qualifying conversion event.
    4. Monthly successful referrals are capped per user and cap-breach attempts emit manual-review alerts.
    5. API surface is implemented for referral summary contract: `GET /referrals/me`.
- Required tests:
    - `TID-TASK-101-API-REFERRAL-LINK`
    - `TID-TASK-101-DOMAIN-ATTRIBUTION-IMMUTABLE`
    - `TID-TASK-101-DOMAIN-PHASED-REWARDS`
    - `TID-TASK-101-DOMAIN-REFERRAL-FRAUD-CAP`

### TASK-102 [PATCH] API Contract Hardening (Versioning, Idempotency, Errors)

- Objective: Align API behavior with versioning, idempotency, and standardized error envelope contracts.
- Acceptance criteria:
    1. Public endpoints are namespaced under versioned path and breaking changes require migration notes.
    2. State-changing booking/payment endpoints reject missing idempotency keys and replay prior response on duplicate
       keys.
    3. Error responses consistently expose machine-readable code/message/trace ID envelope.
    4. Undocumented controller routes are eliminated from public runtime or explicitly declared in OpenAPI with
       environment/profile restrictions (`/auth/dev/login`, `/security/*`).
- Required tests:
    - `TID-TASK-102-CONTRACT-VERSIONED-PATHS`
    - `TID-TASK-102-RELI-IDEMPOTENCY-REPLAY`
    - `TID-TASK-102-CONTRACT-ERROR-ENVELOPE`

### TASK-103 [PATCH] Observability Expansion Beyond MVP Funnel

- Objective: Expand analytics/alerts to leakage, review, verification, and monetization observability requirements.
- Acceptance criteria:
    1. Leakage indicators (phone-sharing flags, repeat contact-share attempts, booking-to-repost ratio) are emitted and
       queryable.
    2. Review completion and verification queue metrics are computed by cohort/time window and surfaced for operations.
    3. Monetization adoption metrics are emitted only when the corresponding phase feature is active and remain
       zero/noop
       otherwise.
    4. Operational alerts cover verification SLA breaches, scope-clarity regression, and configured monetization funnel
       anomaly thresholds.
- Required tests:
    - `TID-TASK-103-OBS-LEAKAGE-METRICS`
    - `TID-TASK-103-OBS-REVIEW-VERIFICATION-METRICS`
    - `TID-TASK-103-OBS-MONETIZATION-ADOPTION`
    - `TID-TASK-103-OBS-ALERT-RULES`

### TASK-104 [PATCH] Privacy/Legal Compliance Controls

- Objective: Implement policy and system controls required for privacy law and legal operating posture.
- Acceptance criteria:
    1. Identity/PII handling includes explicit compliance controls for Mongolia privacy law and consent-bound
       processing.
    2. Data retention policy is enforced in code/jobs for identity assets (active account +90 days) with deletion
       evidence logs.
    3. PII/identity access logs are immutable and queryable for incident investigations.
    4. Legal facilitator-not-employer posture is reflected in contract surfaces and cumulative engagement duration
       alerts
       are emitted before 2-year threshold.
- Required tests:
    - `TID-TASK-104-SEC-RETENTION-POLICY-ENFORCED`
    - `TID-TASK-104-SEC-PII-ACCESS-IMMUTABLE-LOG`
    - `TID-TASK-104-SEC-CONSENT-POLICY-LINK`
    - `TID-TASK-104-LEGAL-ENGAGEMENT-DURATION-ALERT`

### TASK-105 Phase 4 Monetization Rails + Customer/Business Plans

- Objective: Implement phase-4 revenue products and multi-rail checkout readiness.
- Acceptance criteria:
    1. Tasky Plus subscription gates priority queue/SLA eligibility behavior for eligible customers.
    2. Business plans support recurring scheduling, org billing profile, and seat-scoped admin controls with tenant
       isolation.
    3. Checkout supports QPay, SocialPay, and bank-transfer rails with per-rail success/failure telemetry and fallback
       UX messaging.
    4. API surface is implemented for business account contract: `POST /business/accounts`.
- Required tests:
    - `TID-TASK-105-API-TASKY-PLUS-PRIORITY`
    - `TID-TASK-105-API-B2B-TENANT-ISOLATION`
    - `TID-TASK-105-OBS-PAYMENT-RAIL-TELEMETRY`

### TASK-106 Optional Async AI Scope Summary Polish (Phase 3+)

- Objective: Add optional asynchronous LLM summary polish without introducing posting-path dependency.
- Acceptance criteria:
    1. AI summary rewrite runs only when feature toggle is enabled and executes asynchronously after deterministic
       summary
       generation.
    2. Task posting remains available if AI job times out/fails; deterministic summary remains source of truth.
    3. AI rewrite can update editable summary text only and cannot mutate structured intake answers.
- Required tests:
    - `TID-TASK-106-API-AI-SUMMARY-TOGGLE`
    - `TID-TASK-106-RELI-NONBLOCKING-AI-FAILURE`
    - `TID-TASK-106-DOMAIN-INTAKE-IMMUTABILITY`

## Backlog Completion Criteria

Backlog generation is complete when:

1. Every ticket above has a `tickets/<TICKET-ID>.json` spec with AC + test IDs + `depends_on`.
2. Ticket dependencies are acyclic for planned sprint slices.
3. Each ticket includes risk level and mapped REQ/NFR IDs.
4. Every `docs/API.yaml` public path is either implemented in code or explicitly mapped to a non-done patch ticket in
   this backlog.
5. Any implemented non-public diagnostics/auth routes are explicitly marked internal-only and excluded from public API
   surface by contract and runtime profile gates.
