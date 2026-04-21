# Tasky Architecture — Backend (`services/api`)

Status: architecture reference for `services/api`. Sections are labeled with their truth status (see below).

Read after: repo `AGENTS.md`, `services/api/AGENTS.md`, then this file (`api.md`). Use `common.md` and `docs/openapi/AGENTS.md` only for cross-cutting or contract-change context.

> **Reconciliation status: complete.** This document was reconciled with the codebase across
> five passes (authority/async narrative, security, events/outbox, persistence, verification).
> Every section is labeled with its truth status. Treat labels as authoritative; unmarked subsections are current state.
> Run `./tooling/scripts/scan-backend-doc-drift.sh` to check for banned-term drift re-introduction.
> Run `python3 tooling/scripts/validate-schema-parity.py` to check schema inventory drift against Flyway migrations.

## Authority Order

When this document conflicts with other sources, precedence is:

1. **ArchUnit tests and build-enforced rules** — `services/api/src/test/java/mn/tasky/architecture/`
2. **Flyway migrations** — `services/api/src/main/resources/db/migration/` (schema truth)
3. **Runtime code and package structure** — actual Java source
4. **This document** — prose descriptions derived from the above

If prose says X but code/tests say Y, the code/tests win. File a doc-fix issue.

## 1. Scope

> **Truth status: current state** — verified against ArchUnit tests and runtime code.

This document owns backend-specific architecture: module layout, request-path rules, data schemas and flows, API contracts, security, runtime concerns, and testing. Cross-cutting system context, shared infrastructure, NFR baselines, and dev workflow live in `common.md`. Frontend parity contracts live in `shared-frontend.md`.

## 1.1 Foundational Design Patterns

> **Truth status: current state** — enforced by ArchUnit tests.

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

**Two-path publish model:**

1. **Synchronous direct publish (happy path):**
   `DomainEventOutboxService.publish(eventType, aggregateType, aggregateId, payload)` persists the event to
   `domain_outbox_events` and immediately publishes to RabbitMQ via `EventRelayPublisher` (when
   `tasky.automation.broker.enabled=true`). On successful publish, the row is marked `PROCESSED` in the same
   call. Broker failure does **not** roll back the domain transaction — the row remains `PENDING` for relay recovery.

2. **Scheduled relay recovery (failure path):**
   `OutboxRelayScheduler` runs every 10 s (ShedLock-guarded) and delegates to `OutboxRelayService`, which claims
   batches of `PENDING`/`FAILED` rows, republishes via `EventRelayPublisher`, and marks them `PROCESSED` or `FAILED`.
   Failed publishes use exponential backoff (30 s base, 1 h max) with configurable max attempts (default 10).
   Events exceeding max attempts remain `FAILED` with a 24-hour permanent backoff — they are not promoted to a different status but will not be retried aggressively. Admin replay (`OutboxReplayController`) can reset `FAILED` → `PENDING` manually.

**At-least-once delivery:** The system provides true at-least-once semantics — direct publish on the happy path,
relay recovery for failures. Handler-level idempotency via `WorkflowIdempotencyGuard` (`kernel.idempotency`)
handles any duplicate deliveries that arise from the overlap between the two paths.

**Handler dispatch:**

1. `EventWorkerConsumer` (RabbitMQ listener) dispatches to the registered `EventHandler` by event type.
2. Each handler extends `AbstractEventHandler`, which provides:
   - `tryClaimEvent(envelope)` / `tryClaimEventComplete(envelope)` for event-level idempotency.
   - `withObservability(payload, base)` to propagate correlation/locale/platform from the envelope.
3. Handlers live in domain-owned `workflow` packages (e.g. `mn.tasky.messaging.workflow.TaskApplicationAcceptedHandler`).

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

- `RequestContext` → populated by `RequestObservabilityFilter` from HTTP headers; filter calls
  `ContextPropagator.propagate(requestContext)` to seed MDC at HTTP ingress.
- `WorkflowContext` → derived from RequestContext or carried in `AutomationEventEnvelope`.
  `EventWorkerConsumer` reconstructs `WorkflowContext` from envelope fields and calls
  `ContextPropagator.propagate(workflowContext)` at the worker boundary.
- `JobContext` → derived from WorkflowContext. Exists as a type but is **not yet used at runtime**
  (no job layer currently).
- `ContextPropagator` bridges between contexts and MDC; all canonical keys are defined in `LogField`.

