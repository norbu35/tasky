# Tasky Architecture — Backend (`services/api`)

Status: canonical architecture contract for `services/api`.

Read after: repo `AGENTS.md`, `services/api/AGENTS.md`, `common.md`.

## 1. Scope

This document owns backend-specific architecture: module layout, request-path rules, data schemas and flows, API contracts, security, runtime concerns, and testing. Cross-cutting system context, shared infrastructure, NFR baselines, and dev workflow live in `common.md`. Frontend parity contracts live in `shared-frontend.md`.

## 1.1 Foundational Design Patterns

The backend enforces a small set of architectural patterns that are **test-locked by ArchUnit** (see
`services/api/src/test/java/mn/tasky/architecture/`). Every new module, controller, or service must comply.
These patterns exist to keep the monolith decoupled despite sharing a single deployable unit.

### 1.1.1 Audience-Composition / Ports & Adapters (Hexagonal Core)

**Intent.** Controllers must never orchestrate business logic or depend on other modules' internals. Instead,
every request follows one of two allowed shapes:

1. **Audience-composition path** (cross-module or response-shaping):
   `controller → runtime.{publicapi|adminapi}.composition service → module publicapi ports`
2. **Owned-module path** (single-module, no orchestration):
   `controller → module-owned publicapi command/query port`

Composition services live under `mn.tasky.runtime.{publicapi|adminapi}.composition`.
They may depend only on `publicapi` port interfaces — never on DAOs, internal application services, or
other modules' scheduling packages.

**Port contract.** Every module exposes its capabilities through interfaces in a `publicapi` sub-package:

```
mn.tasky.<module>.publicapi.<Module>CommandPort   // write operations
mn.tasky.<module>.publicapi.<Module>QueryPort     // read operations
```

Implementations (`*CommandHandler` / `*QueryHandler`) live in `application.command` / `application.query`
and delegate to internal application services. Ports must never depend on `api`, `dao`, or `scheduling`
packages.

**Exception set.** A small number of controllers are explicitly exempted (auth lifecycle, reference data,
system health). The full exception set is codified in `AudienceCompositionBoundaryTest.EXCEPTION_CONTROLLERS`.
Adding to it requires deliberate code-review justification.

**Enforcement.** `AudienceCompositionBoundaryTest`, `PublicPortBoundaryTest`, `BackendArchitectureTest`.

### 1.1.2 CQRS via Command/Query Port Split

**Intent.** Separate write and read responsibilities at the module boundary.

Each domain that exposes cross-module operations provides:

- `application.command.<Module>CommandHandler implements <Module>CommandPort`
- `application.query.<Module>QueryHandler implements <Module>QueryPort`

Example:

```
mn.tasky.booking.publicapi.BookingCommandPort    ← interface
mn.tasky.booking.application.command.BookingCommandHandler  ← implementation
mn.tasky.booking.publicapi.BookingQueryPort      ← interface
mn.tasky.booking.application.query.BookingQueryHandler      ← implementation
```

Runtime composition services inject the port interfaces, never the handlers.

### 1.1.3 Outbox + Event-Driven Workflow

**Intent.** Decouple side effects (notifications, analytics, wallet crediting) from the synchronous request
path with at-least-once delivery guarantees.

**Flow:**

1. Domain service calls `DomainEventOutboxService.publish(eventType, aggregateType, aggregateId, payload)`.
2. The outbox service persists the event to `domain_outbox_events` **and** publishes it to RabbitMQ
   (when `tasky.automation.broker.enabled=true`). Broker failure does not roll back the domain transaction.
3. `EventWorkerConsumer` (RabbitMQ listener) dispatches to the registered `EventHandler` by event type.
4. Each handler extends `AbstractEventHandler`, which provides:
   - `tryClaimEvent(envelope)` / `tryClaimEventComplete(envelope)` for event-level idempotency.
   - `withObservability(payload, base)` to propagate correlation/locale/platform from the envelope.
5. Handlers live in domain-owned `workflow` packages (e.g. `mn.tasky.messaging.workflow.TaskApplicationAcceptedHandler`).

**Context propagation.** Events carry `correlation_id`, `causation_id`, `command_id`, `workflow_id`,
`actor_id`, `locale`, and `platform`. The `EventWorkerConsumer` restores these into MDC before dispatch.

**Boundary rules (ArchUnit-enforced):**

- `automation.broker` must not depend on domain modules.
- Domain modules must not depend on `automation.broker`.
- `automation.event` contracts must not depend on broker transport.
- Workflow handlers must not depend on controllers or broad application services.
- `kernel.outbox` must not depend on feature modules.

### 1.1.4 Provider / Strategy Pattern for External Integrations

**Intent.** External systems (payment gateways, OAuth providers, push/SMS, geocoding, LLM, storage) are
wrapped behind provider interfaces so callers remain testable and swappable.

