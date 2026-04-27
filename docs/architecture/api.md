# Tasky Architecture — Backend (`services/api`)

This document describes the backend architecture for `services/api`. It should be read as implementation guidance derived from the governing product and policy docs.

Read after: repo `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, relevant maintenance policy, `services/api/AGENTS.md`,
then this file (`api.md`). Use `common.md` and `docs/openapi/AGENTS.md` only for cross-cutting or contract-change
context.

Use `python3 tooling/scripts/governance/validate-schema-parity.py` to check schema inventory against Flyway migrations.

## Authority Order

Product behavior and launch scope are governed by `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, and the relevant maintenance policy docs. This file describes backend design and implementation structure for that product.

Use this interpretation rule throughout:

1. `docs/PRD.md` defines intended Phase 1 behavior and launch scope.
2. `docs/STRATEGY.md` defines operating posture and launch discipline.
3. `docs/ROLLOUT_PHASES.md` preserves later-phase intent without widening the active contract.
4. Maintenance policies constrain activation posture, staging posture, and operational discipline.
5. This document describes how the backend is organized to implement current behavior.
6. Tests, migrations, and runtime code are evidence of implementation reality, but they do **not** expand launch scope on their own.

Any non-Phase-1 scaffolding in code or schema is implementation residue, not active architecture scope.

## 1. Scope

This document owns backend-specific architecture: module layout, request-path rules, data schemas and flows, API contracts, security, runtime concerns, and testing. Cross-cutting system context, shared infrastructure, NFR baselines, and dev workflow live in `common.md`. Frontend parity contracts live in `shared-frontend.md`.

Future rollout intent belongs in `docs/ROLLOUT_PHASES.md`. This architecture doc should describe active backend structure, not keep later-phase technical design alive in the main reading path.

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

**Intent.** Decouple side effects such as notifications, analytics, reminders, and recovery workflows from the synchronous request
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

```claim symbol-exists
class: mn.tasky.common.outbox.DomainEventOutboxService
method: publish
```

```claim db-table
table: domain_outbox_events
required_columns: [id, event_type, payload, status, attempts, created_at]
```

```claim config-key
key: tasky.automation.broker.enabled
```

```claim symbol-exists
class: mn.tasky.admin.api.OutboxReplayController
```

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

**Intent.** External systems used by the Phase 1 product — Facebook OAuth, push/SMS delivery, geocoding, and object storage — are wrapped behind provider interfaces so callers remain testable and swappable.

**Convention:**

```
mn.tasky.<module>.provider.<ProviderInterface>        ← interface
mn.tasky.<module>.provider.<ConcreteProvider>          ← @ConditionalOnProperty implementation
```

**Active Phase 1 provider families:**

| Provider interface                     | Implementations                               | Activation property                 |
| -------------------------------------- | --------------------------------------------- | ----------------------------------- |
| `PushNotificationProvider`             | `FirebasePushProvider`, `LoggingPushProvider` | `tasky.push.provider`               |
| `SmsNotificationProvider`              | `LoggingSmsNotificationProvider`              | `tasky.notification.sms.provider`   |
| `OAuthProvider`                        | `FacebookOAuthProvider`                       | `tasky.auth.oauth.provider`         |
| `GeocodingProvider`                    | `DistrictGeocodingProvider`                   | `tasky.location.geocoding.provider` |
| `StorageProvider` / `S3StorageService` | S3/MinIO                                      | —                                   |

```claim config-key
key: tasky.push.provider
```

```claim config-key
key: tasky.notification.sms.provider
```

```claim config-key
key: tasky.auth.oauth.provider
```

```claim config-key
key: tasky.location.geocoding.provider
```

Deferred adapters for payment, escrow, payout, alternate auth, or LLM-assisted copy may exist in the codebase, but they are not part of the Phase 1 runtime contract and must stay disabled unless the PRD and downstream contracts are updated first.

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

```claim symbol-exists
class: mn.tasky.common.observability.RequestObservabilityFilter
```

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

The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication uses internal Java method calls — no network hops between domains.

### Feature Modules (Phase 1 launch baseline)

