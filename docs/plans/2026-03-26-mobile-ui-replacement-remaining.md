# Mobile UI Replacement Remaining Work Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining mobile UI replacement work after the already-verified auth, infra, notifications, and customer post-task slices.

**Architecture:** The mobile app is already structured around Expo Router screens, shared tokens, and reusable templates. The remaining work should proceed as vertical slices that keep current verified behavior stable while reconciling each route to its Stitch screen spec, localized copy, and navigation contract.

**Tech Stack:** React Native (Expo Router), TypeScript, Jest, `@testing-library/react-native`, `react-i18next`, `@tasky/design-tokens`

---

## Current Baseline

The following slices are already implemented and verified in this workspace:

- `SCR-SHARED-001`, `002`, `005`, `006`, `007`, `008`, `009`
- `SCR-SHARED-016`
- `SCR-INFRA-001` through `005`
- `SCR-CUST-001` through `008`

The following verification baseline has already passed locally:

```bash
pnpm --filter @tasky/mobile typecheck
git diff --check
```

Targeted Jest suites that already passed in this branch:

- auth and onboarding
- notification center
- infrastructure screens
- customer post-task wizard

Use that as the safety baseline. Do not regress the already-finished slices while completing the remaining scope.

## Scope Split

### Completed and frozen for now

- Slice 1 except OTP migration screens
- Slice 4
- Slice 5

### Remaining Phase 0-1 work

1. Shared communication and profile surfaces
2. Shared review and account-status surfaces
3. Customer task-management, booking, dispute, and rescue surfaces
4. Tasker browse, verification, application, jobs, and stats surfaces

### Gated work to leave until the end

1. Phase 2 UI shells
2. Phase 3 UI shells
3. OTP migration flow (`SCR-SHARED-003`, `004`) if the product decision remains to ship shell-only states

## Execution Rules

- Follow TDD for every screen group:
  - write or tighten tests first
  - run the focused failing suite
  - implement the minimal screen changes
  - rerun the focused suite
  - rerun `pnpm --filter @tasky/mobile typecheck`
  - rerun `git diff --check`
- Keep slices vertical. Do not mix unrelated shared, customer, and tasker flows in one patch unless a shared component must change.
- If delegation becomes available again, use explorers for spec reconciliation and bounded workers for disjoint file sets. Current account state may still block subagents, so local execution remains the fallback.
- Preserve the design-system contract in `docs/ARCHITECTURE.md` Section 3.4 and the existing template structure in `apps/mobile/src/components/templates`.

## Remaining Slice Order

### Slice A: Shared Inbox and Profile

**Why first:** These routes already exist with tests, they unlock the message/profile paths referenced by later customer and tasker booking screens, and they are smaller than the booking/dispute surfaces.

**Screens:**

- `SCR-SHARED-010` Conversation List
- `SCR-SHARED-011` Chat Detail
- `SCR-SHARED-012` My Profile
- `SCR-SHARED-013` Edit Profile
- `SCR-SHARED-014` Settings
- `SCR-SHARED-015` Delete Account

**Files to review and likely modify:**

