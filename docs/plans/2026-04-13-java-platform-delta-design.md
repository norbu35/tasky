# Java Platform Delta Design

**Date:** 2026-04-13
**Status:** approved
**Scope:** backend architecture rewrite of current Tasky functionality into a stricter modular, workflow, and automation platform while keeping Java 21, Spring Boot, JDBI, Flyway, PostgreSQL, and the existing monorepo

## Goal

Refactor the current Java backend so it preserves the proven product functionality and current stack while adopting the
most valuable structural ideas from `tasky-agentic`: stronger module boundaries, narrower shared infrastructure,
experience-specific runtime surfaces, explicit public ports, projection-based read models, and a real workflow/job/provider
extension layer.

This is not a TypeScript replatform and not a microservice program. It is a structural rewrite inside the existing stack
so new automations, AI-assisted features, provider integrations, and worker flows become materially cheaper to build and
safer for both humans and coding agents to modify.

## Problem

The current backend is functionally rich but structurally uneven:

- business orchestration is concentrated in large application services
- cross-domain calls happen through broad concrete services instead of narrow public ports
- async side effects are split between synchronous service logic, schedulers, and a centralized outbox switch
- `common` has become a catch-all rather than a narrow kernel
- request-path reads, admin reads, and future analytical reads do not yet follow a strict query-port versus projection split
- current package boundaries are too soft for cheap parallel AI-assisted development

The old automation roadmap improved workflow and worker extensibility, but it did not go far enough on module ownership,
runtime surfaces, or read-model discipline.

## Approaches Considered

### 1. Keep the old roadmap only

This would add workflows, providers, and workers to the current monolith without materially tightening the internal
module model.

Pros:

- lowest short-term disruption
- fastest path to the first few automations

Cons:

- large orchestration services remain central hotspots
- AI-assisted work still collides in broad files and ambiguous seams
- admin, feed, and future read-heavy surfaces still tend to bypass proper module ownership

### 2. Java-preserving structural delta from `tasky-agentic` plus the old extensibility roadmap

This keeps the current stack and current repo, but imports the structural rules that are actually worth taking:

- explicit module public ports
- narrower kernel
- public/admin/worker/scheduler runtime surfaces
- published query ports versus projections
- stronger boundary tests
- standardized event/job/provider contracts

Pros:

- preserves the working stack and current product depth
- gives most of the long-term maintainability and AI-development benefits
- avoids a language and framework rewrite

Cons:

- still a large refactor
- requires careful strangler-style migration of current flows

### 3. Full replatform toward `tasky-agentic`

This would migrate the backend toward the TypeScript/Fastify/Kysely architecture directly.

Pros:

- cleanest convergence with the sibling repo
- strongest long-term alignment with its agentic development model

Cons:

- effectively a rewrite, not a refactor
- duplicates product work already completed in the Java codebase
- highest parity, migration, and rollout risk

## Recommendation

Choose approach 2.

The right move is to import the architectural rules from `tasky-agentic`, not its language or framework. The valuable
assets there are not Fastify or TypeScript. They are the explicit module seams, experience-aware runtime surfaces,
published query ports, projection discipline, and the insistence that async work, read-heavy work, and external
integrations live behind narrow contracts.

The existing Java repo already has the domain depth, the transactional model, the outbox seed, and the operational
constraints. The delta should preserve those strengths and replace the weak internal structure around them.

## Adopt From `tasky-agentic`

The Java backend should explicitly adopt these ideas.

### 1. Runtime surfaces

Adopt four runtime surfaces as the target model:

- `public-api`
- `admin-api`
- `worker`
- `scheduler`

In the first phase these may still run inside one deployable and one Spring Boot module, but the package layout,
configuration, and ownership should behave as if they are separate runtimes. Only later, if needed, should they become
separate deployables.

### 2. Module public ports

Every major business capability needs a narrow public surface:

- `identity`
- `marketplace`
- `booking`
- `trust`
- `wallet`
- `messaging`

Other modules may depend only on public command/query ports, never on internal DAOs or broad concrete services.

### 3. Query-port vs projection split

Two read models should be legal:

- synchronous published query ports for request-path, strongly consistent reads
- consumer-owned projections for feeds, admin lists, search-like views, analytics, and growth surfaces

This rule is worth importing almost verbatim.

### 4. Narrow kernel

The current `common` package should be narrowed into infrastructure concerns only:

- configuration
- request/workflow/job context
- error envelope
- idempotency
- transactions
- outbox primitives
- structured logging and tracing

It should not become a shared home for business helpers or cross-domain convenience services.

### 5. Stronger boundary enforcement

The current ArchUnit rules are useful but too weak. The platform should enforce:

- runtime to module dependency rules
- module public-port rules
- query-port vs projection rules
- admin isolation rules
- prohibition on cross-module DAO access

