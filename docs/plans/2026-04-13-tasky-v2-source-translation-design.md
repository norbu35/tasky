# Tasky V2 Source Translation Design

**Date:** 2026-04-13
**Status:** approved
**Scope:** temporary translation layer from external structural inputs into a Java-native Tasky rewrite target

## Goal

Translate the strongest architectural ideas from the sibling `tasky-agentic` work into a Java-native target for Tasky,
without carrying over the sibling repo's stack or leaving the final Tasky architecture dependent on external context.

This document is intentionally transitional. It is not the final Tasky architecture. Its job is to:

- identify the structural ideas worth adopting
- translate them into Spring Boot, JDBI, Flyway, PostgreSQL, and OpenAPI terms
- identify where current Tasky behavior remains the source of truth
- hand off into a self-contained `Tasky v2` architecture design and rewrite plan

## Inputs

### Structural input

- `../tasky-agentic/docs/plans/2026-04-02-platform-architecture-v2-design.md`
- `../tasky-agentic/docs/plans/2026-04-02-platform-bootstrap-implementation.md`
- `../tasky-agentic/docs/quality/bootstrap-readiness.md`

### Behavioral input

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/API.yaml`
- current backend implementation under `services/api/src/main/java/mn/tasky`

### Business-automation input

- the requirement that Tasky be easy for AI agents to extend safely
- the requirement that Tasky be easy to attach worker automation and provider integrations to
- the requirement that current product behavior not be casually lost during the rewrite

## Assessment

The sibling architecture is the better **structural** target for AI-native development, but not a direct implementation
blueprint for the current Java backend.

What it gets right:

- module public surfaces
- explicit runtime surfaces
- narrow shared infrastructure
- stricter read-model discipline
- better suitability for parallel AI-assisted engineering

What it does not solve by itself:

- migration of the current Java repo
- parity preservation for current Tasky behavior
- the exact worker/provider/AI-evaluation substrate needed for Tasky's business-automation goals
- stack-specific translation into Spring, JDBI, and OpenAPI

The correct sequencing is:

1. translate the structural concepts
2. define a canonical `Tasky v2` architecture
3. write the rewrite plan against that canonical architecture

## Concepts To Carry Forward

### 1. Runtime surfaces

Adopt:

- `public-api`
- `admin-api`
- `worker`
- `scheduler`

These are valuable because they separate request-path concerns from operational and asynchronous concerns.

### 2. Module public surfaces

Every core domain must expose narrow public ports:

- `identity`
- `marketplace`
- `booking`
- `trust`
- `wallet`
- `messaging`

Other domains should not depend on internal services or DAOs directly.

### 3. Query-port vs projection split

Two legal cross-module read modes:

- published query ports for strongly consistent request-path reads
- projection-owned reads for feeds, admin queues, search-like views, growth, and reporting

### 4. Narrow kernel

Shared infrastructure should be limited to:

- configuration
- request/workflow/job context
- logging and tracing hooks
- idempotency
- transactions
- outbox primitives
- shared error contracts

### 5. Boundary enforcement

Architecture must be enforced in tests and package structure, not left as a documentation-only convention.

### 6. Context propagation

The system should preserve:

- `correlation_id`
- `causation_id`
- `command_id`
- `workflow_id`
- `actor_id`

across request, workflow, event, job, and provider boundaries.

## Concepts To Translate, Not Copy

### 1. BFF discipline

Import the discipline, not the framework shape.

Java translation:

- audience-specific controllers
- audience-specific composition layers
- public/admin runtime ownership
- no domain logic in audience composition code

### 2. Contract-first architecture

External API remains OpenAPI-first in Tasky, but the same rigor should apply internally.

Java translation:

- OpenAPI remains the canonical external API contract
- generated SDK remains mandatory
- internal event and job envelopes become first-class contracts
- module command/query interfaces become first-class contracts

### 3. Schema ownership

Physical schema-per-module isolation is not a first-phase requirement.

Java translation:

- code-level DAO ownership first
- migration ownership first
- no direct cross-module reads once query ports exist
- projection tables may use their own namespaces later if needed

### 4. Workflow platform

Do not import the idea of Temporal immediately.

Java translation:

- explicit workflow handlers first
- outbox + broker + worker contracts first
- durable workflow engine later only if real pressure justifies it

## Concepts To Reject For The Initial Rewrite

- TypeScript/Fastify/Kysely rewrite
- microservice split
- full physical database rewrite
- Temporal in the first architecture tranche
- runtime-loaded plugin model

## Translation Table

| Structural Input    | Tasky V2 Translation                                | Why                                                           |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| Real build modules  | package planes + public ports + ArchUnit boundaries | keeps Java stack while tightening reasoning units             |
| BFF packages        | public/admin controller and composition layers      | preserves audience separation                                 |
| Kernel              | `kernel` package                                    | narrows `common`                                              |
| Worker runtime      | `runtime/worker` + broker consumers                 | enables async automation                                      |
| Scheduler runtime   | `runtime/scheduler`                                 | isolates timer and maintenance triggers                       |
| Public exports      | `*.publicapi` contracts                             | narrows cross-module dependencies                             |
| Query ports         | published query adapters                            | preserves fresh request-path reads                            |
| Projections         | projection-owned tables and services                | decouples read-heavy surfaces                                 |
| TS-native contracts | OpenAPI + internal event/job contracts              | preserves current external contract flow                      |
| Outbox/workflows    | canonical event/job envelopes + workflow handlers   | supports automation without immediate durable workflow engine |

## Behavioral Source Of Truth

Current Tasky remains the source of truth for product behavior during the rewrite:

- trust and moderation rules
- booking lifecycle rules
- review and dispute semantics
- messaging and notification semantics
- feature gating posture
- monetization deferral posture

The rewrite should change where behavior lives, not quietly re-decide the behavior itself.

## Handoff

This document hands off into:

1. `Tasky v2 architecture` design
2. `Tasky v2 rewrite` implementation plan

Those documents should stand alone and should not require future implementers to read the sibling repo.