- `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- `apps/mobile/src/app/(tabs)/profile.tsx`
- `apps/mobile/src/app/(shared)/profile/edit.tsx`
- `apps/mobile/src/app/(shared)/profile/settings.tsx`
- `apps/mobile/src/app/(shared)/profile/delete.tsx`
- `apps/mobile/src/locales/en/translation.json`
- `apps/mobile/src/locales/mn/translation.json`

**Primary test files:**

- `apps/mobile/__tests__/screens/shared/ConversationList.test.tsx`
- `apps/mobile/__tests__/screens/shared/ChatDetail.test.tsx`
- `apps/mobile/__tests__/screens/shared/profile/MyProfileScreen.test.tsx`
- `apps/mobile/__tests__/screens/shared/profile/EditProfileScreen.test.tsx`
- `apps/mobile/__tests__/screens/shared/profile/SettingsScreen.test.tsx`
- `apps/mobile/__tests__/screens/shared/profile/AccountDeletionScreen.test.tsx`

**Acceptance focus:**

- message list grouping, unread state, search, and empty state
- chat header/task reference behavior and composer states
- profile hero, stats, and action rows
- settings navigation to terms/help/privacy/delete
- delete-account modal and destructive confirmation flow

**Verification command:**

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/shared/ConversationList.test.tsx \
  __tests__/screens/shared/ChatDetail.test.tsx \
  __tests__/screens/shared/profile/MyProfileScreen.test.tsx \
  __tests__/screens/shared/profile/EditProfileScreen.test.tsx \
  __tests__/screens/shared/profile/SettingsScreen.test.tsx \
  __tests__/screens/shared/profile/AccountDeletionScreen.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

### Slice B: Shared Reviews and Account Status

**Why next:** These screens are referenced from customer and tasker booking detail flows. Finishing them early reduces downstream navigation ambiguity.

**Screens:**

- `SCR-SHARED-017` Review Form
- `SCR-SHARED-018` Review Reminder
- `SCR-SHARED-019` Review Hard Lock
- `SCR-SHARED-020` Suspended Account
- `SCR-SHARED-021` Banned Account

**Files to review and likely modify:**

- `apps/mobile/src/app/(shared)/review/[bookingId].tsx`
- `apps/mobile/src/app/(shared)/account/suspended.tsx`
- `apps/mobile/src/app/(shared)/account/banned.tsx`
- `apps/mobile/src/components/templates/ModalSheetTemplate.tsx` if reminder/hard-lock behavior needs template support
- `apps/mobile/src/locales/en/translation.json`
- `apps/mobile/src/locales/mn/translation.json`

**Primary test files:**

- `apps/mobile/__tests__/screens/shared/ReviewForm.test.tsx`
- `apps/mobile/__tests__/screens/shared/ReviewReminder.test.tsx`
- `apps/mobile/__tests__/screens/shared/ReviewHardLock.test.tsx`
- `apps/mobile/__tests__/screens/shared/SuspendedAccount.test.tsx`
- `apps/mobile/__tests__/screens/shared/BannedAccount.test.tsx`

**Acceptance focus:**

- multi-rating review form states and validation
- reminder sheet CTA behavior
- hard-lock enforcement messaging
- suspended countdown and logout path
- banned state, support copy, and non-recoverable logout

**Verification command:**

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/shared/ReviewForm.test.tsx \
  __tests__/screens/shared/ReviewReminder.test.tsx \
  __tests__/screens/shared/ReviewHardLock.test.tsx \
  __tests__/screens/shared/SuspendedAccount.test.tsx \
  __tests__/screens/shared/BannedAccount.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

### Slice C: Customer Task Detail, Applicants, Bookings, Disputes

**Why third:** This is the largest remaining customer vertical slice and depends on the shared inbox/review surfaces. It should be broken into three passes but kept within one customer-focused workstream.

#### Pass C1: Task Detail and Applicant Selection

**Screens:**

- `SCR-CUST-009` Task Detail
- `SCR-CUST-010` Task Cancel Sheet
- `SCR-CUST-011` Applicants List
- `SCR-CUST-012` Applicant Timeout/Decline Sheet
- `SCR-CUST-013` Tasker Public Profile
- `SCR-CUST-014` Booking Confirmation
- `SCR-CUST-015` Booking Confirmed

**Files:**

- `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`
- `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`

**Tests:**

- `apps/mobile/__tests__/screens/customer/TaskDetailCustomerScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/TaskCancelSheet.test.tsx`
- `apps/mobile/__tests__/screens/customer/ApplicantsListScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/TaskerProfileScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/BookingConfirmedScreen.test.tsx`

#### Pass C2: Booking List, Detail, Timeline, Reschedule, Completion

**Screens:**

- `SCR-CUST-016` Bookings List
- `SCR-CUST-017` Booking Detail
- `SCR-CUST-018` Confirm Completion Sheet
- `SCR-CUST-019` Booking Timeline
- `SCR-CUST-020` Reschedule
- `SCR-CUST-021` No-Show Sheet
- `SCR-CUST-022` Booking Cancel Sheet
- `SCR-CUST-023` Rebook

**Files:**

- `apps/mobile/src/app/(customer)/bookings/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
- `apps/mobile/src/app/(customer)/rebook.tsx`