| Module           | Package        | Responsibility                                                                             | CQRS Ports                                                           |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Identity**     | `identity`     | Cross-cutting facade for authentication state, user identity, and verification             | `IdentityCommandPort`, `IdentityQueryPort`                           |
| **Auth**         | `auth`         | Facebook OAuth login, token issuance, refresh, logout, outage posture                      | _(provider pattern; ports not yet extracted)_                        |
| **User**         | `user`         | User profiles and role state                                                               | _(ports not yet extracted)_                                          |
| **Security**     | `security`     | Session introspection and request security surfaces                                        | _(ports not yet extracted)_                                          |
| **Verification** | `verification` | Tasker verification queue and audit trail                                                  | _(ports not yet extracted)_                                          |
| **Marketplace**  | `marketplace`  | Cross-cutting facade for task, category, and booking flows                                 | `MarketplaceCommandPort`, `MarketplaceQueryPort`                     |
| **Task**         | `task`         | Task drafts, posting, application review, and lifecycle                                    | _(ports not yet extracted)_                                          |
| **Category**     | `category`     | Launch category catalog and structured intake schemas                                      | `CategoryQueryPort` (read-only)                                      |
| **Booking**      | `booking`      | Booking intent window, confirmation, reschedule, cancellation, no-show, completion         | `BookingCommandPort`, `BookingIntentCommandPort`, `BookingQueryPort` |
| **Location**     | `location`     | District and service-area lookup used for eligibility and notification targeting           | `LocationQueryPort` (read-only)                                      |
| **Trust**        | `trust`        | Cross-cutting facade for review, dispute, reliability, and moderation signals              | `TrustCommandPort`, `TrustQueryPort`                                 |
| **Review**       | `review`       | Terminal-outcome review workflow and review debt enforcement                               | _(ports not yet extracted)_                                          |
| **Dispute**      | `dispute`      | Evidence-backed dispute handling and admin outcomes                                        | _(ports not yet extracted)_                                          |
| **Messaging**    | `messaging`    | Platform-mediated post-confirmation messaging and auditability                             | `MessagingCommandPort`, `MessagingQueryPort`                         |
| **Notification** | `notification` | Push/SMS notification delivery                                                             | `NotificationCommandPort`                                            |
| **Analytics**    | `analytics`    | Product-event emission and KPI instrumentation                                             | `AnalyticsCommandPort`                                               |
| **Admin**        | `admin`        | Admin dashboard APIs for verification, moderation, disputes, rescue, and schema governance | `AdminAuditCommandPort`                                              |

### Current-phase boundary

The repository may still contain dormant scaffolding outside the launch baseline. That residue is not part of the active backend contract and should not be used to infer live product scope.

### Orchestration Plane

| Module      | Package   | Responsibility                                                                                                                                                      |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime** | `runtime` | HTTP controllers, composition services, schedulers, and workers. Sub-packages: `publicapi/` (composition), `adminapi/` (admin composition), `scheduler/`, `worker/` |

### Automation Plane

| Module         | Package      | Responsibility                                                                                                                             |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Automation** | `automation` | Event-driven async engine for broker relay, event envelopes, workers, and workflow handlers backing notifications, reminders, and recovery |

### Infrastructure / Cross-Cutting

| Module         | Package      | Responsibility                                                                                                                      |
| -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Kernel**     | `kernel`     | Shared primitives (must never depend on feature modules). Sub-packages: `context/`, `idempotency/`, `logging/`, `error/`, `outbox/` |
| **Common**     | `common`     | Cross-cutting infrastructure: security config, audit, storage, outbox, persistence, health, crypto                                  |
| **Projection** | `projection` | Admin read models. Sub-packages: `admin/`                                                                                           |

Modules marked "ports not yet extracted" may still expose a `publicapi/` package marker without a full CommandPort/QueryPort pair. That is an implementation detail, not permission to bypass the layering rules.

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

- `SystemInfoController` — system and health endpoint
- `SecurityScopeController` — security introspection
- `DevAuthController`, `TokenController`, `FacebookAuthController` — auth lifecycle helpers
- `LocationController`, `ServiceAreaController`, `CategoryController` — pure lookup/reference data
- `OutboxReplayController`, `AdminFeatureToggleController` — operator endpoints
- `OtpController` — dormant non-launch surface retained only as implementation residue; it must remain disabled and absent from launch UX

Any addition to the exception set requires deliberate justification in code review.

## 4. Data Architecture

This section inventories the backend data model in a way that stays aligned with the PRD.

