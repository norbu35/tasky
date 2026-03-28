# Audit Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remediate the March 27, 2026 audit findings across security, backend integrity, contract parity, frontend parity, and operational readiness without weakening the repo's existing verification policy.

**Architecture:** Start with containment and blast-radius reduction, then fix transactional correctness and contract drift, then restore frontend parity, and finally harden infra and CI gates. Keep each change vertically sliced and test-first so high-risk behavior changes land behind clear evidence and rollback boundaries.

**Tech Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL/PostGIS, React/Vite, React Native/Expo, pnpm, Gradle, GitHub Actions

---

## Recommended Execution Order

1. Security containment
2. Storage and PII boundary hardening
3. Booking/dispute/payout transactional integrity
4. Contract parity restoration
5. Mobile/web parity fixes
6. Infra and release-gate hardening

## Workstream Notes

- Use `scripts/agent-flow.sh start --agent <name> --ticket <ID> --slug <slug> --workspace isolated` for each remediation ticket.
- Treat Tasks 1, 2, 3, and 8 as `high` risk in self-verification.
- Do not batch unrelated work into one commit. One task below should normally map to one ticket and one logical PR.
- Run `scripts/agent-flow.sh verify --ticket <ID>` before every push/update.

### Task 1: Contain Dev Auth and Auth Throttling Bypasses

**Files:**
- Modify: `src/main/resources/application-dev.yml`
- Modify: `src/main/java/mn/tasky/auth/api/DevAuthController.java`
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java`
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java`
- Modify: `src/main/java/mn/tasky/auth/api/OtpController.java`
- Modify: `src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- Modify: `src/main/java/mn/tasky/auth/api/TokenController.java`
- Modify: `src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- Create or modify: `src/main/java/mn/tasky/common/security/ClientIpResolver.java`
- Test: `src/test/java/mn/tasky/auth/DevAuthIntegrationTests.java`
- Test: `src/test/java/mn/tasky/OtpSecurityIntegrationTests.java`
- Test: `src/test/java/mn/tasky/security/SecurityBaselineIntegrationTests.java`

**Step 1: Write the failing tests**

- Add a test that `/api/v1/auth/dev/login` rejects `ADMIN`.
- Add a test that startup fails when dev-auth is enabled outside explicitly local profiles.
- Add a test that spoofed `X-Forwarded-For` does not bypass OTP/Facebook/refresh limits when no trusted proxy depth is configured.

**Step 2: Run the targeted tests to confirm failure**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.auth.DevAuthIntegrationTests \
  --tests mn.tasky.OtpSecurityIntegrationTests \
  --tests mn.tasky.security.SecurityBaselineIntegrationTests
```

Expected: FAIL on the new admin-dev-auth and forwarded-header cases.

**Step 3: Implement the minimal production fix**

- Remove committed fallback security secrets from `application-dev.yml`.
- Restrict dev auth to `CUSTOMER` and `TASKER` only.
- Fail fast unless dev auth is explicitly local-only.
- Centralize client IP resolution and only trust forwarding headers when a configured trusted proxy depth is present.
- Reuse the same resolver in OTP, Facebook, token refresh, and global rate-limit code paths.

**Step 4: Re-run tests and security smoke**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.auth.DevAuthIntegrationTests \
  --tests mn.tasky.OtpSecurityIntegrationTests \
  --tests mn.tasky.security.SecurityBaselineIntegrationTests
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/main/resources/application-dev.yml \
  src/main/java/mn/tasky/auth/api/DevAuthController.java \
  src/main/java/mn/tasky/auth/application/AuthService.java \
  src/main/java/mn/tasky/common/config/SecurityConfig.java \
  src/main/java/mn/tasky/auth/api/OtpController.java \
  src/main/java/mn/tasky/auth/api/FacebookAuthController.java \
  src/main/java/mn/tasky/auth/api/TokenController.java \
  src/main/java/mn/tasky/common/security/RateLimitFilter.java \
  src/main/java/mn/tasky/common/security/ClientIpResolver.java \
  src/test/java/mn/tasky/auth/DevAuthIntegrationTests.java \
  src/test/java/mn/tasky/OtpSecurityIntegrationTests.java \
  src/test/java/mn/tasky/security/SecurityBaselineIntegrationTests.java
git commit -m "security(auth): lock down dev auth and trusted client IP handling"
```

