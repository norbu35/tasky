# Java Platform Delta Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the current Java Tasky backend into a stricter module, workflow, runtime-surface, and automation
architecture that preserves current functionality while importing the best structural ideas from `tasky-agentic`.

**Architecture:** Keep Java 21, Spring Boot, JDBI, Flyway, PostgreSQL, OpenAPI, and the existing monorepo. Introduce
runtime surfaces (`public-api`, `admin-api`, `worker`, `scheduler`), module public ports, command/query separation,
projection-owned read models, and a standardized workflow/job/provider substrate. Migrate current behavior behind these
new seams using a strangler approach instead of a rewrite-in-place.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, Flyway, PostgreSQL/PostGIS, OpenAPI, Gradle, ArchUnit,
Micrometer/Prometheus, structured logging, one broker (`RabbitMQ` or `SQS`, selected during implementation)

---

## Delta Summary

This plan supersedes the older automation roadmap by adding the structural deltas that were missing:

- adopt module public ports
- adopt published query ports vs projections
- adopt runtime surfaces as a first-class target
- narrow `common` into `kernel`, `runtime`, and `automation`
- strengthen architecture enforcement beyond the current four ArchUnit rules
- keep the old roadmap's workflow, job, and provider extensibility work

This plan intentionally does **not** include:

- a language rewrite
- a framework rewrite
- a full physical DB schema rewrite in the first phase
- Temporal in the first phase

## Execution Rules

- Preserve current user-visible behavior unless the tranche explicitly states an approved behavior change.
- Treat parity verification as mandatory for every migrated workflow.
- Add structure before moving behavior: public ports and tests must exist before large service extractions.
- Do not move broad packages just for aesthetics; move code only when a new boundary is ready to receive it.
- No module may read another module's tables directly once a public query port exists for that data.
- New async work must use the canonical event and job envelopes.
- For backend tests, follow the scenario-based rules in `AGENTS.md`; if a needed scenario is missing, stop and report the gap.

## Recommended Sequence

Implement in this order:

1. Canonical architecture docs and stronger guardrails
2. Runtime surface and kernel skeleton
3. Module public ports and command/query seams
4. Workflow extraction from large orchestrators
5. Query-port versus projection split
6. Outbox/job/provider platform
7. Observability and context propagation
8. End-to-end migration of current high-value flows

## Delivery Estimate

- Foundation and boundary work: `4-6 weeks`
- Structural refactor of current flows: `6-8 weeks`
- Worker/provider/projection migration and hardening: `4-8 weeks`
- Expected total: `14-22 weeks`

If the repo also splits into separately bootable admin/worker/scheduler services during the same program, budget closer
to `18-26 weeks`.

---

## Tranche 1: Canonicalize The Delta Architecture

**Status:** planned
**Priority:** critical
**Depends on:** none

## Description

Write the canonical architecture delta into the repo and retire the older roadmap so there is one active migration story.
This tranche also records which `tasky-agentic` ideas are adopted, modified, or explicitly rejected.

## Entry Criteria

- Read `docs/ARCHITECTURE.md`
- Read `docs/API.yaml`
- Read `docs/plans/2026-04-13-java-platform-delta-design.md`
- Read `docs/plans/2026-04-12-backend-automation-platform-roadmap.md`
- Read `../tasky-agentic/docs/plans/2026-04-02-platform-architecture-v2-design.md`

## Done When

- a canonical Java delta architecture doc exists
- the old automation roadmap is marked superseded
- the repo documents the target runtime surfaces, kernel rules, module public-port rules, and read-model rules
- the migration program clearly distinguishes adopted versus rejected `tasky-agentic` ideas

### Task 1: Publish the active architecture docs

**Files:**

- Create: `docs/architecture/java-platform-delta.md`
- Create: `docs/architecture/module-public-ports.md`
- Create: `docs/architecture/query-ports-and-projections.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/plans/2026-04-12-backend-automation-platform-roadmap.md`
- Modify: `docs/plans/2026-04-13-java-platform-delta-design.md`

