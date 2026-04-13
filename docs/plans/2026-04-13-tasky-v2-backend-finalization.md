# Tasky V2 Backend Finalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Converge the backend rewrite onto one enforceable architecture style by finishing request-path cutovers,
removing speculative async scaffolding, and deleting superseded orchestration paths.

**Architecture:** Use the finalization design in `docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md` as the
normative target. The only allowed backend request-path shapes after this pass are `controller -> runtime composition -> publicapi ports`
and `controller -> module-owned publicapi ports`, plus a narrow documented exception set. The live async foundation
remains the persisted outbox relay to RabbitMQ; do not introduce a second async strategy during this pass.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, PostgreSQL, RabbitMQ, ArchUnit, JUnit 5, Gradle

---

## Canonical Inputs

- `docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md`
- `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- `docs/plans/2026-04-13-tasky-v2-architecture-design.md`
- `docs/ARCHITECTURE.md`
- `docs/API.yaml`
- `CHANGELOG.md`

## Program Rules

- Backend only. Do not change web/mobile behavior or frontend tests in this pass.
- Preserve user-visible behavior unless the design doc explicitly says otherwise.
- Do not revert unrelated in-progress work already present in the branch.
- Do not introduce new generic async abstractions.
- Do not keep dual request-path implementations alive after parity is proven for a flow family.
- For backend tests, follow the scenario-backed rules in `AGENTS.md`. If a needed scenario is missing, stop and report the gap.

## Delivery Order

Execute tasks in order. Do not skip ahead to deletion until the guardrails and parity checks exist.

### Task 1: Lock the final backend boundary in docs and tests

**Files:**

- Modify: `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- Modify: `services/api/src/test/java/mn/tasky/architecture/AudienceCompositionBoundaryTest.java`
- Modify: `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`
- Modify or Create: any focused architecture test needed for explicit exception-registry enforcement

**Step 1: Write the failing architecture tests**

- Encode the two allowed request-path shapes from the finalization design.
- Encode the explicit exception set.
- Encode the rule that runtime composition services may use `publicapi` ports but not module internals.

**Step 2: Run the targeted architecture tests to verify they fail**

Run:

```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
```

Expected:

- FAIL because mixed controllers and/or missing exception registration still exist

**Step 3: Implement the minimal test-side guard updates**

- Update the rewrite plan to reference the finalization design as the execution target for Tranche 10.
- Keep the exception registry explicit in code so future additions require a deliberate change.

**Step 4: Re-run the architecture tests**

Run the same commands and confirm the failures now point only to real production-code mismatches, not to missing test scaffolding.

**Step 5: Commit**

```bash
git add docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md \
  services/api/src/test/java/mn/tasky/architecture/AudienceCompositionBoundaryTest.java \
  services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java
git commit -m "test: lock backend finalization boundary"
```

### Task 2: Simplify the async foundation around the live outbox relay

**Files:**

- Delete: `services/api/src/main/java/mn/tasky/kernel/outbox/OutboxEnvelope.java`
- Delete: `services/api/src/main/java/mn/tasky/automation/job/AutomationJobEnvelope.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: tests and docs that reference the deleted abstractions

**Step 1: Write the failing tests or assertions**

- Add/adjust architecture or focused unit tests so the codebase fails if the deleted placeholder abstractions remain required.
- Add/adjust tests around the outbox relay only if current behavior is under-specified.

**Step 2: Run the targeted tests to verify they fail**

Run only the tests that cover:

- async contract inventory
- outbox relay behavior
- any existing kernel skeleton assertions impacted by the deletions

**Step 3: Implement the minimal code changes**

- Delete unused placeholder abstractions.
- Keep the persisted outbox + relay publisher path intact.
- Remove stale doc/test references to generic jobs unless a live use case already exists.

**Step 4: Run the targeted async tests**

Confirm:

- the relay path still works
- no deleted abstraction is still referenced

**Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java \
  services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java \
  services/api/src/test \
  docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md
git commit -m "refactor: simplify async foundation around outbox relay"
```

### Task 3: Finish public request-path convergence for the remaining mixed flows

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/api/TaskController.java`
- Modify: `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- Modify: `services/api/src/main/java/mn/tasky/booking/api/BookingIntentController.java`
- Modify: `services/api/src/main/java/mn/tasky/payment/api/PaymentController.java`
- Modify: `services/api/src/main/java/mn/tasky/wallet/api/WalletController.java`
- Modify: relevant runtime composition services under `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/`
- Modify: relevant module `publicapi` ports under `services/api/src/main/java/mn/tasky/**/publicapi/`
- Modify: targeted backend tests only

