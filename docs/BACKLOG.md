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

| Ticket   | Slice                                                            | Risk   | PRD/NFR Coverage                                                                                                                   | Depends On                                                                                         |
|----------|------------------------------------------------------------------|--------|------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| TASK-000 | Project scaffold + workspace bootstrap                           | high   | REQ-AUTH-01, NFR-RELI-01, NFR-API-01                                                                                               | -                                                                                                  |
| TASK-001 | Platform bootstrap hardening                                     | low    | NFR-RELI-01                                                                                                                        | -                                                                                                  |
| TASK-002 | OpenAPI + SDK CI pipeline                                        | medium | NFR-API-01                                                                                                                         | TASK-001                                                                                           |
| TASK-003 | Observability baseline                                           | medium | NFR-RELI-01                                                                                                                        | TASK-001                                                                                           |
| TASK-004 | Security baseline (RBAC, banned check, rate limit)               | high   | REQ-ADMIN-03, NFR-SEC-01                                                                                                           | TASK-001                                                                                           |
| TASK-010 | Facebook OAuth auth + token lifecycle                            | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03                                                                                              | TASK-001, TASK-004                                                                                 |
| TASK-011 | Profile + avatar upload                                          | medium | REQ-AUTH-01                                                                                                                        | TASK-010                                                                                           |
| TASK-012 | Tasker role activation + verification submit/status              | high   | REQ-AUTH-04, REQ-SAFE-01                                                                                                           | TASK-010, TASK-011                                                                                 |
| TASK-013 | Admin verification queue + approve/reject                        | high   | REQ-SAFE-01, REQ-AUTH-04                                                                                                           | TASK-012                                                                                           |
| TASK-020 | Categories public/admin management                               | medium | REQ-TASK-05                                                                                                                        | TASK-001                                                                                           |
| TASK-021 | Task CRUD + task photo upload                                    | high   | REQ-TASK-01, REQ-TASK-04                                                                                                           | TASK-020                                                                                           |
| TASK-022 | Open task feed filters + privacy + pagination                    | high   | REQ-TASK-03, REQ-TASK-05, NFR-API-01, NFR-PERF-01                                                                                  | TASK-021, TASK-065                                                                                 |
| TASK-023 | Task applications + accept                                       | high   | REQ-BOOK-01, REQ-BOOK-02, REQ-TASK-02                                                                                              | TASK-021                                                                                           |
| TASK-030 | Booking aggregate + status guardrails                            | high   | REQ-BOOK-03, REQ-BOOK-05                                                                                                           | TASK-023                                                                                           |
| TASK-031 | QPay initiate + callback idempotency (Post-MVP deferred)         | high   | REQ-PAY-01, NFR-RELI-01                                                                                                            | TASK-030, TASK-064                                                                                 |
| TASK-032 | Cancellation policy + strike logic                               | high   | REQ-BOOK-04, REQ-BOOK-06, NFR-RELI-01                                                                                              | TASK-030                                                                                           |
| TASK-033 | Completion settlement + wallet credit + fee (Post-MVP deferred)  | high   | REQ-PAY-02, REQ-PAY-03                                                                                                             | TASK-030, TASK-031                                                                                 |
| TASK-034 | Payout request + admin processing + schedule (Post-MVP deferred) | high   | REQ-PAY-04, REQ-PAY-05, REQ-PAY-06                                                                                                 | TASK-033                                                                                           |
| TASK-040 | Reviews + rating rollup + pro badge                              | medium | REQ-SAFE-02, REQ-SAFE-04                                                                                                           | TASK-030                                                                                           |
| TASK-041 | Dispute lifecycle + admin resolve                                | high   | REQ-SAFE-03, REQ-ADMIN-02, REQ-MSG-02, NFR-RELI-01                                                                                 | TASK-030, TASK-042                                                                                 |
| TASK-042 | Conversations + REST messaging persistence                       | high   | REQ-MSG-01, REQ-MSG-02                                                                                                             | TASK-023                                                                                           |
| TASK-043 | Real-time messaging (STOMP)                                      | medium | REQ-MSG-01                                                                                                                         | TASK-042                                                                                           |
| TASK-044 | Push + SMS fallback notification orchestration                   | high   | REQ-NOTIF-01, REQ-NOTIF-02                                                                                                         | TASK-023, TASK-030, TASK-032                                                                       |
| TASK-045 | Admin user search + ban/unban enforcement                        | high   | REQ-ADMIN-01, REQ-ADMIN-03                                                                                                         | TASK-004, TASK-010                                                                                 |
| TASK-060 | PII encryption + secure storage controls                         | high   | NFR-SEC-01                                                                                                                         | TASK-004                                                                                           |
| TASK-061 | Localization baseline (mn default)                               | medium | NFR-LOC-01                                                                                                                         | TASK-002                                                                                           |
| TASK-062 | Mobile offline read-only cache for My Tasks                      | medium | NFR-RELI-02                                                                                                                        | TASK-022, TASK-030                                                                                 |
| TASK-063 | Open task feed performance tuning + perf tests                   | high   | NFR-PERF-01                                                                                                                        | TASK-022                                                                                           |
| TASK-064 | Liability disclaimer gate before booking confirmation            | high   | NFR-LEGAL-01                                                                                                                       | TASK-030                                                                                           |
| TASK-065 | Cursor pagination consistency across list APIs                   | medium | NFR-API-01                                                                                                                         | TASK-002                                                                                           |
| TASK-070 | Web design system foundation (`shadcn/ui`)                       | medium | REQ-UI-01, NFR-UI-01                                                                                                               | TASK-002                                                                                           |
| TASK-071 | Mobile token adapter + component parity baseline                 | medium | REQ-UI-02, NFR-UI-01                                                                                                               | TASK-070                                                                                           |
| TASK-072 | Cross-platform UI parity and web accessibility gate              | medium | NFR-UI-02                                                                                                                          | TASK-070, TASK-071                                                                                 |
| TASK-080 | Web customer/tasker MVP flow integration                         | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03, REQ-TASK-01, REQ-TASK-03, REQ-BOOK-01, REQ-BOOK-02                                          | TASK-010, TASK-011, TASK-021, TASK-022, TASK-023, TASK-061, TASK-070                               |
| TASK-081 | Web booking/safety MVP flow integration                          | high   | REQ-BOOK-03, REQ-BOOK-04, REQ-BOOK-05, REQ-BOOK-06, REQ-SAFE-02, REQ-SAFE-03, REQ-NOTIF-01, REQ-NOTIF-02, REQ-MSG-01, NFR-LEGAL-01 | TASK-030, TASK-032, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-064, TASK-070           |
| TASK-082 | Mobile customer/tasker MVP flow integration                      | high   | REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03, REQ-TASK-01, REQ-TASK-03, REQ-BOOK-01, REQ-BOOK-02                                          | TASK-010, TASK-011, TASK-021, TASK-022, TASK-023, TASK-061, TASK-071                               |
| TASK-083 | Mobile booking/safety MVP flow integration                       | high   | REQ-BOOK-03, REQ-BOOK-04, REQ-BOOK-05, REQ-BOOK-06, REQ-SAFE-02, REQ-SAFE-03, REQ-NOTIF-01, REQ-NOTIF-02, REQ-MSG-01, NFR-LEGAL-01 | TASK-030, TASK-032, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-062, TASK-064, TASK-071 |
| TASK-090 | Product analytics and KPI instrumentation                        | medium | NFR-OBS-01                                                                                                                         | TASK-003, TASK-080, TASK-081, TASK-082, TASK-083                                                   |