**Steps:**

1. Write `docs/architecture/java-platform-delta.md` with the adopted target shape and non-goals
2. Write `docs/architecture/module-public-ports.md` with allowed dependency directions
3. Write `docs/architecture/query-ports-and-projections.md` with the request-path vs eventual-consistency split
4. Update `docs/ARCHITECTURE.md` so it points to these docs instead of describing only the older domain-only monolith
5. Replace the old roadmap with a supersession note that points to the new design and plan docs

### Task 2: Record migration invariants

**Files:**

- Create: `docs/architecture/migration-invariants.md`
- Create: `docs/architecture/architecture-migration-parity-matrix.md`

**Steps:**

1. Record which flows must remain behaviorally identical during refactor
2. Record which later-phase surfaces stay deferred during the architecture rewrite
3. Record how parity will be verified as code moves into new seams

## Verification

```bash
git diff -- docs/ARCHITECTURE.md docs/architecture docs/plans/2026-04-12-backend-automation-platform-roadmap.md docs/plans/2026-04-13-java-platform-delta-design.md docs/plans/2026-04-13-java-platform-delta-implementation.md
```

---

## Tranche 2: Add Package Skeletons And Boundary Enforcement

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 1

## Description

Create the package skeleton that mirrors the desired architecture and strengthen architecture tests before moving
behavioral code.

## Entry Criteria

- Tranche 1 completed
- target runtime surfaces and module rules are documented
- current hotspots and forbidden dependency shapes are identified

## Done When

- `kernel`, `runtime`, `automation`, and `projection` package markers exist
- module public-port package markers exist for each core domain
- ArchUnit rules enforce runtime, public-port, and DAO ownership boundaries
- controllers and services cannot bypass the new public-port and workflow seams once introduced

### Task 3: Create architecture marker packages

**Files:**

- Create: `services/api/src/main/java/mn/tasky/kernel/KernelPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/publicapi/PublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/adminapi/AdminApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/worker/WorkerRuntimePackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/scheduler/SchedulerRuntimePackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/automation/AutomationPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/projection/ProjectionPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityPublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/marketplace/publicapi/MarketplacePublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/booking/publicapi/BookingPublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/trust/publicapi/TrustPublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/wallet/publicapi/WalletPublicApiPackageMarker.java`
- Create: `services/api/src/main/java/mn/tasky/messaging/publicapi/MessagingPublicApiPackageMarker.java`

**Steps:**

1. Create empty package-marker types for each architectural plane and module public surface
2. Add package-level javadocs describing allowed dependencies
3. Keep markers minimal so they are safe to add before any code movement

### Task 4: Expand architecture tests

**Files:**

- Modify: `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/RuntimeBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/PublicPortBoundaryTest.java`
- Create: `services/api/src/test/java/mn/tasky/architecture/ProjectionBoundaryTest.java`

**Steps:**

1. Keep the current architecture rules passing
2. Add rules that only runtime packages may depend on controller packages
3. Add rules that cross-module dependencies must go through `*.publicapi`
4. Add rules that projections may read from event/job or projection packages, not transactional DAOs directly
5. Add rules that admin APIs do not leak into public runtime packages

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.BackendArchitectureTest
./gradlew :services:api:test --tests mn.tasky.architecture.RuntimeBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.ProjectionBoundaryTest
```

---

## Tranche 3: Introduce Runtime Surfaces And A Narrow Kernel

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 2

## Description

Create the structural planes that the rest of the refactor depends on: `runtime`, `kernel`, and `automation`. This
tranche is still mostly additive and should not change business behavior.

## Entry Criteria

- Tranche 2 completed
- package markers and architecture tests are in place

## Done When

- request context, error envelope, structured logging, idempotency, and outbox primitives have a clear `kernel` home
- audience-specific API packages exist for public and admin surfaces
- worker and scheduler package entry points exist, even if still bootstrapped inside the current deployable
- `common` has a written deprecation map so new code does not continue to accumulate there

### Task 5: Establish the kernel package

**Files:**

- Create: `services/api/src/main/java/mn/tasky/kernel/context/RequestContext.java`
- Create: `services/api/src/main/java/mn/tasky/kernel/context/RequestContextHolder.java`
- Create: `services/api/src/main/java/mn/tasky/kernel/error/ApiErrorEnvelope.java`
- Create: `services/api/src/main/java/mn/tasky/kernel/logging/StructuredLogFields.java`
- Create: `services/api/src/main/java/mn/tasky/kernel/outbox/EventEnvelope.java`
- Create: `services/api/src/main/java/mn/tasky/kernel/idempotency/CommandId.java`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-prod.yml`

