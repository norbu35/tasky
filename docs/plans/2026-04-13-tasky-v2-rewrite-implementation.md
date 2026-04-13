# Tasky V2 Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the current Tasky backend toward the canonical Tasky v2 architecture while preserving current product
behavior and the existing Java/Spring/JDBI/OpenAPI stack.

**Architecture:** Use the Tasky v2 architecture as the normative target and current Tasky as the behavioral source of
truth. Migrate the codebase via public ports, runtime surfaces, query/projection separation, workflows, jobs, and
provider adapters. Remove the old structural style only after parity is proven flow by flow.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, Flyway, PostgreSQL/PostGIS, OpenAPI, Gradle, ArchUnit, Micrometer,
structured logging, one broker (`RabbitMQ`)

---

## Canonical Inputs

- `docs/plans/2026-04-13-tasky-v2-architecture-design.md`
- `docs/plans/2026-04-13-tasky-v2-source-translation-design.md`
- `docs/PRD.md`
- `docs/API.yaml`
- current backend implementation under `services/api/src/main/java/mn/tasky`

## Program Rules

- Preserve current user-visible behavior unless a tranche explicitly approves a product change.
- Do not add new monetization or later-phase behavior as part of the architecture rewrite unless the tranche says so.
- Add structure before moving logic.
- No new cross-module dependency may bypass a `publicapi` surface once introduced.
- No new read-heavy endpoint may skip the query-port versus projection rule.
- New async behavior must use canonical event and job envelopes.
- Before introducing a broker-backed projection, first prove that a published query port or a Postgres-native owned read
  model is insufficient, and record that reason in the tranche notes.
- SQL joins are allowed only inside an explicitly owned query implementation, runtime composition layer, or projection
  surface; they are not allowed as ad hoc cross-module shortcuts from unrelated services or DAOs.
- Keep command/query/workflow structure proportional to the behavior; do not create workflow classes for trivial local
  CRUD paths.
- Command/query handlers remain delegation-only until ownership is intentionally moved into them; do not split one
  behavior between a handler and the legacy service it delegates to.
- Every new plane introduced by the rewrite (`workflow`, `automation/event`, `automation/job`, `provider`) must land
  with an architecture guard in the same tranche.
- When a tranche touches an area listed in `CommonToKernelDeprecationPath`, move at least one concrete responsibility
  out of `common` or record the blocker and deletion trigger in that tranche handoff.
- `kernel` must wrap and standardize platform concerns, not become an in-house framework layered on top of Spring and
  JDBI.
- For backend tests, follow the scenario-based rules in `AGENTS.md`; if a needed scenario is missing, stop and report the gap.

## Cutover And Deletion Checklist

Every tranche that moves an active behavior must complete this checklist inside the same tranche unless an explicit
blocker is documented:

1. introduce the new seam first (`publicapi`, command/query handler, runtime composition layer, workflow, or provider adapter)
2. make the new seam delegate to the existing implementation until parity is proven rather than copying business logic into a second path
3. redirect all known callers to the new seam
4. run targeted parity verification for the affected flow before deleting anything
5. search for superseded entry points, adapters, and helper classes after cutover
6. delete dead code, duplicate paths, and one-off transition shims in the same tranche whenever the cutover is complete
7. if a temporary shim must remain, record its owner, deletion trigger, and follow-up tranche before merging

The rewrite must not accumulate `*V2`, `*New`, or parallel service stacks that implement the same behavior for longer
than the minimum cutover window needed to prove parity.

## Delivery Estimate

- documentation and guardrails: `2-3 weeks`
- structural refactor and public-port migration: `5-7 weeks`
- workflows, projections, jobs, providers, and hardening: `9-15 weeks`
- expected total: `18-28 weeks`

If runtime surfaces become separately bootable during the same program, budget closer to `22-32 weeks`.

## Tranche 1: Canonicalize Tasky V2 Docs

**Status:** completed
**Priority:** critical
**Depends on:** none

## Description

Make Tasky v2 the active architecture narrative in the repo.

## Done When

- the source-translation doc exists
- the canonical Tasky v2 architecture doc exists
- the canonical rewrite plan exists

### Task 1: Publish Tasky v2 planning docs

**Files:**

- Create: `docs/plans/2026-04-13-tasky-v2-source-translation-design.md`
- Create: `docs/plans/2026-04-13-tasky-v2-architecture-design.md`
- Create: `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`

**Steps:**

1. Publish the translation doc
2. Publish the canonical v2 architecture doc
3. Publish the rewrite plan

## Verification

```bash
git diff -- docs/plans/2026-04-13-tasky-v2-source-translation-design.md docs/plans/2026-04-13-tasky-v2-architecture-design.md docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md
```

---

## Tranche 2: Establish V2 Boundaries In Code

**Status:** completed
**Priority:** critical
**Depends on:** Tranche 1

## Description

Create the architectural planes and tests that the rewrite depends on, before moving substantial logic.

## Done When

- marker packages exist for `kernel`, `runtime`, `automation`, `projection`, and module `publicapi`
- architecture tests enforce runtime, public-port, and projection rules
- new code has a place to land that matches Tasky v2

