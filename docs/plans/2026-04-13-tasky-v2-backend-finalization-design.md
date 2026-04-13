# Tasky V2 Backend Finalization Design

**Date:** 2026-04-13
**Status:** approved
**Scope:** backend rewrite finalization only; web/mobile changes are explicitly out of scope for this pass

## Goal

Turn the current rewrite into one enforceable backend architecture style that is safe to extend for continued platform
development.

This pass does **not** chase superficial completion. It closes the architectural gaps that would otherwise keep the
repo in a half-migrated state:

- mixed request-path orchestration styles
- vague exceptions
- speculative async abstractions with no live ownership
- weak verification around controller and runtime boundaries

## Problem Statement

The broad rewrite plan correctly established the target architecture, but Tranche 10 remained too open-ended to guide
execution safely:

- it named candidate flows without defining the exact cutover rule for request paths
- it did not distinguish real exceptions from unfinished migrations
- it left the async direction ambiguous by keeping both a live outbox relay and unused generic job/outbox contracts
- it did not define the minimum verification bar needed before deleting legacy paths

For the final backend pass, those ambiguities are now resolved explicitly.

## Decision Summary

### 1. Converge all active backend request paths onto two allowed shapes

After finalization, every active backend request path must use exactly one of these shapes:

1. **Audience-composition path**

   ```text
   controller -> runtime.{publicapi|adminapi}.composition service -> module publicapi ports
   ```

   Use this when the endpoint:
   - combines multiple modules
   - performs audience-specific response shaping
   - coordinates feature policy across domains
   - owns non-trivial orchestration at the request boundary

2. **Owned-module path**

   ```text
   controller -> module-owned publicapi command/query port
   ```

   Use this when the endpoint is owned by a single module and does not orchestrate another module's internals.

There is no third general-purpose style. Controllers must not keep broad orchestration logic.

### 2. Narrow the exception set and document it in tests

Only the following categories may remain outside the two primary request shapes:

- bootstrap and health endpoints
- security introspection endpoints
- development-only auth helpers
- operator endpoints whose purpose is low-level platform control rather than product orchestration
- simple lookup/reference-data endpoints that are module-local and do not orchestrate cross-module behavior

The initial explicit exception set for this pass is:

- `mn.tasky.common.config.SystemInfoController`
- `mn.tasky.security.api.SecurityScopeController`
- `mn.tasky.auth.api.DevAuthController`
- `mn.tasky.location.api.LocationController`
- `mn.tasky.notification.api.ServiceAreaController`
- `mn.tasky.admin.api.OutboxReplayController`
- `mn.tasky.admin.api.AdminFeatureToggleController`

Any additional exception must be justified in code review and added to the architecture test registry in the same
change. "Not migrated yet" is not a valid reason.

### 3. Keep the persisted outbox relay as the live async foundation

The live backend async foundation remains:

```text
transaction -> domain_outbox_events -> relay publisher -> RabbitMQ -> workflow handler
```

This pass does **not** switch to direct broker publication from the transaction boundary.

Reasoning:

- the persisted outbox is the current durability boundary
- relay publication gives controlled retry and operational visibility
- removing the relay now would combine foundational redesign with broad flow migration and increase risk

The backend should simplify around the **existing** event pipeline, not introduce a second async strategy during
finalization.

### 4. Standardize on event-driven aftermath now; defer generic job lanes until they are real

For the current backend rewrite, the only live async contract shape is the domain-event path. Speculative generic async
types should not remain in the architecture as placeholders.

That means:

- keep the live event contract used by the outbox/worker flow
- remove unused generic scaffolding such as `OutboxEnvelope` and `AutomationJobEnvelope`
- introduce a dedicated job contract later only when a concrete use case needs a durable job lane distinct from domain events

The rule is simple: no generic async abstraction survives this pass unless a live caller, handler, and ownership
boundary already exist.

### 5. Make the request-path boundary mechanically testable

The controller boundary is complete only when the tests can enforce it.

The guard rule for request paths is:

- controllers may depend on runtime composition services
- controllers may depend on module-owned `publicapi` command/query ports
- controllers may depend on explicitly documented exception services
- controllers may **not** depend on another module's internal application service, DAO, repository, or feature-toggle-driven orchestration path
- runtime composition services may depend on module `publicapi` ports and owned response mappers, but not on another module's internals