**Propagation chain (wired):**
`RequestContext` (ingress) → MDC → `ContextPropagator.captureMdc()` (outbox write) → envelope fields →
`WorkflowContext` (worker dispatch).

`DomainEventOutboxService` captures MDC via `ContextPropagator.captureMdc()` at outbox persistence time,
ensuring trace context survives across the async boundary.

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

> **Truth status: current state** — verified against runtime package structure, PackageMarker inventory, and port interfaces.

The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication uses internal Java method calls — no network hops between domains.

### Feature Modules (domain business logic)

| Module           | Package        | Responsibility                                          | CQRS Ports                                                           |
| ---------------- | -------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| **Identity**     | `identity`     | Cross-cutting facade: composes auth, user, verification | `IdentityCommandPort`, `IdentityQueryPort`                           |
| **Auth**         | `auth`         | Facebook OAuth, OTP login, JWT sessions                 | _(provider pattern; ports not yet extracted)_                        |
| **User**         | `user`         | User profiles, roles                                    | _(ports not yet extracted)_                                          |
| **Security**     | `security`     | Security endpoints (session info, CSRF)                 | _(ports not yet extracted)_                                          |
| **Verification** | `verification` | Tasker KYC / document verification queue                | _(ports not yet extracted)_                                          |
| **Marketplace**  | `marketplace`  | Cross-cutting facade: composes task, category, booking  | `MarketplaceCommandPort`, `MarketplaceQueryPort`                     |
| **Task**         | `task`         | Task CRUD, lifecycle, assignment, status, drafts        | _(ports not yet extracted)_                                          |
| **Category**     | `category`     | Service category taxonomy, intake schemas               | `CategoryQueryPort` (read-only)                                      |
| **Booking**      | `booking`      | Booking state machine, intents, schedule events         | `BookingCommandPort`, `BookingIntentCommandPort`, `BookingQueryPort` |
| **Location**     | `location`     | Districts, service areas, geocoding                     | `LocationQueryPort` (read-only)                                      |
| **Trust**        | `trust`        | Cross-cutting facade: composes review, dispute          | `TrustCommandPort`, `TrustQueryPort`                                 |
| **Review**       | `review`       | Post-task ratings, enforcement cases                    | _(ports not yet extracted)_                                          |
| **Dispute**      | `dispute`      | Dispute resolution, evidence handling                   | _(ports not yet extracted)_                                          |
| **Wallet**       | `wallet`       | Tasker wallet, ledger, payouts                          | `WalletCommandPort`, `WalletQueryPort`                               |
| **Payment**      | `payment`      | Payment gateway integration (QPay)                      | `PaymentCommandPort`                                                 |
| **Messaging**    | `messaging`    | In-app chat (WebSocket/STOMP)                           | `MessagingCommandPort`, `MessagingQueryPort`                         |
| **Notification** | `notification` | Push notifications (FCM), in-app alerts                 | `NotificationCommandPort`                                            |
| **Analytics**    | `analytics`    | Event tracking, marketplace metrics                     | `AnalyticsCommandPort`                                               |
| **Admin**        | `admin`        | Admin dashboard APIs                                    | `AdminAuditCommandPort`                                              |

### Orchestration Plane

| Module      | Package   | Responsibility                                                                                                                                                  |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime** | `runtime` | HTTP controllers, composition services, schedulers, workers. Sub-packages: `publicapi/` (composition), `adminapi/` (admin composition), `scheduler/`, `worker/` |

### Automation Plane

| Module         | Package      | Responsibility                                                                                                                                                                                 |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Automation** | `automation` | Event-driven async engine. Sub-packages: `broker/` (RabbitMQ relay), `event/` (envelope contracts), `job/` (job dispatch), `provider/` (+`llm/`), `worker/` (consumer), `workflow/` (handlers) |

### Infrastructure / Cross-Cutting

| Module         | Package      | Responsibility                                                                                                                      |
| -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Kernel**     | `kernel`     | Shared primitives (must never depend on feature modules). Sub-packages: `context/`, `idempotency/`, `logging/`, `error/`, `outbox/` |
| **Common**     | `common`     | Cross-cutting infrastructure: security config, audit, storage, outbox, persistence, health, crypto                                  |
| **Projection** | `projection` | Admin read models. Sub-packages: `admin/`                                                                                           |

