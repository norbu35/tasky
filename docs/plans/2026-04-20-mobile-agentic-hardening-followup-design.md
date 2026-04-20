# Mobile Agentic Hardening Follow-Up Spec

Date: 2026-04-20
Scope: residual work after the first pass of `docs/plans/2026-04-20-mobile-agentic-hardening-design.md`
Primary inputs:

- `docs/plans/2026-04-20-mobile-agentic-hardening-design.md`
- current mobile structure-check output
- current `apps/mobile` route and feature-screen layout

## Purpose

The first hardening pass landed the foundational pieces:

- route/file structure checking exists
- domain API modules exist
- deferred mobile code has been moved out of `src/future`
- task draft state exists
- several hotspot screens were decomposed

The remaining work is now more focused. The mobile app no longer needs another broad architecture plan; it needs a targeted follow-up spec that clears the current structural backlog and tightens the checker so it reflects the new architecture accurately.

## Review Summary

Current residual state, based on `node apps/mobile/scripts/structure-check.js`:

- `25` fail items
- `24` warnings

Those break down into:

1. `24` route files still over the enforced `100`-line hard limit
2. `1` remaining route-layer banned import
   - `src/app/(shared)/profile/edit.tsx` still imports `@/features/profile/api`
3. `7` route files in the secondary `61-100` warning band
4. `14` oversized modules under `src/features/**/screens`
   - `10` top-level screen files
   - `4` `.parts.tsx` files
5. `1` oversized orchestration hook under `screens`
   - `src/features/tasks/screens/useTaskReviewSubmit.ts`

## What The First Pass Actually Solved

The first pass should be treated as successful in these areas:

1. Structural enforcement exists
   - `apps/mobile/scripts/structure-check.js`
   - `pnpm --filter @tasky/mobile structure:check`

2. Route-layer API misuse is almost eliminated
   - only one offending route remains

3. Domain API modules exist across the mobile domains
   - auth
   - bookings
   - chat
   - disputes
   - notifications
   - profile
   - review
   - tasks
   - verification

4. Draft state for customer task posting now exists as a feature-local boundary
   - `src/features/tasks/draft/*`

5. Deferred surface noise has been reduced
   - `src/future/**` is no longer part of the active source tree

The follow-up spec should therefore avoid reopening already-landed foundational work unless the current implementation still leaks through compatibility branches or enforcement gaps.

## Residual Problem Statement

The remaining issues are now narrower and more operational:

1. The route backlog is still the main blocker to a clean structure-check pass.
2. The task-post flow still carries compatibility-path param plumbing alongside the new draft store.
3. One route still breaks the route-layer API rule.
4. Oversized screen-family files remain, but the current checker treats `Screen.tsx`, `.parts.tsx`, and `use*.ts` as the same class of warning.
5. Some route files are content-heavy or shell-heavy and need a different remediation pattern than business-flow routes.

## Goals

This follow-up is complete when all of the following are true:

1. `structure:check` has zero fail items
2. all route-layer banned imports are eliminated
3. the task-post flow uses the draft boundary as the default and supported path
4. remaining large screen families are split or rebudgeted intentionally
5. structure-check reflects file role, not just directory placement
6. the residual route backlog is reduced to a small, explicitly tolerated warning set or cleared entirely

## Non-Goals

This follow-up does not reopen:

1. the domain API split that already landed
2. the deferred-surface extraction that already landed
3. another repo-wide mobile architecture rewrite
4. visual redesign work

## Residual Backlog Inventory

## A. Route Failures

These are the current route files above the hard `100`-line limit:

### Auth

- `src/app/(auth)/index.tsx`
- `src/app/(auth)/role-select.tsx`

### Customer task creation and task actions

- `src/app/(customer)/tasks/new/category.tsx`
- `src/app/(customer)/tasks/new/photos.tsx`
- `src/app/(customer)/tasks/new/success.tsx`
- `src/app/(customer)/rebook.tsx`
- `src/app/task/[id].tsx`

### Customer bookings and profiles

- `src/app/(customer)/bookings/confirm.tsx`
- `src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- `src/app/(customer)/taskers/[taskerId].tsx`

### Shared profile and legal

- `src/app/(shared)/profile/edit.tsx`
- `src/app/(shared)/profile/delete.tsx`
- `src/app/(shared)/profile/settings.tsx`
- `src/app/(shared)/legal/privacy.tsx`
- `src/app/(shared)/legal/terms.tsx`

### Tabs and top-level home surfaces

- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/bookings.tsx`
- `src/app/(tabs)/inbox/index.tsx`
- `src/app/(tabs)/profile.tsx`
- `src/app/index.tsx`

### Tasker

- `src/app/(tasker)/jobs/index.tsx`
- `src/app/(tasker)/stats.tsx`
- `src/app/(tasker)/verification/consent.tsx`
- `src/app/(tasker)/verification/upload.tsx`

## B. Route Warnings

These are the current route files in the `61-100` warning band:

- `src/app/(shared)/network-error.tsx`
- `src/app/(shared)/app-update.tsx`
- `src/app/(shared)/account/suspended.tsx`
- `src/app/(customer)/bookings/[bookingId]/cancel.tsx`
- `src/app/(tasker)/jobs/[bookingId]/cancel.tsx`
- `src/app/(tasker)/verification/pending.tsx`
- `src/app/(tasker)/verification/rejected.tsx`

## C. Remaining Route-Layer Violation

- `src/app/(shared)/profile/edit.tsx`
  - still imports `getAvatarUploadUrl` from `@/features/profile/api`
  - still owns avatar upload orchestration inline

## D. Oversized Screen-Family Modules

Current warnings above the `220`-line threshold:

### Tasks

- `src/features/tasks/screens/TaskIntakeScreen.tsx`
- `src/features/tasks/screens/TaskLocationScreen.tsx`
- `src/features/tasks/screens/TaskScheduleScreen.tsx`
- `src/features/tasks/screens/CustomerTasksScreen.tsx`
- `src/features/tasks/screens/ApplicantsSelectionScreen.tsx`
- `src/features/tasks/screens/CustomerTaskDetail.parts.tsx`
- `src/features/tasks/screens/useTaskReviewSubmit.ts`

### Bookings

- `src/features/bookings/screens/BookingConfirmedScreen.tsx`
- `src/features/bookings/screens/BookingDetailScreen.tsx`
- `src/features/bookings/screens/BookingTimelineScreen.tsx`
- `src/features/bookings/screens/BookingsListScreen.tsx`
- `src/features/bookings/screens/BookingReschedule.parts.tsx`

### Chat

- `src/features/chat/screens/ChatConversationScreen.tsx`

### Notifications

- `src/features/notifications/screens/NotificationListScreen.tsx`

### Help

- `src/features/help/screens/HelpCenter.parts.tsx`

### Disputes

- `src/features/disputes/screens/DisputeStatus.parts.tsx`

## E. Draft-Boundary Incompleteness

The task draft store exists, but the route layer still contains compatibility plumbing and duplicated route params in some task-post screens.

Representative example:

- `src/app/(customer)/tasks/new/photos.tsx`
  - supports `draftId`
  - still supports serialized fallback params and fallback route pushes

This means the new draft boundary exists, but the route contract is not yet fully simplified.

## Follow-Up Workstreams

## Workstream 1: Clear All Route Failures

### Objective

Bring `structure:check` to zero fail items by clearing the remaining route files above the hard limit and the one remaining banned import.

### Required Pattern

Each failing route should be remediated using one of these patterns:

1. Thin wrapper
   - keep `Stack.Screen`
   - decode route params
   - render feature screen

2. Re-export alias
   - route file becomes `export { default } from '...'`

3. Content delegation
   - move legal/help/static prose into feature screen or content modules

4. Hook extraction
   - move route-local orchestration into feature-local hook

### Grouped Implementation Order

1. `profile/edit.tsx`
   - remove direct feature-api import
   - introduce a feature hook for avatar upload or a composed screen hook in profile

2. Auth routes
   - extract login and role-select into `features/auth/screens/*`
   - leave route files as wrappers

3. Tabs and home routes
   - move tasker browse, inbox index, bookings tab, and profile tab into feature screens
   - stop importing one route directly from another route

4. Task-post remaining routes
   - category
   - photos
   - success

5. Shared profile routes
   - delete
   - settings
   - edit

6. Tasker routes
   - jobs index
   - stats
   - verification consent
   - verification upload

7. Legal routes
   - privacy
   - terms
   - move prose and state handling out of route files

### Exit Criteria

- all route files are `<= 100` lines
- `profile/edit.tsx` no longer imports feature API directly
- route files no longer import other route files as screen implementations

## Workstream 2: Finish The Task Draft Cutover

### Objective

Make the task draft boundary the supported runtime path instead of a partial compatibility layer.

### Scope

- category
- intake
- photos
- location
- schedule
- review
- success

### Required Changes

1. Remove fallback serialized-param branches once all active steps use `draftId`
2. Reduce route params to:
   - `draftId`
   - route-local navigation-only identifiers where strictly necessary
3. Move step validation and completeness checks into draft utilities
4. Keep draft cleanup in success and abort paths explicit

### Exit Criteria

- task-post flow no longer depends on serialized fallback params
- adding a draft field does not require cross-route param propagation changes

## Workstream 3: Normalize Large Screen Families

### Objective

Reduce the remaining oversized screen-family modules without re-opening the whole mobile app.

### Important Review Decision

The current checker treats all files under `src/features/*/screens/**` the same. That is no longer correct now that the codebase contains:

- `*Screen.tsx`
- `*.parts.tsx`
- `*.model.ts`
- `use*.ts`

The next pass should not simply exempt `.parts.tsx`. Some of them are still too large to be healthy. Instead, the checker should budget by role.