This must be encoded in architecture tests, not left as a doc-only convention.

## In-Scope Backend Surfaces

This finalization pass applies to backend request paths that matter for continued platform development.

### Public/API surfaces in scope

- auth request paths that shape live product behavior
- task posting and task retrieval
- task application and acceptance
- booking operations and booking-intent flows
- review submission and review-gated posting/applying flows
- verification submission and review outcomes
- dispute raise and dispute aftermath entry points
- wallet and payment request paths
- user profile and messaging request paths
- category surfaces if they participate in live product behavior beyond static lookup

### Admin/API surfaces in scope

- moderation, verification, dispute, payout, and task-assignment endpoints that change product state or coordinate multiple modules

### Explicitly lower-priority or exception surfaces

These are not ignored, but they do not block finalization if they conform to the documented exception rule:

- health/info
- security scope inspection
- dev-only auth
- outbox replay and feature-toggle operator endpoints
- pure lookup/reference-data endpoints

## Forbidden Post-Finalization Shapes

These shapes must not survive the final backend pass:

- `controller -> multiple broad application services`
- `controller -> another module's concrete service`
- `controller -> DAO / Jdbi interface directly`
- `controller -> feature toggle + broad service branching for cross-module orchestration`
- `runtime composition -> another module's internal service or DAO`
- dual request paths where both a runtime composition service and a legacy direct-service path remain live for the same endpoint family

## Migration Sequence

The backend finalization pass should proceed in this order.

### Phase A: Lock the boundary and async decisions

- publish the finalization design and implementation plan
- strengthen architecture tests to encode the allowed request-path shapes and explicit exception registry
- delete unused generic async scaffolding that conflicts with the chosen event-only foundation

### Phase B: Finish request-path convergence

Cut over the remaining mixed public/admin request paths so each endpoint family uses one allowed shape only.

Priority order:

1. task posting / task apply / acceptance / booking lifecycle request paths
2. payment and wallet request paths
3. booking-intent request paths
4. remaining public/admin request paths that still orchestrate through concrete services instead of runtime/publicapi seams

### Phase C: Remove superseded structural paths

After parity is verified for each migrated family:

- delete compatibility shims
- delete duplicate orchestration services
- delete one-off transition adapters
- remove test allowances that existed only for the temporary cutover window

### Phase D: Sync canonical docs to the live backend

Once code and guards match the finalization design:

- update `docs/ARCHITECTURE.md`
- update the rewrite implementation plan status and handoff note
- update `CHANGELOG.md`

The live architecture docs should describe the architecture that actually runs, not the architecture we intend to reach
later.

## Verification Standard

Tranche 10 is not complete until **all** of the following are true:

### 1. Architecture verification

- controller-boundary tests enforce the two allowed request shapes
- exception controllers are listed explicitly
- runtime composition services are prevented from reaching into module internals
- async contract tests confirm that dead placeholder abstractions are gone

### 2. Behavioral verification

- scenario-backed tests cover each migrated flow that changed entry-point wiring
- duplicate-delivery and idempotency coverage remains intact for workflow aftermath paths
- targeted integration tests prove that request-path parity was preserved during cutover

### 3. Operational verification

- outbox relay tests still prove claim/publish/mark behavior
- worker handlers remain retry-safe and idempotent for migrated event families

### 4. Contract verification

- `./gradlew openApiValidate` passes for backend contract integrity
- backend smoke gates pass

### 5. Documentation verification

- planning docs, architecture docs, and changelog no longer describe deprecated live paths as if they were current

## Non-Goals

This finalization pass is **not**:

- a web/mobile cleanup pass
- a broker replacement program
- a direct-publish outbox redesign
- a generic durable-jobs initiative
- a reason to preserve speculative abstractions "for later"
- a big-bang rewrite of every low-value utility endpoint

## Success Criteria

The backend rewrite is finalization-ready when:

- all meaningful backend request paths use one of the two allowed shapes
- the exception set is narrow, explicit, and enforced by tests
- the live async foundation is singular and unambiguous
- dead rewrite scaffolding is deleted
- legacy request-path orchestration no longer competes with runtime/publicapi seams
- the canonical docs describe the backend that actually exists