### Task 2: Bind Storage Keys to the Caller and Resource Type

**Files:**
- Modify: `src/main/java/mn/tasky/task/application/TaskService.java`
- Modify: `src/main/java/mn/tasky/task/dto/CreateTaskRequest.java`
- Modify: `src/main/java/mn/tasky/task/dto/UpdateTaskRequest.java`
- Modify: `src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- Modify: `src/main/java/mn/tasky/user/api/UserProfileController.java`
- Modify: `src/main/java/mn/tasky/verification/api/VerificationController.java`
- Create or modify: `src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java`
- Test: `src/test/java/mn/tasky/task/TaskLifecycleIntegrationTests.java`
- Test: `src/test/java/mn/tasky/task/TaskControllerUnitTests.java`

**Step 1: Write the failing tests**

- Add a test that task creation rejects a photo key outside the task-photo namespace.
- Add a test that a user cannot attach another user's upload key and receive a signed download URL.
- Add a test that download signing only accepts expected namespaces per resource type.

**Step 2: Run the targeted tests**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.task.TaskLifecycleIntegrationTests \
  --tests mn.tasky.task.TaskControllerUnitTests
```

Expected: FAIL on invalid-key acceptance.

**Step 3: Implement the minimal production fix**

- Introduce a single storage-key policy utility with namespace rules for avatar, task photo, verification, and dispute evidence objects.
- Validate key prefix, resource type, and caller ownership before persisting any key.
- Reject signing requests for keys outside allowed namespaces.

**Step 4: Re-run tests**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.task.TaskLifecycleIntegrationTests \
  --tests mn.tasky.task.TaskControllerUnitTests
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/main/java/mn/tasky/task/application/TaskService.java \
  src/main/java/mn/tasky/task/dto/CreateTaskRequest.java \
  src/main/java/mn/tasky/task/dto/UpdateTaskRequest.java \
  src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java \
  src/main/java/mn/tasky/common/storage/StorageKeyPolicy.java \
  src/main/java/mn/tasky/user/api/UserProfileController.java \
  src/main/java/mn/tasky/verification/api/VerificationController.java \
  src/test/java/mn/tasky/task/TaskLifecycleIntegrationTests.java \
  src/test/java/mn/tasky/task/TaskControllerUnitTests.java
git commit -m "security(storage): enforce upload key ownership and namespace policy"
```

### Task 3: Make Booking, Dispute, and Payout Transitions Atomic and Auditable

**Files:**
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`
- Modify: `src/main/java/mn/tasky/booking/application/BookingService.java`
- Create or modify: `src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- Modify: `src/main/java/mn/tasky/dispute/application/DisputeService.java`
- Modify: `src/main/java/mn/tasky/admin/api/AdminPayoutController.java`
- Modify: `src/main/java/mn/tasky/wallet/application/WalletService.java`
- Modify: `src/main/java/mn/tasky/common/audit/AuditEventDao.java` only if extra helpers are needed
- Test: `src/test/java/mn/tasky/booking/BookingIntegrationTests.java`
- Test: `src/test/java/mn/tasky/dispute/DisputeIntegrationTests.java`
- Test: `src/test/java/mn/tasky/payment/PayoutIntegrationTests.java`
- Test: `src/test/java/mn/tasky/admin/AdminPayoutControllerUnitTests.java`

**Step 1: Write the failing tests**

- Add a test that booking cancellation/completion fails as a single unit if task-state or timeline writes fail.
- Add a test that payout processing is compare-and-set and cannot double-process the same request.
- Add a test that dispute resolution and payout processing both emit immutable audit events in the same transaction.

**Step 2: Run the targeted tests**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.booking.BookingIntegrationTests \
  --tests mn.tasky.dispute.DisputeIntegrationTests \
  --tests mn.tasky.payment.PayoutIntegrationTests \
  --tests mn.tasky.admin.AdminPayoutControllerUnitTests
```