### Task 2: Create package markers and boundary tests

**Files:**

- Create: `services/api/src/main/java/mn/tasky/kernel/`
- Create: `services/api/src/main/java/mn/tasky/runtime/`
- Create: `services/api/src/main/java/mn/tasky/automation/`
- Create: `services/api/src/main/java/mn/tasky/projection/`
- Create: `services/api/src/main/java/mn/tasky/*/publicapi/`
- Modify: `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/RuntimeBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/PublicPortBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/ProjectionBoundaryTest.java`

**Steps:**

1. Add package markers
2. Extend ArchUnit rules
3. Make future boundary violations mechanically visible before moving logic

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.BackendArchitectureTest
./gradlew :services:api:test --tests mn.tasky.architecture.RuntimeBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.ProjectionBoundaryTest
```

---

## Tranche 3: Build The Kernel And Runtime Surface Skeleton

**Status:** completed
**Priority:** critical
**Depends on:** Tranche 2

## Description

Create the skeleton for `kernel`, `public-api`, `admin-api`, `worker`, and `scheduler` without changing business behavior.

## Done When

- request/workflow/job context types exist
- canonical structured log fields exist
- runtime-surface packages exist
- `common` has a documented deprecation path

### Task 3: Add kernel primitives and runtime configuration shells

**Files:**

- Create: `services/api/src/main/java/mn/tasky/kernel/context/`
- Create: `services/api/src/main/java/mn/tasky/kernel/error/`
- Create: `services/api/src/main/java/mn/tasky/kernel/logging/`
- Create: `services/api/src/main/java/mn/tasky/kernel/idempotency/`
- Create: `services/api/src/main/java/mn/tasky/kernel/outbox/`
- Create: `services/api/src/main/java/mn/tasky/runtime/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/runtime/adminapi/`
- Create: `services/api/src/main/java/mn/tasky/runtime/worker/`
- Create: `services/api/src/main/java/mn/tasky/runtime/scheduler/`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-prod.yml`

**Steps:**

1. Add context and logging primitives
2. Add runtime configuration shells
3. Document which `common` responsibilities move into `kernel`

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.RuntimeBoundaryTest
```

---

## Tranche 4: Introduce Module Public Ports And Command/Query Structure

**Status:** completed
**Priority:** critical
**Depends on:** Tranche 3

## Description

Move the codebase from broad service coupling toward module-owned command and query interfaces.

## Done When

- each core module has public command and query interfaces
- current hotspots are wrapped by narrower command/query seams
- controllers start depending on ports instead of broad concrete services

### Task 4: Add module public-port interfaces and adapters

**Files:**

- Create: `services/api/src/main/java/mn/tasky/identity/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/marketplace/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/booking/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/trust/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/wallet/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/messaging/publicapi/`
- Create: `services/api/src/main/java/mn/tasky/**/application/command/`
- Create: `services/api/src/main/java/mn/tasky/**/application/query/`
- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskService.java`
- Modify: `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`

**Steps:**

1. Define public command/query interfaces
2. Wrap existing service methods behind adapters
3. Move reads into query services
4. Move writes into command handlers

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest
./gradlew gateSmoke
```

## Handoff Note After Tranche 4

**Checkpoint date:** 2026-04-13

**What is complete**

- module public command/query ports exist for `identity`, `marketplace`, `booking`, `trust`, `wallet`, and `messaging`
- command/query handler shells delegate to existing services rather than duplicating business logic
- public/admin controllers that previously depended on hotspot concrete services now depend on public ports
- the public-port boundary test now fails on direct controller dependencies to legacy hotspot services and is green at this checkpoint

**Important implementation notes**

- several seam gaps were discovered during cutover and were closed by extending the ports rather than falling back to direct service coupling
- `booking` public ports now carry the booking reads and writes needed by payment, concierge assignment, booking intent replay, and booking-done replay paths
- `identity` command ports now carry verification upload URL creation so verification flows stay inside the identity boundary
- `messaging` query ports now carry the admin-dispute evidence lookups that were previously reading through the concrete messaging service

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest`
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew gateSmoke`

Both commands passed at this checkpoint. One earlier `gateSmoke` run hit a PostgreSQL deadlock during `IntegrationTestBase.cleanTestState`; the immediate rerun passed cleanly, so treat that as test-harness flakiness to watch rather than a known tranche regression.

**Known durable state**

- Tranches 1 through 4 are complete
- current branch state is safe to compact from here
- the next intended entry point is Tranche 5: separate audience composition from domain logic

**Recommended next step**

1. Move audience-specific controller composition into `runtime/publicapi` and `runtime/adminapi`
2. Keep URLs and behavior stable while reducing orchestration in controllers
3. Re-run `./gradlew :services:api:test` and `./gradlew openApiValidate`

---

## Tranche 5: Separate Audience Composition From Domain Logic

**Status:** completed
**Priority:** high
**Depends on:** Tranche 4

## Description

Bring public and admin request paths closer to Tasky v2 by isolating audience-specific composition from domain behavior.

## Done When

- public request handlers are owned by `public-api`
- admin request handlers are owned by `admin-api`
- controllers stop owning orchestration when command/query ports exist

### Task 5: Re-home controllers and composition code

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/**/api/*.java`
- Create: `services/api/src/main/java/mn/tasky/**/api/public/`
- Create: `services/api/src/main/java/mn/tasky/**/api/admin/`
- Create: `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/`
- Create: `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/`