**Steps:**

1. Create the new kernel package types without moving old behavior yet
2. Define canonical context fields: `correlation_id`, `causation_id`, `command_id`, `workflow_id`, `actor_id`
3. Add configuration keys and documentation for the new structured context model
4. Write a deprecation note for which current `common` subpackages move into `kernel`

### Task 6: Establish runtime-surface packages

**Files:**

- Create: `services/api/src/main/java/mn/tasky/runtime/publicapi/PublicApiConfiguration.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/adminapi/AdminApiConfiguration.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/worker/WorkerRuntimeConfiguration.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/scheduler/SchedulerRuntimeConfiguration.java`
- Create: `services/api/src/main/java/mn/tasky/runtime/RuntimeSurfaceREADME.md`
- Modify: `services/api/src/main/java/mn/tasky/common/config/SecurityConfig.java`

**Steps:**

1. Create configuration shells for each runtime surface
2. Route existing controller packages conceptually into public or admin runtime ownership
3. Define how worker and scheduler beans will be discovered separately from request-path beans
4. Keep current deploy topology intact while making future extraction possible

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.RuntimeBoundaryTest
./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest
```

---

## Tranche 4: Add Module Public Ports And Command/Query Seams

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 3

## Description

Add the core contract layer that the rest of the backend should depend on. This tranche creates public command/query
ports and starts separating broad services into command handlers and query services.

## Entry Criteria

- Tranche 3 completed
- runtime and kernel skeletons exist

## Done When

- each core module has explicit public command/query ports
- new code can read cross-module state through ports without importing internal services or DAOs
- broad services begin shrinking into command handlers and query services
- controllers become thinner and more audience-specific

### Task 7: Create module public-port interfaces

**Files:**

- Create: `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommands.java`
- Create: `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueries.java`
- Create: `services/api/src/main/java/mn/tasky/marketplace/publicapi/MarketplaceCommands.java`
- Create: `services/api/src/main/java/mn/tasky/marketplace/publicapi/MarketplaceQueries.java`
- Create: `services/api/src/main/java/mn/tasky/booking/publicapi/BookingCommands.java`
- Create: `services/api/src/main/java/mn/tasky/booking/publicapi/BookingQueries.java`
- Create: `services/api/src/main/java/mn/tasky/trust/publicapi/TrustCommands.java`
- Create: `services/api/src/main/java/mn/tasky/trust/publicapi/TrustQueries.java`
- Create: `services/api/src/main/java/mn/tasky/wallet/publicapi/WalletCommands.java`
- Create: `services/api/src/main/java/mn/tasky/wallet/publicapi/WalletQueries.java`
- Create: `services/api/src/main/java/mn/tasky/messaging/publicapi/MessagingCommands.java`
- Create: `services/api/src/main/java/mn/tasky/messaging/publicapi/MessagingQueries.java`

**Steps:**

1. Define minimal interfaces that mirror existing cross-domain needs
2. Favor read and command segregation over one broad facade
3. Keep interfaces additive and backed by adapters to existing services first

### Task 8: Add command/query adapters around current hotspots

**Files:**

- Create: `services/api/src/main/java/mn/tasky/task/application/command/`
- Create: `services/api/src/main/java/mn/tasky/task/application/query/`
- Create: `services/api/src/main/java/mn/tasky/booking/application/command/`
- Create: `services/api/src/main/java/mn/tasky/booking/application/query/`
- Create: `services/api/src/main/java/mn/tasky/auth/application/command/`
- Create: `services/api/src/main/java/mn/tasky/auth/application/query/`
- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskService.java`
- Modify: `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`