### New File-Role Budgets

Recommended follow-up budgets:

| Role          | Soft Warning | Hard Warning / Fail |
| ------------- | ------------ | ------------------- |
| `*Screen.tsx` | `> 220` warn | `> 280` fail        |
| `*.parts.tsx` | `> 260` warn | `> 340` fail        |
| `*.model.ts`  | `> 180` warn | `> 240` fail        |
| `use*.ts`     | `> 180` warn | `> 240` fail        |

These numbers keep pressure on decomposition without falsely treating every co-located screen helper as equivalent to a route.

### Priority Families

1. Task-post feature screens
   - `TaskIntakeScreen.tsx`
   - `TaskLocationScreen.tsx`
   - `TaskScheduleScreen.tsx`

2. Bookings listing/detail family
   - `BookingDetailScreen.tsx`
   - `BookingTimelineScreen.tsx`
   - `BookingsListScreen.tsx`
   - `BookingReschedule.parts.tsx`

3. Tasks detail/list family
   - `CustomerTasksScreen.tsx`
   - `ApplicantsSelectionScreen.tsx`
   - `CustomerTaskDetail.parts.tsx`

4. Shared utility-heavy screens
   - `ChatConversationScreen.tsx`
   - `NotificationListScreen.tsx`
   - `HelpCenter.parts.tsx`
   - `DisputeStatus.parts.tsx`

### Approved Decomposition Patterns

1. Static section arrays or config objects
   - for help, legal, settings, and notification grouping surfaces

2. Card section families
   - split a monolithic `.parts.tsx` into separate section files when one file becomes a bucket of unrelated chunks

3. Query/view separation
   - keep `Screen.tsx` and `parts.tsx` pure
   - push derived async orchestration into `use*.ts`

4. Formatting helper extraction
   - repeated formatting logic moves into `.model.ts`

### Exit Criteria

- no screen-family file exceeds its role budget without explicit justification
- checker output reflects file role
- remaining warnings are deliberate, not accidental

## Workstream 4: Reclassify Secondary Route Debt

### Objective

Handle the `61-100` route warning band deliberately rather than letting it linger indefinitely.

### Review Note

These seven routes are not urgent architectural breaks. They are secondary debt:

- `network-error`
- `app-update`
- `account/suspended`
- booking/tasker cancel screens
- tasker verification pending/rejected

Most are static or near-static state screens. They can be remediated by:

1. extracting common status-screen composition
2. moving shared copy blocks into content constants
3. accepting a narrow warning-only band for simple one-off state screens if the checker documents that exception

### Decision Required

The next pass should choose one of these approaches and codify it:

1. Strict
   - thin all of them below `60`

2. Tiered
   - allow a stable warning-only band for state screens up to `100`
   - require zero route failures but tolerate a small warning set

Recommended approach: `Tiered`

Reason:

- these routes are not the same risk class as route files that still own real business flow logic
- the fail backlog should be cleared first

### Exit Criteria

- route warning policy is explicit
- state-screen exceptions are documented rather than accidental

## Workstream 5: Update The Structure Checker To Match The Matured Architecture

### Objective

Align the checker to the architecture after the first pass, so it remains credible.

### Required Changes

1. Keep route hard-fail enforcement exactly as the primary gate
2. Keep route banned-import enforcement
3. Keep component/design/future boundary checks
4. Add role-aware screen-family budgets
5. Distinguish:
   - route failures
   - route warnings
   - screen-family warnings
6. Optionally add a rule for route-to-route imports

### Optional Enhancement

Add grouped summary output by category:

- route fail
- route warn
- banned import
- screen warn by role

That makes the remaining backlog easier to manage in slices.

## Proposed Implementation Order

1. Remove the `profile/edit.tsx` route-layer API violation
2. Clear all `25` current fail items from `structure:check`
3. Finish the task draft cutover and remove compatibility branches
4. Refactor the largest remaining screen families
5. Update the checker to use role-aware budgets
6. Decide whether to clear or formally tolerate the seven secondary route warnings

## Verification

For each slice:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile lint`
- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile test:unit`

For task-post route/draft changes:

- targeted task-post Jest suites
- `pnpm --filter @tasky/mobile test:e2e:smoke` when simulator and Maestro are available

## Completion Criteria

This follow-up is complete when:

1. `structure:check` reports zero fail items
2. no route imports feature API modules directly
3. task-post routes rely on `draftId` rather than serialized fallback params
4. the remaining screen-family warnings are reduced or explicitly rebudgeted by file role
5. the route warning band is either cleared or intentionally documented as a tolerated tier

## Immediate Next Slice Recommendation

The highest-leverage next slice is:

1. fix `src/app/(shared)/profile/edit.tsx`
2. extract auth route screens
3. extract tab/home route screens
4. finish task-post route cleanup for `category`, `photos`, and `success`
5. rerun `structure:check`

That slice should remove a large portion of the remaining fail backlog without requiring another broad cross-cutting refactor.