**Tests:**

- `apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/BookingDetailScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/ConfirmCompletionSheet.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/BookingTimelineScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/RescheduleScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx`
- `apps/mobile/__tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx`
- `apps/mobile/__tests__/screens/customer/bookings/RebookScreen.test.tsx`

#### Pass C3: Dispute and Rescue

**Screens:**

- `SCR-CUST-024` Dispute Raise
- `SCR-CUST-025` Dispute Status
- `SCR-CUST-026` No Applicant Rescue
- `SCR-CUST-027` Instant Match Customer

**Files:**

- `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx` if rescue entry stays on task detail
- rescue/instant-match support components if extraction becomes necessary

**Tests:**

- `apps/mobile/__tests__/screens/customer/disputes/DisputeRaiseScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/disputes/DisputeStatusScreen.test.tsx`
- `apps/mobile/__tests__/screens/customer/NoApplicantRescue.test.tsx`

**Customer slice verification command:**

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/customer/TaskDetailCustomerScreen.test.tsx \
  __tests__/screens/customer/TaskCancelSheet.test.tsx \
  __tests__/screens/customer/ApplicantsListScreen.test.tsx \
  __tests__/screens/customer/TaskerProfileScreen.test.tsx \
  __tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx \
  __tests__/screens/customer/bookings/BookingConfirmedScreen.test.tsx \
  __tests__/screens/customer/bookings/BookingsListScreen.test.tsx \
  __tests__/screens/customer/bookings/BookingDetailScreen.test.tsx \
  __tests__/screens/customer/bookings/ConfirmCompletionSheet.test.tsx \
  __tests__/screens/customer/bookings/BookingTimelineScreen.test.tsx \
  __tests__/screens/customer/bookings/RescheduleScreen.test.tsx \
  __tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx \
  __tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx \
  __tests__/screens/customer/bookings/RebookScreen.test.tsx \
  __tests__/screens/customer/disputes/DisputeRaiseScreen.test.tsx \
  __tests__/screens/customer/disputes/DisputeStatusScreen.test.tsx \
  __tests__/screens/customer/NoApplicantRescue.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

### Slice D: Tasker Browse, Verification, and Jobs

**Why last among Phase 0-1:** It is the broadest remaining area and contains the most route creation work, including missing verification entry surfaces.

#### Pass D1: Browse and task detail

**Screens:**

- `SCR-TASK-001` Task Feed
- `SCR-TASK-002` Task Detail Tasker View

**Files:**

- `apps/mobile/src/app/(tabs)/index.tsx`
- `apps/mobile/src/app/task/[id].tsx`
- `apps/mobile/src/app/task/[id]/applicants.tsx` only if applicant detail state is reused

**Tests:**

- `apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/TaskDetailScreen.test.tsx`

#### Pass D2: Verification flow

**Screens:**

- `SCR-TASK-003` through `010`
- `SCR-TASK-011` Application Sent

**Files:**

- `apps/mobile/src/app/(tasker)/verification/index.tsx` create
- `apps/mobile/src/app/(tasker)/verification/consent.tsx`
- `apps/mobile/src/app/(tasker)/verification/upload.tsx`
- `apps/mobile/src/app/(tasker)/verification/pending.tsx`
- `apps/mobile/src/app/(tasker)/verification/approved.tsx`
- `apps/mobile/src/app/(tasker)/verification/rejected.tsx`
- `apps/mobile/src/app/(tasker)/verification/submitted.tsx`
- `apps/mobile/src/app/(tasker)/verification/dan.tsx` create as gated shell if kept in scope
- supporting verification components if needed

