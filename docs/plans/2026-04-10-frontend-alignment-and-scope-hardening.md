# Frontend Alignment And Scope Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align Tasky web and mobile to the verified Phase 1 launch baseline, remove deferred client surfaces from active apps, preserve only substantial future UI in quarantined modules, and finish the remaining launch-live implementation and polish work.

**Architecture:** Execute five tranches in order. Tranche 1 establishes frontend truth. Tranche 2 tightens the active app surface. Tranches 3 and 4 finish launch-live implementation and polish for web and mobile. Tranche 5 realigns tests, docs, and release evidence to the hardened frontend scope.

**Tech Stack:** React 18, TypeScript, React Router, Expo Router, React Native, Tailwind, Radix UI, generated `@tasky/sdk`, Vitest, Jest, Playwright, Maestro

---

## Execution Rules

- Do not remove or quarantine any route before classifying it against `docs/PRD.md` and `docs/quality/launch-baseline-2026-04.md`.
- Expo Router screens are only disabled when they leave `apps/mobile/src/app`.
- Web pages are only disabled when they leave `AppRoutes.tsx` and all active navigation/CTA entrypoints.
- Preserve substantial deferred code only in `src/future/`; delete thin shells instead of hiding them.
- Any endpoint-driven client change must continue using `@tasky/sdk`; do not introduce handwritten request types.
- Tests for removed or quarantined surfaces must be deleted, demoted, or replaced in the same tranche that changes reachability.

## Tranche 1: Build Frontend Truth Matrix

**Status:** completed
**Priority:** critical
**Depends on:** none

## Description

Create the frontend source-of-truth matrix that maps current web and mobile surfaces to the PRD, launch baseline, screen specs, and actual route exposure. This tranche decides what stays live, what moves to `future/`, and what gets deleted.

## Entry Criteria

- Read `docs/PRD.md`
- Read `docs/quality/launch-baseline-2026-04.md`
- Read `docs/API.yaml`
- Read `docs/plans/2026-04-10-frontend-alignment-and-scope-hardening-design.md`
- Inspect `apps/web/src/router/AppRoutes.tsx`
- Inspect `apps/mobile/src/app/`

## Done When

- every current web and mobile route or page surface is classified
- each deferred surface has an action: `quarantine`, `delete`, or `keep backend-only`
- launch-live journey parity gaps are recorded separately for web and mobile
- the matrix identifies specific screens/components that need implementation or polish before launch

**Execution note (2026-04-10):** The matrix and scope-hardening manifest were published in
`docs/quality/frontend-alignment-matrix-2026-04.md` and `docs/quality/frontend-scope-hardening-2026-04.md`.

### Task 1: Publish the frontend alignment matrix

**Files:**

- Create: `docs/quality/frontend-alignment-matrix-2026-04.md`
- Create: `docs/quality/frontend-scope-hardening-2026-04.md`

**Steps:**

1. Inventory active mobile routes under `apps/mobile/src/app`
2. Inventory active web routes from `apps/web/src/router/AppRoutes.tsx` and `apps/web/src/pages`
3. Classify each surface as `launch-live`, `implemented-gated-backend-only`, `deferred-substantial`, `deferred-shell`, or `delete`
4. Record evidence from PRD, launch baseline, API, and screen specs
5. Produce a keep/quarantine/delete manifest for each app

### Task 2: Capture launch-live implementation gaps

**Files:**

- Modify: `docs/quality/frontend-alignment-matrix-2026-04.md`
- Modify: `docs/quality/frontend-scope-hardening-2026-04.md`

**Steps:**

1. For each launch-live journey, record the current state of data wiring, TODO markers, empty/loading/error states, and UI polish
2. Separate true implementation gaps from purely visual polish gaps
3. Group gaps into web-owned, mobile-owned, and shared-content buckets for delegation

## Verification

```bash
rg --files apps/mobile/src/app | sort
rg --files apps/web/src/pages | sort
rg -n "Route path=|Navigate replace to=" apps/web/src/router/AppRoutes.tsx
rg -n "launch-live|deferred-substantial|deferred-shell|implemented-gated-backend-only|delete" docs/quality/frontend-alignment-matrix-2026-04.md docs/quality/frontend-scope-hardening-2026-04.md
```

---

## Tranche 2: Harden Active Frontend Scope

**Status:** in_progress
**Priority:** critical
**Depends on:** Tranche 1

## Description

