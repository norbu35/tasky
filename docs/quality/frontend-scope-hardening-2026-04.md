# Frontend Scope Hardening Manifest

**Date:** 2026-04-10
**Status:** completed -- all actions executed in Tranches 2-4
**Source matrix:** `docs/quality/frontend-alignment-matrix-2026-04.md`

This manifest turns the frontend alignment matrix into executable route and file actions for Tranche 2.

## Web Actions

### Keep In Active App -- DONE

- Public/auth/profile/shared/legal/infra routes
- Customer posting, booking, dispute, rebook, and rescue routes
- Tasker browse, apply, jobs, stats, and manual verification routes
- Admin core launch routes:
  - verifications
  - disputes
  - users
  - categories
  - features
  - concierge
  - moderation

### Move Out Of Active App -- DONE

- [x] `apps/web/src/pages/admin/AdminPayoutsPage.tsx` -- moved to `apps/web/src/future/admin/`
  - [x] removed `/admin/payouts` from `AppRoutes.tsx`
  - [x] removed payouts item from `AdminLayout.tsx`
- [x] `apps/web/src/pages/admin/AdminLeadPricingPage.tsx` -- moved to `apps/web/src/future/admin/`
  - [x] removed `/admin/pricing` from `AppRoutes.tsx`
  - [x] removed pricing item from `AdminLayout.tsx`

### Delete -- DONE

- [x] `/customer/booking-payment` route alias removed from `apps/web/src/router/AppRoutes.tsx`
- [x] `TaskerProfilePolishPage` moved to `apps/web/src/future/tasker/`, route `/tasker/profile/polish` removed
- [x] `VerificationPage.tsx` deleted, `/verification` route removed

### Web Content Fixes Required After Scope Cut -- DONE

- [x] Removed escrow/payment promise language from:
  - [x] `apps/web/src/pages/LandingPage.tsx`
  - [x] `apps/web/src/pages/BookingConfirmationPage.tsx`
  - [x] translation keys used by those screens (en + mn)
- [x] Replaced deferred “boost visibility” language in:
  - [x] `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx`

## Mobile Actions

### Keep In Active App -- DONE

- Launch auth/onboarding and permission setup
- Shared/legal/help/review/notifications/inbox/profile flows
- Customer task posting, applicants, task detail, booking lifecycle, disputes, rescue, rebook, and tasker profile
- Tasker browse, apply, jobs, stats, and manual verification
- Active legacy aliases that still support launch flows:
  - `/create`
  - `/profile/[id]`
  - `/task/[id]`
  - `/task/[id]/applicants`

### Move Out Of Expo Router To `apps/mobile/src/future/` -- DONE

- [x] `apps/mobile/src/app/(auth)/otp.tsx` -- moved to `apps/mobile/src/future/auth/`
- [x] `apps/mobile/src/app/(auth)/otp-migration.tsx` -- moved to `apps/mobile/src/future/auth/`
- [x] `apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx` -- moved to `apps/mobile/src/future/customer/bookings/`
- [x] `apps/mobile/src/app/(customer)/tasks/[taskId]/instant-match.tsx` -- moved to `apps/mobile/src/future/customer/tasks/`
- [x] `apps/mobile/src/app/(tasker)/credits/**` -- moved to `apps/mobile/src/future/tasker/`
- [x] `apps/mobile/src/app/(tasker)/referrals.tsx` -- moved to `apps/mobile/src/future/tasker/`
- [x] `apps/mobile/src/app/(tasker)/subscription.tsx` -- moved to `apps/mobile/src/future/tasker/`
- [x] `apps/mobile/src/app/(tasker)/wallet/**` -- moved to `apps/mobile/src/future/tasker/wallet/`
- [x] `apps/mobile/src/app/(tasker)/jobs/[bookingId]/lead-unlock.tsx` -- moved to `apps/mobile/src/future/tasker/jobs/`
- [x] `apps/mobile/src/app/(tasker)/profile/polish.tsx` -- moved to `apps/mobile/src/future/tasker/profile/`

### Delete From Active Mobile Tree -- DONE

- [x] `apps/mobile/src/app/(customer)/tasks/[taskId]/boost.tsx` -- deleted
- [x] `apps/mobile/src/app/(customer)/tasks/[taskId]/boost-pay.tsx` -- deleted
- [x] `apps/mobile/src/app/(customer)/business/**` -- deleted
- [x] `apps/mobile/src/app/(tasker)/verification/dan.tsx` -- deleted

### Mobile Launch-Live Fix Queue After Scope Cut -- DONE

- [x] Wired real SDK hooks in:
  - [x] `apps/mobile/src/app/(customer)/bookings/[bookingId]/cancel.tsx`
  - [x] `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
  - [x] `apps/mobile/src/app/(tasker)/jobs/[bookingId]/cancel.tsx`
  - [x] `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
  - [x] `apps/mobile/src/app/(shared)/review/hard-lock.tsx`
- [x] UI polish pass completed on launch-live customer posting and task-detail screens

## Test Fallout -- RESOLVED

All test cleanup from the route cuts has been completed:

- Web: `AppRoutesScope.test.tsx` verifies removed routes redirect to `/profile`. No other web tests referenced deleted pages.
- Web Playwright: All 3 smoke specs (`customer-happy-path`, `tasker-happy-path`, `admin-happy-path`) cover only launch-live flows.
- Mobile Jest: 14 deferred-surface test files removed:
  - `OtpScreen`, `OtpMigrationScreen`, `InstantMatchScreen`, `InstantMatchTaskerSheet`
  - `BookingEscrowScreen`, `EscrowScreen`, `ProfilePolishScreen`
  - `ReferralsScreen`, `SubscriptionScreen`
  - `CreditsHistoryScreen`, `CreditsIndexScreen`, `CreditsPayScreen`
  - `WalletScreen`, `WalletPayoutScreen`
- Mobile Maestro: 18 deferred flows moved to `apps/mobile/maestro/flows/deferred/`:
  - B2B flows (JRN-B2B-01 through 04)
  - OTP migration and login (JRN-SHARED-02, 03)
  - Lead unlock, credit, wallet, subscription, boost, instant match, AI polish flows
  - Phase 2/3 screen flows (SCR-P2-001, P2-003, P2-005, P3-003)
- `run-e2e.sh` updated to run only top-level launch-live flows (excludes `deferred/` subdirectory)

## Workstream Split -- ALL COMPLETE

### Workstream A: Web route hardening -- DONE (Tranche 2)

- [x] Edited `AppRoutes.tsx` to remove deferred routes and add redirects
- [x] Edited `AdminLayout.tsx` to remove Payouts and Pricing nav items
- [x] Moved preserved future pages to `apps/web/src/future/`
- [x] Deleted thin web shells (VerificationPage)

### Workstream B: Mobile route hardening -- DONE (Tranche 2)

- [x] Moved future-preserved routes out of `apps/mobile/src/app` to `apps/mobile/src/future/`
- [x] Deleted thin deferred shells (boost, boost-pay, business, dan)
- [x] Updated active navigation

### Workstream C: Launch-live polish -- DONE (Tranches 3-4)

- [x] Web launch copy and admin/tasker/customer parity
- [x] Mobile launch-live SDK hook wiring and UI polish

### Workstream D: Verification/docs realignment -- DONE (Tranche 4)

- [x] Removed 14 mobile test files for deleted/quarantined routes
- [x] Moved 18 deferred Maestro flows to `deferred/` subdirectory
- [x] Updated readiness docs, alignment matrix, and verification matrix