Expected: FAIL on non-atomic transition and duplicate payout cases.

**Step 3: Implement the minimal production fix**

- Move booking, task, timeline, and outbox writes into one transactional application service.
- Convert payout state change to compare-and-set on `PENDING`, and gate ledger insertion on affected-row count.
- Emit `audit_events` for dispute resolution and payout processing with actor, resource, old/new state, and reason.

**Step 4: Re-run targeted tests**

Run the same Gradle command as Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add src/main/java/mn/tasky/booking/api/BookingController.java \
  src/main/java/mn/tasky/booking/application/BookingService.java \
  src/main/java/mn/tasky/booking/application/BookingLifecycleService.java \
  src/main/java/mn/tasky/dispute/application/DisputeService.java \
  src/main/java/mn/tasky/admin/api/AdminPayoutController.java \
  src/main/java/mn/tasky/wallet/application/WalletService.java \
  src/test/java/mn/tasky/booking/BookingIntegrationTests.java \
  src/test/java/mn/tasky/dispute/DisputeIntegrationTests.java \
  src/test/java/mn/tasky/payment/PayoutIntegrationTests.java \
  src/test/java/mn/tasky/admin/AdminPayoutControllerUnitTests.java
git commit -m "fix(lifecycle): make booking and payout transitions atomic"
```

### Task 4: Align Dispute Workflow With the Contract

**Files:**
- Modify: `docs/API.yaml`
- Modify: `src/main/java/mn/tasky/dispute/api/DisputeController.java`
- Modify: `src/main/java/mn/tasky/dispute/dto/DisputeRequest.java`
- Modify: `src/main/java/mn/tasky/dispute/application/DisputeService.java`
- Create if needed: `src/main/java/mn/tasky/dispute/api/DisputeEvidenceController.java`
- Test: `src/test/java/mn/tasky/dispute/DisputeEvidenceIntegrationTests.java`
- Test: `src/test/java/mn/tasky/dispute/DisputeControllerUnitTests.java`

**Step 1: Decide and document the workflow**

- Choose one model and stick to it:
  - evidence required at create time, or
  - dispute can open first and evidence can be appended within the grace period.
- Update `docs/API.yaml` first to match the intended behavior.

**Step 2: Write the failing tests**

- Add a test for the chosen creation rule.
- If append-after-create is kept, add tests for append authorization, append window, and insufficient-evidence auto-close.
- Add a test that open disputes block completion/cancellation.

**Step 3: Run the targeted tests**

Run:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.dispute.DisputeEvidenceIntegrationTests \
  --tests mn.tasky.dispute.DisputeControllerUnitTests \
  --tests mn.tasky.booking.BookingIntegrationTests \
  openApiValidate
```

Expected: FAIL on the current create-only controller behavior or spec mismatch.

**Step 4: Implement the fix**

- Align DTO validation, service behavior, controller surface, and scheduler expectations.
- Enforce open-dispute guards inside booking completion and cancellation transitions.

**Step 5: Re-run tests and contract validation**

Run the same command as Step 3.

Expected: PASS.

**Step 6: Commit**

```bash
git add docs/API.yaml \
  src/main/java/mn/tasky/dispute/api/DisputeController.java \
  src/main/java/mn/tasky/dispute/dto/DisputeRequest.java \
  src/main/java/mn/tasky/dispute/application/DisputeService.java \
  src/main/java/mn/tasky/dispute/api/DisputeEvidenceController.java \
  src/test/java/mn/tasky/dispute/DisputeEvidenceIntegrationTests.java \
  src/test/java/mn/tasky/dispute/DisputeControllerUnitTests.java \
  src/test/java/mn/tasky/booking/BookingIntegrationTests.java
git commit -m "fix(disputes): align evidence workflow and closure guards"
```

