# Mobile UI Replacement Figma Realignment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign the existing mobile UI replacement branch to the live Figma file, backtrack screens that drifted from Figma, and finish the remaining mobile replacement work that is still unimplemented.

**Architecture:** Treat the live Figma file as the visual source of truth and the checked-in screen specs as the state and acceptance source of truth. Execute in two tracks: first audit and realign screens already changed on this branch, then implement the remaining missing screens in phase order. Keep work vertical by user flow, and keep every Figma-backed screen tied to a specific node id so implementation and review are anchored to the same frame.

**Tech Stack:** React Native (Expo Router), TypeScript, Jest, `@testing-library/react-native`, `react-i18next`, `@tasky/design-tokens`, Figma MCP

---

## Execution Status

Execution status on `2026-03-26`:

- `Track 1` completed
  - auth/shared/customer/tasker realignment completed against the live Figma file and verified in the mobile regression gate
- `Track 2` completed
  - extra tasker/product and B2B/business frames were triaged; only `SCR-TASK-019` was promoted into the active branch
- `Track 3` completed
  - OTP shells, tasker Phase 2 shells, Phase 3 shells, and `SCR-TASK-019` AI Profile Polish were implemented and verified
- full regression gate passed:
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/screens/shared __tests__/screens/infra __tests__/screens/customer __tests__/screens/tasker __tests__/integration/auth-flow.test.tsx __tests__/integration/customer-journey.test.tsx __tests__/integration/tasker-journey.test.tsx __tests__/integration/navigation-wiring.test.tsx __tests__/integration/route-guard-integration.test.tsx`
  - `pnpm --filter @tasky/mobile typecheck`
  - `git diff --check`
- remaining process gap:
  - `scripts/self-verify.sh` could not be run for this plan as-is because it requires a canonical `TASK-*` ticket mapping, and this Figma realignment work was executed from the replacement plan rather than a matching ticket spec in `tickets/`

## Source of Truth

Use these inputs in this order for every screen:

1. **Live Figma file:** `https://www.figma.com/design/IljfnTQPkq7vpkmK1NN1NC/Mobile`
2. **Screen spec:** `docs/design/screen-specs/SCR-*.yaml`
3. **Prompt/spec companion:** `docs/design/prompts/screens/SCR-*.yaml`
4. **Design system contract:** `docs/design/component-contract.yaml`
5. **Existing mobile patterns:** `apps/mobile/src/components/templates/*`, `apps/mobile/src/components/ui/*`

## Current Branch Reality

This branch is not a greenfield replacement anymore. It already contains broad screen work across auth, shared, infra, customer, and tasker routes. The immediate planning problem is therefore:

1. **Backtrack and re-audit** the already-touched screens against live Figma
2. **Fix the drift** without regressing the currently passing behavior
3. **Finish what is still missing**, especially gated screens and routes that never got implemented

The branch is also dirty across many mobile files, so the implementation order must avoid accidental rewrites. Every slice below assumes targeted, surgical diffs only.

## Figma Node Map

These are the primary live Figma frames relevant to the replacement work.

### Auth and Shared

- `SCR-SHARED-001` Splash: `2:87` `Premium Splash Screen`
- `SCR-SHARED-002` Login: `2:320` `Auth — Login`
- `SCR-SHARED-003` OTP Verification: `2:193` `Auth — OTP Verification`
- `SCR-SHARED-004` OTP Migration Gate: `2:413` `Auth — OTP Migration Gate`
- `SCR-SHARED-005` Onboarding Carousel: `2:2` `Onboarding Carousel — Slide 1`
- `SCR-SHARED-006` Role Selection: `2:38` `Role Selection`
- `SCR-SHARED-007` Camera Permission: `2:119` `Camera Permission Primer`
- `SCR-SHARED-008` Location Permission: `2:250` `Permission Primer — Location`
- `SCR-SHARED-009` Notification Permission: `2:49184` `Notification Permission Primer`
- `SCR-SHARED-010` Conversation List: `2:451` `Inbox — Conversation List`
- `SCR-SHARED-011` Chat Detail: `2:553` `Inbox — Chat Detail`
- `SCR-SHARED-012` Profile: `2:817` `My Profile — Batbayar B.`
- `SCR-SHARED-013` Edit Profile: `2:756` `Профайл засах`
- `SCR-SHARED-014` Settings: `2:634` `Тохиргоо (Settings)`
- `SCR-SHARED-015` Delete Account: `2:902` `Account Deletion Confirmation`
- `SCR-SHARED-016` Notifications: `2:988` `Мэдэгдэл (Notification Center)`
- `SCR-SHARED-017` Review Form: `2:1089` `Үнэлгээ өгөх (Review Form)`
- `SCR-SHARED-018` Review Reminder: `2:1180` `Review Reminder Bottom Sheet`
- `SCR-SHARED-019` Review Hard Lock: `2:1215` `Review Hard Lock`
- `SCR-SHARED-020` Suspended: `2:1270` `Suspended Account Screen`
- `SCR-SHARED-021` Banned: `2:1325` `Account Banned`

