# Tasky V2 Architecture Design

**Date:** 2026-04-13
**Status:** approved
**Scope:** canonical target architecture for rewriting Tasky into an AI-native development and automation platform while preserving the current Java stack

## Goal

Define a self-contained target architecture for Tasky that makes the codebase:

- easy for AI agents to extend safely
- easy to attach automated workers and provider integrations to
- structurally modular without premature microservices
- compatible with Java 21, Spring Boot, JDBI, Flyway, PostgreSQL, and OpenAPI

This is the canonical target architecture for the rewrite.

## Core Principles

### 1. AI-native development

The codebase should be composed of small, explicit reasoning units with narrow ownership and predictable contracts.

That means:

- module public ports
- command/query separation
- explicit workflow handlers
- worker handlers with typed job contracts
- provider adapters with narrow responsibilities
- strong boundary tests

### 2. Automation-native business architecture

Tasky should make it cheap to solve business problems through software operations:

- asynchronous workflows
- scheduled jobs
- provider integrations
- projection-driven targeting and operations
- AI-assisted internal tools
- trust and fraud automations

### 3. One logical backend

Tasky v2 remains a modular monolith with one primary transactional database and one primary backend codebase.

Separate runtime surfaces exist as architectural boundaries first. Physical extraction is optional and should follow
operational need, not ideology.

### 4. Behavior preservation first

The rewrite preserves current working product behavior unless a specific product change is separately approved.

## System Shape

Tasky v2 has four runtime surfaces:

- `public-api`
- `admin-api`
- `worker`
- `scheduler`

Initially these may still boot from one Spring application. The important rule is that the code and ownership
boundaries must behave as if they are separate runtimes.

## Module Taxonomy

Core transactional modules:

- `identity`
- `marketplace`
- `booking`
- `trust`
- `wallet`
- `messaging`

Derived or consumer-owned surfaces:

- `projection.admin`
- `projection.feed`
- `projection.growth`
- `projection.search`

Shared infrastructure:

- `kernel`
- `automation`
- `runtime`

## Module Rules

Each core module owns:

- command handlers
- query services
- public ports
- internal DAOs
- internal business rules
- module-owned workflows
- module-specific providers where appropriate

Each module exposes a narrow `publicapi` surface for other modules.

No module may:

- call another module's internal DAO
- read another module's tables directly once a published query port exists
- rely on another module's broad application service as an integration surface

## Runtime Surfaces

### Public API

Owns:

- customer-facing and tasker-facing controllers
- audience-specific response composition
- authentication and authorization integration at the request boundary
- mapping between external API contracts and internal module ports

It does not own domain logic.

### Admin API

Owns:

- moderation and support controllers
- admin-only composition
- operational entry points
- support and override workflows

It must remain separated from public request composition.

### Worker

Owns:

- async job consumers
- projection updaters
- provider-calling aftermath handlers
- retry-safe and dead-letter-safe handlers

It does not own synchronous request-path mutation.

### Scheduler

Owns:

- cron-like triggers
- maintenance starts
- delayed workflow or job wakeups

It should remain narrow.

## Kernel

The `kernel` package is intentionally narrow.

Allowed responsibilities:

- configuration
- request, workflow, and job context
- shared error contracts
- structured logging and tracing hooks
- idempotency primitives
- transaction primitives
- outbox primitives

Forbidden responsibilities:

- business helpers
- feature convenience services
- cross-module facades
- reusable business workflows

## Command, Query, Event, And Job Model

Tasky v2 uses four explicit internal contract types.

### Commands

Used for transactional state changes. A command handler should be small, explicit, and owned by a single module.

### Queries

Used for reads. Query services should not quietly mutate state.

### Events

Domain events are facts emitted from committed transactions through the outbox.

### Jobs

Jobs are transport and execution contracts for async work. A job may:

- invoke provider adapters
- update projections
- continue workflows
- perform delayed or retried aftermath logic

Jobs do not replace request-path transactions.

## Read Model Strategy

Tasky v2 supports exactly two cross-module read patterns.

### 1. Published query ports

Use for strongly consistent request-path reads.

Examples:

- checking verification status before accepting an application
- checking wallet state before releasing a payout
- reading current profile state during a request

### 2. Projection-owned read models

Use for:

- feeds
- admin queues
- search-like views
- growth and targeting lists
- reporting

These are eventually consistent, but lag must be bounded and observable.

## Workflow And Automation Model

The standard execution pattern is:

```text
request
  -> controller
  -> command handler
  -> transaction
  -> outbox event
  -> relay
  -> broker
  -> worker handler
  -> provider / projection / workflow continuation
```

Explicit workflow handlers own multi-step processes such as:

- application acceptance aftermath
- booking completion aftermath
- verification review
- dispute aftermath
- payout release
- rescue escalation
- contact reveal
- scope modification

## Provider Families

All external capability families sit behind provider contracts.

Initial families:

- `telephony`
- `sms relay`
- `payment collection`
- `payout`
- `kyc`
- `llm`
- `fraud`
- `lead ingestion`
- `push notifications`
- `file storage`
- `geocoding`

Rules:

- no direct vendor logic in controllers
- no direct vendor logic in broad orchestration services
- provider activation requires config validation, health checks, timeouts, and fallback policy

## AI Integration Rules

Tasky v2 supports AI-assisted features and operations, but deterministic services remain authoritative for high-risk
state changes.

Allowed AI roles:

- summarization
- prioritization
- classification
- recommendation
- internal support copilots
- content rewriting with strict policy

Forbidden AI roles without separate approval:

- final payment decisions
- final moderation bans
- final payout authorization
- final verification approval
- unaudited state transitions

Every AI-assisted workflow must record:

- model version
- prompt version
- trace or decision ID
- redaction policy
- evaluation evidence before scale-up

## Data Ownership

Tasky v2 uses one Postgres database in the near term.

Ownership rules:

- one module owns writes for its tables
- one module owns migrations for its tables
- other modules integrate through public ports or projections
- projection tables are consumer-owned

Physical schema separation is optional in the first rewrite phase and should not block the structural rewrite.

## Verification Model

Required verification layers:

- architecture tests
- scenario-backed behavioral tests
- module integration tests
- worker and projection tests
- OpenAPI validation
- runtime-surface composition checks

The system only becomes AI-native if verification is modular enough that agents can work safely within narrow scopes.

## Migration Principles

- add new seams before moving behavior
- migrate one flow at a time
- preserve parity before deleting old paths
- prefer logical runtime separation before physical deployment separation
- prefer broker-backed workers before durable workflow engines

## Non-Goals

Tasky v2 is not:

- a microservices program
- a TypeScript rewrite
- an event-sourced system
- a runtime plugin platform
- a big-bang rewrite that discards current product depth

## Success Criteria

Tasky v2 is successful when:

- AI agents can add features inside narrow, explicit boundaries
- new provider integrations do not require editing broad core services
- new worker automations can be added without reopening request-path domain logic
- public and admin request composition are clearly separated
- feeds and admin queues move to projection-owned models
- the repo ends with one active architecture style