> Modules marked "ports not yet extracted" have a `publicapi/` package marker but no CommandPort/QueryPort interfaces. Their runtime composition services call application-layer services directly. Port extraction is tracked as tech debt.

## 3. Request-Path Architecture

> **Truth status: current state** — enforced by `AudienceCompositionBoundaryTest`.

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
- `OtpController` — rate-limit enforcement is a cross-cutting security concern, not business logic; also uses `IdentityCommandPort` for OTP operations

Any addition to the exception set requires deliberate justification in code review.

## 4. Data Architecture

> **Truth status: current state** — Schema descriptions verified against Flyway migrations V1–V28 and live DAO/DTO contracts.
> Section 4.1 and 4.2 reflect the current-state schema; section 4.4 documents planned target-state tables separately.
> For authoritative column definitions, consult the migrations directly.
>
> **Drift guard:** `python3 tooling/scripts/validate-schema-parity.py` compares the curated schema inventory
> (`tooling/config/expected-schema.json`) against the actual Flyway migrations. It runs in the `structural-gate`
> CI job and fails the PR on table or column drift. Run `--update-expected` when adding a new migration.

### 4.1 Current-state Domain Schema (authoritative)

> **Truth status: current state** — verified against Flyway migrations V1–V28 and live DAO/DTO contracts.
> For column-level definitions, consult the migrations directly (`services/api/src/main/resources/db/migration/`).

#### Identity

- `users`: `id (UUID PK)`, `phone`, `phone_blind_idx (UNIQUE)`, `primary_auth` (FACEBOOK, PHONE_OTP), `role` (CUSTOMER, TASKER, ADMIN), `status` (PENDING, ACTIVE, VERIFIED, SUSPENDED, BANNED, DELETED), `suspension_end_at`, `created_at`, `updated_at`
- `profiles`: `user_id (PK → users)`, `full_name`, `avatar_url`, `rating_avg`, `bio`, `completed_tasks`
  — `instant_match_revoked_until` (behavior-affecting: gates instant-match eligibility when set to a future timestamp)
  — `last_active_at` (updated on activity)
- `verifications`: `id (UUID PK)`, `user_id (FK → users)`, `id_card_front_key`, `id_card_back_key`, `status` (PENDING, APPROVED, REJECTED), `submitted_at`, `admin_notes`, `reviewed_at`, `consent_policy_version`, `consent_accepted_at`, `dan_reference (nullable)`
  — columns store S3/MinIO object keys, not URLs; download links are generated via presigned GET URLs on demand

#### Marketplace

- `tasks`: `id (UUID PK)`, `customer_id (FK → users)`, `category_id (FK → categories)`, `description`, `budget`, `location_lat`, `location_lng`, `location_text`, `location_point (GEOMETRY(Point, 4326))`, `status` (OPEN, ASSIGNED, COMPLETED, CANCELLED, NO_SHOW), `scheduled_at`, `created_at`, `updated_at`, `intake_answers_json (JSONB)`, `intake_schema_version`, `scope_summary_source` (TEMPLATE, USER_EDITED, LLM)
- `task_drafts`: `id (UUID PK)`, `customer_id (FK → users)`, `category_id (FK → categories)`, `intake_answers_json (JSONB)`, `intake_schema_version`, `summary_draft`, `location_lat`, `location_lng`, `location_text`, `created_at`, `expires_at (default now()+7d)`
  — Design constraint: drafts intentionally do NOT store `location_point`; geometry is materialized only on promotion to `tasks`
- `task_photos`: `id (UUID PK)`, `task_id (FK → tasks)`, `storage_key`, `sort_order`
- `categories`: `id (UUID PK)`, `name`, `name_mn`, `icon_url`, `is_active`, `sort_order`, `intake_enabled`, `intake_schema_version`, `intake_schema_json (JSONB)`
- `category_schema_versions`: `id (UUID PK)`, `category_id (FK → categories)`, `version`, `schema_json (JSONB)`, `status` (DRAFT, CANARY, ACTIVE, ROLLED_BACK), `created_by`, `created_at`, `activated_at`; UNIQUE(category_id, version)
- `task_applications`: `id (UUID PK)`, `task_id (FK → tasks)`, `tasker_id (FK → users)`, `message`, `status` (APPLIED, SELECTED, ACCEPTED, DECLINED, EXPIRED), `relevance_score`, `recommended`, `selected_at`, `respond_by_at`, `created_at`; UNIQUE(task_id, tasker_id)
- `bookings`: `id (UUID PK)`, `task_id (FK → tasks)`, `tasker_id (FK → users)`, `customer_id (FK → users)`, `price`, `status` (ASSIGNED, PAID, COMPLETED, CANCELLED, NO_SHOW), `cancellation_fee`, `liability_disclaimer_accepted`, `liability_disclaimer_accepted_at`, `confirmed_scheduled_at`, `settlement_mode` (DIRECT, LEAD_UNLOCK, ESCROW; default DIRECT), `late_cancel_incident`, `created_at`, `updated_at`
  — `PAID` is a live transitional state in the booking state machine