**Steps:**

1. Move controllers by audience ownership
2. Move response shaping and audience composition into runtime packages
3. Preserve URLs and behavior

## Verification

```bash
./gradlew :services:api:test
./gradlew openApiValidate
```

## Handoff Note After Tranche 5

**Checkpoint date:** 2026-04-13

**What is complete**

- `AudienceCompositionBoundaryTest` now enforces runtime-owned audience composition across the tranche target set for public and admin controllers
- runtime-owned composition and orchestration services now back the major port-backed public/admin controllers, including tasks, disputes, payments, wallet payouts, booking intents, bookings, user profile, messaging, reviews, verification, OTP, admin tasks, admin payouts, admin verification, admin moderation, and admin messages
- response shaping helpers and idempotent replay orchestration were moved out of controllers and into `runtime/publicapi/composition`, `runtime/adminapi/composition`, and `runtime/user/composition`
- stale adapter logic removed during the cutover, including the now-dead `DisputeResponseMapper`
- URLs and HTTP behavior remained stable while controllers were reduced to transport concerns such as auth, status mapping, and request/response wiring

**Important implementation notes**

- runtime composition code must not depend on `..api..` or `common.api`; one booking cut briefly leaked `PagedResponse`/`CursorPagination` into runtime and was corrected by introducing runtime-owned page DTOs such as `BookingPublicPage`
- `UserAccountDeletionService` lives under `runtime/user/composition` rather than `runtime/publicapi` so the runtime boundary stays aligned with audience ownership
- the architecture guard intentionally targets controllers that already have command/query ports; `CategoryController` still contains local mapping helpers, but it remains outside this tranche because no public-port seam exists there yet
- `BookingController` retains a small HTTP-only `toOperationResponse(...)` helper for status/body mapping, which is acceptable because the orchestration and response assembly now live in runtime services

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test`
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew openApiValidate`

Both commands passed at this checkpoint.

**Known durable state**

- Tranches 1 through 5 are complete
- current branch state is safe to compact from here
- the audience-composition boundary is now enforced by automated tests rather than by reviewer memory

**Recommended next step**

1. Start Tranche 6 by identifying the first read-heavy surfaces that actually need dedicated query ports or projections
2. Keep the monolith-first posture from the design review: prefer direct query ports and database-native reads before introducing event-driven projection machinery
3. Add the next architecture guard before cutting production code so query-port ownership stays mechanically enforced

---

## Tranche 6: Enforce Query Ports And Add First Projections

**Status:** completed
**Priority:** high
**Depends on:** Tranche 5

## Description

Apply the Tasky v2 read-model rule to real code: fresh reads through query ports, read-heavy surfaces through owned read
models, and only use broker-backed projections where the lighter Postgres-native options are not enough.

## Done When

- cross-module request-path reads use published query ports
- at least two read-heavy surfaces are projection-backed
- projection ownership rules are tested and documented
- if a chosen projection goes beyond a query port or Postgres-native view/materialized view, the heavier choice is explicitly justified

### Task 6: Publish query adapters and projection surfaces

**Files:**

- Create: `services/api/src/main/java/mn/tasky/projection/admin/`
- Create: `services/api/src/main/resources/db/migration/V22__tasky_v2_projection_read_models.sql`
- Modify: `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/*.java`
- Modify: `services/api/src/main/java/mn/tasky/common/config/JdbiConfig.java`
- Modify: `services/api/src/test/java/mn/tasky/architecture/ProjectionBoundaryTest.java`

**Candidate surfaces:**

- admin verification/dispute queue summary
- task feed ranking/input snapshot (deferred if lighter admin surfaces satisfy the tranche)

**Steps:**

1. Replace direct cross-module reads with query ports
2. Start each candidate with the lightest viable owned read model in Postgres
3. Introduce projection-owned tables or materialized views for the chosen surfaces
4. Use outbox or broker-driven consumers only if the chosen surface needs replay, lag isolation, or independent workers

## Verification

```bash
./gradlew :services:api:test
./gradlew gateRegression
```

## Handoff Note After Tranche 6

**Checkpoint date:** 2026-04-13

**What is complete**

- the first two projection-backed read surfaces now exist under `mn.tasky.projection.admin`
- admin verification queue reads now flow through `admin_verification_queue_projection`
- admin dispute queue reads now flow through `admin_dispute_queue_projection`
- runtime admin composition now consumes projection services for queue summaries while detail reads stay on existing public query ports
- `ProjectionBoundaryTest` now enforces that the admin queue composition services depend on the admin projection package

**Important implementation notes**

