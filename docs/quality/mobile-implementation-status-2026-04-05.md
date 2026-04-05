# Mobile Implementation Status Audit

**Date:** 2026-04-05
**Method:** Repomix static analysis of `apps/mobile/src/` (215 files, 252k tokens)
**Purpose:** Determine which phases, journeys, and screens are actually implemented in the mobile codebase so Maestro flows can be scoped accurately.

---

## Authority Note

This document is a **derived** snapshot. It describes the codebase state as of 2026-04-05.
Authoritative screen definitions live in `docs/design/screen-specs/SCR-*.yaml`.
Authoritative journey definitions live in `docs/design/journey-catalog.yaml`.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented — substantive file, no major TODOs |
| ⚠️ | Partial — substantive file but contains TODO markers or thin delegate pattern |
| 🔁 | Delegate — file is a 1-line re-export; feature is in `features/` component |
| 🪲 | Thin stub — < 30 meaningful code lines, likely incomplete |
| ❌ | Not implemented — no file exists |

---

## Summary by Phase

| Phase | Total Screens | Implemented | Partial | Not Implemented |
|-------|--------------|-------------|---------|-----------------|
| Phase 0-1 (Core) | ~57 | ~45 | ~10 | 2 (B2B none, splash thin) |
| Phase 2 (Monetization) | ~8 | 5 | 1 | 1 (SCR-P2-004 task boost) |
| Phase 3+ (Wallet/Escrow) | ~5 | 3 | 2 | 0 |
| B2B | 7 | 0 | 0 | 7 |

**Key finding: Phase 2 is substantially implemented. Phase 3+ screens exist but some are partial. B2B is entirely absent from the codebase.**

---

## Screen-by-Screen Status

### SHARED Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-SHARED-001 | Splash | `app/index.tsx` | ⚠️ | Router redirect; no SCR testID on splash frame |
| SCR-SHARED-002 | Login | `app/(auth)/index.tsx` | ✅ | 341 code lines, facebook-login-button testID present |
| SCR-SHARED-003 | OTP Verify | `app/(auth)/otp.tsx` | ✅ | 307 lines, Phase 2 auth implemented |
| SCR-SHARED-004 | OTP Migration | `app/(auth)/otp-migration.tsx` | ⚠️ | 220 lines, has TODO markers |
| SCR-SHARED-005 | Onboarding | `app/onboarding.tsx` | ✅ | 272 lines, SCR-SHARED-005-next testID present |
| SCR-SHARED-006 | Role Select | `app/(auth)/role-select.tsx` | ✅ | 220 lines, role-card-customer testID present |
| SCR-SHARED-007 | Camera Permission | `app/(auth)/permission-camera.tsx` | ✅ | 50 lines |
| SCR-SHARED-008 | Location Permission | `app/(auth)/permission-location.tsx` | ✅ | 50 lines |
| SCR-SHARED-009 | Notification Permission | `app/(auth)/permission-notifications.tsx` | ✅ | 62 lines |
| SCR-SHARED-010 | Inbox List | `app/(tabs)/inbox/index.tsx` | ⚠️ | 234 lines, has TODO markers |
| SCR-SHARED-011 | Chat Detail | `app/(tabs)/inbox/[id].tsx` | ⚠️ | 453 lines, has TODO markers |
| SCR-SHARED-012 | Profile | `app/(tabs)/profile.tsx` | ✅ | 170 lines |
| SCR-SHARED-013 | Profile Edit | `app/(shared)/profile/edit.tsx` | ⚠️ | 118 lines, has TODO markers |
| SCR-SHARED-014 | Settings | `app/(shared)/profile/settings.tsx` | ✅ | 123 lines |
| SCR-SHARED-015 | Delete Account | `app/(shared)/profile/delete.tsx` | ⚠️ | 162 lines, has TODO markers |
| SCR-SHARED-016 | Notification Center | `app/(shared)/notifications.tsx` | ✅ | 380 lines |
| SCR-SHARED-017 | Review Form | `app/(shared)/review/[bookingId].tsx` | 🔁 | Delegates to `features/review/components/ReviewForm`; no SCR testID in file |
| SCR-SHARED-018 | Post-Review Success | — | ❌ | No dedicated screen; handled inline |
| SCR-SHARED-019 | Tasker Public Profile | `app/(customer)/taskers/[taskerId].tsx` | ✅ | 274 lines |
| SCR-SHARED-020 | Suspended Account | `app/(shared)/account/suspended.tsx` | ✅ | 98 lines |
| SCR-SHARED-021 | Banned Account | `app/(shared)/account/banned.tsx` | ✅ | 80 lines |