### 6. Structured async contracts

Async work should use:

- canonical event envelope
- canonical job envelope
- correlation and causation IDs
- idempotency keys
- versioned payloads
- dead-letter handling

### 7. Experience-specific surfaces

Admin should be treated as an operational surface, not as a grab-bag of direct domain entry points. This is especially
important for moderation, payouts, disputes, and operational overrides.

## Do Not Adopt Directly

These parts of `tasky-agentic` are not worth importing as-is.

### 1. TypeScript/Fastify/Kysely rewrite

The Java stack is not the problem. Replatforming would consume time without solving the core architecture issue faster.

### 2. Full physical DB schema rewrite now

`tasky-agentic` wants per-module schemas with role enforcement. That idea is valid, but retrofitting the existing Java
database wholesale is too expensive for the near-term payoff. The Java delta should first enforce ownership in code,
DAOs, migrations, and architecture tests. Physical schema separation can be applied to new tables and projections later.

### 3. Temporal now

Temporal is attractive, but it is not the first missing layer. The current repo first needs explicit workflows, job
contracts, a broker bridge, and provider ports. Durable workflow infrastructure can be reconsidered later once those
contracts are stable and there is real pressure from timers or long-running stateful processes.

### 4. Full BFF duplication now

The BFF idea is useful at the boundary, but there is no reason to create three duplicate Java application cores. The
current repo should separate audience-specific controller and composition layers first, then decide whether separate
deployables are justified.

## Target Java Shape

The target architecture inside the current stack is:

```text
services/api
  runtime/
    publicapi/
    adminapi/
    worker/
    scheduler/
  kernel/
    config/
    context/
    error/
    logging/
    idempotency/
    outbox/
    transaction/
  automation/
    event/
    job/
    broker/
    provider/
    health/
    metrics/
  identity/
    api/public/
    api/admin/
    publicapi/
    application/command/
    application/query/
    workflow/
    provider/
    dao/
    projection/
  marketplace/
  booking/
  trust/
  wallet/
  messaging/
```

This does not require a one-shot package rename. Existing packages can be migrated into this shape incrementally behind
adapters and new public-port layers.

## Data Ownership Strategy

Keep one Postgres database and current schema posture in the near term.

Ownership rules should become:

- one module owns writes for its tables
- one module owns migrations for its tables
- one module exposes published queries for strongly consistent read needs
- other modules do not read another module's tables directly
- projections own their own read tables and consume events

Near-term enforcement should happen through:

- package boundaries
- DAO ownership rules
- migration ownership documentation
- architecture tests

Future new projection tables may use dedicated schema namespaces, but this is not a prerequisite for the refactor.

## Workflow And Automation Model

The new extension substrate should be:

```text
HTTP request
  -> audience controller
  -> command handler
  -> transactional state mutation
  -> domain event outbox write
  -> relay
  -> broker
  -> worker handler
  -> provider adapter / projection updater / workflow continuation
```

Workflows should be explicit modules, not incidental code inside controllers or large services.

Examples:

- application acceptance aftermath
- booking completion aftermath
- verification review
- payout release
- scope modification
- contact reveal
- rescue escalation

## AI Development Implications

This delta is better for AI-assisted engineering because it creates smaller, more explicit reasoning units:

- module public ports instead of direct service webs
- one command handler per transactional action
- one query service per read path
- one workflow handler per multi-step process
- one worker handler per async job type
- one provider adapter per vendor family

That lowers change risk, reduces merge conflicts, and makes it easier to test and review AI-generated changes locally.

## Testing And Verification Model

The migration must preserve the repo's testing doctrine:

- scenario-backed behavioral tests for user-facing business flows
- stronger ArchUnit tests for boundaries
- integration tests for runtime-surface composition
- worker and projection tests for async flows
- OpenAPI validation remains mandatory

For migrated behavior, parity tests are as important as new structure tests. The architecture rewrite must not quietly
change business behavior while moving code into cleaner seams.

## Effort And Risk

This is materially larger than the old roadmap.

Estimated effort for one strong solo engineer:

- `12-18 weeks` for the structural refactor to parity if runtime split stays mostly logical
- `16-24 weeks` if admin/worker/scheduler become separately bootable runtimes during the same program
- add `4-8 weeks` if physical schema separation or Temporal-like durable workflow infrastructure is included early

The main risks are:

- partial migration that leaves two competing architectural styles
- over-rotating into package churn before public ports exist
- introducing projections before event contracts and ownership rules are stable
- under-testing parity during the orchestration rewrite

## Decision

Replace the old automation roadmap with a new delta migration plan that:

1. preserves the current Java stack
2. imports the strong architectural rules from `tasky-agentic`
3. keeps the workflow/job/provider extensibility from the prior roadmap
4. explicitly sequences parity-preserving refactor work before ambitious new automations
