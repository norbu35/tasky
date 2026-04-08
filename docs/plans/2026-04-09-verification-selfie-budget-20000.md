# Verification Selfie And 20k Budget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make selfie upload mandatory for tasker verification and raise the minimum task budget to 20,000 MNT across the authoritative documents, backend, generated API surface, and clients.

**Architecture:** PRD is the authority. `docs/ARCHITECTURE.md` and `docs/API.yaml` must be corrected to match the approved product truth, then the generated SDK, Spring Boot backend, and mobile/web boundary adapters must be aligned to that contract. Verification requires a new persisted `selfie_key` backend field and admin/detail surfacing; budget enforcement must be raised uniformly in request validation and shared schema validation.

**Tech Stack:** Spring Boot 3, Java 21, JDBI 3, Flyway, OpenAPI, generated TypeScript SDK, React, React Native, Zod.

---

### Task 1: Record the authoritative contract change

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/API.yaml`

**Steps:**
1. Update PRD task budget language from the legacy placeholder threshold to 20,000 MNT.
2. Update PRD verification language so consent precedes ID + selfie upload.
3. Update architecture data model and flow sections to include `selfie_key` and the new budget minimum.
4. Update OpenAPI request/response schemas and endpoint descriptions to require `selfie_key`.

### Task 2: Align persisted backend verification and task validation

**Files:**
- Modify: `services/api/src/main/resources/db/migration/*`
- Modify: `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- Modify: `services/api/src/main/java/mn/tasky/verification/dto/VerificationSubmitRequest.java`
- Modify: `services/api/src/main/java/mn/tasky/verification/api/VerificationController.java`
- Modify: `services/api/src/main/java/mn/tasky/task/dto/CreateTaskRequest.java`
- Modify: `services/api/src/main/java/mn/tasky/task/dto/UpdateTaskRequest.java`

**Steps:**
1. Add database support for persisting verification selfie storage keys.
2. Require and validate `selfie_key` on verification submit.
3. Pass selfie storage through verification persistence and admin/detail reads.
4. Raise backend budget validation from the legacy value to 20,000 MNT.

### Task 3: Regenerate SDK and align frontend/mobile boundaries

**Files:**
- Modify: `packages/sdk/src/generated/*`
- Modify: `packages/core/src/tasks/taskSchema.ts`
- Modify: `packages/core/src/tasks/useTasks.ts`
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`
- Modify: `apps/web/src/lib/apiClient.ts`
- Modify: verification UI call sites in `apps/mobile/src/features/verification/**` and `apps/web/src/pages/VerificationPage.tsx`

**Steps:**
1. Run SDK generation from the corrected OpenAPI contract.
2. Raise shared task schema budget minimum to 20,000 MNT.
3. Update mobile/web verification submit payloads to send `selfie_key` plus consent fields.
4. Keep booking/task boundary fixes already made in this branch intact.

### Task 4: Update tests and note QA-owned scenario drift

**Files:**
- Modify: `services/api/src/test/java/mn/tasky/task/TaskScenarioTests.java`
- Modify: `apps/mobile/__tests__/lib/mobileApiClientBoundary.test.ts`
- Modify: `apps/mobile/__tests__/lib/mobileApiClientSchema.test.ts`

**Steps:**
1. Extend mobile boundary tests to assert selfie verification payload shape.
2. Update backend assertions where the contract shape changed.
3. Record that `tests/scenarios/task.md` still encodes the pre-correction budget threshold and cannot be edited from this branch under the repo rules.

### Task 5: Verify and merge

**Files:**
- Modify: `CHANGELOG.md`

**Steps:**
1. Run focused backend tests for task/verification boundary changes.
2. Run mobile boundary tests and package typechecks.
3. Capture any remaining pre-existing failures separately from this change.
4. Merge `codex/prd-api-boundary-alignment` into `main` once verification is complete.
