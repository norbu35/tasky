# Tasky Rewrite Hardening Follow-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining post-Tranche-10 architectural gaps by enforcing runtime composition through public ports,
restoring durable audit for concierge assignment, and removing accidental lockfile drift.

**Architecture:** This is a short hardening pass on top of `feature/rewrite`, not a new tranche. Runtime composition
must depend on module `publicapi` ports rather than concrete feature-module application services, and admin override
flows must retain durable audit evidence rather than logs-only fallbacks. Keep the patch minimal and behavior-preserving.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, PostgreSQL, ArchUnit, JUnit 5, Gradle, pnpm

---

## Canonical Inputs

- `docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md`
- `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- `docs/ARCHITECTURE.md`
- `CHANGELOG.md`
- `services/api/src/test/java/mn/tasky/architecture/AudienceCompositionBoundaryTest.java`
- `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`

## Program Rules

- Do not reopen the broader Tranche 10 migration. This is a focused hardening pass only.
- Preserve runtime behavior. The point is boundary enforcement and durability restoration, not feature changes.
- Do not weaken architecture tests to fit the current code. Strengthen code or add the proper seam.
- Use `pnpm` as the only JS package manager in this repo.
- Keep commits small and task-scoped.

## Delivery Order

Complete the tasks in order. Each task should leave the branch in a better state than before.

### Task 1: Add a notification public port and move runtime composition onto it

**Files:**

- Create: `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- Create or Modify: `services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java`
- Modify: `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- Modify: `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/NotificationCompositionService.java`
- Modify: `services/api/src/test/java/mn/tasky/architecture/AudienceCompositionBoundaryTest.java`
- Modify: `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`

**Step 1: Write the failing architecture tests**

- Extend `AudienceCompositionBoundaryTest` so `NotificationController` still depends on the runtime composition service.
- Extend `BackendArchitectureTest` so runtime composition services fail if they depend on feature-module `..application..` classes.
- Allow only `publicapi` ports or explicitly documented exception services.

**Step 2: Run the targeted tests to verify they fail**

Run:

```bash
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
```

Expected:

- FAIL because `NotificationCompositionService` currently depends on `NotificationService`

**Step 3: Write the minimal implementation**

- Introduce `NotificationCommandPort` with just the operations the runtime needs now:
  - `registerDevice(String userId, String token, String platform)`
  - `unregisterDevice(String userId, String token)`
- Implement it with a thin command handler that delegates to `NotificationService`.
- Update `NotificationCompositionService` to depend on `NotificationCommandPort`, not `NotificationService`.

**Step 4: Run the targeted tests to verify they pass**

Run the same two commands and confirm PASS.

**Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java \
  services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java \
  services/api/src/main/java/mn/tasky/notification/application/NotificationService.java \
  services/api/src/main/java/mn/tasky/runtime/publicapi/composition/NotificationCompositionService.java \
  services/api/src/test/java/mn/tasky/architecture/AudienceCompositionBoundaryTest.java \
  services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java
git commit -m "refactor(runtime): route notification composition through public port"
```

### Task 2: Restore durable audit for concierge assignment through a narrow seam

**Files:**

- Create: `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- Create or Modify: `services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java`
- Modify: `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskConciergeAssignmentService.java`
- Modify: `services/api/src/main/java/mn/tasky/common/audit/AuditEventDao.java` only if required by the new handler
- Modify or Create: targeted tests for concierge assignment durability

**Step 1: Write the failing test**

- Add a focused test for concierge assignment proving that a durable audit record is written, not just a log line.
- Prefer a focused service/integration test over a giant full-stack scenario.

**Step 2: Run the targeted test to verify it fails**

Run only the new concierge-assignment test class or method.

Expected:

- FAIL because the current implementation only logs

**Step 3: Write the minimal implementation**

- Introduce `AdminAuditCommandPort` with one method that records an audit event.
- Implement it with a thin handler over `AuditEventDao`.
- Update `AdminTaskConciergeAssignmentService` to use the new port.
- Keep the existing metadata JSON behavior.
- Do not leave logs-only as the source of truth.

**Step 4: Run the targeted test to verify it passes**

- Confirm the audit record is written transactionally.

**Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java \
  services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java \
  services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskConciergeAssignmentService.java \
  services/api/src/test
git commit -m "fix(admin): restore durable concierge assignment audit"
```

### Task 3: Remove accidental npm lockfile drift

**Files:**

- Delete: `package-lock.json`

**Step 1: Verify the repo package-manager contract**

Read:

```bash
sed -n '1,40p' package.json
```

Expected:

- `packageManager: "pnpm@..."`

**Step 2: Delete the stray lockfile**

- Remove `package-lock.json`

**Step 3: Verify no code path requires it**

Run:

```bash
git diff -- package-lock.json
```

Expected:

- the file is deleted and nothing else depends on it

**Step 4: Commit**

```bash
git add package-lock.json
git commit -m "chore(repo): remove stray npm lockfile"
```

### Task 4: Re-verify the hardening pass and sync docs if needed

**Files:**

- Modify: `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `CHANGELOG.md`

Only touch docs if the implementation in Tasks 1-3 lands and changes the truth of the branch.

**Step 1: Run the architecture and smoke gates**

Run:

```bash
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew openApiValidate
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew gateSmoke
```

Expected:

- all commands PASS

**Step 2: Update docs only if they are now more accurate**

- If runtime composition is fully on ports for the touched surfaces, update the Tranche 10 handoff note so it no longer overclaims or underclaims the branch state.
- If concierge assignment now has a durable audit seam again, remove or revise the carried-forward “logs-only” gap.
- Note the `package-lock.json` removal in `CHANGELOG.md` only if repo hygiene changes are already being tracked there.

**Step 3: Commit docs if changed**

```bash
git add docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md docs/ARCHITECTURE.md CHANGELOG.md
git commit -m "docs(rewrite): sync hardening follow-up status"
```

## Final Verification

Before calling this follow-up complete, run:

```bash
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.contract.ApiContractTraceabilityTests"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew :services:api:test --tests "mn.tasky.auth.AuthHttpScenarioTests"
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew openApiValidate
GRADLE_USER_HOME=/tmp/tasky-gradle ./gradlew gateSmoke
```

## Completion Criteria

This follow-up is complete only when:

- runtime composition no longer depends on notification application services directly
- the architecture tests enforce that rule
- concierge assignment writes durable audit evidence again
- `package-lock.json` is gone
- targeted tests and `gateSmoke` pass