**Step 1: Write the failing tests for one endpoint family at a time**

Order:

1. task / application / booking lifecycle request paths
2. payment / wallet request paths
3. booking-intent request paths

For each family:

- add or tighten architecture expectations first
- add or update scenario-backed or focused integration tests for parity

**Step 2: Run only the targeted failing tests**

Run:

- the architecture test for the relevant controller family
- the scenario-backed backend tests for the flow being migrated

Do not start implementation until the relevant tests fail for the expected reason.

**Step 3: Implement the minimal production changes**

- Move orchestration out of controllers.
- Route cross-module or audience-specific flows through runtime composition services.
- Route owned-module flows through module `publicapi` command/query ports.
- Remove controller-level feature-toggle branching that exists only because orchestration is misplaced.

**Step 4: Run the targeted tests again**

Confirm both:

- request-path boundary now matches the allowed architecture shape
- behavior remains unchanged

**Step 5: Commit after each endpoint family**

Example pattern:

```bash
git add services/api/src/main/java/mn/tasky/task/api/TaskController.java \
  services/api/src/main/java/mn/tasky/runtime/publicapi/composition \
  services/api/src/main/java/mn/tasky/**/publicapi \
  services/api/src/test
git commit -m "refactor: cut over <family> request path to final v2 shape"
```

### Task 4: Finish admin/runtime convergence where state-changing orchestration still leaks

**Files:**

- Modify: state-changing admin controllers under `services/api/src/main/java/mn/tasky/admin/api/`
- Modify: runtime admin composition services under `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/`
- Modify: targeted backend tests only

**Step 1: Identify non-exception admin controllers still orchestrating through concrete services**

- Do not touch `OutboxReplayController` or `AdminFeatureToggleController` unless they violate the explicit exception rule.

**Step 2: Write the failing architecture/parity tests**

- One admin family at a time.

**Step 3: Implement the minimal cutover**

- Move remaining state-changing orchestration to admin runtime composition services or module public ports.

**Step 4: Run the targeted tests**

- Confirm admin request paths now use one allowed shape only.

**Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky/admin/api \
  services/api/src/main/java/mn/tasky/runtime/adminapi/composition \
  services/api/src/test
git commit -m "refactor: finish admin request-path convergence"
```

### Task 5: Delete superseded orchestration paths and transition shims

**Files:**

- Delete or Modify: legacy service adapters, compatibility shims, and duplicate orchestration helpers made dead by Tasks 3-4
- Modify: any tests that still point at the deleted transition path

**Step 1: Search for dead references after each cutover**

- Look for legacy controller dependencies, obsolete runtime helpers, and duplicate orchestration services.

**Step 2: Write or tighten tests so deletion is safe**

- Prefer architecture assertions and targeted flow tests over broad speculative refactors.

**Step 3: Delete the dead code**

- Remove only code proven unreachable or superseded by the new path.
- If a shim must remain, record the owner and deletion trigger in docs before moving on.

**Step 4: Run the relevant targeted tests**

- Confirm no endpoint or worker still relies on the deleted path.

**Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky services/api/src/test
git commit -m "refactor: remove superseded rewrite shims"
```

### Task 6: Update canonical backend docs to match the live architecture

**Files:**

- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- Modify: `CHANGELOG.md`

**Step 1: Update docs only after code and tests are green**

- Do not describe intended architecture as live until the implementation matches it.

**Step 2: Document the final backend state**

- request-path shapes
- exception set
- live async foundation
- deleted speculative abstractions
- tranche completion status

**Step 3: Run doc-adjacent verification**

Run:

```bash
./gradlew openApiValidate
```

Expected:

- PASS

**Step 4: Commit**

```bash
git add docs/ARCHITECTURE.md docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md CHANGELOG.md
git commit -m "docs: finalize backend rewrite architecture"
```

## Final Verification

Run these before calling the backend rewrite finalized:

```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
./gradlew openApiValidate
./gradlew gateSmoke
```

Also run the targeted scenario-backed and integration tests touched by the migrated flow families. Do **not** claim completion based on architecture tests alone.

## Completion Criteria

This plan is complete only when:

- all meaningful backend request paths use one allowed shape
- the exception registry is explicit and narrow
- the live async foundation is the persisted outbox relay path only
- speculative async placeholders are removed
- dead rewrite shims are deleted or explicitly carried with owner + deletion trigger
- canonical backend docs describe the live backend accurately