### Task 5: Restore OpenAPI and Generated-Client Authority

**Files:**
- Modify: `docs/API.yaml`
- Modify: `packages/sdk/src/generated/api-types.ts` via generator
- Modify: `packages/sdk/src/index.ts` only if exports must expand
- Modify: `apps/web/src/lib/apiClient.ts`
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`
- Modify: `src/test/java/mn/tasky/contract/ApiContractTraceabilityTests.java`
- Create: `src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java`

**Step 1: Write parity tests first**

- Add a test that compares declared Spring mappings to the OpenAPI path set.
- Add a test that fails when deferred endpoints remain in `docs/API.yaml` without explicit deferral metadata.

**Step 2: Run the failing tests**

Run:

```bash
./gradlew --no-daemon test --tests mn.tasky.contract.ApiContractTraceabilityTests --tests mn.tasky.contract.OpenApiSpringParityTests
pnpm --filter @tasky/sdk generate
```

Expected: FAIL on current undocumented live endpoints and undocumented dead paths.

**Step 3: Implement the fix**

- Either implement or explicitly defer missing endpoints.
- Document all live endpoints in `docs/API.yaml`.
- Remove hand-written request shapes where generated schema types should be used directly.

**Step 4: Re-run parity checks**

Run:

```bash
./gradlew --no-daemon test --tests mn.tasky.contract.ApiContractTraceabilityTests --tests mn.tasky.contract.OpenApiSpringParityTests
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/mobile typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add docs/API.yaml \
  packages/sdk/src/index.ts \
  packages/sdk/src/generated/api-types.ts \
  apps/web/src/lib/apiClient.ts \
  apps/mobile/src/lib/mobileApiClient.ts \
  src/test/java/mn/tasky/contract/ApiContractTraceabilityTests.java \
  src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java
git commit -m "refactor(contract): enforce openapi parity across clients and server"
```

### Task 6: Repair the Mobile Task-Posting Flow End-to-End

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Modify: `apps/mobile/src/features/tasks/hooks/useCreateTask.ts`
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/budget.tsx`
- Test: `apps/mobile/__tests__/App.test.tsx`
- Create: `apps/mobile/__tests__/screens/customer/task-create/TaskCreateFlow.test.tsx`

**Step 1: Write the failing tests**

- Add a test that the wizard preserves uploaded photo keys across screens.
- Add a test that the review screen submits `intake_answers`, `intake_schema_version`, and `photo_keys`.
- Add a test that the API client request shape matches the generated task-create schema.

**Step 2: Run the targeted tests**

Run:

```bash
pnpm --filter @tasky/mobile test:unit -- --runInBand apps/mobile/__tests__/App.test.tsx apps/mobile/__tests__/screens/customer/task-create/TaskCreateFlow.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: FAIL on missing payload fields and placeholder photo flow.

**Step 3: Implement the flow**

- Replace the placeholder photo step with actual selection/upload state management.
- Carry structured intake answers and schema version through the wizard.
- Type request payloads from generated SDK schemas instead of handwritten mobile-only shapes.

**Step 4: Re-run tests**

Run the same command as Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/new/intake.tsx \
  apps/mobile/src/app/(customer)/tasks/new/photos.tsx \
  apps/mobile/src/app/(customer)/tasks/new/review.tsx \
  apps/mobile/src/features/tasks/hooks/useCreateTask.ts \
  apps/mobile/src/lib/mobileApiClient.ts \
  apps/mobile/src/app/(customer)/tasks/new/location.tsx \
  apps/mobile/src/app/(customer)/tasks/new/schedule.tsx \
  apps/mobile/src/app/(customer)/tasks/new/budget.tsx \
  apps/mobile/__tests__/App.test.tsx \
  apps/mobile/__tests__/screens/customer/task-create/TaskCreateFlow.test.tsx
git commit -m "fix(mobile): restore contract-driven task posting flow"
```