### Infrastructure

- `SCR-INFRA-001` Network Error: `2:1360`
- `SCR-INFRA-002` Session Expired: `2:1390`
- `SCR-INFRA-003` Terms: `2:1462`
- `SCR-INFRA-004` App Update: `2:1557`
- `SCR-INFRA-005` Help: `2:1594`

### Customer

- `SCR-CUST-001` My Tasks: `2:1689`
- `SCR-CUST-002` Category: `2:1783`
- `SCR-CUST-003` Intake: `2:1880`
- `SCR-CUST-004` Photos: `2:1956`
- `SCR-CUST-005` Location: `2:2021`
- `SCR-CUST-006` Schedule/Budget: `2:2080`
- `SCR-CUST-007` Review/Submit: `2:2212`
- `SCR-CUST-008` Success: `2:16276`
- `SCR-CUST-009` Task Detail: `2:16205`
- `SCR-CUST-010` Task Cancel: `2:16325`
- `SCR-CUST-011` Applicants: `2:16393`
- `SCR-CUST-012` Applicant Timeout/Decline: `2:16512`
- `SCR-CUST-013` Tasker Public Profile: `2:16551`
- `SCR-CUST-014` Booking Confirmation: `2:16679`
- `SCR-CUST-015` Booking Confirmed: `2:16767`
- `SCR-CUST-016` Bookings List: `2:16826`
- `SCR-CUST-017` Booking Detail: `2:16933`
- `SCR-CUST-018` Confirm Completion: `2:17017`
- `SCR-CUST-019` Timeline: `2:17093`
- `SCR-CUST-020` Reschedule: `2:17223`
- `SCR-CUST-021` Customer No-Show: `2:17362`
- `SCR-CUST-022` Customer Cancel: `2:17462`
- `SCR-CUST-023` Rebook: `2:17568`
- `SCR-CUST-024` Dispute Raise: `2:17672`
- `SCR-CUST-025` Dispute Status: `2:17747`
- `SCR-CUST-026` No Applicant Rescue: `2:17850`
- `SCR-CUST-027` Instant Match Customer: `2:17939`

### Tasker

- `SCR-TASK-001` Feed: `2:18034`
- `SCR-TASK-002` Task Detail: `2:18192`
- `SCR-TASK-003` Verification Gate: `2:48043`
- `SCR-TASK-004` Consent: `2:48173`
- `SCR-TASK-005` Upload: `2:48121`
- `SCR-TASK-006` DAN Fast-Path: `2:48235`
- `SCR-TASK-007` Pending: `2:48291`
- `SCR-TASK-008` Approved: `2:48725`
- `SCR-TASK-009` Rejected: `2:48378`
- `SCR-TASK-010` Submitted: `2:48440`
- `SCR-TASK-011` Application Sent: `2:18408`
- `SCR-TASK-012` My Jobs: `2:48522`
- `SCR-TASK-013` Booking Detail: `2:48874`
- `SCR-TASK-014` No-Show: `2:48978`
- `SCR-TASK-015` Cancel: `2:19029`
- `SCR-TASK-016` Stats: `2:49048`
- `SCR-TASK-017` Lead Unlock: `2:48641`
- `SCR-TASK-018` Privacy Policy: `2:48774` `Privacy Policy`

### Gated Phase 2 and 3

- `SCR-P2-001` Credits Balance: `2:47102`
- `SCR-P2-002` QPay Payment: `2:47256`
- `SCR-P2-003` Transaction History: `2:47304`
- `SCR-P2-004` Low Balance Alert: `2:47446`
- `SCR-P2-005` Referral: `2:47511`
- `SCR-P3-001` Wallet: `2:47635`
- `SCR-P3-002` Payout: `2:47760`
- `SCR-P3-003` Escrow Payment: `2:47831`
- `SCR-P3-004` Tasky Pro Subscription: `2:47888`
- `SCR-P3-005` Instant Match Tasker: `2:47950`