**Steps:**

1. Wrap existing behavior in new command and query entry points without changing business behavior
2. Move read-only methods into query services first
3. Move discrete write actions into command handlers second
4. Keep old broad services as temporary facades until all callers are migrated

## Verification

```bash
./gradlew :services:api:test --tests mn.tasky.architecture.PublicPortBoundaryTest
./gradlew gateSmoke
```

---

## Tranche 5: Migrate Controllers To Audience-Specific Surfaces

**Status:** planned
**Priority:** high
**Depends on:** Tranche 4

## Description

Separate public and admin composition logic from domain behavior. This brings the current repo closer to the sibling
architecture's BFF discipline without rewriting it into a new framework.

## Entry Criteria

- Tranche 4 completed
- module public ports exist

## Done When

- public request handlers depend on public ports and query services instead of broad domain services
- admin request handlers are isolated from public request composition
- audience-specific composition logic moves out of domain service classes

### Task 9: Re-home controller packages by audience

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/**/api/*.java`
- Create: `services/api/src/main/java/mn/tasky/**/api/public/`
- Create: `services/api/src/main/java/mn/tasky/**/api/admin/`
- Modify: `services/api/src/main/java/mn/tasky/admin/api/*.java`

**Steps:**

1. Re-home controllers into `api/public` or `api/admin` packages
2. Keep URL contracts stable
3. Remove controller-owned orchestration where public ports or command handlers exist
4. Update architecture tests to lock in the audience split

### Task 10: Extract audience-specific composition logic

**Files:**

- Create: `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/`
- Create: `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/`
- Modify: relevant controller classes touched in Task 9

**Steps:**

1. Move response-shaping and audience-specific composition into runtime-owned classes
2. Keep domain modules free of presentation concerns
3. Avoid creating new broad "view services"

## Verification

```bash
./gradlew :services:api:test
./gradlew openApiValidate
```

---

## Tranche 6: Introduce Query Ports And Projection-Owned Read Models

**Status:** planned
**Priority:** high
**Depends on:** Tranche 5

## Description

Adopt the most valuable `tasky-agentic` read-model rule: request-path fresh reads go through published query ports,
while feeds, admin queues, search-like lists, and growth surfaces move to projections.

## Entry Criteria

- Tranche 5 completed
- public ports and runtime surfaces are in use

## Done When

- request-path cross-module reads go through published query ports
- at least two read-heavy surfaces use projection-owned tables or materialized views
- direct cross-domain DAO reads are prohibited by rule and by code

### Task 11: Publish request-path query ports

**Files:**

- Modify: module public query interfaces from Tranche 4
- Create: `services/api/src/main/java/mn/tasky/**/application/query/internal/`
- Create: `services/api/src/main/java/mn/tasky/**/publicapi/*QueryAdapter.java`

**Steps:**

1. Identify request-path reads that must stay strongly consistent
2. Back those reads with published query adapters
3. Replace any direct cross-module DAO access in request paths

### Task 12: Add first projection surfaces

**Files:**

- Create: `services/api/src/main/java/mn/tasky/projection/admin/`
- Create: `services/api/src/main/java/mn/tasky/projection/feed/`
- Create: `services/api/src/main/resources/db/migration/V__projection_read_models.sql`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`

**Candidate projections:**

- admin verification/dispute queue summary
- task feed ranking/input snapshot
- notification targeting snapshots

**Steps:**

1. Create projection-owned tables for the first two read-heavy surfaces
2. Feed those tables from outbox events or the new broker path
3. Switch the chosen admin/feed endpoints to projection-backed reads

## Verification

```bash
./gradlew :services:api:test
./gradlew gateRegression
```

---

## Tranche 7: Replace Ad Hoc Async Logic With A Canonical Workflow/Job Platform

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 6

## Description

Bring the old roadmap's automation work back in, but now on top of stronger module and read-model seams. This tranche
creates explicit workflows, canonical event and job envelopes, the broker bridge, and worker handlers.

## Entry Criteria

- Tranche 6 completed
- projections and public ports are live

## Done When

- `DomainEventOutboxProcessor` is no longer the primary business orchestration switch
- explicit workflow handlers exist for the main multi-step processes
- one broker relay publishes canonical job envelopes
- worker handlers consume jobs with idempotency, retries, and DLQ safety

### Task 13: Add workflow packages and handlers

**Files:**

- Create: `services/api/src/main/java/mn/tasky/booking/workflow/`
- Create: `services/api/src/main/java/mn/tasky/trust/workflow/`
- Create: `services/api/src/main/java/mn/tasky/wallet/workflow/`
- Modify: `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`

**Steps:**

1. Create explicit workflow handlers for acceptance, completion, verification review, and rescue escalation
2. Move multi-step aftermath logic out of broad services into workflow handlers
3. Keep transaction boundaries clear: request-path mutation first, async aftermath second

### Task 14: Add canonical event and job envelopes

**Files:**

- Create: `services/api/src/main/java/mn/tasky/automation/event/DomainEventEnvelope.java`
- Create: `services/api/src/main/java/mn/tasky/automation/job/JobEnvelope.java`
- Create: `services/api/src/main/java/mn/tasky/automation/job/JobType.java`
- Create: `services/api/src/main/java/mn/tasky/automation/broker/`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-prod.yml`

**Steps:**

1. Define canonical event envelope fields and schema version rules
2. Define canonical job envelope fields and retry semantics
3. Add a relay from outbox rows to broker jobs
4. Add worker consumers with idempotency and dead-letter routing

## Verification

```bash
./gradlew :services:api:test
./gradlew gateRegression
```

---

## Tranche 8: Standardize Provider Families And AI Integration Contracts

**Status:** planned
**Priority:** high
**Depends on:** Tranche 7

## Description

Standardize all external capabilities behind provider families and create a disciplined contract for AI-assisted
product features so the architecture can absorb future integrations without reopening core transaction code.

## Entry Criteria

- Tranche 7 completed
- workflow/job/event model is live

## Done When

- provider families exist for telephony, sms relay, payment collection, payout, kyc, llm, fraud, and lead ingestion
- provider adapters are called from workers or workflows, not broad controllers or services
- AI integrations log model, prompt/version, decision trace, and evaluation artifacts

### Task 15: Introduce provider families

**Files:**

- Create: `services/api/src/main/java/mn/tasky/automation/provider/`
- Create: `services/api/src/main/java/mn/tasky/payment/provider/`
- Create: `services/api/src/main/java/mn/tasky/verification/provider/`
- Create: `services/api/src/main/java/mn/tasky/notification/provider/`
- Create: `services/api/src/main/java/mn/tasky/messaging/provider/`
- Modify: `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`

**Steps:**

1. Define provider request/response/error contracts
2. Add local fake or logging adapters for every provider family
3. Replace embedded vendor-specific logic with provider interfaces
4. Add health checks, configuration validation, and timeout policy per provider family

### Task 16: Add AI integration policy and evaluation contracts

**Files:**

- Create: `docs/architecture/ai-integration-contract.md`
- Create: `docs/quality/ai-evaluation-policy.md`
- Create: `services/api/src/main/java/mn/tasky/automation/provider/llm/`
- Modify: `docs/PRD.md`
- Modify: `docs/ARCHITECTURE.md`

**Steps:**

1. Document allowed AI product surfaces and forbidden decision scopes
2. Require model version, prompt version, trace ID, and PII-minimization policy for AI-assisted actions
3. Define evaluation requirements before any AI copilot becomes production-significant

## Verification

```bash
./gradlew :services:api:test
./gradlew gateSmoke
./gradlew gateRegression
```

---

## Tranche 9: Propagate Context, Observability, And Operator Controls

**Status:** planned
**Priority:** high
**Depends on:** Tranche 8

## Description

Make the new architecture operable. This tranche adds the context propagation, tracing, replay, and operator tooling
needed for a solo engineer to run the system safely.

## Entry Criteria

- Tranche 8 completed
- worker and provider paths are live

## Done When

- request, workflow, job, and provider boundaries preserve canonical context fields
- dead-letter and replay controls exist
- dashboards and runbooks explain queue lag, projection lag, provider failures, and stuck workflows

### Task 17: Propagate context fields end to end

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/kernel/context/RequestContext.java`
- Modify: `services/api/src/main/java/mn/tasky/kernel/logging/StructuredLogFields.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/automation/job/JobEnvelope.java`
- Modify: `services/api/src/main/java/mn/tasky/automation/provider/**`

**Steps:**

1. Preserve `correlation_id`, `causation_id`, `command_id`, `workflow_id`, and `actor_id` across boundaries
2. Ensure logs and metrics emit these fields consistently
3. Add tests for context continuity across request, outbox, worker, and provider transitions

### Task 18: Add operator tooling and runbooks

**Files:**

- Create: `docs/operations/java-platform-delta-runbook.md`
- Create: `docs/operations/worker-and-projection-failure-modes.md`
- Modify: `services/api/src/main/java/mn/tasky/admin/`

**Steps:**

1. Add replay and dead-letter inspection controls
2. Document how to diagnose projection lag, failed jobs, and provider degradation
3. Keep all replay actions idempotent and auditable

## Verification

```bash
./gradlew :services:api:test
./gradlew gateFull
```

---

## Tranche 10: Parity Migration Of Current High-Value Flows

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 9

## Description

Complete the rewrite by migrating the most important current behaviors to the new architecture and removing the old
competing paths.

## Entry Criteria

- Tranches 1 through 9 completed
- operator tooling and observability are available

## Done When

- the major current user flows run through module public ports, command/query seams, workflows, and jobs
- old broad orchestration paths are removed or reduced to thin compatibility shims
- there is one architectural style left in the repo, not two

### Task 19: Migrate the current Phase 1 core flows

**Candidate flows:**

- task creation and publish
- task apply and accept
- booking completion and review aftermath
- verification review
- dispute creation and resolution aftermath
- rescue escalation

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/**`
- Modify: `services/api/src/main/java/mn/tasky/booking/**`
- Modify: `services/api/src/main/java/mn/tasky/auth/**`
- Modify: `services/api/src/main/java/mn/tasky/dispute/**`
- Modify: `services/api/src/main/java/mn/tasky/review/**`

**Steps:**

1. Migrate one flow at a time behind parity tests
2. Remove old direct side-effect orchestration only after parity is proven
3. Keep feature flags or compatibility shims only where necessary for safe rollout

### Task 20: Remove superseded structural paths

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/common/**`
- Modify: `services/api/src/main/java/mn/tasky/**/application/*Service.java`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Remove or deprecate old broad service entry points that the new architecture replaces
2. Update docs so the final architecture is described directly, not as a migration target
3. Record the milestone in `CHANGELOG.md`

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

If implementation starts now, the first concrete slice should be:

1. Tranche 1 Task 1
2. Tranche 1 Task 2
3. Tranche 2 Task 3
4. Tranche 2 Task 4
5. Tranche 3 Task 5
6. Tranche 4 Task 7

This sequence creates the active architecture docs, locks in guardrails, and introduces public ports before any major
behavioral extraction begins.