### Task 7: Repair Broken Web Customer Routes and Applicants Flow

**Files:**
- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/CustomerTaskDetailsPage.tsx`
- Modify: `apps/web/src/pages/customer/CustomerBookingDetailPage.tsx`
- Modify: `apps/web/src/pages/customer/CustomerApplicantsPage.tsx`
- Modify: `apps/web/src/lib/apiClient.ts`
- Test: `apps/web/tests/integration/customer-phase1.test.tsx`
- Create or modify: `apps/web/src/pages/__tests__/CustomerTaskPage.test.tsx`
- Create: `apps/web/src/pages/customer/__tests__/CustomerBookingDetailPage.test.tsx`
- Create: `apps/web/src/pages/customer/__tests__/CustomerApplicantsPage.test.tsx`

**Step 1: Write the failing tests**

- Add tests for `:taskId` and `:bookingId` route-param loading.
- Add a test that the applicants page fetches applicants for the routed task and wires accept/profile actions.
- Add a test that hardcoded scaffolding copy is removed from the rendered page.

**Step 2: Run the targeted tests**

Run:

```bash
pnpm --filter @tasky/web test:unit -- CustomerTaskPage CustomerBookingDetailPage CustomerApplicantsPage
pnpm --filter @tasky/web typecheck
```

Expected: FAIL on param mismatch and scaffold behavior.

**Step 3: Implement the minimal fix**

- Standardize on `useParams` for routed entity IDs.
- Remove placeholder fallbacks like `booking-1`.
- Replace dead scaffolding with real fetch/render/action wiring.

**Step 4: Re-run tests**

Run the same command as Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/router/AppRoutes.tsx \
  apps/web/src/pages/CustomerTaskDetailsPage.tsx \
  apps/web/src/pages/customer/CustomerBookingDetailPage.tsx \
  apps/web/src/pages/customer/CustomerApplicantsPage.tsx \
  apps/web/src/lib/apiClient.ts \
  apps/web/src/pages/__tests__/CustomerTaskPage.test.tsx \
  apps/web/src/pages/customer/__tests__/CustomerBookingDetailPage.test.tsx \
  apps/web/src/pages/customer/__tests__/CustomerApplicantsPage.test.tsx \
  apps/web/tests/integration/customer-phase1.test.tsx
git commit -m "fix(web): restore customer route and applicants flow parity"
```

### Task 8: Re-establish Shared Contract and Token Boundaries

**Files:**
- Modify: `packages/design-tokens/src/index.ts`
- Modify: `packages/design-tokens/src/colors.ts`
- Modify: `packages/design-tokens/src/layout.ts`
- Modify: `packages/design-tokens/src/motion.ts`
- Modify: `apps/mobile/src/design/tokenAdapter.ts`
- Modify: `apps/web/src/lib/apiClient.ts`
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`
- Test: `apps/mobile/__tests__/design/tokens.test.ts`
- Test: `apps/web/tests/unit/token-binding.test.tsx`

**Step 1: Write the failing tests**

- Add tests that both clients consume exported token APIs rather than deep-importing internal package files.
- Add tests that request payload types come from generated schemas where applicable.

**Step 2: Run the targeted tests**

Run:

```bash
pnpm --filter @tasky/mobile test:unit -- --runInBand apps/mobile/__tests__/design/tokens.test.ts
pnpm --filter @tasky/web test:unit -- token-binding
```

Expected: FAIL on current deep-import and handwritten-request assumptions.

**Step 3: Implement the fix**

- Export canonical token and motion surfaces from `@tasky/design-tokens`.
- Remove mobile deep imports and client-local request definitions where generated schemas exist.

**Step 4: Re-run tests**

Run the same command as Step 2, then:

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/mobile typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/design-tokens/src/index.ts \
  packages/design-tokens/src/colors.ts \
  packages/design-tokens/src/layout.ts \
  packages/design-tokens/src/motion.ts \
  apps/mobile/src/design/tokenAdapter.ts \
  apps/web/src/lib/apiClient.ts \
  apps/mobile/src/lib/mobileApiClient.ts \
  apps/mobile/__tests__/design/tokens.test.ts \
  apps/web/tests/unit/token-binding.test.tsx
git commit -m "refactor(frontend): restore shared token and request contracts"
```