- `booking_intents`: `id (UUID PK)`, `task_id (FK → tasks CASCADE)`, `tasker_id (FK → users)`, `customer_id (FK → users)`, `source` (REBOOK, INSTANT_MATCH), `status` (PENDING, CONFIRMED, EXPIRED, CANCELLED), `original_booking_id (FK → bookings)`, `offer_id`, `expires_at`, `confirmed_booking_id (FK → bookings)`, `confirmed_at`, `created_at`, `updated_at`
- `booking_schedule_events`: `id (UUID PK)`, `booking_id (FK → bookings)`, `actor_user_id (FK → users)`, `event_type` (REQUESTED, ACCEPTED, DECLINED, EXPIRED), `proposed_scheduled_at`, `reason`, `created_at`
- `booking_timeline_events`: `id (UUID PK)`, `booking_id (FK → bookings)`, `event_type`, `actor_user_id (FK → users)`, `metadata_json (JSONB)`, `created_at`
- `task_rescue_events`: `id (UUID PK)`, `task_id (FK → tasks)`, `triggered_at`, `trigger_window` (DAYTIME, OFF_HOURS), `actions_json (JSONB)`, `created_at`
- `booking_reviews`: `id (UUID PK)`, `booking_id (FK → bookings)`, `reviewer_id (FK → users)`, `reviewee_id (FK → users)`, `quality_rating (1-5)`, `punctuality_rating (1-5)`, `communication_rating (1-5)`, `clarity_rating (1-5)`, `respectfulness_rating (1-5)`, `comment`, `created_at`; UNIQUE(booking_id, reviewer_id)
- `tasker_reliability_scores`: `tasker_id (PK → users)`, `score`, `completion_rate`, `punctuality_rate`, `cancellation_rate`, `review_avg`, `window_days`, `computed_at`
- `tasker_badges`: `tasker_id (FK → users)`, `badge_type` (PRO), `assigned_at`, `revoked_at`; PK(tasker_id, badge_type)

#### Wallet

- `wallets`: `user_id (PK → users)`, `balance_mnt`, `held_balance_mnt`, `updated_at`
- `ledger_entries`: `id (UUID PK)`, `user_id (FK → users)`, `amount`, `type` (DEPOSIT, FEE, HOLD, RELEASE, CONFISCATE, PAYOUT, REFUND), `reference_id`, `description`, `created_at`
- `payout_requests`: `id (UUID PK)`, `user_id (FK → users)`, `amount`, `status` (PENDING, PROCESSED, REJECTED), `created_at`, `processed_at`
- `credited_bookings`: `booking_id (PK → bookings)`

#### Communication

- `conversations`: `id (UUID PK)`, `task_id (FK → tasks)`, `customer_id (FK → users)`, `tasker_id (FK → users)`, `created_at`; UNIQUE(task_id, customer_id, tasker_id)
- `messages`: `id (UUID PK)`, `conversation_id (FK → conversations)`, `sender_id (FK → users)`, `content`, `phone_number_flagged`, `content_hash`, `sent_at`
- `device_tokens`: `user_id (FK → users)`, `token`, `platform`, `created_at`; UNIQUE(user_id, token)
- `notification_log`: `id (UUID PK)`, `user_id (FK → users)`, `type`, `channel`, `status`, `event_key`, `provider_message_id`, `error_code`, `created_at`

#### Support