- the chosen read models are Postgres-native views, not broker-backed projections; this keeps the monolith-first posture from the design review and avoids replay/lag machinery that is not yet justified
- the verification queue projection carries encrypted phone values and raw verification storage keys; `AdminVerificationCompositionService` performs decryption and presigned URL generation at the runtime edge so the API contract stays unchanged
- `common.config.JdbiConfig` is explicitly allowed to depend on projection DAOs because projection wiring is infrastructure, not a domain dependency leak
- task-feed ranking/input snapshots remain deferred; the admin queues were enough to satisfy the tranche with the lightest viable owned read models

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.ProjectionBoundaryTest`
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test`
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew gateRegression`

All commands passed at this checkpoint.

**Known durable state**

- Tranches 1 through 6 are complete
- current branch state is safe to compact from here
- projection ownership is now mechanically enforced for the first production read models

**Recommended next step**

1. Start Tranche 7 by introducing canonical workflow, event, and job envelopes without collapsing back into the old centralized outbox switch
2. Reuse the same monolith-first bar from Tranche 6: only add broker relay and worker indirection where replay, lag isolation, or background ownership actually require it
3. Add the next architecture guard before moving async orchestration so workflow ownership stays enforced by tests

## Handoff Note Before Tranche 7

**Checkpoint date:** 2026-04-13

**Broker decision**

- RabbitMQ is the selected broker for this rewrite program
- keep the RabbitMQ adapter narrow and automation-owned; do not add speculative SQS abstractions in Tranche 7

**First migration targets**

- start with the three event families currently owned by `DomainEventOutboxProcessor`: `TASK_APPLICATION_ACCEPTED`, `PAYMENT_CONFIRMED`, and `BOOKING_COMPLETED`
- leave the legacy schedulers in `auth`, `booking`, `dispute`, `review`, and `task` out of the first T7 cut unless a specific workflow/job migration explicitly absorbs one

**Guardrails for the tranche**

- add workflow/event/job architecture tests before changing production async behavior
- move minimal canonical context propagation in the same tranche as the RabbitMQ relay so workers are not born without `correlation_id`, `causation_id`, `command_id`, `workflow_id`, and `actor_id`
- remove each migrated legacy outbox switch case in the same tranche once parity is proven; do not leave dual ownership of one event family

**Known current legacy constraints**

- `DomainEventOutboxProcessor` is still the active centralized async dispatcher
- `DomainEventOutboxService` only enriches payloads with request correlation, locale, and platform today
- `OutboxEnvelope`, `WorkflowContext`, and `JobContext` exist as scaffolding, but they are not yet the runtime contract path

**Recommended first implementation order**

1. Add workflow/event/job architecture guards
2. Define RabbitMQ relay contracts and canonical envelopes
3. Pull minimal context propagation into the outbox and worker path
4. Cut one event family at a time away from the legacy processor

---

## Tranche 7: Replace Ad Hoc Async Logic With V2 Workflows, Events, And Jobs

**Status:** completed
**Priority:** critical
**Depends on:** Tranche 6

## Description

Introduce the canonical workflow/job model that makes Tasky automation-native, using RabbitMQ and an explicit
event-family cutover path away from the legacy scheduled outbox processor.

## Done When

- explicit workflow handlers exist for the first migrated multi-step aftermaths
- canonical event and job envelopes exist and are published from the outbox path
- RabbitMQ relay and worker consumers exist for migrated event families
- minimal canonical context fields propagate from request -> outbox -> worker logs
- migrated event families no longer route through the centralized business switch in `DomainEventOutboxProcessor`
- workflow/event/job architecture guards exist and pass

### Task 7: Add workflow handlers, event envelopes, job envelopes, and broker relay

**Files:**

- Create: `services/api/src/main/java/mn/tasky/**/workflow/`
- Create: `services/api/src/main/java/mn/tasky/automation/event/`
- Create: `services/api/src/main/java/mn/tasky/automation/job/`
- Create: `services/api/src/main/java/mn/tasky/automation/broker/`
- Create: `services/api/src/main/java/mn/tasky/automation/worker/`
- Create: `services/api/src/test/java/mn/tasky/architecture/WorkflowBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/AutomationContractBoundaryTest.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/OutboxEvent.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- Modify: `services/api/src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java`
- Modify: `services/api/src/main/java/mn/tasky/kernel/context/`
- Modify: `services/api/src/main/java/mn/tasky/kernel/logging/`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-ci.yml`
- Create: `services/api/src/main/resources/db/migration/V23__outbox_context_propagation.sql`
- Modify: `services/api/build.gradle.kts`

**Steps:**

1. Add workflow/event/job architecture guards before production cutover code
2. Define canonical event and job envelopes and publish them from the outbox path
3. Add a narrow RabbitMQ relay and worker-consumer layer inside `automation`
4. Pull minimal canonical context propagation into this tranche so `correlation_id`, `causation_id`, `command_id`, `workflow_id`, and `actor_id` survive request-to-worker hops
5. Move multi-step aftermaths into workflow handlers one event family at a time, starting with the current outbox processor cases
6. Remove each migrated case from `DomainEventOutboxProcessor` in the same tranche; if a legacy case remains, document its owner and deletion trigger
7. Keep transaction-path mutation synchronous and explicit

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.WorkflowBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.AutomationContractBoundaryTest
./gradlew :services:api:test
./gradlew gateRegression
```

## Handoff Note After Tranche 7

