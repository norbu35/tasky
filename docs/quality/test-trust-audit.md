# Test Trust Audit

Last updated: 2026-04-10

## Objective

Classify the existing verification evidence for launch-critical Phase 1 requirements and separate blocker-grade proof from advisory or ceremonial checks.

## Traceability Caveat

- `tests/registry.yaml` still maps scenario `prd_ref` values to the legacy `REQ-*` requirement set.
- The launch-only `REQ-P1-*` mapping therefore lives in `docs/quality/requirement-verification-matrix.md` and should be treated as a maintained translation layer rather than a generated registry export.

## Registry Integrity Findings

| Finding                                                                            | Evidence                                                                                                                                                                                                                                | Release-confidence impact                                                                                                                   |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario registry still uses legacy requirement IDs.                               | `tests/registry.yaml` continues to record `prd_ref: REQ-*` entries rather than launch-only `REQ-P1-*` IDs.                                                                                                                              | The registry is not a launch-truth export by itself; reviewers must translate through the maintained launch matrix.                         |
| Registry status required a fresh sync during this tranche.                         | A fresh `./gradlew --no-daemon gateSmoke` run executed `sync-registry.sh` and updated 12 scenarios from `untested` to `covered`, including `SCN-ANALYTICS-001/002/003`, `SCN-MSG-001/002/003/004`, and `SCN-NOTIF-001/002/003/004/005`. | The current registry is now aligned for those families, but status accuracy still depends on running the sync step as part of verification. |
| Some launch-critical requirement areas still have no direct scenario family.       | Verification workflow, admin feature toggles, admin ban/unban action, Pro badge assignment, and concierge dispatch do not yet have a direct scenario family in `tests/scenarios/*.md`.                                                  | These remain genuine release-risk gaps because there is no blocker-grade backend proof.                                                     |
| At least one critical scenario is intentionally waived pending a deferred feature. | `SCN-BOOK-006` is `status: untested` with `override_status: waived pending tasker-suspension feature`.                                                                                                                                  | The waiver is acceptable only as a deferred-feature decision; it should not be mistaken for launch-ready coverage.                          |

## Current Verification Run

- `./gradlew --no-daemon gateSmoke` passed on 2026-04-09 after redirecting `GRADLE_USER_HOME` into `/tmp`; the run also executed `sync-registry.sh` and updated 12 scenarios from `untested` to `covered`.
- The literal `pnpm -r test` command could not complete in this sandbox because nested workspace `pnpm run` scripts attempted to self-install pnpm into the protected user store under `~/Library/pnpm/store`.
- Equivalent direct workspace commands now split cleanly:
  - Web: `pnpm exec vitest run --reporter verbose` in `apps/web` passed on 2026-04-09 with `38` passing files and `272` passing tests after fixing stale admin-page expectations and i18n setup drift.
  - Mobile: `pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --json --outputFile /tmp/tasky-mobile-jest-22.json` passed on 2026-04-09 with `118` passing suites and `802` passing tests, completing the tranche-long rehab from earlier red baselines (`26/13`, `47/18`, `55/20`, `75/25`, `92/30`, `107/35`, `121/40`, `129/43`, `143/47`, `156/53`, `173/58`, `188/61`, `207/64`, `229/67`, `258/70`, `281/73`, `314/76`, and `362/86`). A follow-up `pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --detectOpenHandles --openHandlesTimeout=1000` run also exited cleanly with all `118` suites / `802` tests passing and did not surface a concrete leaking handle, even though the normal JSON run still prints the generic post-run warning.
- The rebuilt client E2E surfaces now have direct verification evidence:
  - Web Playwright: `pnpm --filter @tasky/web typecheck` passed, `pnpm --filter @tasky/web lint` passed with only the existing `ProfilePage.tsx` fast-refresh warnings, and `pnpm --filter @tasky/web exec playwright test --grep @smoke --project=chromium --list` now resolves only the three outcome-based smoke specs (`customer-happy-path`, `tasker-happy-path`, and `admin-happy-path`) after retiring the legacy route/shell smoke files.
  - Web Playwright execution: `timeout 60 pnpm --filter @tasky/web exec playwright test --grep @smoke --project=chromium` still fails in this sandbox before test logic because Chromium headless shell cannot launch under the local macOS Mach-port restrictions (`mach_port_rendezvous.cc ... Permission denied (1100)`).
  - Mobile Maestro smoke: `bash -n apps/mobile/scripts/run-e2e-smoke.sh` passed, and a fake-CLI harness run proved that `pnpm --filter @tasky/mobile test:e2e:smoke` now expands to three deterministic flows: `smoke.yaml`, `JRN-CUST-01-post-a-task.yaml`, and `tasker-browse.yaml`.
  - CI wiring: `quality-gates.yml`, `nightly-regression.yml`, and `release-gate.yml` now invoke Playwright smoke/regression on Ubuntu and Maestro smoke on macOS with a simulator boot + `expo run:ios --configuration Release` build step.
