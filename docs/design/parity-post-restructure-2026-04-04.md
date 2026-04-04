# Post-Restructure Mobile Parity Checklist (2026-04-04)

## Scope
This checklist is for the **validation-only** parity pass after the NativeWind/token/shell restructuring.
Do not reopen architecture decisions in this pass; only record and fix residual visual/state drift.

## Design Source
- Figma file key: `IljfnTQPkq7vpkmK1NN1NC`
- Plan reference: `docs/plans/2026-04-04-mobile-nativewind-foundation-plan.md` (final tranche)

## Validation Matrix
| Area | Route | Screen/Test Ref | Status | Notes |
|---|---|---|---|---|
| Auth | `apps/mobile/src/app/(auth)/index.tsx` | `SCR-SHARED-002` | pending | Verify language pill placement and hero/footer spacing after shell migration. |
| Auth | `apps/mobile/src/app/(auth)/otp.tsx` | `SCR-SHARED-003` | pending | OTP hidden input is intentionally raw `TextInput`; verify code-cell visual parity. |
| Auth | `apps/mobile/src/app/onboarding.tsx` | `SCR-SHARED-005` | pending | Re-check top bar, pagination dots, and CTA spacing. |
| Auth | `apps/mobile/src/app/(auth)/role-select.tsx` | `SCR-SHARED-006` | pending | Selected-card fill and border are locked to test expectations. |
| Customer Posting | `apps/mobile/src/app/(customer)/tasks/new/category.tsx` | `SCR-CUST-002` | pending | Validate search/header rhythm and card spacing after shell migration. |
| Customer Posting | `apps/mobile/src/app/(customer)/tasks/new/success.tsx` | `SCR-CUST-008` | pending | Verify hero/card/action spacing under sticky action bar behavior. |
| Customer Booking | `apps/mobile/src/app/(customer)/bookings/confirmed.tsx` | `SCR-CUST-015` | pending | Confirm CTA stack, success icon area, and decorative accent behavior. |
| Customer Booking | `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx` | `SCR-CUST-020` | pending | Validate sticky submit CTA and scroll insets across device sizes. |
| Customer Tasks | `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx` | `SCR-CUST-011` | pending | Check header/list/sheet composition after `ScreenContainer` migration. |
| Customer Disputes | `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx` | `SCR-CUST-025` | pending | Verify timeline/evidence cards after bottom-nav removal. |
| Shared | `apps/mobile/src/app/(shared)/legal/terms.tsx` | `SCR-INFRA-004` | pending | Validate legal page hierarchy and spacing with inset scroll shell. |
| Shared | `apps/mobile/src/app/(shared)/help.tsx` | `SCR-INFRA-005` | pending | Validate search field and FAQ sections after input primitive migration. |
| Tasker | `apps/mobile/src/app/(tasker)/verification/consent.tsx` | `SCR-TASK-004` | pending | Verify scroll gate + sticky CTA behavior and legal link spacing. |
| Tasker Feed | `apps/mobile/src/app/(tabs)/index.tsx` | `SCR-TASK-001` | pending | Confirm search field and header composition after `Input` migration. |
| Tasker Wallet | `apps/mobile/src/app/(tasker)/wallet/payout.tsx` | `SCR-P3-002` | pending | Validate payout input and error-state spacing with shared `Input`. |

## Verification Evidence To Capture
- iOS simulator screenshots for each validated route state.
- Android simulator spot-checks for sticky action bars and inset behavior.
- Any intentional deviations documented inline in this file before merge.

## Review Loop (2026-04-04)
- Corrected SCR mapping errors discovered during code audit (reschedule/help/terms rows).
- Cleared mobile lint warnings to zero project warnings (only ESLint v9 `.eslintrc` deprecation warning remains tooling-level).
- Parity matrix statuses remain `pending` until simulator + Figma state capture is attached.