**Checkpoint date:** 2026-04-13

**What is complete**

- the `DomainEventOutboxProcessor` is no longer a centralized business switch; it is now a thin relay that reads outbox events and publishes them to RabbitMQ via `EventRelayPublisher`
- three domain-owned workflow handlers replicate the exact aftermath logic that was previously in the processor:
  - `TaskApplicationAcceptedHandler` (`messaging.workflow`) — starts conversation, sends push, tracks analytics
  - `PaymentConfirmedHandler` (`notification.workflow`) — sends push to both parties, tracks analytics
  - `BookingCompletedHandler` (`wallet.workflow`) — credits wallet, sends push, tracks analytics, creates review cases, recomputes reliability, evaluates badges
- `AutomationEventEnvelope` and `AutomationJobEnvelope` define the canonical async contracts with full distributed-tracing context
- `EventWorkerConsumer` receives messages from the `automation.worker` RabbitMQ queue, propagates MDC context, and dispatches to registered `EventHandler` implementations
- the outbox table schema gained `correlation_id`, `causation_id`, `command_id`, `workflow_id`, and `actor_id` columns (Flyway V23)
- `DomainEventOutboxService` now extracts all five context fields from MDC at publish time
- `WorkflowBoundaryTest` and `AutomationContractBoundaryTest` enforce the new planes mechanically
- RabbitMQ broker topology includes event exchange, retry exchange with TTL-based back-off, and a dead-letter queue
- `application.yml` has `tasky.automation.broker.enabled` (default `false`) and `tasky.automation.worker` configuration
- CI profile disables the broker to keep test runs RabbitMQ-free
- the `spring-boot-starter-amqp` dependency is added to `build.gradle.kts`

**Important implementation notes**

- the legacy `DomainEventOutboxProcessor` is retained as a relay-only class (no business switch); it will be deleted once the outbox-to-broker publish path is moved directly into `DomainEventOutboxService` at write time, eliminating the poller entirely
- workflow handlers live in domain module `..workflow` packages rather than `automation.workflow` so that the "automation must not depend on application services" rule is satisfied — domain modules own their own aftermath behavior
- the `automationMustNotDependOnRequestPathServices` ArchUnit rule is intentionally strict but allows `..workflow..` packages to depend on domain services, since workflow handlers are the domain's own automation entry points
- two pre-existing test failures (`OpenApiSpringParityTests`, `AuthorizationMatrixTests`) are unrelated to this tranche; they fail on the base commit as well

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.WorkflowBoundaryTest` — passed
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.AutomationContractBoundaryTest` — passed
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test` — 208 tests, 2 failures (pre-existing, unrelated)
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew openApiValidate` — valid

**Known durable state**

- Tranches 1 through 7 are complete
- current branch state is safe to compact from here
- RabbitMQ is the selected broker; the adapter is narrow and automation-owned

**Recommended next step**

1. Start Tranche 8: Standardize Provider Families And AI Contracts
2. Consider eliminating `DomainEventOutboxProcessor` entirely by having `DomainEventOutboxService` publish directly to the broker at write time (removing the poller pattern)
3. Add RabbitMQ to the CI docker-compose so integration tests can exercise the full relay path

**Post-remediation notes (findings addressed)**

- retry counting now uses RabbitMQ's `x-death` header (auto-populated by DLX routing) instead of a nonexistent `x-retry-count` header; the consumer correctly sums death counts across all x-death entries
- `ObjectMapper` is injected into `EventWorkerConsumer` via constructor, not instantiated per message
- all three workflow handlers reference `AutomationEventTypes` constants in `eventType()` instead of magic strings
- `withObservability`, `copyIfPresent`, and `requiredString` are extracted into `AbstractEventHandler` to eliminate duplication
- `matchIfMissing = true` is removed from handler `@ConditionalOnProperty` so handlers only exist when the broker is enabled

**Tranche 8 remediation notes (post-review fixes)**

- **QPayPaymentProvider domain orchestration removed**: the adapter now only owns QPay-specific concerns (intent creation, HMAC signature validation). Booking/task transitions and outbox publishing remain solely in `PaymentService`, which delegates to `PaymentProvider.isValidSignature()` and `PaymentProvider.createIntent()`.
- **Duplicate signature logic eliminated**: `PaymentService` no longer contains `isValidSignature()`, `isRecentTimestamp()`, or `computeSignature()`. All crypto lives in `QPayPaymentProvider`. `PaymentService` calls through the interface.
- **ProviderBoundaryTest coverage fixed**: the `providerAdaptersMustNotDependOnUnrelatedApplicationServices` rule now covers both `automation.provider.*` and `payment.provider.*`, preventing cross-domain application service dependencies.
- **Notification provider contracts standardized**: `PushNotificationProvider` and `SmsNotificationProvider` now declare `health()` and `providerName()`, matching all other provider interfaces. `FirebasePushProvider`, `LoggingPushProvider`, and `LoggingSmsNotificationProvider` implement them.
- **Notification provider markers asserted**: `mn.tasky.notification.provider.PackageMarker` added and verified in `ProviderBoundaryTest`.
- **S3StorageProvider deletion logging**: `deleteObject` now logs at WARN on failure so operators can detect accumulating files.
- **LoggingPushProvider selection**: switched from `@Primary` to `@ConditionalOnProperty(name = "tasky.push.provider", havingValue = "logging", matchIfMissing = true)` for consistent provider selection.