### INFRA Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-INFRA-001 | Network Error | `app/(shared)/network-error.tsx` | ⚠️ | 102 lines but **no SCR-INFRA-001 testID** |
| SCR-INFRA-002 | App Update | `app/(shared)/app-update.tsx` | ⚠️ | 101 lines but **no SCR-INFRA-002 testID** |
| SCR-INFRA-003 | Session Expired | `app/(shared)/session-expired.tsx` | ⚠️ | 77 lines but **no SCR-INFRA-003 testID** |
| SCR-INFRA-004 | Terms of Service | `app/(shared)/legal/terms.tsx` | ✅ | 377 lines, SCR-INFRA-004 present |
| SCR-INFRA-005 | Help & FAQ | `app/(shared)/help.tsx` | ⚠️ | 524 lines, has TODO markers |

### CUSTOMER Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-CUST-001 | Task List | `app/(customer)/tasks/index.tsx` | ✅ | 576 lines |
| SCR-CUST-002 | Category Select | `app/(customer)/tasks/new/category.tsx` | ⚠️ | 390 lines, has TODO |
| SCR-CUST-003 | Intake Form | `app/(customer)/tasks/new/intake.tsx` | ⚠️ | 382 lines, has TODO |
| SCR-CUST-004 | Photo Upload | `app/(customer)/tasks/new/photos.tsx` | ✅ | 244 lines |
| SCR-CUST-005 | Location Pin | `app/(customer)/tasks/new/location.tsx` | ⚠️ | 323 lines, has TODO |
| SCR-CUST-006 | Schedule & Budget | `app/(customer)/tasks/new/schedule.tsx` | ⚠️ | 427 lines, has TODO |
| SCR-CUST-007 | Review & Submit | `app/(customer)/tasks/new/review.tsx` | ✅ | 544 lines |
| SCR-CUST-008 | Task Success | `app/(customer)/tasks/new/success.tsx` | ✅ | 186 lines |
| SCR-CUST-009 | Customer Task Detail | `app/(customer)/tasks/[taskId]/index.tsx` | ✅ | 462 lines |
| SCR-CUST-010 | Task Boost (P2) | — | ❌ | **No file exists** |
| SCR-CUST-011 | Applicants List | `app/(customer)/tasks/[taskId]/applicants.tsx` | ✅ | 448 lines |
| SCR-CUST-013 | Tasker Public Profile | `app/(customer)/taskers/[taskerId].tsx` | ✅ | 274 lines |
| SCR-CUST-014 | Booking Confirm | `app/(customer)/bookings/confirm.tsx` | ✅ | 226 lines |
| SCR-CUST-015 | Booking Confirmed | `app/(customer)/bookings/confirmed.tsx` | ✅ | 385 lines |
| SCR-CUST-016 | Bookings List | `app/(customer)/bookings/index.tsx` | ✅ | 563 lines |
| SCR-CUST-017 | Booking Detail | `app/(customer)/bookings/[bookingId]/index.tsx` | ✅ | 366 lines |
| SCR-CUST-019 | Booking Timeline | `app/(customer)/bookings/[bookingId]/timeline.tsx` | ✅ | 401 lines |
| SCR-CUST-020 | Reschedule | `app/(customer)/bookings/[bookingId]/reschedule.tsx` | ⚠️ | 627 lines, has TODO |
| SCR-CUST-023 | Rebook | `app/(customer)/rebook.tsx` | ✅ | 229 lines |
| SCR-CUST-024 | Raise Dispute | `app/(customer)/bookings/[bookingId]/dispute.tsx` | ⚠️ | 213 lines, has TODO |
| SCR-CUST-025 | Dispute Detail | `app/(customer)/disputes/[disputeId]/index.tsx` | ✅ | 748 lines |
| SCR-CUST-027 | Instant Match Modal | `app/(customer)/tasks/[taskId]/instant-match.tsx` | ✅ | 382 lines (Phase 3) |