### Deferred Post-MVP Monetization Tracks

The following tickets remain defined but are not release-gating for phase-1 MVP:

1. `TASK-031`
2. `TASK-033`
3. `TASK-034`

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

### TASK-031 QPay Initiate + Callback Idempotency

- Objective: Post-MVP monetization path for secure payment initiation and callback transitions.
- Acceptance criteria:
    1. Initiation endpoint creates provider payment intent with traceable reference.
    2. Callback endpoint is idempotent and signature-validated.
    3. Successful callback applies the configured monetization transition exactly once.
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

### TASK-033 Completion Settlement + Wallet Credit/Fee

- Objective: Post-MVP monetization path to settle wallet balances after booking completion.
- Acceptance criteria:
    1. Completion credits tasker wallet with fee deduction.
    2. Ledger entries are immutable and auditable.
- Required tests:
    - `TID-TASK-033-DOMAIN-WALLET-CREDIT`
    - `TID-TASK-033-DOMAIN-FEE-DEDUCTION`

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
    1. Admin can search users by phone.
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
    1. Mobile supports OTP login/signup and profile setup/update with avatar upload.
    2. Customer can create task and tasker can discover/filter/apply to eligible open tasks.
    3. Mobile route/access handling enforces auth state, role gating, and banned-user behavior.
- Required tests:
    - `TID-TASK-082-MOBILE-AUTH-OTP-FLOW`
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

## Backlog Completion Criteria

Backlog generation is complete when:

1. Every ticket above has a `tickets/<TICKET-ID>.json` spec with AC + test IDs + `depends_on`.
2. Ticket dependencies are acyclic for planned sprint slices.
3. Each ticket includes risk level and mapped REQ/NFR IDs.