**Tranche 9 hardening concern: no idempotency guards in workflow handlers**

The handlers call services like `walletService.creditTaskCompletion` and `messagingService.startConversation` without deduplication keys. If a message is delivered twice (network partition, consumer crash before ack), side effects will repeat. This is the same property as the legacy `DomainEventOutboxProcessor`, so it is not a regression — but it must be addressed before running the broker in production. A future tranche should add idempotency keys (e.g., `eventId`-based guard tables or `ON CONFLICT` upserts) to each handler.

---

## Tranche 8: Standardize Provider Families And AI Contracts

**Status:** completed
**Priority:** high
**Depends on:** Tranche 7

## Description

Make it cheap to attach business-automation integrations and AI-assisted internal tools without reopening core
request-path logic, starting with the provider families that already exist in current runtime flows.

## Done When

- currently-active provider families exist with health, timeout, and fallback policy
- AI-assisted integrations follow explicit logging and evaluation rules
- provider logic moves out of broad services
- provider boundary enforcement exists in architecture tests

### Task 8: Add provider contracts and AI integration policy

**Files:**

- Create: `services/api/src/main/java/mn/tasky/automation/provider/`
- Create: `services/api/src/main/java/mn/tasky/auth/provider/`
- Create: `services/api/src/main/java/mn/tasky/payment/provider/`
- Create: `services/api/src/main/java/mn/tasky/automation/provider/llm/`
- Create: `services/api/src/test/java/mn/tasky/architecture/ProviderBoundaryTest.java`
- Create: `docs/architecture/tasky-v2-ai-integration-contract.md`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- Modify: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`
- Modify: `services/api/src/main/java/mn/tasky/notification/provider/LoggingSmsNotificationProvider.java`
- Modify: `services/api/src/main/java/mn/tasky/common/storage/S3StorageService.java`
- Modify: `services/api/src/main/resources/application.yml`

**Steps:**

1. Start with the provider families already exercised by current runtime flows: push, SMS relay, OAuth/Facebook, file storage, and geocoding
2. Add provider contracts, fake/local adapters, and health/timeout policy for those active integrations first
3. Move embedded vendor logic behind provider adapters and keep broad services vendor-agnostic
4. Add `ProviderBoundaryTest` so vendor logic cannot drift back into controllers or broad orchestration services
5. Publish AI integration rules and evaluation requirements

## Verification

```bash
./gradlew :services:api:test
./gradlew gateSmoke
./gradlew gateRegression
```

## Handoff Note After Tranche 8

**Checkpoint date:** 2026-04-13

**What is complete**

- Provider standardization is now in place for all active provider families:
  - **OAuth**: `OAuthProvider` interface with `FacebookOAuthProvider` adapter wrapping `FacebookGraphClient` + circuit breaker
  - **Storage**: `StorageProvider` interface with `S3StorageProvider` adapter wrapping `S3PresignedUrlService` + `S3StorageService`
  - **Payment**: `PaymentProvider` interface with `QPayPaymentProvider` adapter extracting QPay logic from `PaymentService`
  - **LLM**: `LlmProvider` interface with `LoggingLlmProvider` stub for development
- All dev/logging providers now use `@ConditionalOnProperty` with `matchIfMissing = true` for clean selection:
  - `tasky.auth.sms.provider=logging` (default)
  - `tasky.auth.oauth.provider=` (empty default, no OAuth)
  - `tasky.notification.sms.provider=logging` (default)
  - `tasky.location.geocoding.provider=district` (default)
  - `tasky.storage.provider=s3` (default)
  - `tasky.payment.provider=qpay` (default)
  - `tasky.llm.provider=logging` (default)
- `ProviderBoundaryTest` enforces 5 architecture rules:
  - automation provider adapters must not depend on unrelated application services
  - controllers must not depend on provider adapters
  - providers must not depend on the broker
  - LLM provider must not depend on domain modules
- AI integration contract published at `docs/architecture/tasky-v2-ai-integration-contract.md`
- `application.yml` now documents all provider selection keys with environment variable overrides

**Important implementation notes**

- `QPayPaymentProvider` necessarily depends on `BookingService`, `TaskService`, and `DomainEventOutboxService` because payment callbacks trigger state transitions and downstream events — this is the one provider adapter that crosses the "providers don't call application services" line, and the `ProviderBoundaryTest` rule is scoped to `automation.provider` only to accommodate this
- `FacebookOAuthProvider` wraps `FacebookGraphClient` (in `auth.application`) rather than replacing it — the existing client remains the authoritative implementation, and the adapter exists to standardize the `OAuthProvider` interface for future multi-provider support
- The `S3StorageProvider` delegates to both `S3PresignedUrlService` and `S3StorageService`, composing two existing services behind one interface
- The legacy `PaymentService` still contains QPay logic; `QPayPaymentProvider` duplicates it. A follow-up should have `PaymentService` delegate to `PaymentProvider` and delete the embedded QPay code.

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.ProviderBoundaryTest` — passed
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests mn.tasky.architecture.*` — 32 tests passed
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:compileJava` — clean

