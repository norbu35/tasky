# Maestro Setup & Architectural Drift Alignment Handoff

**Date:** April 5, 2026
**Target Agent:** Next AI Assistant (e.g., Claude, Gemini)
**Goal:** Finalize the alignment between `docs/design/` specifications and the actual Expo Router codebase, and begin writing Maestro E2E test specs.

## 1. Findings & Context

We started setting up Maestro for E2E testing to catch layout bugs (like Flexbox collapsing issues in React Native that Jest cannot catch).
To do this efficiently, we analyzed the design specifications using the repaired authority chain:
- **User Flows:** `docs/design/journey-catalog.yaml`
- **Screen Route/State Authority:** `docs/design/screen-specs/SCR-*.yaml`
- **State Coverage Checklist:** `docs/design/state-matrix.yaml`
- **Synchronized Summary Only:** `docs/design/screen-inventory.yaml`
- **Traceability Rules:** `docs/ARCHITECTURE.md` (mandates `TID-*` or `SCR-*` identifiers for testing).

**The Drift We Discovered:**
1. **Routes:** The `screen-inventory.yaml` specified semantic paths (e.g., `/auth/login`), but the codebase uses Expo Router grouping (e.g., `(auth)/index.tsx` mapping to `/`). 
2. **Identifiers:** The codebase was missing the architectural `SCR-*` identifiers in its `testID` props, instead relying on ad-hoc strings like `testID="login-screen"`.

## 2. Progress So Far

1. **Installed Maestro:** Maestro CLI is installed locally.
2. **Wrote Initial Flows:** Translated `JRN-SHARED-01` into an executable Maestro flow at `apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml` and created a smoke test (`smoke-feed.yaml`).
3. **Fixed Routes:** Route and state authority now belong to `docs/design/screen-specs/SCR-*.yaml`; `docs/design/screen-inventory.yaml` is a synchronized summary only.
4. **Injected TestIDs:** Used a script to inject the official `SCR-*` tags into the topmost layout components of each screen in `apps/mobile/src/app/**/*.tsx`.
5. **Fixed Type Errors:** Many files ended up with duplicate `testID` props (e.g., `testID="SCR-SHARED-002" testID="login-screen"`). We successfully cleaned up 40+ of these duplicates.

## 3. What's Left To Be Done

### Step A: Fix Remaining TypeScript Errors
There are currently **12 duplicate `testID` errors** preventing the build from passing. You must fix these before writing more tests.

Run `pnpm --filter @tasky/mobile typecheck` to see them.
The files currently failing due to `JSX elements cannot have multiple attributes with the same name` are:
1. `src/app/(customer)/bookings/[bookingId]/dispute.tsx:78`
2. `src/app/(customer)/rebook.tsx:107`
3. `src/app/(customer)/tasks/new/location.tsx:79`
4. `src/app/(customer)/tasks/new/photos.tsx:74`
5. `src/app/(customer)/tasks/new/schedule.tsx:185`
6. `src/app/(shared)/profile/edit.tsx:66`
7. `src/app/(tabs)/profile.tsx:52`
8. `src/app/(tasker)/credits/pay.tsx:32`
9. `src/app/(tasker)/jobs/[bookingId]/index.tsx:56`
10. `src/app/(tasker)/profile/polish.tsx:206`
11. `src/app/(tasker)/verification/approved.tsx:17`
12. `src/app/(tasker)/verification/submitted.tsx:17`

**Action:** Open each file, locate the duplicated `testID` props on the root `ScreenContainer` or `DetailTemplate`, keep the `SCR-*` identifier, and remove the legacy ad-hoc identifier. Then verify with `pnpm --filter @tasky/mobile test`.

### Step B: Write Maestro Test Specifications
Once the build is green, the architecture is aligned enough to continue Maestro authoring.
You can now use `docs/design/journey-catalog.yaml` plus `docs/design/screen-specs/SCR-*.yaml` to write the remaining Maestro flow files inside `apps/mobile/maestro/flows/`.

## Maestro Coverage Model
1. **Journey flows:** one Maestro flow per `JRN-*` happy path, plus selected high-risk alternate paths.
2. **Screen/state coverage:** additional Maestro smoke/state flows for screens or required states not covered by journeys.

Route and state authority for Maestro come from `docs/design/screen-specs/SCR-*.yaml`.
`docs/design/journey-catalog.yaml` defines flow coverage.
`docs/design/state-matrix.yaml` defines required state coverage.
`docs/design/screen-inventory.yaml` is a synchronized summary only.

When a route is needed for implementation or debugging, look it up in the matching `screen-specs/SCR-*.yaml` file first.

Known uncovered families still requiring explicit Maestro planning beyond journey happy paths:
- Notification Center
- Legal/help/privacy/stats surfaces
- B2B surfaces — **not implemented in codebase; defer entirely**
- Phase 2 monetization screens — **implemented: credits (P2-001..003), referrals (P2-005); P2-004 (task boost) missing**
- Phase 3 wallet/escrow/subscription/instant match — **implemented: all Phase 3 screens present**

**Implementation status audit (2026-04-05):** See `docs/quality/mobile-implementation-status-2026-04-05.md` for the definitive per-screen and per-journey implementation status derived from static analysis of the full mobile codebase. This supersedes the earlier assumption that only Phase 0-1 was available. Phase 2 is substantially implemented. Phase 3 screens are present. B2B is the only family with zero implementation.

When writing Maestro `.yaml` files, **always use the injected `SCR-*` IDs** (e.g., `- assertVisible: id: "SCR-SHARED-002"`) to ensure the tests remain robust against localization changes and structural redesigns.