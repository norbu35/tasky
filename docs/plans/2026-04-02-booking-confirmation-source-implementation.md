# Booking Confirmation Source Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a source-aware confirmation contract so rebook reaches the real booking confirmation surface safely, while keeping instant match phase-gated and preserving the existing applicant-accept path.

**Architecture:** Keep `acceptApplication` unchanged for applicant confirmation. Introduce a booking-intent contract only for `REBOOK` and `INSTANT_MATCH`, and make the shared confirmation UI submit by source. Rebook is the first implementable slice; instant match remains blocked on Phase 3 activation plus scenario coverage.

**Tech Stack:** OpenAPI 3, generated `@tasky/sdk`, Spring Boot 3, JDBI, React Native (Expo), React 18, TypeScript, Jest, Vitest, JUnit

---

### Task 1: Validate Scenario Coverage Before Backend Code

**Files:**
- Check: `tests/scenarios/booking.md`
- Check: `tests/registry.yaml`
- Check: `src/test/java/mn/tasky/task/TaskAcceptScenarioTests.java`
- Check: `src/test/java/mn/tasky/booking/BookingScenarioTests.java`

**Step 1: Confirm existing scenario coverage**

- Verify `SCN-BOOK-007` and `SCN-BOOK-008` cover only applicant confirmation
- Verify there is no authored scenario for rebook-intent confirmation
- Verify there is no authored scenario for instant-match confirmation

**Step 2: Stop if the new scenarios are still absent**

Run: `rg -n "rebook intent|instant-match intent|instant match.*confirm|rebook.*confirm" tests/scenarios tests/registry.yaml -S`
Expected: no matching authored scenarios; record the blocker in the task/PR notes and do not add backend tests yet

### Task 2: Define The Source-Aware API Contract

**Files:**
- Modify: `docs/API.yaml`
- Regenerate: `packages/sdk/src/generated/api-types.ts`

**Step 1: Add booking-intent schemas and endpoints**

- Add `BookingIntent`
- Add `CreateBookingIntentRequest`
- Add `ConfirmBookingIntentRequest`
- Add `POST /tasks/{id}/booking-intents`
- Add `GET /booking-intents/{id}`
- Add `POST /booking-intents/{id}/confirm`
- Keep `POST /tasks/{id}/applications/{applicationId}/accept` unchanged
- Keep `/tasks/{id}/instant-match` phase-gated

**Step 2: Regenerate the SDK**

Run: `pnpm sdk:generate`
Expected: generated SDK types include the new booking-intent operations

### Task 3: Add Client Methods For Booking Intents

**Files:**
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`
- Modify: `apps/web/src/lib/apiClient.ts`

**Step 1: Write the failing client-level tests if coverage exists**

- Prefer updating existing client tests if present
- If no client tests exist, add focused frontend tests at the screen level instead of inventing backend-only tests

**Step 2: Add minimal client methods**

- `createBookingIntent`
- `getBookingIntent`
- `confirmBookingIntent`

**Step 3: Verify types**

Run: `pnpm -r typecheck`
Expected: PASS with no handwritten API type drift

### Task 4: Implement Rebook Intent Creation In Backend

**Files:**
- Create: `src/main/java/mn/tasky/booking/dto/BookingIntent.java`
- Create: `src/main/java/mn/tasky/booking/dto/CreateBookingIntentRequest.java`
- Create: `src/main/java/mn/tasky/booking/dto/ConfirmBookingIntentRequest.java`
- Create: `src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- Create: `src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`
- Modify: `src/main/java/mn/tasky/booking/AGENTS.md`
- Modify: Flyway migrations under `src/main/resources/db/migration/`

**Step 1: Write the failing backend test only if authored scenarios exist**

- If QA has not added scenarios, do not invent one
- If QA has added scenarios, write a single-scenario test per authored case

**Step 2: Implement minimal REBOOK intent creation**