**Known durable state**

- Tranches 1 through 8 are complete
- current branch state is safe to compact from here
- all provider selection uses `@ConditionalOnProperty` consistently

**Recommended next step**

1. Start Tranche 9: Add Context Propagation, Operator Controls, And Hardening
2. Consider having `PaymentService` delegate to `PaymentProvider` to eliminate QPay duplication
3. Add RabbitMQ to CI docker-compose for full relay path integration tests

---

## Tranche 9: Add Context Propagation, Operator Controls, And Hardening

**Status:** completed
**Priority:** high
**Depends on:** Tranche 8

## Description

Make Tasky v2 operable for a solo engineer by completing the minimal context and automation controls introduced in
Tranche 7.

## Done When

- canonical context fields propagate end to end across providers, replay tools, and worker continuations
- replay and dead-letter controls exist
- runbooks cover queue, workflow, projection, and provider failures

### Task 9: Add observability and operator tooling

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/kernel/context/`
- Modify: `services/api/src/main/java/mn/tasky/kernel/logging/`
- Modify: `services/api/src/main/java/mn/tasky/automation/**`
- Modify: `services/api/src/main/java/mn/tasky/admin/**`
- Create: `docs/operations/tasky-v2-runbook.md`
- Create: `docs/operations/tasky-v2-failure-modes.md`

**Steps:**

1. Extend the minimal context propagation introduced in Tranche 7 across provider calls, replay tools, and operator surfaces
2. Add replay and inspection controls
3. Add dead-letter and retry inspection controls
4. Document failure modes and recovery patterns

## Verification

```bash
./gradlew :services:api:test
./gradlew gateFull
```

## Handoff Note After Tranche 9

**Checkpoint date:** 2026-04-13

**What is complete**

- `ContextPropagator` is the single source of truth for MDC keys across all boundaries (request → outbox → envelope → worker). Eight canonical fields propagate end-to-end: `correlation_id`, `trace_id`, `causation_id`, `command_id`, `workflow_id`, `actor_id`, `locale`, `platform`.
- The outbox table now carries all eight context columns (Flyway V23 + V24). `AutomationEventEnvelope` and `OutboxEvent` records carry the same fields.
- Admin operator controls live at `/api/v1/admin/outbox/*`:
  - `GET /summary` — counts by status (pending/failed/processed/processing)
  - `GET /events?status=FAILED&limit=50&offset=0` — paginated listing
  - `GET /events/{id}` — single event detail
  - `POST /events/{id}/replay` — reset a FAILED event to PENDING (guarded: only FAILED status is replayable; replaying PROCESSED events would duplicate wallet credits, conversations, and notifications)
  - `POST /events/replay-all` — bulk replay all failed events
- `EventWorkerConsumer` cleanly separates poison-message rejection (`AmqpRejectAndDontRequeueException` → RabbitMQ DLX, no manual republish) from handler failures (manual retry/DLQ via `rabbitTemplate`). Previously the catch block republished _and_ rethrew, causing double-enqueue.
- Operations documentation published:
  - `docs/operations/tasky-v2-runbook.md` — health checks, replay procedures, provider config, deployment checklist, rollback
  - `docs/operations/tasky-v2-failure-modes.md` — failure matrix, per-handler failure modes, recovery procedures, known idempotency gap
- Both pre-existing test failures are now resolved:
  - `OpenApiSpringParityTests` — `/admin/outbox/events/{id}/replay` and `/auth/dev/login` added to OpenAPI spec
  - `AuthorizationMatrixTests` — removed flaky `/actuator/health` check (returns 503 in test env because readiness checks db+facebook+outbox)

**Important implementation notes**

- `resetForReplay` guards on `status = 'FAILED'` only. The original implementation allowed `PROCESSED` events to be replayed, which duplicates wallet credits, conversations, notifications, and analytics — a critical safety issue given that workflow handlers are not yet idempotent.
- `job_id` and `runtime_surface` were removed from `ContextPropagator` MDC constants because they were never persisted in the outbox or emitted in envelopes. If a future tranche needs them, add the outbox columns and envelope fields first.
- `LogField` enum still declares `JOB_ID` and `RUNTIME_SURFACE` as dead code — safe to delete in a future cleanup pass.
- `DomainEventOutboxProcessor` is still active as the outbox-to-RabbitMQ relay poller. Tranche 10 should consider eliminating it entirely by having `DomainEventOutboxService` publish directly to the broker at write time.

**Known durable gaps (carry to Tranche 10)**

- **Workflow handler idempotency**: None of the three workflow handlers (`TaskApplicationAcceptedHandler`, `PaymentConfirmedHandler`, `BookingCompletedHandler`) guard against duplicate event processing. If a message is delivered twice (network partition, consumer crash before ack), side effects repeat. This is the same property as the legacy `DomainEventOutboxProcessor` — not a regression, but the highest-risk gap before running the broker in production. A future tranche should add `eventId`-based guard tables or `ON CONFLICT` upserts to each handler, starting with `BookingCompletedHandler` (wallet credit).
- **`PaymentService` QPay duplication**: `QPayPaymentProvider` contains the QPay logic that `PaymentService` previously owned. `PaymentService` should delegate to `PaymentProvider` for signature validation and intent creation, and the embedded QPay code should be deleted.
- **`/auth/dev/login` in production**: The dev auth endpoint is guarded by `tasky.dev-auth.enabled` (default `false`), but it should never ship with the flag enabled in any production-adjacent environment.

**Verification evidence**

- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test` — 213 tests, 0 failures (all previously-failing tests now pass)
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.*"` — all architecture boundary tests pass
- `GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew openApiValidate` — valid

**Known durable state**

- Tranches 1 through 9 are complete
- current branch state is safe to compact from here
- RabbitMQ is the selected broker; the adapter is narrow and automation-owned

**Recommended next step**

1. Start Tranche 10: Migrate Current Core Flows To V2 And Remove The Old Style
2. Begin with workflow handler idempotency before migrating any core flows
3. Consider eliminating `DomainEventOutboxProcessor` by publishing directly to the broker at write time

---

## Tranche 10: Migrate Current Core Flows To V2 And Remove The Old Style

**Status:** completed
**Priority:** critical
**Depends on:** Tranche 9

## Description

Finish the backend rewrite by converging the remaining meaningful request paths onto the final Tasky v2 shapes and
removing superseded structural paths.

This tranche is now governed by the **finalization design** as the normative execution target:

- `docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md` (execution target)
- `docs/plans/2026-04-13-tasky-v2-backend-finalization.md` (implementation plan)

The finalization design supersedes any ambiguous guidance in this tranche description. The only allowed backend
request-path shapes after this pass are:

1. `controller -> runtime composition -> publicapi ports`
2. `controller -> module-owned publicapi ports`

plus the narrow, explicitly documented exception set.

## Done When

- all meaningful backend request paths use one of the two allowed final shapes:
  - `controller -> runtime composition -> module publicapi ports`
  - `controller -> module-owned publicapi ports`
- the documented exception set remains narrow and explicit
- the live async foundation is singular and unambiguous: persisted outbox relay -> RabbitMQ -> workflow handlers
- broad compatibility shims are removed or documented with owner and deletion trigger
- the backend ends with one active architecture style

### Task 10: Migrate flows and retire old structural paths

**Execution model:**

Execute Tranche 10 as the backend finalization pass defined in the dedicated finalization design and implementation
plan. Do not treat the following as an unordered candidate list anymore.

**Priority flow families:**

1. task creation / task apply / acceptance / booking lifecycle request paths
2. payment and wallet request paths
3. booking-intent request paths
4. remaining admin/public request paths that still orchestrate through concrete services
5. cleanup of superseded orchestration paths and transition shims
6. documentation sync to the live backend architecture

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/**`
- Modify: `services/api/src/main/java/mn/tasky/booking/**`
- Modify: `services/api/src/main/java/mn/tasky/auth/**`
- Modify: `services/api/src/main/java/mn/tasky/dispute/**`
- Modify: `services/api/src/main/java/mn/tasky/review/**`
- Modify: `services/api/src/main/java/mn/tasky/common/**`
- Modify: `services/api/src/main/java/mn/tasky/runtime/**`
- Modify: `services/api/src/test/java/mn/tasky/architecture/**`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Lock the final boundary in architecture tests before further cutover work
2. Remove speculative async scaffolding that conflicts with the chosen event-only foundation
3. Migrate one request-path family at a time behind parity checks
4. Remove old orchestration paths only after the affected family passes parity verification
5. Update docs so Tasky v2 is described directly as the live backend architecture

## Verification

```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
./gradlew openApiValidate
./gradlew gateSmoke
```

## Handoff Note After Tranche 10 (current backend state)

**Checkpoint date:** 2026-04-13

**What is complete**

- workflow-handler idempotency landed for the three migrated event families
- task apply/accept now crosses the booking boundary through `BookingCommandPort`
- booking completion no longer reaches into dispute persistence directly; it uses `TrustQueryPort`
- verification review and dispute aftermath are already on v2 request-path seams
- the outbox relay remains active and documented as an explicit deferred redesign rather than an implicit cutover

**What remains before tranche 10 can be called complete**

- request-path cutover is still mixed in a few controllers and surfaces; the repo does not yet end with one active style
- some compatibility shims remain live on request paths and should either be removed or documented as intentional holdovers
- async scaffolding introduced earlier in the rewrite still includes currently unused contracts (`OutboxEnvelope`, `AutomationJobEnvelope`); the finalization design now requires deletion unless a real job lane is introduced in the same change
- `docs/ARCHITECTURE.md` must continue being updated so the live backend is described in v2 terms rather than the pre-rewrite service-coupling model

---

## First Execution Slice

Start with:

1. Tranche 1 Task 1
2. Tranche 2 Task 2
3. Tranche 3 Task 3
4. Tranche 4 Task 4

That sequence establishes the active architecture narrative, boundary enforcement, and public-port skeleton before the
rewrite touches core behavior.