Two rules apply:

This section inventories the launch-aligned backend data model. Non-launch residue in the physical schema is not normative for the active product baseline.

### 4.1 Launch-aligned domain schema inventory

For exact column definitions, use the Flyway migrations in `services/api/src/main/resources/db/migration/`.

#### Identity and access

- `users`: user identity, role, status, and session-facing auth state. Phase 1 launch authentication is Facebook OAuth only. Alternate auth enum values may exist physically but remain disabled for launch.
- `profiles`: profile data such as full name, avatar, bio, and aggregate completion/reputation fields. Public ratings remain hidden until the product threshold policy allows display.
- `verifications`: tasker verification submission, consent evidence, review decision, notes, and timestamps.

#### Marketplace and booking

- `tasks`: customer task record with admin-active category, pricing mode (`BUDGET` / `QUOTE`), structured intake answers, schedule, approximate/exact location fields, lifecycle status, and summary provenance. Launch summary generation is deterministic; any LLM-related provenance must remain dormant.
- `task_drafts`: draft posting state bound to a specific intake schema version.
- `categories`: admin-governed category catalog and active intake schema pointers.
- `category_schema_versions`: versioned structured-intake definitions with draft/canary/active lifecycle.
- `task_applications`: tasker applications, structured pricing response data, selection state, and response-window timestamps.
- `bookings`: confirmed work agreement between customer and selected tasker. Phase 1 lifecycle centers on confirmed, completed, canceled, disputed, and no-show outcomes. If physical schema includes monetization-oriented states or settlement modes, they remain dormant outside launch.
- `booking_intents`: the selected-tasker acceptance window between customer selection and booking confirmation.
- `booking_schedule_events`: immutable reschedule request, accept, decline, and expiry records.
- `booking_timeline_events`: auditable lifecycle and policy events such as reminders, status changes, and adjudication outcomes.
- `task_rescue_events`: auditable record of assisted distribution or operator rescue.

#### Communication and notifications

- `conversations`: platform-mediated post-confirmation conversation threads between booking participants.
- `messages`: message records with moderation-relevant metadata.
- `device_tokens`: mobile push tokens per user/device.
- `notification_log`: push/SMS delivery attempts and idempotent event keys.

#### Trust, disputes, and moderation

- `booking_reviews`: bilateral structured review submissions after reviewable terminal outcomes.
- `review_enforcement_cases`: reminder cadence and lock state for owed reviews.
- `tasker_reliability_scores`: derived reliability data used for ranking and trust operations.
- `tasker_badges`: trust badge assignments. Badge display remains subordinate to verification and threshold-based public reputation policy.
- `disputes`: booking-linked dispute records resolved through evidence-backed moderation.
- `dispute_evidence`: uploaded or written evidence artifacts tied to a dispute.
- `tasker_strikes`: trust escalation records for no-show, cancellation, or misconduct patterns.
- `audit_events`: admin and system audit trail.

#### Operational support

- `oauth_states`, `oauth_outage_events`: auth-session coordination and provider outage posture.
- `rate_limit_counters`: request-rate limiting state.
- `moderation_policy`: operator-controlled moderation threshold configuration.
- `booking_reliability_incidents`: auditable late-cancel and no-show incidents.
- `districts`, `tasker_service_districts`: district lookup and tasker service-area preferences used for targeting and diagnostics.
- `domain_outbox_events`, `event_idempotency`: durable async delivery and handler idempotency.
- `feature_toggles`: audited runtime toggles used for controlled rollout posture.

### 4.3 Read models and projections

Admin read models live in the `projection.admin` package.

No SQL views or materialized projections are currently part of the architecture contract. Admin read models are composed in Java through composition services backed by query ports.

### 4.4 Launch-aligned data flow patterns

1. **Structured task intake and posting**
   - Client loads the active category schema and binds the task draft to that schema version.
   - Server validates answers against the bound version, not against whatever becomes active later.
   - Server generates a deterministic summary before task creation. If template rendering fails, posting still succeeds with a canonical fallback summary.
2. **Application review, selection, and booking confirmation**
   - `POST /tasks` creates an open task.
   - `POST /tasks/{id}/applications` creates structured applications.
   - Customers can review the full application set, with ranking allowed but no hard comparison cap.
   - Customer selection creates a pending booking intent.
   - Booking becomes confirmed only when the selected tasker accepts within the four-hour acceptance window.
   - Expiry or explicit decline returns the task to selectable-applicant state without confirming a booking.