Remove deferred capability exposure from both clients. Launch-live screens remain reachable. Substantial future work is quarantined under `src/future/`. Thin or misleading shells are deleted.

## Entry Criteria

- Tranche 1 completed
- each deferred surface has a ratified action in the scope-hardening manifest

## Done When

- no deferred mobile screen remains under `apps/mobile/src/app`
- no deferred web route remains in `AppRoutes.tsx` or active navigation
- preserved future UI lives under `apps/mobile/src/future/` or `apps/web/src/future/`
- deleted or quarantined surfaces no longer influence active smoke/test suites

**Execution note (2026-04-10):** The first web scope-hardening slice is complete: the stale `/verification` route and
page were removed, and targeted route/admin tests now assert the hardened web surface. Mobile route hardening remains
pending in this tranche.

### Task 3: Harden mobile route exposure

**Files:**

- Modify: `apps/mobile/src/app/**/*`
- Create: `apps/mobile/src/future/**/*`
- Modify: `apps/mobile/__tests__/**/*`

**Steps:**

1. Move substantial deferred screens and supporting components out of Expo Router into `apps/mobile/src/future/`
2. Delete thin deferred shells and their tests
3. Remove launch-incompatible tabs, deep links, buttons, and route pushes
4. Update mobile tests to stop expecting quarantined routes

### Task 4: Harden web route exposure

**Files:**

- Modify: `apps/web/src/router/AppRoutes.tsx`
- Modify: `apps/web/src/pages/**/*`
- Modify: `apps/web/src/layout/**/*`
- Create: `apps/web/src/future/**/*`
- Modify: `apps/web/src/pages/**/*.test.tsx`
- Modify: `apps/web/e2e/**/*`

**Steps:**

1. Remove deferred routes from `AppRoutes.tsx` and active nav surfaces
2. Move substantial future pages/components to `apps/web/src/future/`
3. Delete thin future shells and route-only tests
4. Update browser and component tests to match the hardened route tree

## Verification

```bash
rg --files apps/mobile/src/app | sort
rg --files apps/mobile/src/future | sort
rg --files apps/web/src/future | sort
rg -n "instant-match|boost|wallet|subscription|referrals|business|credits|lead-unlock|otp|dan" apps/mobile/src/app apps/web/src/router apps/web/src/layout
pnpm --filter @tasky/web exec vitest run --reporter verbose
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false
```

---

## Tranche 3: Align And Polish Launch-Live Web

**Status:** planned
**Priority:** high
**Depends on:** Tranche 2

## Description

Bring the remaining web launch-live journeys up to PRD and screen-spec parity. This tranche is about implementation completion, copy accuracy, admin coherence, and deliberate polish on the actual launch surface.

## Entry Criteria

- Tranche 2 completed
- active web route tree reflects launch scope

## Done When

- customer, tasker, shared, and admin launch-live pages reflect PRD scope
- web launch pages have consistent empty/loading/error states
- copy and CTAs no longer imply deferred monetization or dormant capabilities
- remaining web UI defects are documented with explicit deferral if not fixed in tranche

### Task 5: Close web launch-live behavior gaps

**Files:**

- Modify: `apps/web/src/pages/**/*`
- Modify: `apps/web/src/components/**/*`
- Modify: `apps/web/src/locales/**/*`

**Steps:**

1. Fix launch-live pages that are still partial, stale, or route-drifted
2. Remove deferred language from landing, booking, task, and admin surfaces
3. Align tasker/customer/admin flows with the launch baseline and real backend behavior

### Task 6: Polish web quality and consistency

**Files:**

- Modify: `apps/web/src/pages/**/*`
- Modify: `apps/web/src/components/**/*`
- Modify: `apps/web/src/styles/**/*`

**Steps:**

1. Normalize spacing, typography, hierarchy, and CTA treatment across launch-live pages
2. Ensure loading, empty, error, and restricted-account states are explicit and consistent
3. Review responsive behavior on primary launch screens

## Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web exec vitest run --reporter verbose
pnpm --filter @tasky/web exec playwright test --project=chromium
```

---

## Tranche 4: Align And Polish Launch-Live Mobile

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 2

## Description

Complete and polish the mobile launch-live journeys after the deferred surface has been removed from the router tree. Mobile is expected to carry the largest implementation and visual quality delta.

## Entry Criteria

- Tranche 2 completed
- mobile Expo Router tree reflects launch scope
- launch-live mobile gap list is current

## Done When

- launch-live customer, tasker, and shared flows match the PRD and screen specs
- obvious TODO placeholders are removed from launch-live paths
- mobile UI quality is consistent on launch-critical screens
- navigation, back behavior, and state transitions are coherent across the active app

### Task 7: Close mobile launch-live behavior gaps

**Files:**

- Modify: `apps/mobile/src/app/**/*`
- Modify: `apps/mobile/src/features/**/*`
- Modify: `apps/mobile/src/components/**/*`
- Modify: `apps/mobile/src/locales/**/*`

**Steps:**

1. Fix partial launch-live flows in auth, onboarding, task posting, task detail, booking, messaging, reviews, disputes, and shared account/profile areas
2. Replace remaining TODO or placeholder behavior in launch-live screens with real UX or explicit not-available handling
3. Align mobile screen copy and CTAs with PRD and backend truth

### Task 8: Polish mobile UI quality

**Files:**

- Modify: `apps/mobile/src/app/**/*`
- Modify: `apps/mobile/src/components/**/*`
- Modify: `apps/mobile/src/design/**/*`

**Steps:**

1. Normalize spacing, visual hierarchy, density, and content rhythm across launch-live screens
2. Improve empty/loading/error states and restricted-state handling
3. Review small-device layout behavior and touch target consistency

## Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false
pnpm --filter @tasky/mobile exec maestro test .maestro
```

---

## Tranche 5: Realign Verification, Docs, And Release Evidence

**Status:** planned
**Priority:** high
**Depends on:** Tranche 3, Tranche 4

## Description

Finalize the frontend program by making the docs, tests, and release evidence reflect the hardened scope and polished launch surfaces.

## Entry Criteria

- web and mobile launch-live polish work completed
- quarantined/deleted surface list is final

## Done When

- tests for deleted or quarantined surfaces are removed or demoted
- launch-live coverage is current for both clients
- docs that describe frontend behavior match the hardened apps
- release-readiness artifacts reflect the new frontend truth

### Task 9: Rebuild frontend verification around the hardened scope

**Files:**

- Modify: `apps/web/src/pages/**/*.test.tsx`
- Modify: `apps/mobile/__tests__/**/*`
- Modify: `apps/web/e2e/**/*`
- Modify: `apps/mobile/.maestro/**/*`
- Modify: `docs/quality/test-trust-audit.md`
- Modify: `docs/quality/verification-matrix.md`

**Steps:**

1. Remove or demote tests that only cover deleted/quarantined surfaces
2. Strengthen launch-live tests where gaps remain after the frontend changes
3. Update web Playwright and mobile Maestro coverage to the hardened scope

### Task 10: Update canonical frontend-facing docs

**Files:**

- Modify: `docs/PRD.md`
- Modify: `docs/quality/launch-baseline-2026-04.md`
- Modify: `docs/quality/frontend-alignment-matrix-2026-04.md`
- Modify: `docs/quality/final-launch-readiness-report-2026-04.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Record the final launch-live frontend surface and the deferred quarantine list
2. Remove stale documentation references to deleted or no-longer-reachable client surfaces
3. Update launch-readiness reporting with the new frontend state

## Verification

```bash
pnpm -r typecheck
pnpm -r test
pnpm --filter @tasky/web exec playwright test --project=chromium
pnpm --filter @tasky/mobile exec maestro test .maestro
pnpm exec prettier --check docs/plans/2026-04-10-frontend-alignment-and-scope-hardening-design.md docs/plans/2026-04-10-frontend-alignment-and-scope-hardening.md docs/quality/frontend-alignment-matrix-2026-04.md docs/quality/frontend-scope-hardening-2026-04.md
```

---

## Suggested Delegation Split

- **Agent A: Frontend truthing and matrix**
  - owns Tranche 1 outputs and evidence gathering
- **Agent B: Mobile scope hardening and future-code quarantine**
  - owns mobile route classification execution in Tranche 2
- **Agent C: Web scope hardening and future-code quarantine**
  - owns web route classification execution in Tranche 2
- **Agent D: Launch-live web parity/polish**
  - begins after Tranche 2 web cut list is stable
- **Agent E: Launch-live mobile parity/polish**
  - begins after Tranche 2 mobile cut list is stable
- **Agent F: Verification/docs realignment**
  - follows the quarantine and polish work, then updates tests/docs
