# Tasky V2 Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the current Tasky backend toward the canonical Tasky v2 architecture while preserving current product
behavior and the existing Java/Spring/JDBI/OpenAPI stack.

**Architecture:** Use the Tasky v2 architecture as the normative target and current Tasky as the behavioral source of
truth. Migrate the codebase via public ports, runtime surfaces, query/projection separation, workflows, jobs, and
provider adapters. Remove the old structural style only after parity is proven flow by flow.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, Flyway, PostgreSQL/PostGIS, OpenAPI, Gradle, ArchUnit, Micrometer,
structured logging, one broker (`RabbitMQ` or `SQS`, selected during execution)

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
- For backend tests, follow the scenario-based rules in `AGENTS.md`; if a needed scenario is missing, stop and report the gap.

## Delivery Estimate

- documentation and guardrails: `2-3 weeks`
- structural refactor and public-port migration: `5-7 weeks`
- workflows, projections, jobs, providers, and hardening: `7-12 weeks`
- expected total: `16-24 weeks`

If runtime surfaces become separately bootable during the same program, budget closer to `20-28 weeks`.

## Tranche 1: Canonicalize Tasky V2 Docs

**Status:** planned
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

**Status:** planned
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

**Status:** planned
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

**Status:** planned
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

---

## Tranche 5: Separate Audience Composition From Domain Logic

**Status:** planned
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

---

## Tranche 6: Enforce Query Ports And Add First Projections

**Status:** planned
**Priority:** high
**Depends on:** Tranche 5

## Description

Apply the Tasky v2 read-model rule to real code: fresh reads through query ports, read-heavy surfaces through projections.

## Done When

- cross-module request-path reads use published query ports
- at least two read-heavy surfaces are projection-backed
- projection ownership rules are tested and documented

### Task 6: Publish query adapters and projection surfaces

**Files:**

- Modify: module public query interfaces
- Create: `services/api/src/main/java/mn/tasky/projection/admin/`
- Create: `services/api/src/main/java/mn/tasky/projection/feed/`
- Create: `services/api/src/main/resources/db/migration/V__tasky_v2_projection_read_models.sql`
- Modify: selected public/admin endpoints

**Candidate surfaces:**

- admin verification/dispute queue summary
- task feed ranking/input snapshot

**Steps:**

1. Replace direct cross-module reads with query ports
2. Create projection-owned tables
3. Move chosen read-heavy endpoints onto projections

## Verification

```bash
./gradlew :services:api:test
./gradlew gateRegression
```

---

## Tranche 7: Replace Ad Hoc Async Logic With V2 Workflows, Events, And Jobs

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 6

## Description

Introduce the canonical workflow/job model that makes Tasky automation-native.

## Done When

- explicit workflow handlers exist for main multi-step processes
- canonical event and job envelopes exist
- outbox rows relay to one broker
- worker handlers replace the centralized business switch in the outbox processor

### Task 7: Add workflow handlers, event envelopes, job envelopes, and broker relay

**Files:**

- Create: `services/api/src/main/java/mn/tasky/**/workflow/`
- Create: `services/api/src/main/java/mn/tasky/automation/event/`
- Create: `services/api/src/main/java/mn/tasky/automation/job/`
- Create: `services/api/src/main/java/mn/tasky/automation/broker/`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `services/api/src/main/resources/application.yml`
- Modify: `services/api/src/main/resources/application-prod.yml`

**Steps:**

1. Define canonical event and job envelopes
2. Move multi-step aftermaths into workflows
3. Add broker relay and worker consumers
4. Keep transaction-path mutation synchronous and explicit

## Verification

```bash
./gradlew :services:api:test
./gradlew gateRegression
```

---

## Tranche 8: Standardize Provider Families And AI Contracts

**Status:** planned
**Priority:** high
**Depends on:** Tranche 7

## Description

Make it cheap to attach business-automation integrations and AI-assisted internal tools without reopening core request-path logic.

## Done When

- provider families exist with health, timeout, and fallback policy
- AI-assisted integrations follow explicit logging and evaluation rules
- provider logic moves out of broad services

### Task 8: Add provider contracts and AI integration policy

**Files:**

- Create: `services/api/src/main/java/mn/tasky/automation/provider/`
- Create: `services/api/src/main/java/mn/tasky/payment/provider/`
- Create: `services/api/src/main/java/mn/tasky/verification/provider/`
- Create: `services/api/src/main/java/mn/tasky/notification/provider/`
- Create: `services/api/src/main/java/mn/tasky/messaging/provider/`
- Create: `services/api/src/main/java/mn/tasky/automation/provider/llm/`
- Modify: `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- Create: `docs/architecture/tasky-v2-ai-integration-contract.md`

**Steps:**

1. Add provider contracts and fake/local adapters
2. Move embedded vendor logic behind adapters
3. Publish AI integration rules and evaluation requirements

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

Make Tasky v2 operable for a solo engineer.

## Done When

- canonical context fields propagate end to end
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

1. Propagate canonical context IDs
2. Add replay and inspection controls
3. Document failure modes and recovery patterns

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