3. **Reschedule, cancellation, and no-show authority**
   - Only accepted in-app reschedule events change the canonical schedule.
   - Late-cancel and no-show timers always read the latest accepted in-app schedule.
   - No-show reminder triggers at scheduled start +30 minutes; no-show flag is allowed no earlier than +1 hour.
   - In-app activity in the trailing 30 minutes and accepted future reschedules block premature no-show adjudication.
4. **Completion, review gate, and disputes**
   - Completion sequence is: tasker marks complete → customer confirms or disputes → push notification reminder on silence where a device token exists → timeout auto-complete → ops fallback for edge cases.
   - Every reviewable terminal booking outcome creates bilateral review debt.
   - Customer posting and tasker application actions remain blocked until the owed review is submitted.
   - Disputes remain evidence-backed moderation flows, not escrow or payout flows.
5. **Assistance and rescue**
   - Phase 1 prefers native self-serve matching.
   - If a task receives no qualified application within the allowed window, the backend may record assisted distribution or manual rescue in `task_rescue_events`.
   - Any such intervention remains measurable and must not be counted as self-serve.
6. **Messaging and contact control**
   - Open-ended pre-booking chat is not part of the Phase 1 launch contract.
   - Post-confirmation in-app chat is the launch contact channel after the booking price is locked; it remains platform-mediated and available for admin review.
   - Exact address and any direct contact surface remain policy-controlled and unavailable before booking confirmation.
7. **Identity, verification, and outage posture**
   - Facebook OAuth is the only launch login path for new sessions.
   - If the provider is down, new authentication fails closed while valid sessions remain usable until expiry.
   - Tasker verification requires recorded consent and auditable state transitions.
8. **Category and admin governance**
   - Category activation, deactivation, linting, preview, canary, and rollback are admin-governed.
   - Verification queues, disputes, moderation actions, and rescue actions remain auditable operator surfaces.

### 4.5 Interpretation note for dormant implementation residue

This repository may still contain dormant tables, handlers, enums, or toggles for deferred marketplace features. Architecture documentation must never present those surfaces as launch behavior merely because they exist in code or schema.

## 5. API Design

### 5.1 Standards

- **Protocol**: REST over HTTP/2.
- **Format**: JSON.
- **Spec**: OpenAPI 3.0.3 (maintained contract).
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
  - Access token TTL: 15 minutes. Refresh token TTL: configurable (base default **14 days**; `dev` and `local` profiles override to 30 days).
  - `JwtTokenService` validates signature, expiry, issuer, audience, and token type on every parse.
  - Facebook OAuth is the only launch authentication method for new sessions.
  - Any non-launch auth residue must remain disabled and absent from launch UX.
- **Token revocation**: `TokenBlacklistService` holds an in-memory Caffeine cache of revoked `jti` values with a 15-minute TTL (matching access token lifetime). The logout endpoint (`POST /api/v1/auth/logout`) revokes the current access token's JTI. The blacklist is also consulted on STOMP `CONNECT` when messaging is enabled.
- **Authorization**:
  - `SecurityConfig` enforces role boundaries for launch surfaces: task posting and draft flows for customers, verification/service-area flows for taskers, booking/review/dispute/messaging flows for booking participants, and admin-only operator surfaces.
  - `JwtAuthenticationFilter` rejects `BANNED`, `SUSPENDED`, and `DELETED` users on authenticated requests, refresh-token rotation, and auth entry points.
  - Exact task address remains hidden until confirmed booking and is then visible only to the task owner, confirmed tasker, and authorized admin surfaces.
  - Raw direct contact details remain hidden unless an approved policy surface intentionally unlocks them. Phase 1 normal operation does not require direct raw contact exchange.
  - Liability disclaimer acceptance is required where booking confirmation policy says so and is enforced both at DTO validation and service level.

```claim symbol-exists
class: mn.tasky.common.security.JwtTokenService
```

```claim symbol-exists
class: mn.tasky.common.security.TokenBlacklistService
```

```claim endpoint
operationId: logout
method: POST
path: /api/v1/auth/logout
```