**Tests:**

- `apps/mobile/__tests__/screens/tasker/VerificationGate.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/ConsentScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/UploadScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/PendingScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/ApprovedScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/RejectedScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/verification/SubmittedScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/ApplicationSent.test.tsx`

#### Pass D3: Jobs, no-show, cancel, stats, privacy

**Screens:**

- `SCR-TASK-012` My Jobs
- `SCR-TASK-013` Booking Detail Tasker
- `SCR-TASK-014` Tasker No-Show
- `SCR-TASK-015` Tasker Cancel
- `SCR-TASK-016` Tasker Stats
- `SCR-TASK-018` Privacy Policy

**Files:**

- `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
- `apps/mobile/src/app/(tasker)/stats.tsx`
- `apps/mobile/src/app/(shared)/legal/privacy.tsx`

**Tests:**

- `apps/mobile/__tests__/screens/tasker/jobs/MyJobsScreen.test.tsx`
- `apps/mobile/__tests__/screens/tasker/jobs/BookingDetailTasker.test.tsx`
- `apps/mobile/__tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx`
- `apps/mobile/__tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx`
- `apps/mobile/__tests__/screens/tasker/jobs/TaskerStatsScreen.test.tsx`
- `apps/mobile/__tests__/screens/shared/profile/PrivacyPolicyScreen.test.tsx`

**Tasker slice verification command:**

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/tasker/TaskFeedScreen.test.tsx \
  __tests__/screens/tasker/TaskDetailScreen.test.tsx \
  __tests__/screens/tasker/VerificationGate.test.tsx \
  __tests__/screens/tasker/verification/ConsentScreen.test.tsx \
  __tests__/screens/tasker/verification/UploadScreen.test.tsx \
  __tests__/screens/tasker/verification/PendingScreen.test.tsx \
  __tests__/screens/tasker/verification/ApprovedScreen.test.tsx \
  __tests__/screens/tasker/verification/RejectedScreen.test.tsx \
  __tests__/screens/tasker/verification/SubmittedScreen.test.tsx \
  __tests__/screens/tasker/ApplicationSent.test.tsx \
  __tests__/screens/tasker/jobs/MyJobsScreen.test.tsx \
  __tests__/screens/tasker/jobs/BookingDetailTasker.test.tsx \
  __tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx \
  __tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx \
  __tests__/screens/tasker/jobs/TaskerStatsScreen.test.tsx \
  __tests__/screens/shared/profile/PrivacyPolicyScreen.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

### Slice E: Gated Phase 2 and Phase 3 shells

**Why last:** These are allowed to be UI shells, and some have no active API contract yet. They should not block the Phase 0-1 finish line.

**Phase 2:**

- `SCR-SHARED-003`, `SCR-SHARED-004`
- `SCR-TASK-017`
- `SCR-P2-001` through `005`

**Phase 3:**

- `SCR-P3-001` through `005`

**Rule:** do not start these until slices A through D are passing and the remaining unresolved Phase 0-1 surfaces are closed.

## Final Regression Gate

After each slice passes its focused suite, expand to the broader mobile regression pack:

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/auth \
  __tests__/screens/shared \
  __tests__/screens/infra \
  __tests__/screens/customer \
  __tests__/screens/tasker \
  __tests__/integration/auth-flow.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

If runtime or timeout constraints make the full suite too expensive every pass, run it at least after finishing each major slice.

## Recommended Next Action

Start with **Slice A: Shared Inbox and Profile**. It has the best dependency-to-effort ratio, and finishing it first will make the downstream booking and tasker flows easier to reconcile without navigation churn.
