# Web Phase 1 Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the web client’s Phase `0-1` parity work by integrating the already-built parity foundation and then closing the remaining shared, customer, and tasker gaps through tested vertical slices.

**Architecture:** Keep the current Vite + React Router web app and continue building on the new parity shells plus focused page modules already on this branch. Do not restart from greenfield: parity shells, shared baseline pages, customer baseline pages, and their focused tests already exist and must be integrated forward rather than rebuilt.

**Tech Stack:** React 18, React Router 6, TypeScript, TanStack Query, Vitest, Playwright, Radix UI, Tailwind, shared `AppContext`, current web API client

---

## Current Branch State

Already implemented and verified in focused tests:

- `docs/plans/2026-03-26-web-phase-1-parity-matrix.md`
- `apps/web/src/components/parity/*`
- `apps/web/tests/unit/parity-shells.test.tsx`
- `apps/web/src/pages/shared/*`
- `apps/web/tests/integration/shared-parity.test.tsx`
- `apps/web/src/pages/customer/*`
- `apps/web/tests/integration/customer-phase1.test.tsx`

The remaining work is **integration plus missing route families**, not greenfield page invention.

## File Structure Plan

### Controller-owned integration hotspots

- `apps/web/src/router/AppRoutes.tsx`
- `apps/web/src/pages/index.ts`
- `apps/web/src/locales/en/translation.json`
- `apps/web/src/locales/mn/translation.json`
- `apps/web/src/layout/DesktopSidebar.tsx`
- `apps/web/src/layout/BottomNavBar.tsx`
- `apps/web/src/layout/Header.tsx`
- `apps/web/src/router/RouteGuards.tsx`
- `apps/web/src/lib/userAccess.ts`

These files should be treated as **controller-only merge points** during subagent-driven execution. Workers may own page/test slices, but route/export/nav/locale wiring should be integrated serially by the controller after each page slice is reviewed.

### Shared/customer files already created and to be integrated or extended

- `apps/web/src/pages/shared/*`
- `apps/web/src/pages/customer/*`

### Remaining new files expected

- `apps/web/src/pages/shared/AppUpdatePage.tsx`
- `apps/web/src/pages/customer/CustomerBookingsPage.tsx`
- `apps/web/src/pages/customer/CustomerBookingDetailPage.tsx`
- `apps/web/src/pages/customer/CustomerBookingConfirmedPage.tsx`
- `apps/web/src/pages/customer/CustomerTimelinePage.tsx`
- `apps/web/src/pages/customer/CustomerReschedulePage.tsx`
- `apps/web/src/pages/customer/CustomerNoShowReminderDialog.tsx`
- `apps/web/src/pages/customer/CustomerDisputeRaisePage.tsx`
- `apps/web/src/pages/customer/CustomerDisputeStatusPage.tsx`
- `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx`
- `apps/web/src/pages/customer/CustomerRebookPage.tsx`
- `apps/web/src/pages/tasker/TaskerTaskDetailPage.tsx`
- `apps/web/src/pages/tasker/TaskerApplicationSentPage.tsx`
- `apps/web/src/pages/tasker/VerificationGatePage.tsx`
- `apps/web/src/pages/tasker/VerificationConsentPage.tsx`
- `apps/web/src/pages/tasker/VerificationUploadPage.tsx`
- `apps/web/src/pages/tasker/VerificationPendingPage.tsx`
- `apps/web/src/pages/tasker/VerificationApprovedPage.tsx`
- `apps/web/src/pages/tasker/VerificationRejectedPage.tsx`
- `apps/web/src/pages/tasker/VerificationSubmittedPage.tsx`
- `apps/web/src/pages/tasker/TaskerJobsPage.tsx`
- `apps/web/src/pages/tasker/TaskerBookingDetailPage.tsx`
- `apps/web/src/pages/tasker/TaskerNoShowDialog.tsx`
- `apps/web/src/pages/tasker/TaskerCancelDialog.tsx`
- `apps/web/src/pages/tasker/TaskerStatsPage.tsx`
- `apps/web/src/pages/tasker/TaskerPrivacyPage.tsx`
- `apps/web/src/pages/tasker/TaskerProfilePolishPage.tsx`

### Remaining new integration tests expected

- `apps/web/tests/integration/customer-bookings-phase1.test.tsx`
- `apps/web/tests/integration/tasker-phase1.test.tsx`
- `apps/web/tests/integration/navigation-phase1.test.tsx`

## Execution Rules

- Treat existing focused green slices as assets to integrate, not work to replace.
- TDD remains mandatory for every new route family or behavior change.
- Prefer explicit `vitest run <package-relative path>` commands over broad `pnpm test -- <token>` commands, because the latter currently over-matches and runs too much of the web suite.
- Keep Phase `0-1` invariants intact:
  - Facebook-first auth
  - no active OTP behavior
  - manual verification
  - direct settlement messaging
  - no live Phase `2` / `3+` runtime activation

## Task 1: Integrate Completed Shared And Customer Baselines