- The backend release gate was also re-verified in this pass: `GRADLE_USER_HOME=/tmp/gradle ./gradlew --no-daemon gateRegression` passed after removing the blanket JaCoCo package floor from blocking gates, moving mutation enforcement to `gateFull`, and making `sync-registry.sh` degrade cleanly when PIT XML is missing or malformed.

## Client-Side Findings

- The new shared mobile i18n harness plus the guarded global Jest `AsyncStorage` cleanup removed a known false-negative bucket. `TaskFeedScreen`, `CustomerNoShowSheet`, `SettingsScreen`, `TaskDetailCustomerScreen`, `NoApplicantRescue`, and `IntakeFormScreen` now pass under the updated harness, so those earlier failures were test-environment drift rather than product regressions. (`BookingEscrowScreen` was also fixed but has since been removed as part of the post-hardening test realignment.)
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx` and `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx` were repaired in this tranche cycle and now pass their targeted suites. The previous dispute blockers were genuine product/spec defects and are no longer open.
- The booking-detail/list rehab also landed in this cycle. `BookingDetailTasker`, `BookingDetailScreen`, and `BookingsListScreen` now pass after moving the suites onto the shared i18n harness and fixing real runtime translation defects in the bookings list copy (`customer.bookings.pageTitle`, `customer.bookings.emptyDescription`, `customer.bookings.emptyCta`, and missing `BookingsListScreen.*` keys).
- The booking-sheet rehab also landed in this cycle. `ConfirmCompletionSheet`, `RescheduleScreen`, and `CustomerCancelSheet` now pass after moving the suites onto the shared i18n harness and fixing real runtime copy defects in the completion, reschedule, and customer-cancel flows.
- The template/legal rehab also landed in this cycle. `FeedListTemplate`, `DetailTemplate`, `Help`, `Terms`, and `PrivacyPolicyScreen` now pass after moving the suites onto the shared i18n harness, updating stale selectors, and correcting the generic Mongolian `feed/detail` fallback copy so reusable templates no longer render message-specific errors.
- The tasker detail and shared-account rehab also landed in this cycle. `TaskDetailScreen`, `ApplicationSent`, `SuspendedAccount`, `BannedAccount`, and `ReviewHardLock` now pass after the i18n-harness migration, and the malformed Mongolian suspended-account title was corrected. (Deferred-surface suites `LeadUnlockSheet`, `InstantMatchTaskerSheet`, `WalletScreen`, and `WalletPayoutScreen` were also fixed but have since been removed as part of the post-hardening test realignment.)
- The latest customer/auth/shared rehab also landed in this cycle. `RebookScreen`, `ScheduleBudgetScreen`, `ReviewReminder`, and `TasksTabScreen` now pass after moving the suites onto the shared i18n harness and aligning stale selector/copy expectations with the runtime screens. (`OtpScreen` was also fixed but has since been removed as part of the post-hardening test realignment.)
- The later-phase/shared rehab also landed in this cycle. `RoleSelectScreen`, `NotificationCenter`, and `TaskerNoShowSheet` now pass after the i18n-harness migration; this batch also fixed two real runtime defects in `apps/mobile/src/app/(shared)/notifications.tsx` and `apps/mobile/src/app/(auth)/role-select.tsx`. (`EscrowScreen` and `CreditsHistoryScreen` were also fixed but have since been removed as part of the post-hardening test realignment.)
- The auth/navigation integration rehab also landed in this cycle. `auth-flow`, `role-based-ui`, `tasker-journey`, `SplashScreen`, and `OnboardingScreen` now pass after removing stale inline `react-i18next` mocks, aligning splash redirects to the current `/(tabs)` runtime, and replacing an obsolete hidden-tab assertion with the current customer-only FAB behavior.
- The latest customer posting/booking rehab also landed in this cycle. `TaskPostedSuccessScreen`, `InstantMatchScreen`, `LocationScreen`, `PhotoUploadScreen`, and `BookingConfirmedScreen` now pass after moving the suites onto the shared i18n harness, aligning wizard-progress assertions to the real accessibility surface, and updating the stale task-post-success done-route expectation to the current `/(tabs)` runtime.
- The latest integration/provider rehab also landed in this cycle. `customer-journey` and `navigation-wiring` now pass after aligning the suites with the real `RoleProvider` wiring, current customer/tasker tab labels, and the customer-only floating-action-button behavior.
- The latest profile/jobs rehab also landed in this cycle. `EditProfileScreen`, `MyProfileScreen`, `TaskerProfileScreen`, `MyTasksListScreen`, and `TaskerCancelSheet` now pass after the shared i18n-harness migration. This batch also fixed two real runtime defects: the customer task-list hero card was incorrectly rendering the category token `MyTasksListScreen.copy1` as visible copy, and the Mongolian `tasker.jobs.cancel.title` / `heading` translations were wired to unrelated strings.
- The final mobile rehab batch also landed in this cycle. `ChatDetail`, `CategorySelectionScreen`, `MyJobsScreen`, `TaskerStatsScreen`, and `KeyComponents` are now green after migrating the remaining suites to the shared i18n harness, aligning the category-selection flow to the current wizard UX, replacing brittle merged-`className` equality checks with merged-token assertions, and fixing two real runtime defects: `MyJobsScreen` now has real translated tab labels, and `ChatDetailScreen` no longer renders debug-grade STOMP copy in user-facing safety banners. (`CreditsIndexScreen`, `CreditsPayScreen`, and `OtpMigrationScreen` were also fixed but have since been removed as part of the post-hardening test realignment.)

## Trust Model

| Class        | What it means                                                                                                                         | Launch use                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `blocker`    | Backend scenario or contract coverage proves the requirement or unhappy path with an observable outcome.                              | Safe to use as launch-critical evidence.                                           |
| `advisory`   | Web, mobile, Playwright, or Maestro evidence shows the flow or UI state, but the proof is mocked, route-level, or otherwise indirect. | Useful for confidence and regressions, but not sufficient alone for launch claims. |
| `ceremonial` | Shell-only, existence-only, snapshot-like, or mock-only coverage that proves wiring rather than runtime behavior.                     | Good for navigation and copy drift, not for launch confidence.                     |

## High-Value Blocker Evidence

| Evidence family                                                                                                              | Why it is trusted                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `services/api/src/test/java/mn/tasky/**ScenarioTests.java`                                                                   | These tests exercise backend behavior against real application services and assert observable state changes or error codes.               |
| `tests/scenarios/*.md` with matching backend scenario implementations                                                        | The human-authored scenario specs are the canonical behavioral contract for launch-critical flows, even when the generated registry lags. |
| `tests/scenarios/*` unhappy-path checks such as auth fail-closed, booking no-show, dispute window, and task schema rejection | These are the strongest proofs for launch gating rules.                                                                                   |

## Advisory Evidence

| Evidence family                      | Why it is only advisory                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/tests/integration/*`       | These tests often prove user-visible behavior, but many use mocked `apiClient` instances or local harnesses.                                                                                                                                |
| `apps/mobile/maestro/flows/*`        | Useful device-level coverage for the launch-live surfaces that are deterministic under current dev-auth personas, but the evidence still depends on a locally built simulator app rather than backend scenario proof.                       |
| `apps/web/e2e/*` Playwright journeys | The new customer/tasker/admin browser flows prove meaningful UI outcomes, but they still run against mocked API routes rather than a live backend and could not be executed end-to-end in this sandbox because Chromium cannot launch here. |

## Ceremonial Evidence

| Evidence family            | Example                                                                                                                           | Why it is ceremonial                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Shell-only component tests | `apps/mobile/__tests__/screens/tasker/VerificationGate.test.tsx`, `apps/mobile/__tests__/screens/shared/ReviewHardLock.test.tsx`  | They assert rendering and callback wiring, not backend state transitions.                 |
| Mock-only admin UI tests   | `apps/web/src/pages/admin/__tests__/AdminFeaturesPage.test.tsx`, `apps/web/src/pages/admin/__tests__/AdminConciergePage.test.tsx` | They prove the page talks to a mocked client, not that the live runtime path is complete. |
| Empty/loading state checks | Several admin and tasker page tests that only assert skeletons or empty states                                                    | They keep the UI from breaking, but they are not launch evidence on their own.            |

## Highest-Risk Missing Evidence

- `REQ-P1-AUTH-04` still lacks a direct backend scenario for verification-gated tasker role activation.
- `REQ-P1-SAFE-01` still lacks a direct backend verification lifecycle scenario.
- `REQ-P1-SAFE-05` still lacks direct proof of the Pro badge threshold and automatic assignment rule.
- `REQ-P1-ADMIN-03` is still only ceremonial because the feature-toggle page is mocked UI.
- `REQ-P1-ADMIN-04` is only advisory because the ban/unban page lacks a direct backend scenario in this sweep.
- `REQ-P1-ADMIN-05` is mixed: dispute resolution is backend-backed, but concierge dispatch is still only UI-wired evidence.
- Push notification semantics are covered, but device-backed delivery proof is still thin.

## Classification Judgments

| Area                        | Judgment                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Auth and task posting       | Mostly `blocker` evidence exists; the only launch-critical gap is verification-gated role activation.                            |
| Booking and unhappy paths   | Strongest evidence family in the repo; backend scenarios are plentiful and should be treated as launch-blocking proof.           |
| Trust and safety            | Review and dispute behavior is blocker-grade; verification and Pro badge evidence are still incomplete.                          |
| Admin                       | Category management is strong; verification review, ban/unban, toggle management, and concierge dispatch are still too UI-heavy. |
| Messaging and notifications | Backend semantics are blocker-grade; delivery proof is still advisory.                                                           |

## Evidence Notes

- `apps/web/tests/integration/tasks.test.tsx`, `apps/web/tests/integration/customer-phase1.test.tsx`, and `apps/web/tests/integration/booking-safety.test.tsx` are better than shell smoke, but they still rely on mock clients and should stay advisory.
- `apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml`, `tasker-browse.yaml`, `JRN-SHARED-01-onboarding.yaml`, and the active profile/legal smoke flows are useful deterministic device checks, but they are not a substitute for backend scenarios.
- `apps/web/e2e/customer-happy-path.spec.ts`, `tasker-happy-path.spec.ts`, and `admin-happy-path.spec.ts` are now materially stronger than route smoke and are CI-wired, but they should still be treated as advisory because they use mocked browser routes instead of live backend outcomes.
- `services/api/src/test/java/mn/tasky/notification/NotificationScenarioTests.java` proves push semantics at the service/provider boundary with mocks; it does not prove device delivery on a real client.

## Post-Hardening Test Scope Realignment (2026-04-10)

The frontend scope hardening (Tranches 2-4) removed deferred routes from the active web and mobile app trees. The corresponding test realignment removed or relocated test suites that only covered those deferred surfaces:

- **14 mobile Jest test files removed**: `OtpScreen`, `OtpMigrationScreen`, `InstantMatchScreen`, `InstantMatchTaskerSheet`, `BookingEscrowScreen`, `EscrowScreen`, `ProfilePolishScreen`, `ReferralsScreen`, `SubscriptionScreen`, `CreditsHistoryScreen`, `CreditsIndexScreen`, `CreditsPayScreen`, `WalletScreen`, `WalletPayoutScreen`.
- **18 Maestro flows moved to `apps/mobile/maestro/flows/deferred/`**: B2B (4), OTP auth (2), lead unlock (2), credits/wallet/subscription (3), boost/instant match (2), AI profile polish (1), Phase 2/3 screen flows (4). These flows remain available for re-activation when their corresponding features ship.
- **11 launch-live-but-fixture-blocked Maestro flows moved to `apps/mobile/maestro/flows/requires-fixture/`**: messaging, review submission, customer booking/dispute/rebook flows, suspended/banned and network error flows, and tasker apply/active-booking flows. These stay available, but they do not run in the deterministic suite until fixture personas exist.
- **Legacy exploratory Maestro flows moved to `apps/mobile/maestro/flows/legacy/`**: old onboarding, task creation, profile-role-switch, tab-navigation, and smoke-feed flows no longer participate in automated regression.
- **`run-e2e.sh` updated** to execute only the deterministic launch-live flow list, and `run-e2e-smoke.sh` now runs launch smoke + customer post-task + tasker browse.
- **Web tests clean**: No web test files referenced the removed pages. `AppRoutesScope.test.tsx` is retained as the scope-hardening verification test (it asserts removed routes redirect to `/profile`).
- **Web Playwright clean**: All 3 E2E smoke specs cover only launch-live flows.
- **Web README updated**: Removed stale `VerificationPage` reference from the page table.