**Convention:**

```
mn.tasky.<module>.provider.<ProviderInterface>        ← interface
mn.tasky.<module>.provider.<ConcreteProvider>          ← @ConditionalOnProperty implementation
```

Active providers:

| Provider interface                     | Implementations                               | Activation property                 |
| -------------------------------------- | --------------------------------------------- | ----------------------------------- |
| `PushNotificationProvider`             | `FirebasePushProvider`, `LoggingPushProvider` | `tasky.push.provider`               |
| `SmsNotificationProvider`              | `LoggingSmsNotificationProvider`              | `tasky.auth.sms.provider`           |
| `OAuthProvider`                        | `FacebookOAuthProvider`                       | `tasky.auth.oauth.provider`         |
| `PaymentProvider`                      | `QPayPaymentProvider`                         | —                                   |
| `GeocodingProvider`                    | `DistrictGeocodingProvider`                   | `tasky.location.geocoding.provider` |
| `StorageProvider` / `S3StorageService` | S3/MinIO                                      | —                                   |
| `LlmProvider`                          | `LoggingLlmProvider`                          | —                                   |

**Boundary rules (ArchUnit-enforced):**

- Controllers must not depend on provider packages.
- Provider adapters must not orchestrate domain state machines.
- Providers publish through the outbox path, never directly to the broker.

### 1.1.5 Projection (Read-Model Optimization)

**Intent.** Admin list and queue queries go through dedicated projection read models rather than
directly querying domain tables.

Projections live under `mn.tasky.projection.admin` and are consumed only by `runtime.adminapi.composition`
services. They are derived read models — they must not depend on inbound adapters (`api`, `scheduling`).

**Enforcement.** `ProjectionBoundaryTest`.

### 1.1.6 Kernel (Narrow Shared Plane)

**Intent.** A minimal shared plane (`mn.tasky.kernel`) provides primitives that multiple runtime surfaces
need but must not accumulate feature logic.

Kernel contents:

- `kernel.context` — `RequestContext`, `WorkflowContext`, `JobContext`, `ContextPropagator` (MDC bridge)
- `kernel.idempotency` — `WorkflowIdempotencyGuard`, `EventIdempotencyDao`, `IdempotencyKey`
- `kernel.logging` — `LogField` enum (canonical MDC key names)
- `kernel.error` — `KernelError` record
- `kernel.outbox` — outbox primitives (must remain domain-agnostic)

**Boundary rule.** Kernel packages must not depend on any feature module. Enforced by `BackendArchitectureTest`.

### 1.1.7 Two-Phase Idempotency

**Intent.** Prevent duplicate side effects at two levels.

1. **Request-level** (synchronous): `IdempotencyService` in `common.idempotency`.
   Controllers pass `Idempotency-Key` header; the service claims an `IdempotencyRecord` with
   `IN_PROGRESS` → `COMPLETED` lifecycle. Mandatory for irreversible state-changing endpoints.

2. **Event-level** (async): `WorkflowIdempotencyGuard` in `kernel.idempotency`.
   Workflow handlers call `tryClaimEvent(envelope)` before processing and `tryClaimEventComplete(envelope)`
   after side effects. Uses `event_idempotency` table with `ON CONFLICT DO NOTHING`.

### 1.1.8 Context Propagation

**Intent.** Every boundary crossing (HTTP request → async workflow → job → provider call) carries a
consistent tracing context.

- `RequestContext` → populated by `RequestObservabilityFilter` from HTTP headers.
- `WorkflowContext` → derived from RequestContext or carried in `AutomationEventEnvelope`.
- `JobContext` → derived from WorkflowContext.
- `ContextPropagator` bridges between contexts and MDC; all canonical keys are defined in `LogField`.

### 1.1.9 Layering Within a Domain Module

Each domain module (e.g. `booking`, `task`, `auth`) follows a strict internal layering:

```
mn.tasky.<module>/
  api/                  ← inbound adapters (Spring @RestController)
  application/          ← business logic (domain services)
    command/            ← CommandHandler implements CommandPort
    query/              ← QueryHandler implements QueryPort
  dao/                  ← JDBI SQL Object interfaces (persistence)
  dto/                  ← data transfer objects (records)
  provider/             ← external integration adapters (optional)
  publicapi/            ← stable port interfaces (cross-module contract)
    PackageMarker.java  ← marks the public API surface
  scheduling/           ← @Scheduled tasks (ShedLock-guarded)
  workflow/             ← EventHandler implementations for outbox events (optional)
```

**Dependency direction (ArchUnit-enforced):**

- `dao` must not depend on `api`, `application`, or `scheduling`.
- `application`, `dao`, and `scheduling` must not depend on `api`.
- `publicapi` must not depend on `api`, `dao`, or `scheduling`.
- `common.config` wiring must not leak into domain code.
- Cross-domain scheduling dependencies are forbidden.