- `disputes`: `id (UUID PK)`, `booking_id (FK → bookings)`, `raised_by (FK → users)`, `reason`, `status` (OPEN, RESOLVED_TASKER, RESOLVED_CUSTOMER, ESCALATED, CLOSED_INSUFFICIENT_EVIDENCE), `resolution_action` (RESOLVE_CUSTOMER, RESOLVE_TASKER, ESCALATE, REFUND, RELEASE), `wrongful_party_user_id`, `resolution_notes`, `resolved_at`, `created_at`
- `dispute_evidence`: `id (UUID PK)`, `dispute_id (FK → disputes)`, `type` (CHAT_EXCERPT, PHOTO, WRITTEN_TIMELINE), `storage_key`, `text_payload`, `created_at`
- `tasker_strikes`: `id (UUID PK)`, `user_id (FK → users)`, `booking_id (FK → bookings)`, `reason`, `created_at`
- `referrals`: `id`, `referrer_id`, `referred_id`, `conversion_event`, `converted_at`, `reward_type`, `reward_applied`
- `referral_rewards`: `id`, `referral_id`, `phase`, `reward_type`, `reward_value`, `applied_at`
- `review_enforcement_cases`: `id (UUID PK)`, `booking_id (FK → bookings)`, `user_id (FK → users)`, `reason_code`, `status` (PENDING, REMINDED_24H, REMINDED_72H, COMPLETED, EXPIRED), `investigation_active` (behavior-affecting: drives hard-lock enforcement), `triggered_at`, `resolved_at`
- `audit_events`: `id (UUID PK)`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `metadata_json (JSONB)`, `created_at`

### 4.2 Current-state Operational / Support Schema (authoritative)

> **Truth status: current state** — live tables that support auth, moderation, and infrastructure.
> Not product-facing but materially affect backend behavior.

#### Auth Operations

- `otp_challenges`: `phone_blind_idx (PK)`, `code`, `expires_at`, `attempts`
- `refresh_sessions`: `token_id (PK)`, `user_id (FK → users)`, `expires_at`

#### Trust & Moderation

- `moderation_policy`: `id (SMALLINT PK, singleton=1)`, `strike_window_days`, `strike_threshold`, `first_suspension_days`, `repeat_suspension_days`, `repeat_offense_window_days`, `auto_unsuspend_enabled`, `updated_at`
- `suspension_events`: `id (UUID PK)`, `user_id (FK → users)`, `strike_count`, `suspension_days`, `suspended_at`, `unsuspended_at`
- `booking_reliability_incidents`: `id (UUID PK)`, `booking_id (FK → bookings)`, `user_id (FK → users)`, `incident_type`, `details`, `recorded_at`; UNIQUE(booking_id, user_id, incident_type)

#### Service Areas

- `districts`: `id (UUID PK)`, `name`, `name_mn`, `slug (UNIQUE)`, `is_active`, `centroid_lat`, `centroid_lng`
- `tasker_service_districts`: `user_id (FK → users CASCADE)`, `district_id (FK → districts CASCADE)`, `created_at`; PK(user_id, district_id)

#### Event Infrastructure

- `domain_outbox_events`: `id`, `type`, `payload (JSONB)`, `status` (PENDING, PROCESSING, PROCESSED, FAILED), `attempts`, `last_error`, `available_at`, `created_at`, `correlation_id`, `causation_id`, `command_id`, `workflow_id`, `actor_id`
  — full outbox pattern with context propagation; events relayed to RabbitMQ and consumed by domain workflow handlers
- `event_idempotency`: `event_id (PK)`, `event_type`, `handler`, `event_status` (IN_PROGRESS, COMPLETED), `processed_at`

#### Feature Flags

- `feature_toggles`: `id (UUID PK)`, `feature_name (UNIQUE)`, `is_enabled`, `activated_at`, `deactivated_at`, `updated_by`, `updated_at`
  — four toggles seeded at migration time: `escrow_enabled` is the only implemented-gated monetization path with confirmed runtime enforcement; `lead_fee_enabled`, `subscription_enabled`, and `ai_scope_summary_enabled` are seeded latent capabilities with no confirmed runtime consumer

### 4.3 Read Models and Projections

> **Truth status: current state** — admin read models in `projection.admin` package.

_(No database views or materialized projections currently exist. Admin read models are composed in Java via composition services backed by publicapi query ports. This section is a placeholder for when SQL views or materialized query tables are introduced.)_

### 4.4 Planned / Target-state Schema (non-authoritative)

> **Truth status: target design only** — these tables have **no current migration or runtime**.
> They are documented for roadmap and design reference. Do not read them as launch-live schema.
> When any of these are implemented, move the entry to the current-state section above and add the migration reference.