## Track 1: Backtrack and Realign Already-Touched Screens

This track exists because the current branch implemented many screens before the live Figma file was used directly.

### Audit Rules For Every Realignment Task

- [ ] Pull live Figma design context for the exact node before editing
- [ ] Compare the route visually and structurally to Figma
- [ ] Tighten or add tests for the Figma-specific behavior before changing production code
- [ ] Run the focused suite first
- [ ] Apply the smallest runtime diff needed
- [ ] Re-run the focused suite
- [ ] Re-run `pnpm --filter @tasky/mobile typecheck`
- [ ] Re-run `git diff --check`

### Backtrack Slice 1: Auth, Onboarding, and Permissions

**Files to audit first:**

- `apps/mobile/src/app/index.tsx`
- `apps/mobile/src/app/onboarding.tsx`
- `apps/mobile/src/app/(auth)/index.tsx`
- `apps/mobile/src/app/(auth)/role-select.tsx`
- `apps/mobile/src/app/(auth)/permission-camera.tsx`
- `apps/mobile/src/app/(auth)/permission-location.tsx`
- `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- `apps/mobile/src/components/templates/AuthTemplate.tsx`
- `apps/mobile/src/components/ui/PermissionPrimer.tsx`

**Tests to tighten first:**

- `apps/mobile/__tests__/screens/auth/SplashScreen.test.tsx`
- `apps/mobile/__tests__/screens/auth/LoginScreen.test.tsx`
- `apps/mobile/__tests__/screens/auth/OnboardingScreen.test.tsx`
- `apps/mobile/__tests__/screens/auth/RoleSelectScreen.test.tsx`
- `apps/mobile/__tests__/screens/auth/PermissionScreens.test.tsx`
- `apps/mobile/__tests__/integration/auth-flow.test.tsx`

**Likely drift to validate against Figma:**

- splash hierarchy, branding cluster, footer treatment, and visual tone
- onboarding pagination and top-app-bar treatment
- role-card spacing, art treatment, and button framing
- permission primer bottom-sheet density, icon treatment, and action hierarchy

### Backtrack Slice 2: Shared Inbox, Profile, Reviews, Infra

**Files to audit first:**

- `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- `apps/mobile/src/app/(tabs)/profile.tsx`
- `apps/mobile/src/app/(shared)/profile/edit.tsx`
- `apps/mobile/src/app/(shared)/profile/settings.tsx`
- `apps/mobile/src/app/(shared)/profile/delete.tsx`
- `apps/mobile/src/app/(shared)/notifications.tsx`
- `apps/mobile/src/app/(shared)/review/[bookingId].tsx`
- `apps/mobile/src/features/review/components/ReviewReminder.tsx`
- `apps/mobile/src/features/review/components/ReviewHardLock.tsx`
- `apps/mobile/src/app/(shared)/account/suspended.tsx`
- `apps/mobile/src/app/(shared)/account/banned.tsx`
- `apps/mobile/src/app/(shared)/network-error.tsx`
- `apps/mobile/src/app/(shared)/session-expired.tsx`
- `apps/mobile/src/app/(shared)/app-update.tsx`
- `apps/mobile/src/app/(shared)/legal/terms.tsx`
- `apps/mobile/src/app/(shared)/help.tsx`

**Tests to tighten first:**

- all `apps/mobile/__tests__/screens/shared/*`
- all `apps/mobile/__tests__/screens/shared/profile/*`
- all `apps/mobile/__tests__/screens/infra/*`

**Likely drift to validate against Figma:**

- list density, search/filter layout, empty-state structure
- profile hero proportions, settings row grouping, destructive affordances
- review reminder/hard-lock sheet composition
- error and infra-screen illustration/layout balance

### Backtrack Slice 3: Customer Posting, Task Management, and Bookings

**Files to audit first:**

- `apps/mobile/src/app/(customer)/tasks/index.tsx`
- `apps/mobile/src/app/(tabs)/tasks.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`
- `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`
- `apps/mobile/src/app/(customer)/bookings/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`
- `apps/mobile/src/app/(customer)/rebook.tsx`

**Tests to tighten first:**

- all customer screen tests under `apps/mobile/__tests__/screens/customer/**`

**Likely drift to validate against Figma:**