## 2. Module Layout (`mn.tasky.*` Packages)

The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication uses internal Java method calls — no network hops between domains.

| Domain                  | Packages                                   | Responsibility                                                                               |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **identity**            | `auth`, `user`, `security`, `verification` | Auth (Facebook OAuth, OTP), user profiles, JWT filter, KYC/verification queue                |
| **marketplace**         | `task`, `category`, `booking`              | Task posting & intake schemas, category management, booking state machine, applications      |
| **wallet** _(Phase 2+)_ | `wallet`, `payment`                        | Credit ledger (Phase 2), internal wallet/escrow/payouts (Phase 3+), QPay integration         |
| **communication**       | `messaging`, `notification`                | In-app WebSocket messaging, push notifications (FCM), SMS fallback                           |
| **support**             | `dispute`, `review`, `admin`, `analytics`  | Disputes & evidence, review enforcement, admin tools, analytics event tracking               |
| **common**              | `common`                                   | Cross-cutting: security filters, pagination, error handling, crypto, outbox, health, storage |

## 3. Request-Path Architecture

Every active backend request path uses one of two allowed shapes:

1. **Audience-composition path**: `controller -> runtime.{publicapi|adminapi}.composition service -> module publicapi ports`
   - Used when the endpoint combines multiple modules, performs audience-specific response shaping, or coordinates feature policy across domains.

2. **Owned-module path**: `controller -> module-owned publicapi command/query port`
   - Used when the endpoint is owned by a single module and does not orchestrate another module's internals.

**Forbidden shapes:**

- Controllers depending on another module's internal application service, DAO, or feature-toggle-driven orchestration path.
- Runtime composition services depending on module DAOs or internal application services (must use publicapi ports).

**Exception set** (explicitly documented in architecture tests):

- `SystemInfoController` — system/health endpoint
- `SecurityScopeController` — security introspection
- `DevAuthController`, `TokenController`, `FacebookAuthController` — auth lifecycle helpers
- `LocationController`, `ServiceAreaController`, `CategoryController` — pure lookup/reference data
- `OutboxReplayController`, `AdminFeatureToggleController` — operator endpoints

Any addition to the exception set requires deliberate justification in code review.

## 4. Data Architecture

### 4.1 Core Schema (ERD)

#### Identity Module

- `users`: `id (UUID)`, `facebook_id (nullable, UK)`, `phone (nullable, UK)`, `primary_auth` (FACEBOOK, PHONE_OTP),
  `role`, `status` (PENDING, ACTIVE, VERIFIED, SUSPENDED, BANNED), `suspension_end_at`, `created_at`, `updated_at`
- `profiles`: `user_id (FK)`, `full_name`, `avatar_url`, `rating_avg`
- `verifications`: `user_id (FK)`, `id_card_front_key`, `id_card_back_key`, `status`, `admin_notes`, `submitted_at`,
  `reviewed_at`, `consent_policy_version`, `consent_accepted_at`, `dan_reference` (nullable)
  — columns store S3/MinIO object keys, not URLs; download links are generated via presigned GET URLs on demand

#### Marketplace Module

- `tasks`: `id`, `customer_id`, `category_id (FK)`, `description`, `budget`, `location_point (GEOMETRY)`,
  `location_text`, `status` (OPEN, ASSIGNED, COMPLETED, CANCELLED, NO*SHOW), `scheduled_at`, `intake_answers_json`
  (JSONB), `intake_schema_version`, `scope_summary_source` (TEMPLATE, USER_EDITED, LLM),
  `business_account_id (FK, nullable)` *(Phase 2+ B2B Lite — tags task as belonging to a business account)\_
- `task_drafts`: `id`, `customer_id`, `category_id`, `intake_answers_json (JSONB)`, `intake_schema_version`,
  `summary_draft`, `created_at`, `expires_at`
- `task_photos`: `id`, `task_id (FK)`, `storage_key`, `sort_order`
- `categories`: `id`, `name`, `name_mn`, `icon_url`, `is_active`, `sort_order`, `intake_enabled`,
  `intake_schema_version`, `intake_schema_json (JSONB)`, `last_known_good_schema_version`
- `category_schema_versions`: `id`, `category_id`, `version`, `schema_json (JSONB)`, `status` (DRAFT, CANARY, ACTIVE,
  ROLLED_BACK), `is_last_known_good`, `created_by`, `created_at`, `activated_at`
- `task_applications`: `task_id`, `tasker_id`, `status` (APPLIED, SELECTED, ACCEPTED, DECLINED, EXPIRED),
  `relevance_score`, `recommended`, `selected_at`, `respond_by_at`, `created_at`