- persist booking intent with source `REBOOK`
- validate original booking ownership and completed status
- capture task/tasker summary snapshot needed by confirm UI
- keep instant-match logic out of this task

**Step 3: Run targeted backend checks**

Run: `./gradlew test --tests '*Booking*'`
Expected: PASS for touched booking tests only when authored scenarios exist

### Task 5: Implement Rebook Intent Confirmation

**Files:**
- Modify: `src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- Modify: `src/main/java/mn/tasky/booking/application/BookingService.java`
- Modify: `src/main/java/mn/tasky/common/idempotency/IdempotencyOperations.java`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`

**Step 1: Write the failing confirmation test only if authored scenarios exist**

- cover success path
- cover disclaimer-required rejection
- cover idempotent replay

**Step 2: Implement minimal confirm behavior**

- require `liability_disclaimer_accepted=true`
- create the booking against the intent’s task/tasker snapshot
- mark intent confirmed
- return the existing booking on replay

**Step 3: Verify**

Run: `./gradlew test --tests '*Booking*'`
Expected: PASS for touched booking tests only when authored scenarios exist

### Task 6: Wire Mobile Rebook To Booking Intents

**Files:**
- Modify: `apps/mobile/src/app/(customer)/rebook.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- Create: `apps/mobile/src/features/bookings/hooks/useCreateBookingIntent.ts`
- Create: `apps/mobile/src/features/bookings/hooks/useConfirmBookingIntent.ts`
- Modify: `apps/mobile/__tests__/screens/customer/bookings/RebookScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx`

**Step 1: Write the failing mobile tests**

- rebook success should create task, then booking intent, then navigate to confirm with `source=rebook`
- confirm screen should call `confirmBookingIntent` when `source=rebook`
- existing `source=application` path must still call `acceptApplication`

**Step 2: Implement the minimal mobile wiring**

- branch confirm behavior by `source`
- require `bookingIntentId` for `rebook`
- preserve the existing applicant flow behavior

**Step 3: Run targeted mobile tests**

Run: `pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/screens/customer/bookings/RebookScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx`
Expected: PASS

### Task 7: Wire Web Rebook To Booking Intents

**Files:**
- Modify: `apps/web/src/pages/customer/CustomerRebookPage.tsx`
- Modify: `apps/web/src/pages/BookingConfirmationPage.tsx`
- Modify: relevant web tests under `apps/web/tests/`

**Step 1: Write the failing web tests**

- rebook should create a booking intent before navigating to confirmation
- confirmation page should branch by `source`
- applicant flow should remain unchanged

**Step 2: Implement minimal web wiring**

- keep URL-driven confirmation
- add `source` and `bookingIntentId` handling

**Step 3: Run targeted web tests**

Run: `pnpm --filter @tasky/web test -- --runInBand booking-payment customer-bookings-phase1`
Expected: PASS

### Task 8: Keep Instant Match Explicitly Deferred Until Phase 3

**Files:**
- Modify: `docs/API.yaml`
- Modify: `tasks/TASK-002.md`
- Optionally modify: `docs/superpowers/specs/2026-04-02-mobile-design-refresh-design.md`

**Step 1: Document the Phase 3 boundary**

- keep `/tasks/{id}/instant-match` deferred
- state that `INSTANT_MATCH` booking intents must not be implemented until Phase 3 activation and authored scenarios exist

**Step 2: Do not wire frontend confirm flows for instant match yet**

- maintain current safe fallback behavior unless/until the backend contract exists

### Task 9: Run Verification

**Files:**
- No file edits

**Step 1: Run backend verification if backend implementation landed**

Run: `./gradlew test`
Expected: PASS

**Step 2: Run frontend verification**

Run: `pnpm -r typecheck`
Expected: PASS

Run: `pnpm --filter @tasky/mobile test`
Expected: PASS

Run: `pnpm --filter @tasky/web test`
Expected: PASS