### TASKER Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-TASK-001 | Tasker Browse Feed | `app/(tabs)/index.tsx` | ⚠️ | 235 lines, has TODO; `app/(tasker)/tasks/[taskId].tsx` is a 9-line stub |
| SCR-TASK-002 | Task Detail (Tasker) | `app/task/[id].tsx` | ✅ | 224 lines |
| SCR-TASK-003 | Verification Gate | `app/(tasker)/verification/index.tsx` | 🪲 | 12 lines — delegates to VerificationGate component |
| SCR-TASK-004 | Verification Consent | `app/(tasker)/verification/consent.tsx` | ✅ | 165 lines |
| SCR-TASK-005 | ID Upload | `app/(tasker)/verification/upload.tsx` | ⚠️ | 254 lines, has TODO |
| SCR-TASK-006 | DAN Fast-Path | `app/(tasker)/verification/dan.tsx` | ✅ | 97 lines |
| SCR-TASK-007 | Verification Pending | `app/(tasker)/verification/pending.tsx` | ✅ | 108 lines |
| SCR-TASK-008 | Verification Approved | `app/(tasker)/verification/approved.tsx` | 🪲 | 17 lines — SuccessCelebrationTemplate, SCR testID present |
| SCR-TASK-009 | Verification Rejected | `app/(tasker)/verification/rejected.tsx` | ✅ | 99 lines |
| SCR-TASK-010 | Verification Submitted | `app/(tasker)/verification/submitted.tsx` | 🪲 | 17 lines — SuccessCelebrationTemplate, SCR testID present |
| SCR-TASK-012 | Tasker Jobs List | `app/(tasker)/jobs/index.tsx` | ✅ | 134 lines |
| SCR-TASK-013 | Tasker Job Detail | `app/(tasker)/jobs/[bookingId]/index.tsx` | ✅ | 230 lines |
| SCR-TASK-016 | Tasker Stats | `app/(tasker)/stats.tsx` | ✅ | 185 lines |
| SCR-TASK-018 | Privacy Policy | `app/(shared)/legal/privacy.tsx` | ✅ | 150 lines |
| SCR-TASK-019 | AI Profile Polish | `app/(tasker)/profile/polish.tsx` | ⚠️ | 368 lines, has TODO |

### PHASE 2 Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-P2-001 | Credits Balance | `app/(tasker)/credits/index.tsx` | ✅ | 152 lines |
| SCR-P2-002 | Credit Payment | `app/(tasker)/credits/pay.tsx` | ✅ | 130 lines |
| SCR-P2-003 | Credit History | `app/(tasker)/credits/history.tsx` | ✅ | 135 lines |
| SCR-P2-004 | Task Boost | — | ❌ | **No file exists** |
| SCR-P2-005 | Referrals | `app/(tasker)/referrals.tsx` | ✅ | 144 lines |
| SCR-P2-006 | Low Balance Alert | `features/credits/components/LowBalanceAlert.tsx` | ✅ | Component only, no dedicated route |

### PHASE 3+ Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-P3-001 | Wallet Balance | `app/(tasker)/wallet/index.tsx` | ✅ | 62 lines |
| SCR-P3-002 | Payout Request | `app/(tasker)/wallet/payout.tsx` | ⚠️ | 75 lines, has TODO |
| SCR-P3-003 | Escrow Payment | `app/(customer)/bookings/[bookingId]/escrow.tsx` | ✅ | 153 lines |
| SCR-P3-004 | Subscription | `app/(tasker)/subscription.tsx` | ✅ | 102 lines |
| SCR-P3-005 | Instant Match Modal | `app/(customer)/tasks/[taskId]/instant-match.tsx` | ✅ | 382 lines (same file as SCR-CUST-027) |

### B2B Screens

| SCR ID | Name | File | Status | Notes |
|--------|------|------|--------|-------|
| SCR-B2B-001 | Business Account | — | ❌ | **Not implemented** |
| SCR-B2B-002 | Business Locations | — | ❌ | **Not implemented** |
| SCR-B2B-003 | Business Members | — | ❌ | **Not implemented** |
| SCR-B2B-004 | B2B Task Post | — | ❌ | **Not implemented** |
| SCR-B2B-005 | B2B Tasks List | — | ❌ | **Not implemented** |
| SCR-B2B-006 | B2B Task Detail | — | ❌ | **Not implemented** |
| SCR-B2B-007 | B2B Subscription | — | ❌ | **Not implemented** |