- wizard chrome and step semantics
- card framing, status chips, and booking-detail visual grouping
- applicants list hierarchy and timeout sheet treatment
- booking confirmation / confirmed success alignment
- rescue and dispute entry prominence

### Backtrack Slice 4: Tasker Browse, Verification, Jobs, Stats

**Files to audit first:**

- `apps/mobile/src/app/(tabs)/index.tsx`
- `apps/mobile/src/app/task/[id].tsx`
- `apps/mobile/src/app/(tasker)/verification/index.tsx`
- `apps/mobile/src/app/(tasker)/verification/consent.tsx`
- `apps/mobile/src/app/(tasker)/verification/upload.tsx`
- `apps/mobile/src/app/(tasker)/verification/pending.tsx`
- `apps/mobile/src/app/(tasker)/verification/rejected.tsx`
- `apps/mobile/src/app/(tasker)/verification/approved.tsx`
- `apps/mobile/src/app/(tasker)/verification/submitted.tsx`
- `apps/mobile/src/features/tasks/components/ApplicationSentSuccess.tsx`
- `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
- `apps/mobile/src/app/(tasker)/stats.tsx`
- `apps/mobile/src/app/(shared)/legal/privacy.tsx`

**Tests to tighten first:**

- all tasker screen tests under `apps/mobile/__tests__/screens/tasker/**`

**Likely drift to validate against Figma:**

- feed trust banner, search/filter placement, task-card density
- verification gate vs consent vs upload visual separation
- application-sent success composition and CTA hierarchy
- booking-detail CTA order, sheet framing, and exact-address disclosure
- stats layout and section presentation relative to the dashboard frame
- privacy framing and content hierarchy, while keeping it in the original tasker slice

## Track 2: Triage Extra Figma Surfaces Before Final Gated Work

This track moves ahead of the gated-shell implementation on purpose. Several Figma-only tasker frames may actually be parity-adjacent extensions of already-touched tasker routes. Triage them before final implementation so the same routes are not reopened twice.

### Task D: Triage Additional Tasker/Product Frames

**Observed Figma-only frames:**

- `2:18546` `My Applications Tracker`
- `2:18818` `Earnings Dashboard`
- `2:19102` `Цаг өөрчлөх (Tasker)`
- `2:19239` `Dispute — Tasker View`
- `2:19342` `KYC Verification Status`
- `2:19454` `Service Areas`
- `2:46979` `Availability Schedule`
- `2:47195` `Portfolio`
- `2:49248` `Task Boost Options`
- `2:49373` `Boost төлбөр`
- `2:49423` `AI Profile Polish — Initial Loading State`

**Triage buckets:**

- `parity-adjacent candidate now`
  - `My Applications Tracker`
  - `Earnings Dashboard`
  - `Цаг өөрчлөх (Tasker)`
  - `Dispute — Tasker View`
  - `KYC Verification Status`
- `profile or capability expansion`
  - `Service Areas`
  - `Availability Schedule`
  - `Portfolio`
- `growth or monetization experiment`
  - `Task Boost Options`
  - `Boost төлбөр`
  - `AI Profile Polish — Initial Loading State`

**Plan intent:**

- classify each tasker/product frame before gated implementation continues
- treat `parity-adjacent candidate now` as the only set eligible to re-enter the current replacement branch without new product approval
- treat the other two buckets as follow-on scope unless product explicitly promotes them

**Triage outcome on 2026-03-26:**

- `My Applications Tracker`: `out-of-scope`
  - not represented in checked-in screen inventory/specs; current tasker parity uses task detail plus `SCR-TASK-011` instead of a separate tracker route
- `Earnings Dashboard`: `parity-adjacent candidate now`
  - treat as a Figma refinement target for existing `SCR-TASK-016` stats/dashboard parity rather than a brand-new route
- `Цаг өөрчлөх (Tasker)`: `out-of-scope`
  - customer reschedule is spec-backed as `SCR-CUST-020`, but no separate tasker reschedule route/spec exists in the current authorized replacement scope
- `Dispute — Tasker View`: `out-of-scope`
  - customer dispute raise/status are spec-backed; no tasker dispute screen is present in the current inventory or route map
- `KYC Verification Status`: `parity-adjacent candidate now`
  - treat as already covered by verification status parity (`SCR-TASK-007`/`008`/`009`/`010`), not a new route
- `Service Areas`: `profile or capability expansion`
  - relevant to matching quality but not represented as a current mobile replacement screen spec
- `Availability Schedule`: `profile or capability expansion`
  - PRD-valid capability, but not a current mobile replacement screen with checked-in acceptance coverage
- `Portfolio`: `profile or capability expansion`
  - PRD-valid as a subscription capability, but not part of the current verified replacement surface
- `Task Boost Options`: `growth or monetization experiment`
  - spec-backed as `SCR-CUST-028`, but outside the original March replacement scope
- `Boost төлбөр`: `growth or monetization experiment`
  - spec-backed as `SCR-CUST-029`, but outside the original March replacement scope
- `AI Profile Polish — Initial Loading State`: `parity-adjacent candidate now`
  - promoted into the active branch because it has a checked-in `SCR-TASK-019` screen spec and PRD support

### Task E: Triage Additional Business/B2B Frames

**Observed Figma-only frames:**

- `2:49485` `Business Accounts List`
- `2:49562` `Business Account Editor`
- `2:49643` `Бизнес бүртгэх`
- `2:49723` `Business Location Editor`
- `2:49805` `Бизнесийн гишүүд (Loading)`
- `2:49867` `Post Task as Business (Loading)`
- `2:49919` `Бизнесийн даалгаврууд (Loading)`
- `2:49974` `Бизнесийн төлбөр (Loading)`
- `2:50052` `Post Task as Business`
- `2:50106` `Business Subscription Billing`

**Plan intent:**

- classify the entire B2B/business set as `out-of-scope unless PRD or ticket added`
- do not mix these frames into the consumer/tasker replacement branch
- if product later promotes them, create a separate business-mobile replacement plan instead of extending this one

**Triage outcome on 2026-03-26:**

- All listed B2B/business frames remain `out-of-scope unless PRD or ticket added` for this branch.
- They should be handled in a separate business-mobile plan rather than mixed into the consumer/tasker replacement work.

## Track 3: Finish Missing Work From The Original Replacement Scope

### Task A: OTP Phase 2 Shells

**Figma frames:** `2:193`, `2:413`

**Files:**

- Create or modify: `apps/mobile/src/app/(auth)/otp.tsx`
- Create or modify: `apps/mobile/src/app/(auth)/otp-migration.tsx`
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`
- Test: new auth-screen tests for OTP verification and migration shell states

**Plan intent:**

- implement visual shells only
- no production routing change unless feature flags explicitly enable them
- keep Facebook-first auth intact for Phase 0-1

### Task B: Tasker Phase 2 Gated Screens

**Figma frames:** `2:48235`, `2:48641`, `2:47102`, `2:47256`, `2:47304`, `2:47446`, `2:47511`

**Files:**

- Create: `apps/mobile/src/app/(tasker)/verification/dan.tsx`
- Create: `apps/mobile/src/features/bookings/components/LeadUnlockSheet.tsx`
- Create: `apps/mobile/src/app/(tasker)/credits/index.tsx`
- Create: `apps/mobile/src/app/(tasker)/credits/pay.tsx`
- Create: `apps/mobile/src/app/(tasker)/credits/history.tsx`
- Create: low-balance alert support surface under `apps/mobile/src/features/billing/components/` or `apps/mobile/src/features/credits/components/`
- Create: `apps/mobile/src/app/(shared)/referrals.tsx` or `apps/mobile/src/app/(tasker)/referrals.tsx` after confirming route conventions from Figma/spec
- Modify: translations for new gated copy
- Test: dedicated tasker and shared billing/referral screen tests

**Plan intent:**

- implement shell states with static/demo data only
- include success, empty, and error states where Figma shows them
- keep routes behind feature flags or non-primary navigation

### Task C: Phase 3 Wallet, Escrow, Subscription, Instant Match

**Figma frames:** `2:47635`, `2:47760`, `2:47831`, `2:47888`, `2:47950`

**Files:**

- Create: `apps/mobile/src/app/(tasker)/wallet/index.tsx`
- Create: `apps/mobile/src/app/(tasker)/wallet/payout.tsx`
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx`
- Create: `apps/mobile/src/app/(tasker)/subscription.tsx`
- Create: `apps/mobile/src/features/matching/components/InstantMatchTaskerSheet.tsx`
- Modify: translations for new gated copy
- Test: wallet, payout, escrow, subscription, and instant-match tests

**Plan intent:**

- keep these as API-gated shells
- preserve the visual state hierarchy from Figma
- avoid coupling to unfinished backend contracts

## Verification Strategy

### Focused Verification Per Slice

Run the narrowest suite first for the slice being realigned or added. After that:

```bash
pnpm --filter @tasky/mobile typecheck
git diff --check
```

Then run self-verification and append the required work-log entry per `AGENTS.md` and `docs/quality/SELF_VERIFY_CONTRACT.md`.

### Full Regression Gate Before Completion

```bash
pnpm --filter @tasky/mobile test -- --runInBand \
  __tests__/screens/auth \
  __tests__/screens/shared \
  __tests__/screens/infra \
  __tests__/screens/customer \
  __tests__/screens/tasker \
  __tests__/integration/auth-flow.test.tsx \
  __tests__/integration/customer-journey.test.tsx \
  __tests__/integration/tasker-journey.test.tsx \
  __tests__/integration/navigation-wiring.test.tsx \
  __tests__/integration/route-guard-integration.test.tsx
pnpm --filter @tasky/mobile typecheck
git diff --check
```

### Figma Review Rule

For every screen touched after this plan is adopted:

- [ ] record the Figma node id in the implementation notes or PR notes
- [ ] pull Figma design context before editing
- [ ] compare final runtime layout against the live Figma frame, not only the derived YAML

## Recommended Execution Order

1. Backtrack auth/shared/customer/tasker slices already touched on the branch
2. Triage extra Figma-only tasker and business frames
3. Finish OTP shells
4. Finish tasker Phase 2 gated screens
5. Finish Phase 3 wallet/escrow/subscription/instant-match shells
6. Run full regression gate

## Delegation Model

Use subagent delegation by default during execution. Keep write scopes disjoint.

### Shared ownership lane

These dirty shared hotspots must never be edited by multiple active lanes at once:

- `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
- `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- `apps/mobile/src/components/templates/SettingsTemplate.tsx`
- `apps/mobile/src/components/ui/ModalSheet.tsx`
- `apps/mobile/src/components/ui/PermissionPrimer.tsx`
- `apps/mobile/src/components/ui/LanguageSwitcher.tsx`
- `apps/mobile/src/components/ui/index.ts`
- `apps/mobile/src/locales/en/translation.json`
- `apps/mobile/src/locales/mn/translation.json`
- `apps/mobile/src/lib/mobileApiClient.ts`

If any feature lane needs one of these files, either serialize that lane or route the shared-file diff through a dedicated integration lane.

### Recommended parallel lanes

- **Lane A1: Auth realignment**
  - Owns splash, login, onboarding, role selection, and permission screens
- **Lane A2: Shared surfaces realignment**
  - Owns inbox, profile, review, and infra screens, excluding shared hotspot files
- **Lane B1: Customer posting and task-management realignment**
  - Owns post-task, task detail, applicants, tasker profile, booking confirm, and booking confirmed
- **Lane B2: Customer bookings and disputes realignment**
  - Owns booking detail, timeline, reschedule, dispute, dispute status, rescue, and instant-match customer
- **Lane C1: Tasker browse and verification realignment**
  - Owns feed, task detail, verification gate, consent, upload, pending, approved, rejected, submitted, and application-sent
- **Lane C2: Tasker jobs and management realignment**
  - Owns jobs, booking detail, no-show, cancel, stats, lead unlock, and privacy
- **Lane D1: OTP and Phase 2 shells**
  - Owns OTP shells, DAN, credits, QPay payment, transaction history, low-balance alert, referral, and lead-unlock shell work
- **Lane D2: Phase 3 shells**
  - Owns wallet, payout, escrow, subscription, and instant-match tasker shells

### Delegation rules

- Never assign the same route file to two subagents
- Never assign shared hotspot files to more than one active lane
- Keep translation updates batched at the end of each lane or reserve them for a dedicated integration lane
- Run focused tests inside each lane before handing work back
- After each lane returns, perform one integrating review locally before merging the lane into the working branch
- Use a read-only reviewer subagent after each major lane to check spec/Figma compliance before moving on

## Exit Criteria

This replacement effort is complete only when all of the following are true:

- every screen in the original March replacement scope has been re-audited against the live Figma file
- every missing scoped route or shell listed in Track 3 exists and is tested
- all original-scope customer screens through `SCR-CUST-027` and tasker screens through `SCR-TASK-018` are explicitly covered by either a realignment task or a gated-shell task in this plan
- the branch passes the full mobile regression gate
- any extra Figma-only frames not in the March plan have been explicitly classified and documented instead of being left ambiguous