### Task 9: Harden Runtime Infra, DR, and Release Gates

**Files:**
- Modify: `docker/init-db.sql`
- Modify: `docker-compose.yml`
- Modify: `src/main/resources/application.yml`
- Modify: `src/main/resources/application-prod.yml`
- Modify: `docker/backup.sh`
- Create: `docker/restore.sh`
- Modify: `scripts/self-verify.sh`
- Modify: `scripts/validate-migrations.py`
- Modify: `scripts/performance-smoke.sh`
- Modify: `.github/workflows/quality-gates.yml`
- Create: `.github/workflows/release-gate.yml`
- Modify: `docs/LAUNCH_ROADMAP.md`
- Modify: `docs/quality/SELF_VERIFY_CONTRACT.md`

**Step 1: Write the failing checks/tests**

- Add a test or CI assertion that runtime uses `tasky_app` rather than owner creds.
- Add a CI assertion that `migration_safety` exercises fresh and upgrade database runs.
- Add a CI assertion that `performance_smoke` hits at least one core API endpoint, not just `/actuator/health`.
- Add a release-gate checklist artifact requirement before promotion.

**Step 2: Run the current checks to capture the gap**

Run:

```bash
python3 scripts/validate-migrations.py
bash scripts/performance-smoke.sh
rg -n "migration_safety|performance_smoke|sast_dependency_scan" scripts/self-verify.sh docs/quality/SELF_VERIFY_CONTRACT.md .github/workflows/quality-gates.yml
```

Expected: evidence that the current checks are weaker than policy.

**Step 3: Implement the fix**

- Separate migration credentials from runtime app credentials and wire PgBouncer/app to `tasky_app`.
- Add executable restore support for database and object storage.
- Expose readiness/liveness/metrics through infra-appropriate management access, not human admin JWTs.
- Upgrade self-verify and CI workflows so high-risk checks match policy.
- Add a release-gate workflow that enforces migration, rollback, and readiness signoff artifacts.

**Step 4: Re-run verification**

Run:

```bash
python3 scripts/validate-migrations.py
bash scripts/performance-smoke.sh
./gradlew --no-daemon test --tests mn.tasky.common.ObservabilityIntegrationTests --tests mn.tasky.security.AuthorizationMatrixTests
```

Expected: PASS and updated workflow parity.

**Step 5: Commit**

```bash
git add docker/init-db.sql \
  docker-compose.yml \
  src/main/resources/application.yml \
  src/main/resources/application-prod.yml \
  docker/backup.sh \
  docker/restore.sh \
  scripts/self-verify.sh \
  scripts/validate-migrations.py \
  scripts/performance-smoke.sh \
  .github/workflows/quality-gates.yml \
  .github/workflows/release-gate.yml \
  docs/LAUNCH_ROADMAP.md \
  docs/quality/SELF_VERIFY_CONTRACT.md
git commit -m "chore(infra): align runtime hardening and release gates with policy"
```

## Final Verification Pass

After all tasks land, run the full high-risk regression once:

```bash
pnpm install --frozen-lockfile
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
./gradlew --no-daemon test openApiValidate
scripts/self-verify.sh --ticket <FINAL-TICKET> --risk high --req <REQ-IDS> --out artifacts/self-verify.json
python3 scripts/validate-self-verify.py artifacts/self-verify.json docs/quality/self-verify.schema.json
```

Expected: PASS across frontend, backend, contract validation, and self-verification.