---

## Journey Implementation Status

Maps each of the 27 journeys from `docs/design/journey-catalog.yaml` to actual codebase state.

### SHARED Journeys

| Journey ID | Name | Status | Blocker / Notes |
|-----------|------|--------|-----------------|
| JRN-SHARED-01 | First Launch & Onboarding | ✅ Ready | All screens implemented; flow stub exists |
| JRN-SHARED-02 | Phase 2 OTP Migration | ⚠️ Partial | otp-migration.tsx has TODO markers |
| JRN-SHARED-03 | Phase 2 OTP Login (New User) | ✅ Ready | otp.tsx fully implemented |
| JRN-SHARED-04 | Messaging | ⚠️ Partial | Inbox and chat screens have TODOs |
| JRN-SHARED-05 | Profile Management | ⚠️ Partial | profile/edit.tsx has TODOs |
| JRN-SHARED-06 | Settings & Account | ⚠️ Partial | profile/delete.tsx has TODOs |
| JRN-SHARED-07 | Review Submission | ✅ Ready | ReviewForm component is substantive; delegate pattern |

### CUSTOMER Journeys

| Journey ID | Name | Status | Blocker / Notes |
|-----------|------|--------|-----------------|
| JRN-CUST-01 | Post a Task | ⚠️ Partial | category, intake, location, schedule have TODOs |
| JRN-CUST-02 | Review Applicants & Confirm (Phase 0-1) | ✅ Ready | All screens substantive |
| JRN-CUST-03 | Review Applicants & Confirm (Phase 2 Lead Unlock) | ✅ Ready | LeadUnlockSheet component exists |
| JRN-CUST-04 | Manage Active Booking | ✅ Ready | Booking detail + timeline fully implemented |
| JRN-CUST-05 | Rebook Tasker | ✅ Ready | rebook.tsx fully implemented |
| JRN-CUST-06 | Raise & Track Dispute | ⚠️ Partial | dispute.tsx has TODOs; dispute detail is OK |
| JRN-CUST-07 | Cancel Open Task | ✅ Ready | TaskCancelSheet component exists in features/ |
| JRN-CUST-08 | Instant Match (Phase 3) | ✅ Ready | instant-match.tsx fully implemented |
| JRN-CUST-09 | Purchase Task Boost (Phase 2) | ❌ Not Implemented | SCR-CUST-010 / SCR-P2-004 file missing entirely |

### TASKER Journeys

| Journey ID | Name | Status | Blocker / Notes |
|-----------|------|--------|-----------------|
| JRN-TASK-01 | Tasker Verification | ⚠️ Partial | upload.tsx has TODOs; end states (approved/submitted) are thin but functional |
| JRN-TASK-02 | Browse & Apply to Task | ⚠️ Partial | Tasker feed index.tsx has TODOs |
| JRN-TASK-03 | Lead Unlock Accept/Decline (Phase 2) | ✅ Ready | LeadUnlockSheet component in features/bookings |
| JRN-TASK-04 | Manage Active Booking (Tasker) | ✅ Ready | jobs/[bookingId]/index.tsx + jobs/index.tsx OK |
| JRN-TASK-05 | Credit Purchase | ✅ Ready | credits/index + pay fully implemented |
| JRN-TASK-06 | Wallet & Payout (Phase 3) | ⚠️ Partial | wallet/payout.tsx has TODO |
| JRN-TASK-07 | Tasker Pro Subscription (Phase 3) | ✅ Ready | subscription.tsx fully implemented |
| JRN-TASK-08 | AI Profile Polish | ⚠️ Partial | profile/polish.tsx has TODOs |

### B2B Journeys

| Journey ID | Name | Status | Blocker / Notes |
|-----------|------|--------|-----------------|
| JRN-B2B-01 | Create Business Account | ❌ Not Implemented | No B2B screens exist in codebase |
| JRN-B2B-02 | Post Task as Business | ❌ Not Implemented | No B2B screens exist in codebase |
| JRN-B2B-03 | Manage Business Tasks | ❌ Not Implemented | No B2B screens exist in codebase |
| JRN-B2B-04 | Business Subscription Billing | ❌ Not Implemented | No B2B screens exist in codebase |

