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

**Status:** planned
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
- Create: `services/api/src/test/java/mn/tasky/architecture/WorkflowBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/AutomationContractBoundaryTest.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `services/api/src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java`
- Modify: `services/api/src/main/java/mn/tasky/kernel/context/`
- Modify: `services/api/src/main/java/mn/tasky/kernel/logging/`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-prod.yml`

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

---

## Tranche 8: Standardize Provider Families And AI Contracts

**Status:** planned
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
- Create: `services/api/src/main/java/mn/tasky/location/provider/`
- Create: `services/api/src/main/java/mn/tasky/payment/provider/`
- Create: `services/api/src/main/java/mn/tasky/verification/provider/`
- Create: `services/api/src/main/java/mn/tasky/notification/provider/`
- Create: `services/api/src/main/java/mn/tasky/messaging/provider/`
- Create: `services/api/src/main/java/mn/tasky/storage/provider/`
- Create: `services/api/src/main/java/mn/tasky/automation/provider/llm/`
- Create: `services/api/src/test/java/mn/tasky/architecture/ProviderBoundaryTest.java`
- Modify: `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- Modify: `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- Modify: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`
- Create: `docs/architecture/tasky-v2-ai-integration-contract.md`

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

---

## Tranche 9: Add Context Propagation, Operator Controls, And Hardening

**Status:** planned
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

---

## Tranche 10: Migrate Current Core Flows To V2 And Remove The Old Style

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 9

## Description

Finish the rewrite by moving the important current flows fully onto the Tasky v2 architecture and removing superseded structural paths.

## Done When

- current Phase 1 core flows use v2 module ports, workflows, jobs, and providers
- broad compatibility shims are reduced or removed
- the repo ends with one active architecture style

### Task 10: Migrate flows and retire old structural paths

**Candidate flows:**

- task creation and publish
- task apply and accept
- booking completion and review aftermath
- verification review
- dispute aftermath
- rescue escalation

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/**`
- Modify: `services/api/src/main/java/mn/tasky/booking/**`
- Modify: `services/api/src/main/java/mn/tasky/auth/**`
- Modify: `services/api/src/main/java/mn/tasky/dispute/**`
- Modify: `services/api/src/main/java/mn/tasky/review/**`
- Modify: `services/api/src/main/java/mn/tasky/common/**`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Migrate one core flow at a time behind parity checks
2. Remove old orchestration paths only after parity is proven
3. Update docs so Tasky v2 is described directly as the live architecture

## Verification

```bash
./gradlew test
./gradlew openApiValidate
pnpm -r typecheck
pnpm -r test
./gradlew gateFull
```

---

## First Execution Slice

Start with:

1. Tranche 1 Task 1
2. Tranche 2 Task 2
3. Tranche 3 Task 3
4. Tranche 4 Task 4

That sequence establishes the active architecture narrative, boundary enforcement, and public-port skeleton before the
rewrite touches core behavior.