- `instant_match_offers` _(Phase 3+ — not yet created)_: `id`, `task_id`, `tasker_id`, `offer_rank`, `expires_at`, `status`
  (PENDING, ACCEPTED, DECLINED, EXPIRED), `created_at`
- `bookings`: `id`, `task_id`, `tasker_id`, `status` (ASSIGNED, COMPLETED, CANCELLED, NO_SHOW), `price`,
  `confirmed_scheduled_at`, `liability_disclaimer_accepted`, `liability_disclaimer_accepted_at`, `settlement_mode`
  (DIRECT, LEAD_UNLOCK, ESCROW), `late_cancel_incident`, `created_at`
- `booking_schedule_events`: `id`, `booking_id`, `actor_user_id`, `event_type` (REQUESTED, ACCEPTED, DECLINED, EXPIRED),
  `proposed_scheduled_at`, `reason`, `created_at`
- `booking_timeline_events`: `id`, `booking_id`, `event_type`, `actor_user_id`, `metadata_json (JSONB)`, `created_at`
- `task_rescue_events`: `id`, `task_id`, `triggered_at`, `trigger_window` (DAYTIME, OFF_HOURS), `actions_json` (JSONB),
  `created_at`
- `booking_reviews`: `id`, `booking_id`, `reviewer_id`, `reviewee_id`, `quality_rating`, `punctuality_rating`,
  `communication_rating`, `clarity_rating`, `respectfulness_rating`, `comment`, `created_at`
- `tasker_reliability_scores`: `tasker_id`, `score`, `completion_rate`, `punctuality_rate`, `cancellation_rate`,
  `review_avg`, `window_days`, `computed_at`
- `tasker_badges`: `tasker_id`, `badge_type` (PRO), `assigned_at`, `revoked_at`

#### Wallet Module And Deferred Monetization Targets

Current schema evidence in this sweep confirms the escrow-path tables `wallets`, `ledger_entries`, and
`payout_requests`. The credit, subscription, and B2B entries below are target-model placeholders for later phases;
they are not all present in current migrations/runtime and must not be read as launch-live schema.

- `credit_balances` _(planned Phase 2 target model)_: `tasker_id (PK)`, `balance`, `total_purchased`, `total_spent`,
  `total_refunded`, `updated_at`
- `credit_transactions` _(planned Phase 2 target model)_: `id`, `tasker_id`, `amount`, `type`
  (PURCHASE, SPEND, REFUND, SIGNUP_BONUS), `reference_id`, `idempotency_key`, `created_at`
- `credit_packs` _(planned Phase 2 target model)_: `id`, `name`, `credit_count`, `price_mnt`, `is_active`
- `lead_unlock_prices` _(planned Phase 2 target model)_: `id`, `category_id`, `district_id`, `credits_required`,
  `effective_from`, `effective_to`, `updated_by`
- `wallets` _(implemented-gated Phase 3 path)_: `user_id (PK)`, `available_balance_mnt`, `pending_balance_mnt`,
  `updated_at`
- `ledger_entries` _(implemented-gated Phase 3 path)_: `id`, `wallet_id`, `amount`, `type`
  (DEPOSIT, FEE, PAYOUT, REFUND), `reference_id`, `created_at`
- `payout_requests` _(implemented-gated Phase 3 path)_: `id`, `user_id`, `amount`, `bank_account`, `status`,
  `requested_at`, `processed_at`, `processed_by`
- `tasker_subscriptions` _(planned Phase 3 target model)_: `id`, `tasker_id`, `status`, `started_at`, `expires_at`,
  `plan_code`
- `business_accounts` _(planned future B2B target model; no current migration/runtime evidence in this sweep)_: `id`,
  `owner_user_id (FK)`, `name`, `plan_code`, `billing_cycle_day`, `status` (TRIAL, ACTIVE, SUSPENDED, CHURNED),
  `created_at`
- `business_locations` _(planned future B2B target model; no current migration/runtime evidence in this sweep)_: `id`,
  `business_account_id (FK)`, `label`, `address_text`, `location_point (GEOMETRY)`, `is_active`
- `business_members` _(planned future B2B target model; no current migration/runtime evidence in this sweep)_: `id`,
  `business_account_id (FK)`, `user_id (FK)`, `role` (OWNER, MANAGER), `joined_at`,
  UNIQUE(`business_account_id`, `user_id`)

#### Communication Module

- `conversations`: `id`, `task_id (FK)`, `customer_id (FK)`, `tasker_id (FK)`, `created_at`
- `messages`: `id`, `conversation_id (FK)`, `sender_id (FK)`, `content`, `phone_number_flagged`, `content_hash`,
  `created_at`
- `device_tokens`: `user_id (FK)`, `token`, `platform` CHECK (IOS, ANDROID, WEB), `created_at`
- `notification_log`: `id`, `user_id`, `type`, `channel` (PUSH, SMS), `status`, `event_key`, `provider_message_id`,
  `error_code`, `created_at`