**Files:**
- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/index.ts`
- Modify: `apps/web/src/locales/en/translation.json`
- Modify: `apps/web/src/locales/mn/translation.json`
- Modify: `apps/web/src/pages/ProfilePage.tsx`
- Modify: `apps/web/src/pages/MessagingNotificationsPage.tsx`
- Modify: `apps/web/src/pages/CustomerTaskPage.tsx`
- Modify: `apps/web/src/pages/CustomerTaskDetailsPage.tsx`
- Create: `apps/web/src/pages/shared/AppUpdatePage.tsx`
- Test: `apps/web/tests/integration/shared-parity.test.tsx`
- Test: `apps/web/tests/integration/customer-phase1.test.tsx`
- Test: `apps/web/tests/integration/auth.test.tsx`
- Test: `apps/web/tests/integration/messaging.test.tsx`
- Test: `apps/web/tests/integration/authz-guards.test.tsx`
- Test: `apps/web/tests/integration/tasks.test.tsx`
- Test: `apps/web/tests/integration/navigation-phase1.test.tsx`

- [ ] Write or tighten failing tests for the real app routes that should now expose the shared and customer baseline pages.
- [ ] Add a real route-integration test in `navigation-phase1.test.tsx` that mounts the app and proves the newly exported shared/customer routes are reachable through `AppRoutes.tsx`.
- [ ] Run the exact focused tests to capture the red failures:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/shared-parity.test.tsx
  pnpm --filter @tasky/web exec vitest run tests/integration/customer-phase1.test.tsx
  pnpm --filter @tasky/web exec vitest run tests/integration/navigation-phase1.test.tsx tests/integration/auth.test.tsx tests/integration/messaging.test.tsx tests/integration/authz-guards.test.tsx tests/integration/tasks.test.tsx
  ```
- [ ] Add exports for the new shared/customer pages from `apps/web/src/pages/index.ts`.
- [ ] Wire real routes for the new shared/customer surfaces in `AppRoutes.tsx`.
- [ ] Update profile, messaging, and legacy customer pages so the new route set is reachable without breaking existing flows.
- [ ] Add the `App Update` operational surface into the shared route family and shared parity regression.
- [ ] Add browser-native permission explanation treatment where web depends on notifications, location, or camera access, and prove it in focused tests:
  - notifications context in the shared communication/notifications flow
  - location context in customer task posting
  - camera/upload context only where an upload flow would otherwise fail without explanation
- [ ] Add or revise locale copy needed by the integrated shared/customer surfaces.
- [ ] Re-run the same focused tests until green.

Expected:
- shared and customer baseline pages are reachable through the real app shell
- old overloaded routes are no longer the only entry points

## Task 2: Close Customer Booking, Timeline, Dispute, And Rescue Gaps

**Files:**
- Create: `apps/web/src/pages/customer/CustomerBookingsPage.tsx`
- Create: `apps/web/src/pages/customer/CustomerBookingDetailPage.tsx`
- Create: `apps/web/src/pages/customer/CustomerBookingConfirmedPage.tsx`
- Create: `apps/web/src/pages/customer/CustomerTimelinePage.tsx`
- Create: `apps/web/src/pages/customer/CustomerReschedulePage.tsx`
- Create: `apps/web/src/pages/customer/CustomerNoShowReminderDialog.tsx`
- Create: `apps/web/src/pages/customer/CustomerDisputeRaisePage.tsx`
- Create: `apps/web/src/pages/customer/CustomerDisputeStatusPage.tsx`
- Create: `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx`
- Create: `apps/web/src/pages/customer/CustomerRebookPage.tsx`
- Modify: `apps/web/src/pages/BookingConfirmationPage.tsx`
- Modify: `apps/web/src/pages/BookingSafetyPage.tsx`
- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/index.ts`
- Test: `apps/web/tests/integration/customer-bookings-phase1.test.tsx`
- Test: `apps/web/tests/integration/booking-payment.test.tsx`
- Test: `apps/web/tests/integration/booking-safety.test.tsx`

- [ ] Write the failing `customer-bookings-phase1` integration test covering bookings list, booking detail, timeline, reschedule, no-show flag, no-show reminder, dispute status, and rescue entry.
- [ ] Run it to verify the route family is red:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/customer-bookings-phase1.test.tsx
  ```
- [ ] Implement the new customer booking/dispute pages using parity shells and existing booking data patterns.
- [ ] Keep the no-show reminder as a distinct surface instead of collapsing it into generic no-show handling.
- [ ] Split `BookingConfirmationPage` from the confirmed/success state.
- [ ] Keep direct-settlement Phase `0-1` messaging intact; do not surface wallet or escrow business behavior.
- [ ] Re-run the focused booking test set:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/customer-bookings-phase1.test.tsx tests/integration/booking-payment.test.tsx tests/integration/booking-safety.test.tsx
  ```

Expected:
- customer booking/dispute/rescue route family is present and tested

## Task 3: Add Tasker Browse, Application, Verification, And Jobs Parity

**Files:**
- Create: `apps/web/src/pages/tasker/TaskerTaskDetailPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerApplicationSentPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationGatePage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationConsentPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationUploadPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationPendingPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationApprovedPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationRejectedPage.tsx`
- Create: `apps/web/src/pages/tasker/VerificationSubmittedPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerJobsPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerBookingDetailPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerNoShowDialog.tsx`
- Create: `apps/web/src/pages/tasker/TaskerCancelDialog.tsx`
- Create: `apps/web/src/pages/tasker/TaskerStatsPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerPrivacyPage.tsx`
- Create: `apps/web/src/pages/tasker/TaskerProfilePolishPage.tsx`
- Modify: `apps/web/src/pages/TaskerFeedPage.tsx`
- Modify: `apps/web/src/pages/TaskerTasksPage.tsx`
- Modify: `apps/web/src/pages/VerificationPage.tsx`
- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/index.ts`
- Test: `apps/web/tests/integration/tasker-phase1.test.tsx`
- Test: `apps/web/tests/integration/booking-safety.test.tsx`
- Test: `apps/web/tests/integration/tasks.test.tsx`