- `instant_match_offers`: `id`, `task_id`, `tasker_id`, `offer_rank`, `expires_at`, `status` (PENDING, ACCEPTED, DECLINED, EXPIRED), `created_at`
- `credit_balances`: `tasker_id (PK)`, `balance`, `total_purchased`, `total_spent`, `total_refunded`, `updated_at`
- `credit_transactions`: `id`, `tasker_id`, `amount`, `type` (PURCHASE, SPEND, REFUND, SIGNUP_BONUS), `reference_id`, `idempotency_key`, `created_at`
- `credit_packs`: `id`, `name`, `credit_count`, `price_mnt`, `is_active`
- `lead_unlock_prices`: `id`, `category_id`, `district_id`, `credits_required`, `effective_from`, `effective_to`, `updated_by`
- `tasker_subscriptions`: `id`, `tasker_id`, `status`, `started_at`, `expires_at`, `plan_code`
- `business_accounts`: `id`, `owner_user_id (FK)`, `name`, `plan_code`, `billing_cycle_day`, `status` (TRIAL, ACTIVE, SUSPENDED, CHURNED), `created_at`
- `business_locations`: `id`, `business_account_id (FK)`, `label`, `address_text`, `location_point (GEOMETRY)`, `is_active`
- `business_members`: `id`, `business_account_id (FK)`, `user_id (FK)`, `role` (OWNER, MANAGER), `joined_at`; UNIQUE(business_account_id, user_id)
- `tasks.business_account_id` (Phase 2+ B2B Lite — tags task as belonging to a business account)

### 4.5 Data Flow Patterns

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

> **Truth status: current state** — aligned with OpenAPI spec and runtime enforcement.

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
  - Access token TTL: 15 minutes. Refresh token TTL: configurable (current default is **14 days**).
  - `JwtTokenService` validates signature, expiry, issuer, audience, and token type on every parse.
- **Token Revocation**: `TokenBlacklistService` holds an in-memory Caffeine cache of revoked `jti` values with a 15-minute TTL (matching access token lifetime). The logout endpoint (`POST /api/v1/auth/logout`) revokes the current access token's JTI. The blacklist is also consulted on STOMP `CONNECT`. The blacklist is in-memory and does not survive restarts — user ban provides persistent revocation.
- **Authorization**:
  - **Filter-level role enforcement**: `SecurityConfig` enforces roles at the Spring Security filter chain for all business endpoint groups (task drafts → CUSTOMER; verification/wallet/subscriptions/business → TASKER; bookings/disputes/reviews/messaging → CUSTOMER|TASKER; payments/credits → CUSTOMER). Service-layer checks provide a second enforcement layer.
  - **Terminal account-status enforcement**: `JwtAuthenticationFilter` rejects `BANNED`, `SUSPENDED`, and `DELETED` users on every authenticated HTTP request. The same terminal-status set is enforced on STOMP `CONNECT`, on refresh-token rotation, and at all auth entry points (Facebook login, OTP verify, dev login).
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
  - **Liability Disclaimer Contract**: applicant accept and booking confirm endpoints reject requests without
    `liability_disclaimer_accepted=true` via Bean Validation (`@NotNull` + `@AssertTrue`). Accepted disclaimer
    is also enforced in service logic as defense in depth.
- **Bean Validation**: `@Valid` + JSR-380 annotations enforce request-shape constraints on controller-layer DTOs. Some security-sensitive invariants (liability disclaimer, booking ownership) have both DTO-level and service-level enforcement; others are service-level only.
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
    `ASSIGNED -> PAID -> COMPLETED|CANCELLED|NO_SHOW` for bookings (PAID is escrow-phase intermediate;
    in direct-settlement mode bookings go ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW directly).
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

> **Truth status: current state** — verified against `DomainEventOutboxService`, `EventRelayPublisher`, `EventWorkerConsumer`, `OutboxRelayService`, `OutboxRelayScheduler`.

- **Mechanism (retired):** The old `@Async` + `ApplicationEventPublisher` + polling relay mechanism is
  **retired**. The old `DomainEventOutboxProcessor` polling relay is also retired.
- **Mechanism (current — two-path publish):** `DomainEventOutboxService` persists events to
  `domain_outbox_events` and, when `tasky.automation.broker.enabled=true`, directly publishes to RabbitMQ
  via `EventRelayPublisher`. On successful direct publish, the row is marked `PROCESSED` immediately.
  Rows that fail to publish remain `PENDING` for relay recovery.