```claim symbol-exists
class: mn.tasky.common.config.SecurityConfig
```

```claim symbol-exists
class: mn.tasky.common.security.JwtAuthenticationFilter
```

- **Bean Validation**: `@Valid` + JSR-380 annotations enforce request-shape constraints on controller DTOs. Security-sensitive invariants also receive service-layer checks.
- **Rate limiting**:
  - General API traffic uses sliding-window limits backed by `rate_limit_counters`.
  - Auth endpoints and other abuse-sensitive edges must fail closed under configured limits.
  - Any non-launch auth endpoints that still exist in code must stay disabled and must not leak into launch UX or policy.
  - When messaging is enabled, STOMP `SEND` frames are rate-limited and subscriptions are authorization-checked.
- **Web frontend security**:
  - `Caddyfile.production` sets a `Content-Security-Policy` header: `default-src 'self'`, `script-src` allows Facebook CDN and the inline polyfill hash, `style-src` allows Google Fonts, `connect-src` allows `wss:` and `graph.facebook.com`.
  - Built JS/CSS chunks include `integrity` (SRI) attributes generated at build time.
- **Data privacy**:
  - Government ID images are stored in a private object store and served to admin only through short-lived presigned URLs.
  - Exact coordinates are stored in the database, while public task feeds expose only approximate or district-level location before booking confirmation.
  - Structured intake answers are retained and access-controlled according to platform policy.
- **Optional async polish posture**:
  - Runtime LLM assistance is not part of the Phase 1 posting path.
  - If async summary polish is ever introduced later, deterministic summary generation remains canonical and posting success must not depend on the model.
- **Input validation**: JSR-380 covers most DTOs. Any path that still performs service-level validation only should be treated as implementation debt, not as the preferred contract.

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

- **Category intake contract**:
  - Category endpoints must expose `intake_enabled`, `intake_schema_version`, and the active schema payload needed by posting clients.
  - Launch task creation is category-specific and uses the current admin-active category catalog. Generic free-form posting is not the primary creation path.
- **Draft contract**:
  - Draft create/update APIs persist the schema version bound at form start.
  - Final task submission validates against the bound schema version and returns field-level errors for missing or invalid required answers.
- **Location eligibility contract**:
  - Final task submission validates coordinates against the Ulaanbaatar service area through the location public query port before persistence.
  - The launch district-centroid provider uses active UB district centroid bounds as a deterministic fail-closed approximation until polygon-backed service-area data exists.
- **Summary contract**:
  - Task submission performs deterministic scope summary generation.
  - On summary-generation failure, the server still returns success with a canonical fallback summary and records the failure event.
- **Booking contract**:
  - Customer selection creates a pending booking intent first.
  - Booking is confirmed only after the selected tasker accepts within the active four-hour response window.
  - Expired or explicitly declined selections do not create bookings and return the task to applicant-review state.
  - Applicant ranking is allowed, but the customer remains free to inspect and choose across the full application set.
  - No-show policy is deterministic: reminder at `+30m`, no-show flag eligibility at `+1h`, trailing 30-minute activity lookback protection, and accepted-reschedule precedence over earlier schedules.
  - Booking confirmation copy and payloads must communicate that the locked price and intake scope are the baseline agreement. Materials, supplies, vehicles, or post-confirmation scope changes are participant agreements recorded through platform-mediated chat or support evidence, not platform payment protection.
  - Launch lifecycle transitions align with the PRD: tasks move through open/assigned/completed-or-terminal states, and bookings move through confirmed/completed-or-terminal states without requiring payment-gated intermediates.
- **Pricing contract**:
  - Every Phase 1 task uses exactly one of the two launch pricing modes: `I have a budget` or `I want quotes`.
  - Structured application pricing must support budget acceptance for budget-mode tasks and one quote submission for quote-mode tasks. Counter-offers are not part of the Phase 1 budget flow.
- **Trust contract**:
  - Disputes may be opened during active bookings and for 24 hours after completion.
  - Evidence-backed moderation remains the dispute model for Phase 1.
  - Dispute evidence grace auto-closes for insufficient evidence 24 hours after the evidence reminder when no evidence is added.
  - Review reminders follow the immediate, 24-hour, and 72-hour cadence, and the next post/apply action remains gated on owed review completion.
  - Public trust presentation prioritizes verification and trust badges, while ratings remain hidden until at least three customer-to-tasker reviews exist.