- [ ] Write the failing `tasker-phase1` integration test for tasker detail, application-sent, verification states, jobs, stats, privacy, and profile polish.
- [ ] Run it to verify red:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/tasker-phase1.test.tsx
  ```
- [ ] Implement the missing tasker route family with parity shells and current tasker data patterns.
- [ ] Preserve manual verification and Phase `0-1` tasker behavior; do not activate DAN or payment rails.
- [ ] Re-run the focused tasker verification set:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/tasker-phase1.test.tsx tests/integration/tasks.test.tsx tests/integration/booking-safety.test.tsx
  ```

Expected:
- tasker route family reaches Phase `0-1` parity without later-phase activation

## Task 4: Controller Integration Checkpoint

**Files:**
- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/index.ts`
- Modify: `apps/web/src/locales/en/translation.json`
- Modify: `apps/web/src/locales/mn/translation.json`

- [ ] Merge the outputs of Tasks 2 and 3 into the shared route/export/locale hotspots.
- [ ] Resolve route naming, export ordering, and copy collisions centrally instead of delegating those hotspots to page workers.
- [ ] Run the route-family integration tests after the merge:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/customer-bookings-phase1.test.tsx tests/integration/tasker-phase1.test.tsx tests/integration/navigation-phase1.test.tsx
  ```

Expected:
- worker-owned page slices are integrated into the real app shell without shared-file conflicts

## Task 5: Finish Navigation, Guards, Copy, And Accessibility Integration

**Files:**
- Modify: `apps/web/src/router/RouteGuards.tsx`
- Modify: `apps/web/src/layout/DesktopSidebar.tsx`
- Modify: `apps/web/src/layout/BottomNavBar.tsx`
- Modify: `apps/web/src/layout/Header.tsx`
- Modify: `apps/web/src/lib/userAccess.ts`
- Modify: `apps/web/src/locales/en/translation.json`
- Modify: `apps/web/src/locales/mn/translation.json`
- Test: `apps/web/tests/integration/authz-guards.test.tsx`
- Test: `apps/web/tests/integration/navigation-phase1.test.tsx`
- Test: `apps/web/tests/integration/auth.test.tsx`
- Test: `apps/web/tests/integration/messaging.test.tsx`

- [ ] Write the failing `navigation-phase1` integration test for role-based nav exposure and redirects.
- [ ] Run it to capture the red:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/navigation-phase1.test.tsx
  ```
- [ ] Update shared nav, headers, bottom nav, and guards to expose the new Phase `0-1` routes only.
- [ ] Ensure suspended/banned routing remains correct after the new route family is exposed.
- [ ] Consolidate the route/copy changes into the locale files.
- [ ] Re-run the focused nav/auth/shared regression:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/navigation-phase1.test.tsx tests/integration/authz-guards.test.tsx tests/integration/auth.test.tsx tests/integration/messaging.test.tsx
  ```

Expected:
- real app navigation and guard behavior align with the new route map

## Task 6: Full Web Verification And Smoke Gate

**Files:**
- Modify: only the files already touched by Tasks 1-4 if verification exposes real regressions
- Test: `apps/web/tests/integration/*.test.tsx`
- Test: relevant accessibility tests under `apps/web/tests/accessibility/`

- [ ] Run the focused route-family suites together:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/shared-parity.test.tsx tests/integration/customer-phase1.test.tsx tests/integration/customer-bookings-phase1.test.tsx tests/integration/tasker-phase1.test.tsx tests/integration/navigation-phase1.test.tsx
  ```
- [ ] Run the existing affected regression suites:
  ```bash
  pnpm --filter @tasky/web exec vitest run tests/integration/auth.test.tsx tests/integration/messaging.test.tsx tests/integration/authz-guards.test.tsx tests/integration/tasks.test.tsx tests/integration/booking-payment.test.tsx tests/integration/booking-safety.test.tsx
  ```
- [ ] Run typecheck and diff check:
  ```bash
  pnpm --filter @tasky/web typecheck
  git diff --check
  ```
- [ ] Run the broader web test pass if the focused suites are clean:
  ```bash
  pnpm --filter @tasky/web test
  ```

Expected:
- all touched parity work is green under focused regression
- typecheck and diff check pass
- broader web suite is at least no worse than before this parity work