#### Support Module

- `disputes`: `id`, `booking_id (FK)`, `raised_by (FK)`, `reason`, `status`, `resolution_action` (RESOLVE_CUSTOMER,
  RESOLVE_TASKER, ESCALATE, REFUND, RELEASE), `wrongful_party_user_id`, `resolution_notes`, `created_at`
- `dispute_evidence`: `id`, `dispute_id (FK)`, `type` (CHAT_EXCERPT, PHOTO, WRITTEN_TIMELINE), `storage_key`,
  `text_payload`, `created_at`
- `tasker_strikes`: `id`, `user_id (FK)`, `booking_id (FK)`, `reason`, `created_at`
- `referrals`: `id`, `referrer_id`, `referred_id`, `conversion_event`, `converted_at`, `reward_type`, `reward_applied`
- `referral_rewards`: `id`, `referral_id`, `phase`, `reward_type`, `reward_value`, `applied_at`
- `review_enforcement_cases`: `id`, `booking_id`, `user_id`, `reason_code`, `status`, `triggered_at`, `resolved_at`
- `audit_events`: `id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `metadata_json (JSONB)`,
  `created_at`

#### Infrastructure Tables

- `domain_outbox_events`: `id`, `type`, `payload (JSONB)`, `status` (PENDING, PROCESSING, PROCESSED, FAILED), `attempts`, `last_error`, `available_at`, `created_at`, `correlation_id`, `causation_id`, `command_id`, `workflow_id`, `actor_id`
  — full outbox pattern with context propagation; events relayed to RabbitMQ and consumed by domain workflow handlers.
- `feature_toggles`: `id`, `feature_name`, `is_enabled`, `activated_at`, `deactivated_at`, `updated_by`
  — four toggles are currently seeded at migration time: `escrow_enabled` is the only implemented-gated monetization
  path with confirmed runtime enforcement in this sweep; `lead_fee_enabled`, `subscription_enabled`, and
  `ai_scope_summary_enabled` are seeded latent capabilities with no confirmed runtime consumer in this sweep.
  `promoted_listings_enabled` and `b2b_enabled` remain documented future activation gaps; this sweep found no current
  migration or runtime evidence that they are seeded or live gates.

### 4.2 Data Flow Patterns

1. **Structured Task Intake & Posting Flow**:
   - Client loads active category schema (`intake_schema_json`, `intake_schema_version`).
   - Draft is created with bound schema version (`task_drafts`) and validated against that same version at submit.
   - Server generates deterministic scope summary from answers; if template rendering fails, server falls back to
     canonical key-value summary and logs failure.
   - `POST /tasks` writes `tasks` row with `intake_answers_json`, `intake_schema_version`, `scope_summary_source`.
2. **Task & Booking Flow** (Dual-status model):
   - `POST /tasks` → `tasks.status=OPEN`.
   - `POST /tasks/{id}/applications` → creates `task_applications`.
   - `POST /tasks/{id}/applications/{appId}/accept` → customer accepts Tasker + liability disclaimer; creates
     `bookings.status=ASSIGNED`; updates `tasks.status=ASSIGNED`.
   - In Phase 2+, booking confirmation/contact reveal requires successful lead-unlock debit (`LEAD_UNLOCK_ACCEPTED`)
     before customer phone reveal.
   - `POST /bookings/{id}/complete` → `bookings.status=COMPLETED`; `tasks.status=COMPLETED`.
   - **No-show adjudication path (REQ-BOOK-11)**:
     - Scheduler emits reminder at `confirmed_scheduled_at +10m` and writes `booking_timeline_events` (
       `NO_SHOW_REMINDER_SENT`).
     - Either party may call `POST /bookings/{id}/no-show/flag` at/after `+15m`.
     - Eligibility check uses canonical schedule (latest accepted in-app reschedule; otherwise booking confirmed
       time).
     - Request is rejected unless all are true: booking is `ASSIGNED`; no accepted future reschedule supersedes
       current schedule; no status/check-in events from either party in trailing 30 minutes.
     - On success, one DB transaction updates `bookings.status=NO_SHOW` and `tasks.status=NO_SHOW`, then appends
       immutable `booking_timeline_events` (`NO_SHOW_CONFIRMED`) plus `audit_events` with actor and rule snapshot.
     - Endpoint is idempotent: duplicate/retry requests for same booking return existing terminal state.
3. **Reschedule & Timer Authority Flow**:
   - Reschedule request/accept/decline/expiry writes to `booking_schedule_events`.
   - Canonical schedule timers (late-cancel/no-show) reference only latest accepted in-app schedule.
   - Chat-only schedule mentions do not mutate enforcement timers.
4. **Ranking, Repeat Booking, and Instant Match Flow**:
   - Applicant ranking uses category match, proximity, reliability score, completion rate, and review quality.
   - Repeat booking pre-fills a new task from a completed booking in the same category.
   - Phase 3+ instant match uses `instant_match_offers` with 5-minute offer window and fallback to application flow
     after 3 declines/timeouts.
5. **Monetization Flow** _(Phased by PRD)_:
   - Phase 0-1: direct settlement only (`DIRECT`), no platform fee transactions.
   - Phase 2: credit pack purchase via QPay; selected Tasker lead unlock consumes credits before customer contact
     reveal.
   - Phase 2 lead-unlock pricing resolves from `lead_unlock_prices` by category/district/effective window.
   - Signup bonus credits are granted once per tasker via idempotent transaction key.
   - Phase 3+: escrow payment initiation/callback, wallet crediting, and payout processing are feature-toggled.
6. **No-Applicant Rescue Flow**:
   - If a task has zero eligible applicants for 120 minutes during 08:00-22:00 local time, enqueue rescue actions.
   - Rescue actions include: budget/schedule adjustment prompt, broadened push fanout, and concierge queue placement.
   - Persist trigger and executed actions in `task_rescue_events`.
7. **Messaging Flow** (WebSocket + REST fallback):
   - Conversation is created when Tasker applies to a task.
   - Real-time delivery via Spring WebSocket + STOMP.
   - WebSocket: `SUBSCRIBE /topic/conversations/{id}`, `SEND /app/conversations/{id}/messages`.
   - REST fallback: `POST /conversations/{id}/messages`.
   - Message scanning flags phone-sharing patterns for advisory/admin workflows; `content_hash` supports tamper-evident
     dispute investigation.
8. **Identity, Consent, and Outage Posture Flow**:
   - Phase 0-1: Facebook OAuth primary login; Phase 2+ OTP primary with migration of existing users.
   - During OAuth outage, new login/signup fails closed, while existing valid sessions continue until expiry.
   - Identity upload is blocked until consent is captured (`consent_policy_version`, timestamp).
   - Outage state is surfaced to clients and audit/ops events are emitted.
9. **Reviews, Disputes, and Enforcement Flow**:
   - Booking completion triggers bilateral review prompt + reminders at 24h and 72h.
   - Hard lock is created only for configured risk cases and stored in `review_enforcement_cases`.
   - Dispute creation requires at least one evidence artifact, or enters 24-hour evidence grace before auto-close.
   - Tasker cancellation/no-show incidents are rolled into strike review and reliability-score recomputation.
   - Pro badge assignment is auto-evaluated from completion/rating thresholds and stored in `tasker_badges`.
10. **Category Lifecycle & Referral Flow**:
    - Category deactivation blocks new drafts and new tasks while preserving lifecycle for existing tasks.
    - Phase 2+ referral attribution is persisted at signup and finalized on first completed booking conversion.
    - Monthly referral reward caps and threshold breaches emit manual-review alerts.
    - Referral rewards are phase-aware and persisted in `referral_rewards`.
11. **Payout and Legal-Guard Flow**:
    - Payout processing enforces Tuesday/Friday execution window in platform timezone.
    - System tracks cumulative tasker engagement duration and emits legal-review alerts before 2-year threshold.

## 5. API Design

### 5.1 Standards

- **Protocol**: REST over HTTP/2.
- **Format**: JSON.
- **Spec**: OpenAPI 3.0.3 (Source of Truth).
- **Versioning**: URI Versioning (`/api/v1/...`).
- **Breaking-change policy**: Contract-breaking API updates require version bump and migration notes in the same
  release.

### 5.2 Error Envelope

Standardized error response:

```json
{
  "code": "TASK_ALREADY_BOOKED",
  "message": "This task has already been assigned to another tasker.",
  "trace_id": "abc-123"
}
```

### 5.3 Security

- **Authentication**: `Authorization: Bearer <JWT>` header.
  - Tokens are signed HS256, carry `iss: tasky-server` and `aud: tasky-api`, and include a `jti` (UUID) for revocation.
  - Access token TTL: 15 minutes. Refresh token TTL: configurable (default 30 days).
  - `JwtTokenService` validates signature, expiry, issuer, audience, and token type on every parse.
- **Token Revocation**: `TokenBlacklistService` holds an in-memory Caffeine cache of revoked `jti` values with a 15-minute TTL (matching access token lifetime). Inject and call `TokenBlacklistService.revoke(jti)` for explicit revocation. Does not survive restarts — use user ban for persistent revocation.
- **Authorization**:
  - **Filter-level role enforcement**: `SecurityConfig` enforces roles at the Spring Security filter chain for all business endpoint groups (task drafts → CUSTOMER; verification/wallet/subscriptions/business → TASKER; bookings/disputes/reviews/messaging → CUSTOMER|TASKER; payments/credits → CUSTOMER). Service-layer checks provide a second enforcement layer.
  - **Banned User Check**: `JwtAuthenticationFilter` checks `currentUserStatus()` (Caffeine-cached, 60 s TTL) on every authenticated request. Ban enforcement latency is at most 60 seconds. Cache can be flushed by restarting the application for immediate enforcement.
  - **Contact/Address Reveal Rules**:
    - Tasker phone is never exposed to customers in API responses.
    - Customer phone is masked until selected Tasker completes lead unlock in paid phases.
    - Exact task address is hidden pre-confirmation (and pre-payment commitment in escrow phases).
    - **Phase 0-1 current behavior**: `GET /tasks/{id}` reveals `location_text` (exact address) to any tasker
      whose booking is in `ASSIGNED`, `PAID`, or `COMPLETED` status. No payment gate exists because Phase 0-1
      uses direct settlement only.
    - **Phase 2 activation gap**: If `lead_fee_enabled` is activated in a later tranche, `TaskController.getTask()`
      must be updated to gate address reveal behind a successful lead-unlock event. This is not launch behavior and
      remains a required activation work item.
  - **OAuth Outage Posture (Phase 0-1)**: Login/signup endpoints fail closed when OAuth provider is down; existing
    already-issued valid tokens remain usable until expiry.
  - **Liability Disclaimer Contract**: applicant accept endpoint rejects requests without
    `liability_disclaimer_accepted=true`; accepted disclaimer is persisted on booking.
- **Rate Limiting**:
  - **OTP Endpoints**: Config-defined per phone and per request-source limits with lockout on repeated failed OTP
    verification attempts.
  - **General API**: Sliding window (1-minute window), DB-backed via `rate_limit_counters` table (`RateLimitFilter`). Defaults: 100 rpm authenticated, 30 rpm unauthenticated. Configurable per environment.
  - **WebSocket (STOMP)**: `StompRateLimitInterceptor` applies a Bucket4j token-bucket per user (30 messages/minute) on all `SEND` frames. Subscription authorization uses a single `isParticipant` DB query rather than loading all conversations.
- **Web Frontend Security**:
  - `Caddyfile.production` sets a `Content-Security-Policy` header: `default-src 'self'`, `script-src` allows Facebook CDN and the inline polyfill hash, `style-src` allows Google Fonts, `connect-src` allows `wss:` and `graph.facebook.com`.
  - Built JS/CSS chunks include `integrity` (SRI) attributes generated by `vite-plugin-sri3` at build time.
- **Data Privacy**:
  - **Gov IDs**: Stored in a strict **Private S3 Bucket**. API never exposes public links. Admin viewing uses
    short-lived Presigned GET URLs.
  - **Location**: Exact coords in DB. API exposes `approximate_lat/lng` only for `PublicTask`.
  - **Intake Answers**: Stored as structured JSON; retained/deleted per platform data retention policy and access is
    role-scoped.
- **Monetization Security (Phase 2+)**:
  - **Callbacks**: QPay Webhook MUST verify the HMAC signature using a server-side secret key.
  - **Idempotency**: Enforced on all financial endpoints when monetization is enabled.
- **AI Safety (Phase 0-2)**:
  - Runtime LLM is not on the task-posting critical path.
  - If optional async LLM summary polish is enabled in Phase 3+, deterministic summary remains source of truth on
    failures/timeouts.
- **Input Validation**: JSR-380 (Bean Validation) on all DTOs.

### 5.4 File Upload Pattern (Presigned URLs)

1. Client requests a presigned upload URL:
   - `POST /tasks/photos/upload-url` (task photos before task creation)
   - `POST /tasks/{id}/photos/upload-url` (task photos after task creation)
   - `POST /verification/upload-url` (ID verification images)
   - `POST /users/me/avatar/upload-url` (avatar)
2. Backend generates a presigned URL (S3/MinIO) and returns it with a `storage_key`.
   - _Security_: Backend MUST enforce `Content-Type` in the signed URL signature.
3. Client uploads file directly to S3/MinIO using the presigned URL.
4. Backend stores only the `storage_key` in the database.

### 5.5 Pagination Pattern (Cursor-Based)

All list endpoints use cursor-based pagination. Response envelope:

```json
{
  "data": [],
  "cursor": {
    "next": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

Query parameters: `cursor` (opaque string), `limit` (default 20, max 100).

### 5.6 Task Intake and Booking Contracts

- **Category Intake Contract**:
  - `GET /categories` (or category detail) must expose `intake_enabled`, `intake_schema_version`, and active schema
    payload for task-posting clients.
- **Draft Contract**:
  - Draft create/update APIs must persist `intake_schema_version` bound at start.
  - Final task submit validates against bound schema version and rejects missing required answers with field-level
    error codes.
- **Summary Contract**:
  - Task submit pipeline performs deterministic scope summary generation.
  - On summary generation failure, server returns success with canonical fallback summary and logs failure event.
- **Booking Contract**:
  - Applicant acceptance endpoint requires `liability_disclaimer_accepted=true`.
  - In paid phases, booking confirmation/contact reveal must be gated by successful lead-unlock debit event.
  - Applicant list supports ranked ordering (`relevance_score`) while preserving customer free selection.
  - Selected-applicant confirmation timeout is phase-driven (15m in Phase 2, 5m for Phase 3 instant-match offers).
  - Repeat-booking endpoint must only allow rebook from completed bookings and same-category prefill.
  - No-show policy is deterministic: reminder at `+10m`, no-show flag eligibility at `+15m`, dual inactivity check on
    trailing 30 minutes, and accepted reschedule precedence over prior schedule.
  - Status transitions must enforce `OPEN -> ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW` for tasks and
    `ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW` for bookings.
- **Monetization Contract**:
  - Credit debits are valid only for `LEAD_UNLOCK_ACCEPTED` events.
  - Application cap defaults to 10 and is config-driven per category.
  - Price resolution for lead unlock must use active `lead_unlock_prices` row by category/district/effective time.
  - Signup bonus (5 credits) must be one-time per eligible tasker and enforced idempotently.
- **Dispute and Review Contract**:
  - Dispute creation from `ASSIGNED` or within 24h of `COMPLETED` requires at least one evidence artifact or enters
    24h grace before auto-close.
  - Review reminders follow immediate +24h +72h cadence; hard lock applies only for configured risk triggers.
  - Notification fallback events (`HIRED`, `BOOKING_CONFIRMED`) are idempotent via `notification_log.event_key`.
- **Trust Scoring Contract**:
  - Reliability score is recomputed on cancellation/no-show/completion signals and consumed by applicant ranking.
  - Pro badge assignment is deterministic from completion/rating thresholds and evaluated in background jobs.
- **Admin Contract**:
  - Admin user search supports exact normalized phone lookup plus name and Facebook ID criteria with cursor pagination.
  - Category management supports intake schema create/update/activate/version/rollback with audit logs.
  - Feature toggles must be runtime-switchable without redeploy and fully audited. Only `escrow_enabled` has
    confirmed runtime enforcement in the current sweep; the remaining monetization toggles stay dormant until later
    activation work is verified.

## 6. Backend Runtime Concerns

### 6.1 Backend Stack

- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.x
- **Persistence**: **JDBI 3** (SQL Object API)
  - _Rationale_: We prefer explicit SQL control over JPA magic for performance and predictability.
  - _Migration_: Flyway
- **Database**: PostgreSQL 16 + PostGIS (for geospatial queries)
- **Auth**: Spring Security + JWT (Stateless)

### 6.2 JDBI & Migration Policy

- All SQL is written explicitly via JDBI SQL Object API. No ORM magic.
- Flyway manages schema migrations. Migration naming: `V<version>__<description>.sql`.
- Migrations are forward-only in production. Use new migrations to fix; never modify merged migrations.

### 6.3 Async Workers & Outbox Consumers

- **Mechanism**: Spring `@Async` + `ApplicationEventPublisher` for decoupling.
- **Persistence**: For critical tasks (e.g., notifications, payouts), the `domain_outbox_events` table provides at-least-once delivery. Events are published to RabbitMQ via an outbox relay poller, then handled by domain-owned workflow consumers.

### 6.4 Feature Toggles (Runtime Enforcement Status)

- Feature toggles are seeded at migration time and stored in `feature_toggles`.
- `escrow_enabled` is the only implemented-gated monetization path with confirmed runtime enforcement.
- `lead_fee_enabled`, `subscription_enabled`, and `ai_scope_summary_enabled` are seeded latent capabilities with no confirmed runtime consumer.
- `promoted_listings_enabled` and `b2b_enabled` remain documented future activation gaps; no current migration or runtime evidence.
- Toggles must be runtime-switchable without redeploy and fully audited.

## 7. Backend Testing

- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`.
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`.
- `@DisplayName` must be `"SCN-XXX-NNN: <exact title from scenario file>"`.
- Check `tests/registry.yaml` for existing scenarios before writing tests. Read `tests/scenarios/<domain>.md`.
- After writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`.
- Never modify `tests/scenarios/` directly.
- Never use `@DirtiesContext`.
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap.

## 8. Verification Commands

| Gate       | Command                    | Blocks         |
| ---------- | -------------------------- | -------------- |
| Smoke      | `./gradlew gateSmoke`      | merge to main  |
| Regression | `./gradlew gateRegression` | deploy         |
| Full       | `./gradlew gateFull`       | nightly alerts |