### INFRA Journeys

| Journey ID | Name | Status | Blocker / Notes |
|-----------|------|--------|-----------------|
| JRN-INFRA-01 | Error Recovery | ⚠️ Partial | Screens exist but **missing SCR testIDs** on network-error, app-update, session-expired |
| JRN-INFRA-02 | Suspended/Banned Account | ✅ Ready | Both screens fully implemented with SCR testIDs |

---

## Maestro Scope Decision

Based on this analysis, Maestro flows should target the following:

### In Scope — Write Flows Now

| Journey | Justification |
|---------|--------------|
| JRN-SHARED-01 | ✅ All screens ready; flow stub exists, needs completion |
| JRN-SHARED-03 | ✅ OTP auth fully implemented |
| JRN-SHARED-07 | ✅ Review form delegate works |
| JRN-CUST-02 | ✅ Full booking confirmation flow |
| JRN-CUST-04 | ✅ Active booking management |
| JRN-CUST-05 | ✅ Rebook flow |
| JRN-CUST-07 | ✅ Cancel via sheet |
| JRN-CUST-08 | ✅ Instant match (Phase 3) |
| JRN-TASK-03 | ✅ Lead unlock (Phase 2) |
| JRN-TASK-04 | ✅ Tasker job management |
| JRN-TASK-05 | ✅ Credit purchase (Phase 2) |
| JRN-TASK-07 | ✅ Subscription (Phase 3) |
| JRN-INFRA-02 | ✅ Account suspension/ban |

### In Scope — Write Flows With Known Gaps

| Journey | What to test | What to skip |
|---------|-------------|-------------|
| JRN-SHARED-04 | Happy path list + open conversation | Error states (TODO) |
| JRN-SHARED-05 | Profile view; settings | Edit form deep validation (TODO) |
| JRN-SHARED-06 | Settings navigation | Delete account confirmation (TODO) |
| JRN-CUST-01 | Full wizard (category→success); TODOs are non-blocking for happy path | Field-level validation edge cases |
| JRN-CUST-06 | Dispute detail view | Raise dispute form edge cases (TODO) |
| JRN-TASK-01 | Gate→Consent→Upload→Pending→Approved | DAN fast-path (separate flow) |
| JRN-TASK-02 | Feed list + task detail | Apply modal edge cases |
| JRN-TASK-06 | Wallet balance | Payout form (TODO) |
| JRN-TASK-08 | Polish entry screen | AI generation edge cases (TODO) |
| JRN-INFRA-01 | Network error screen | Needs SCR testID added first |

### Out of Scope — Do Not Write Flows

| Journey | Reason |
|---------|--------|
| JRN-CUST-09 | SCR-P2-004 file does not exist |
| JRN-B2B-01..04 | No B2B screens implemented |
| JRN-SHARED-02 | OTP migration screen has significant TODOs |

---

## Action Items Before Running Maestro

### P0 — Required Before Any Flow Runs

1. **Fix 12 duplicate testID TypeScript errors** (listed in `docs/plans/2026-04-05-maestro-setup-handoff.md`)
2. **Add missing SCR testIDs** to:
   - `app/(shared)/network-error.tsx` → `SCR-INFRA-001`
   - `app/(shared)/app-update.tsx` → `SCR-INFRA-002`
   - `app/(shared)/session-expired.tsx` → `SCR-INFRA-003`
   - `app/(shared)/review/[bookingId].tsx` → ensure `ReviewForm` component receives and uses `SCR-SHARED-017`
3. **Verify build is green**: `pnpm --filter @tasky/mobile typecheck`

### P1 — Needed Before Writing Flows for Specific Journeys

4. **JRN-INFRA-01**: Add SCR testIDs above (P0 item #2)
5. **JRN-CUST-01**: Verify TODO sections in category/intake/location/schedule don't crash the happy path

### P2 — Document in Backlog, Not a Blocker

6. Note that **B2B journeys** are not implemented — update backlog priority to "future phase"
7. Note that **JRN-CUST-09 (Task Boost)** has no screen — mark as out-of-scope in coverage backlog