- **Admin contract**:
  - Admin can manage verification queues, disputes, moderation actions, rescue actions, category schemas, and feature toggles with audit trails.
  - Category management supports lint, preview, activate, deactivate, canary, and rollback operations.

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

- `DomainEventOutboxService` writes durable events to `domain_outbox_events` and publishes them through `EventRelayPublisher` when broker mode is enabled.
- `OutboxRelayScheduler` and `OutboxRelayService` recover failed or pending publishes and move events through the retry path with backoff and bounded attempts.
- Broker publish failure does not roll back the domain transaction because the durable outbox row already exists.
- `OutboxReplayController` can reset replayable failures back to `PENDING` so the relay can pick them up again.
- `EventWorkerConsumer` dispatches broker-delivered events to registered `EventHandler` implementations.
- Handler idempotency is enforced through `WorkflowIdempotencyGuard` rather than broker-level deduplication.
- This async path backs launch-critical side effects such as notifications, reminders, analytics events, and recovery workflows.

### 6.4 Feature Toggles

- Feature toggles are stored in `feature_toggles` and must be fully audited.
- A toggle may control runtime wiring, but toggle presence does **not** change product scope on its own.
- Any non-launch surface must remain disabled and absent from launch UX until the governing docs change.
- Any activation that changes product behavior must update the PRD, maintenance policy, contracts, tests, and implementation together.

## 7. Backend Testing

- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`.
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`.
- `@DisplayName` for scenario-backed tests must include the scenario ID (e.g. `"SCN-TASK-001: ..."`) so that `sync-registry.sh` can discover it. Multiple scenario IDs in a single display name are supported (e.g. `"SCN-TASK-009 SCN-SMOKE-004: ..."`). Non-scenario domain-unit tests (no SCN mapping) may use descriptive display names without the SCN prefix.
- Check `tests/registry.yaml` for existing scenarios before writing tests. Read `tests/scenarios/<domain>.md`.
- If no scenario covers the behavior, stop and report the gap unless you are the designated scenario curator for the current execution brief.
- Scenario curation is single-owner work. Only the designated scenario curator for the current execution brief may edit `tests/scenarios/**`; all implementation agents must otherwise treat it as read-only.
- Scenario curation must reconcile the active baseline from `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, active `docs/openapi/**`, and active `docs/design/**` before test-writing slices begin.
- Obsolete tests tied to removed or future-phase behavior may be deleted once the active scenario set no longer covers that behavior.
- After scenario curation or writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`.
- Never use `@DirtiesContext`.
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap.

## 8. Verification Commands

### Gradle gates (local / CI)

| Gate       | Command                                                                                                      | Purpose                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Smoke      | `./gradlew gateSmoke`                                                                                        | Fast local confidence                                |
| Regression | `./gradlew gateRegression`                                                                                   | Extended or nightly coverage                         |
| Full       | `./gradlew gateFull`                                                                                         | Full suite including PIT mutation testing            |
| Slice      | `./gradlew jacocoSliceReport jacocoSliceCoverageVerification -PcoveragePackages=mn.tasky.auth,mn.tasky.task` | Scoped coverage report + 80% floor for a rehab slice |

### CI enforcement (actual wiring)

| CI workflow              | What it runs                                                                                          | When                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `quality-gates.yml`      | `pnpm repo:docs:check` + `:services:api:check` + `jacocoTestCoverageVerification` + `openApiValidate` | pushes to `main` / `staging`                     |
| `release-gate.yml`       | migration safety, rollback readiness, performance smoke, E2E smoke                                    | deploy                                           |
| `nightly-regression.yml` | `gateRegression` + `openApiValidate`                                                                  | manual dispatch while nightly schedule is paused |

```claim workflow
filename: quality-gates.yml
name: quality-gates
triggers: [push, workflow_dispatch]
```

```claim workflow
filename: release-gate.yml
name: release-gate
triggers: [workflow_dispatch, workflow_call]
```

```claim workflow
filename: nightly-regression.yml
name: nightly-regression
triggers: [workflow_dispatch]
```

`gateSmoke` is a local smoke gate, not the only merge gate. The merge gate runs the broader `check`, and release and
nightly gates are governed by their respective workflows.