- **Relay recovery:** `OutboxRelayScheduler` runs every 10 s (ShedLock-guarded via `@SchedulerLock`),
  delegating to `OutboxRelayService`. Recovery loop: `claimBatch` (PENDING/FAILED rows) → `publish` via
  `EventRelayPublisher` → `markProcessed` / `markFailed`. Failed events receive exponential backoff
  (30 s base, 1 h max) with configurable max attempts (default 10, via `tasky.automation.relay.max-attempts`);
  events exceeding max attempts remain `FAILED` with a 24-hour permanent backoff. Admin replay can reset these
  back to `PENDING` for reprocessing.
  Batch size is configurable via `tasky.automation.relay.batch-size`.
- **Persistence:** The outbox row is written first; broker publish is attempted synchronously afterward.
  Broker failure does **not** roll back the domain transaction because the row already exists.
- **Admin replay:** `OutboxReplayController` resets `FAILED` → `PENDING` (via `resetForReplay`);
  the relay scheduler picks up replayed events on the next cycle. Replay now works end-to-end.
- **Health:** `OutboxHealthIndicator` correctly reports health — events transition out of `PENDING`
  (via direct publish or relay), so stale-PENDING false-negatives no longer occur.
- **Consumption:** `EventWorkerConsumer` (RabbitMQ listener, `automation.worker` queue) dispatches to registered
  `EventHandler` implementations by event type, with retry routing (x-death headers, configurable `max-retries`)
  and DLQ fallback.
- **At-least-once semantics:** Idempotency is enforced at the handler level via `WorkflowIdempotencyGuard`
  (`kernel.idempotency`), not by deduplication at the broker.

### 6.4 Feature Toggles (Runtime Enforcement Status)

- Feature toggles are seeded at migration time and stored in `feature_toggles`.
- `escrow_enabled` is the only implemented-gated monetization path with confirmed runtime enforcement.
- `lead_fee_enabled`, `subscription_enabled`, and `ai_scope_summary_enabled` are seeded latent capabilities with no confirmed runtime consumer.
- `promoted_listings_enabled` and `b2b_enabled` remain documented future activation gaps; no current migration or runtime evidence.
- Toggles must be runtime-switchable without redeploy and fully audited.

## 7. Backend Testing

> **Truth status: current state** — matches `tests/registry.yaml` and build configuration.

- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`.
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`.
- `@DisplayName` for scenario-backed tests must include the scenario ID (e.g. `"SCN-TASK-001: ..."`) so that `sync-registry.sh` can discover it. Multiple scenario IDs in a single display name are supported (e.g. `"SCN-TASK-009 SCN-SMOKE-004: ..."`). Non-scenario domain-unit tests (no SCN mapping) may use descriptive display names without the SCN prefix.
- Check `tests/registry.yaml` for existing scenarios before writing tests. Read `tests/scenarios/<domain>.md`.
- After writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`.
- Never modify `tests/scenarios/` directly.
- Never use `@DirtiesContext`.
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap.

## 8. Verification Commands

> **Truth status: current state** — matches `build.gradle.kts` task definitions and CI workflow wiring.

### Gradle gates (local / CI)

| Gate       | Command                    | Purpose                                   |
| ---------- | -------------------------- | ----------------------------------------- |
| Smoke      | `./gradlew gateSmoke`      | Fast compile + critical-test subset       |
| Regression | `./gradlew gateRegression` | Extended test suite for broader coverage  |
| Full       | `./gradlew gateFull`       | Full suite including PIT mutation testing |

### CI enforcement (actual wiring)

| CI workflow          | What it runs                                                                                   | When                  |
| -------------------- | ---------------------------------------------------------------------------------------------- | --------------------- |
| `quality-gates.yml`  | `:services:api:check` + `jacocoTestCoverageVerification` + `openApiValidate` (not `gateSmoke`) | every PR              |
| `release-gate.yml`   | migration safety, rollback readiness, performance smoke, E2E smoke (not `gateRegression`)      | deploy (staging/prod) |
| `nightly-regression` | `gateRegression` + `openApiValidate`                                                           | nightly schedule      |

> `gateSmoke` and `gateRegression` are defined as Gradle tasks but are not currently wired into PR or deploy gates.
> `gateRegression` runs only in the nightly schedule. The PR gate runs a broader `check` which includes `architectureTest`.
