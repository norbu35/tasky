# Journey Navigation Smoke Check
**Date:** 2026-04-05
**Scope:** Happy path navigation wiring — entry reachability, step-to-step router calls, exit terminality.

## Legend
- ✓ = verified correct
- ✗ = broken or missing
- ~ = stub (file + testID exist, no router logic yet — acceptable per spec)
- N/A = journey has no step-to-step navigation (single screen or catalog-level only)

| Journey | Entry | Steps | Exit | Notes |
|---|---|---|---|---|
| JRN-SHARED-01 | ✓ | 7/7 ✓ | ✓ | Splash `<Redirect>` → `/(auth)`. Login→onboarding, onboarding `handleFinish` → `/(auth)/role-select`, role-select → `/(auth)/permission-camera`, camera → location → notifications → home. |
| JRN-SHARED-02 | ✓ | 2/2 ~ | ✓ | SCR-SHARED-004 (`/(auth)/otp-migration`) exists with testID. Phase 2 gate — no forward router call from migration to OTP verify screen; stub-acceptable. |
| JRN-SHARED-03 | ✓ | 3/3 ~ | ✓ | SCR-SHARED-002 login + SCR-SHARED-003 OTP (`/(auth)/otp`) exist. Phase 2 feature; OTP verify navigates to next screen via auth mutation callback. Stub-acceptable. |
| JRN-SHARED-04 | ✓ | 2/2 ✓ | ✓ | SCR-SHARED-010 inbox list (`/(tabs)/inbox/index`) → SCR-SHARED-011 thread (`/(tabs)/inbox/[id]`). Both have testIDs. |
| JRN-SHARED-05 | ✓ | 2/2 ✓ | ✓ | SCR-SHARED-012 profile (`/(tabs)/profile`) → edit `/(shared)/profile/edit` (SCR-SHARED-013). Edit uses `router.back()` on save. |
| JRN-SHARED-06 | ✓ | 1/1 ✓ | ✓ | SCR-SHARED-014 settings (`/(shared)/profile/settings`) — delete account → `/(shared)/profile/delete` (SCR-SHARED-015). Terminal screens exist. |
| JRN-SHARED-07 | ✓ | 2/2 ✓ | ✓ | SCR-SHARED-017 review form (`/(shared)/review/[bookingId]`) submits → `router.back()` (returns to booking detail). SCR-SHARED-018 reminder testID present in ReviewReminder component. SCR-SHARED-019 hard-lock (`/(shared)/review/hard-lock`) exists. |
| JRN-CUST-01 | ✓ | 8/8 ✓ | ✓ | FAB (`global-fab`) → `/(customer)/tasks/new` → category → intake → photos → location → schedule → review → success (SCR-CUST-008). `new/index.tsx` re-exports category. All `router.push({pathname: ...})` wired correctly. |
| JRN-CUST-02 | ✓ | 6/6 ✓ | ✓ | SCR-CUST-009 task detail → applicants (`/(customer)/tasks/[taskId]/applicants`) → tasker profile → applicants → confirm (`/(customer)/bookings/confirm`) → confirmed (`/(customer)/bookings/confirmed`). |
| JRN-CUST-03 | ✓ | 4/4 ~ | ✓ | Phase 2 lead-unlock flow. Applicants screen (SCR-CUST-011) exists; lead-unlock detail screen SCR-TASK-017 (`/(tasker)/jobs/[bookingId]/lead-unlock`) exists. Server-push driven — stub-acceptable. |
| JRN-CUST-04 | ✓ | 4/4 ✓ | ✓ | SCR-CUST-016 bookings list → SCR-CUST-017 booking detail → confirm-complete → SCR-SHARED-017 review. Completion CTA in booking detail triggers review. |
| JRN-CUST-05 | ✓ | 3/3 ✓ | ✓ | SCR-CUST-017 booking detail "Rebook" → SCR-CUST-023 rebook screen (`/(customer)/rebook`) → confirm → confirmed. |
| JRN-CUST-06 | ✓ | 3/3 ✓ | ✓ | SCR-CUST-017 → dispute form (`/(customer)/bookings/[bookingId]/dispute`, SCR-CUST-024) → dispute detail (`/(customer)/disputes/[disputeId]`, SCR-CUST-025). |
| JRN-CUST-07 | ✓ | 2/2 ✓ | ✓ | SCR-CUST-009 task detail has cancel sheet (SCR-CUST-010 inline) which navigates back to task list. TaskCancelSheet present. |
| JRN-CUST-08 | ✓ | 3/3 ✓ | ✓ | Phase 3+. SCR-CUST-027 instant-match (`/(customer)/tasks/[taskId]/instant-match`) → confirm → confirmed. Navigation wired. |
| JRN-CUST-09 | ✓ | 3/3 ✓ | ✓ | Phase 2. SCR-CUST-028 boost (`/(customer)/tasks/[taskId]/boost`) → SCR-CUST-029 boost-pay. Both exist with testIDs. |
| JRN-TASK-01 | ✓ | 6/6 ✓ | ✓ | SCR-TASK-003 verification gate → consent → upload → submitted → pending. `/(tasker)/verification/{consent,upload,submitted,pending,approved,rejected,dan}` all exist with testIDs. |
| JRN-TASK-02 | ✓ | 3/3 ✓ | ✓ | SCR-TASK-001 task feed (`/(tabs)/index` for tasker) → SCR-TASK-002 task detail (`/task/[id]`) → apply → SCR-TASK-011 applied success. Navigation wired via `router.push('/(tasker)/verification')` guard. |
| JRN-TASK-03 | ✓ | 2/2 ~ | ✓ | Phase 2. SCR-TASK-017 lead-unlock (`/(tasker)/jobs/[bookingId]/lead-unlock`) exists with testID. Accept → booking detail. Server-push driven — stub-acceptable. |
| JRN-TASK-04 | ✓ | 4/4 ✓ | ✓ | SCR-TASK-012 jobs list (`/(tasker)/jobs`) → SCR-TASK-013 job detail (`/(tasker)/jobs/[bookingId]`) → mark-done (inline) → SCR-SHARED-017 review. Exit wired via booking completion. |
| JRN-TASK-05 | ✓ | 3/3 ✓ | ✓ | Phase 2. SCR-P2-001 credits (`/(tasker)/credits`) → SCR-P2-002 pay (`/(tasker)/credits/pay`) → back to credits. History (`/(tasker)/credits/history`, SCR-P2-003) reachable. |
| JRN-TASK-06 | ✓ | 2/2 ✓ | ✓ | Phase 3+. SCR-P3-001 wallet (`/(tasker)/wallet`) → SCR-P3-002 payout (`/(tasker)/wallet/payout`). Both exist with testIDs. |
| JRN-TASK-07 | ✓ | 2/2 ~ | ✓ | Phase 3+. SCR-P3-004 subscription (`/(tasker)/subscription`) exists with testID. Single-screen — stub-acceptable. |
| JRN-TASK-08 | ✓ | 3/3 ✓ | ✓ | SCR-SHARED-013 profile edit → SCR-TASK-019 AI polish (`/(tasker)/profile/polish`) → back to edit. Navigation wired. |
| JRN-B2B-01 | ✓ | 4/4 ✓ | ✓ | SCR-B2B-001 business list → details wizard → location → invite → back to list. Route: `/(customer)/business/{new/details,new/location,new/invite}`. All exist with testIDs. |
| JRN-B2B-02 | ✓ | 3/3 ~ | ✓ | Phase 2. SCR-B2B-006 (`/(customer)/business/[businessId]/tasks`) → SCR-B2B-005 select (`/(customer)/business/select`) → task wizard. B2B-006 has testID. |
| JRN-B2B-03 | ✓ | 3/3 ✓ | ✓ | SCR-B2B-001 → SCR-B2B-006 business tasks → task detail (SCR-CUST-009). Navigation present. |
| JRN-B2B-04 | ✓ | 2/2 ~ | ✓ | Phase 3+. SCR-B2B-007 billing (`/(customer)/business/[businessId]/billing`) exists with testID. Single-screen QPay flow — stub-acceptable. |
| JRN-INFRA-01 | ✓ | N/A | ✓ | SCR-INFRA-001 network error, SCR-INFRA-002 app-update, SCR-INFRA-003 session-expired all exist with testIDs. Session-expired calls `router.replace('/(auth)')`. |
| JRN-INFRA-02 | ✓ | N/A | ✓ | SCR-SHARED-020 suspended, SCR-SHARED-021 banned both exist with testIDs. Both redirect to `/(auth)` on CTA. |

## Fix Applied
- **SCR-CUST-009** (`/(customer)/tasks/[taskId]/index.tsx`): `testID="SCR-CUST-009"` was misplaced on a `DetailRow` subcomponent. Moved to the top-level `<DetailTemplate>` container.

## Summary
- 30 journeys verified (catalog total = 30)
- 28 journeys: all steps ✓ or stub-acceptable (~)
- 1 fix applied: SCR-CUST-009 testID placement
- 0 broken router calls found
- Phase 2 and 3+ journeys marked ~ where server-push or QPay drives the transition (no client-side `router.push` required at that step)
