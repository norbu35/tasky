# Mobile Contract Alignment Spec

Date: 2026-04-21
Scope: `apps/mobile`, with updates to `docs/ARCHITECTURE.md` only if contract wording is proven incomplete by implementation work
Status: execution spec for aligning the current mobile codebase with the cleaned architecture contract
Normative source: `docs/ARCHITECTURE.md` section 7.7

## Purpose

This spec is not a second architecture contract. It is an implementation guide for bringing the mobile codebase into conformance with the contract that now lives in `docs/ARCHITECTURE.md`.

It is written for a weaker model. The intent is to:

1. keep the work bounded
2. prevent reopening already-settled architecture decisions
3. make the remaining contract-alignment work executable in safe vertical slices
4. specify concrete stop conditions and verification so the implementation does not drift into a rewrite

## Current State Snapshot

Use this snapshot as the baseline unless the code changes before implementation starts.

### Contract and Enforcement

- `docs/ARCHITECTURE.md` section 7.7 is now the only normative mobile contract.
- `apps/mobile/scripts/structure-check.js` enforces:
  - route budgets
  - route banned imports
  - route-to-route warnings
  - component/design boundaries
  - provider/store/lib/utils boundaries
  - screen-family budgets
- Current `structure:check` status:
  - `0` fail items
  - `5` warnings

### Current Route Warnings

These are warning-only, tolerated state-style routes:

- `src/app/(shared)/app-update.tsx`
- `src/app/(shared)/network-error.tsx`
- `src/app/(shared)/session-expired.tsx`
- `src/app/(tasker)/verification/pending.tsx`
- `src/app/(tasker)/verification/rejected.tsx`

These are not the primary blockers for contract alignment. They should only be thinned if the touched slice benefits clearly from doing so.

### Current Structural Hotspots

1. Root bootstrap and runtime ownership are still too implicit.
   - `src/app/_layout.tsx` wires token-refresh behavior through top-level module side effects.
   - `RootLayout` calls `useProfileSync()` before `QueryClientProvider` is mounted in the returned tree.
   - Push/background message setup also lives inline in `_layout.tsx`.

2. Server state is still mirrored into Zustand.
   - `src/store/authStore.ts` stores `profile`.
   - `src/features/profile/hooks/useProfile.ts` subscribes to the query cache and copies `me` query data into the store.
   - Consumers still read `profile` from `authStore`:
     - `src/hooks/useRouteGuard.ts`
     - `src/features/tasks/hooks/useTasks.ts`
     - `src/features/chat/screens/useChatConversation.ts`

3. `authStore` still contains dead or weakly justified state.
   - `deviceToken` and `setDeviceToken` exist in `src/store/authStore.ts`.
   - There are currently no runtime consumers of that state.

4. Query key usage is inconsistent.
   - `src/lib/queryKeys.ts` exists.
   - Many hooks still use raw array keys directly.
   - Several invalidations still target coarse string prefixes directly.
   - `useProfileSync` currently depends on the literal `'me'` query-key prefix rather than the key factory.

5. Domain API modules are still thin facades over a transport god-object.
   - `src/lib/mobileApiClient.ts` is `971` lines.
   - The `MobileApiClient` interface still exposes domain methods across auth, profile, tasks, bookings, reviews, disputes, chat, notifications, and verification.
   - Feature-local `api.ts` files are mostly pass-through wrappers over `createMobileApiClient()`, for example `src/features/tasks/api.ts`.

6. Legacy screen-decomposition migration is already largely complete.
   - There are currently no `*.parts.tsx` files under `apps/mobile/src`.
   - Do not reopen screen-family naming work unless a touched file still violates the current contract or budget.

## Goals

This alignment effort is successful when all of the following are true:

1. root bootstrap and app-wide provider ownership match the runtime-ownership contract
2. `authStore` no longer mirrors query-owned profile data
3. query-key usage is normalized enough that invalidation and current-user access are predictable
4. `mobileApiClient.ts` trends toward transport-only infrastructure instead of remaining the de facto domain API
5. no implementation slice regresses `structure:check`
6. the resulting code is easier for weaker models to edit without violating the contract

## Non-Goals

This spec does not authorize:

1. changing the mobile architecture contract again unless implementation proves a true gap
2. replacing Expo Router, React Query, Zustand, NativeWind, or Jest
3. redesigning the UI
4. rewriting every screen family
5. backend API changes unless the implementation proves an existing mobile path cannot comply without one
6. broad naming churn outside touched files

## Working Rules For The Weaker Model

1. Treat `docs/ARCHITECTURE.md` as the source of truth.
   If this spec and the contract disagree, the contract wins.

2. Prefer bounded extractions over rewrites.
   Move code into the layer that already owns it instead of inventing new abstractions early.

3. Keep each tranche independently verifiable.
   Do not combine store cleanup, transport decomposition, and route thinning in one uncontrolled patch.

4. Do not add new global state to compensate for awkward query usage.
   If data is server-owned, prefer React Query.

5. Do not move transport concerns upward.
   If `mobileApiClient.ts` is awkward, split domain work out of it; do not spread transport usage into screens, providers, or stores.

6. Do not spend primary effort on tolerated route warnings unless the touched slice directly benefits.

7. If a change requires backend contract work or a new cross-feature abstraction whose owner is unclear, stop and report instead of guessing.

## Tranche Order

Implement the work in the order below.

## Tranche 0: Baseline Verification And Working Map

### Goal

Start from a fresh factual baseline before editing.

### Read First

- `docs/ARCHITECTURE.md` section 7.7
- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/store/authStore.ts`
- `apps/mobile/src/features/profile/hooks/useProfile.ts`
- `apps/mobile/src/lib/queryKeys.ts`
- `apps/mobile/src/lib/mobileApiClient.ts`
- representative feature APIs:
  - `src/features/tasks/api.ts`
  - `src/features/bookings/api.ts`
  - `src/features/profile/api.ts`

### Required Artifact

Produce a short working note with:

- current structure-check output
- current consumers of `authStore.profile`
- current uses of `getSharedApiClient()` / token-refresh delegate wiring
- current count and examples of raw query keys
- current domains still implemented inside `mobileApiClient.ts`

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`

## Tranche 1: Root Bootstrap And Provider Ownership

### Goal

Bring `src/app/_layout.tsx` into compliance with the runtime-ownership contract and remove provider-order hazards.

### Primary Problems To Fix

1. `useProfileSync()` is called inside `RootLayout` before `QueryClientProvider` exists in the rendered tree.
2. Token-refresh delegate wiring currently runs as a top-level module side effect in `_layout.tsx`.
3. Background/foreground notification wiring is mixed into route-root composition rather than being clearly owned by bootstrap/provider code.

### Scope

- `src/app/_layout.tsx`
- any new bootstrap helper/provider created to own app-wide setup
- `src/providers/**` only if the ownership boundary becomes clearer there

### Required Changes

1. Move query-dependent bootstrap logic so it runs under `QueryClientProvider`.
   Acceptable patterns:
   - a child bootstrap component rendered inside the provider tree
   - a dedicated app-bootstrap provider under the root shell

2. Move token-refresh delegate setup out of top-level module execution.
   The setup may still live near root bootstrap, but it must be owned by a mounted runtime surface rather than import-time side effects.

3. Keep `_layout.tsx` focused on:
   - provider composition
   - platform lifecycle bridges
   - root navigation shell

4. If notification bootstrap remains app-wide, make that ownership explicit.
   The implementation may stay in `_layout.tsx` or a provider/bootstrap child, but the resulting structure should be obvious and bounded.

### Acceptance Criteria

- no query-dependent hook is invoked before its provider exists
- root token-refresh wiring is not executed as module-level side effect
- `_layout.tsx` reads as provider composition plus bounded bootstrap only

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx`
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/navigation-wiring.test.tsx`

## Tranche 2: Remove Query-Owned Profile Mirroring From Zustand

### Goal

Align store ownership with the contract by removing `profile` from `authStore` and stopping query-cache mirroring.

### Current Problem Surface

- `src/store/authStore.ts`
- `src/features/profile/hooks/useProfile.ts`
- `src/hooks/useRouteGuard.ts`
- `src/features/tasks/hooks/useTasks.ts`
- `src/features/chat/screens/useChatConversation.ts`

### Required Changes

1. Remove `profile` and `setProfile` from `authStore` unless implementation proves a narrow, non-query-owned subset must remain.
2. Delete `useProfileSync()` after its consumers are migrated.
3. Introduce one stable current-user query path for consumers that need authenticated profile data.
   Acceptable patterns:
   - `useMyProfile()`
   - a small dedicated helper hook for current-user status/id derived from `useMyProfile()`

4. Migrate current consumers:
   - `useRouteGuard` should derive restriction state from query-owned profile data or an explicitly justified auth-status surface
   - `useTaskDetail` should stop reading verification state from `authStore.profile`
   - `useChatConversation` should derive `myId` without store mirroring

5. Remove `deviceToken` from `authStore` unless a real runtime owner is introduced in the same slice.
   Current baseline suggests it is dead state.

### Important Constraint

Do not introduce a new global store just to replace `profile`. The contract prefers React Query ownership for server state.

### Acceptance Criteria

- `authStore` owns session/bootstrap state only
- no query-cache subscription mirrors `me` into Zustand
- current-user consumers rely on query-owned data or a narrow derived helper
- dead `deviceToken` state is removed or explicitly justified and wired

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/hooks/useRouteGuard.test.tsx`
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/route-guard-integration.test.tsx`
- smallest touched screen or hook tests in chat/tasks/profile

## Tranche 3: Query Key Normalization And Cache Semantics

### Goal

Make query ownership predictable enough that weaker models can mutate cache logic safely.

### Current Problem Surface

- `src/lib/queryKeys.ts` exists but is not used consistently
- multiple hooks still use raw array keys directly
- invalidations often target broad string prefixes such as `['booking']`, `['tasks']`, `['messages']`

### Required Changes

1. Use `src/lib/queryKeys.ts` as the default key factory in touched features.
2. Standardize at least the domains affected by Tranche 2 and any touched mutation hooks:
   - profile
   - tasks
   - bookings
   - chat

3. Replace literal cache subscriptions or invalidations that depend on ad hoc prefixes when the key factory can express the intent.
4. Fix obvious naming drift such as inconsistent recent-location key names if touched as part of the slice.

### Important Constraint

Do not attempt a repo-wide query-key rewrite in one pass. Normalize by domain and by touched mutation/query pairs.

### Acceptance Criteria

- touched features use `queryKeys` instead of ad hoc literals
- invalidations in touched features are specific and reviewable
- current-user/profile logic no longer depends on literal `'me'` prefix matching

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`
- targeted hook tests for touched domains
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx`

## Tranche 4: Transport Decomposition Behind Real Feature APIs

### Goal

Move the codebase toward the contract’s “transport-only lib, domain-owned feature API” model without attempting a single-shot rewrite.

### Current Problem Surface

- `src/lib/mobileApiClient.ts` is `971` lines
- `MobileApiClient` still exposes domain methods across nearly every feature
- representative feature APIs such as `src/features/tasks/api.ts` are thin pass-through wrappers over the transport client

### Required Changes

This tranche should be done incrementally by domain. Recommended order:

1. Profile
2. Notifications
3. Tasks
4. Bookings
5. Chat / review / disputes / verification as follow-on slices

For each touched domain:

1. Move request construction and response mapping into the feature-local `api.ts`.
2. Reduce feature dependence on domain-specific methods hanging off `MobileApiClient`.
3. Preserve shared transport responsibilities in `mobileApiClient.ts`:
   - base URL resolution
   - auth headers
   - token refresh
   - request primitives
   - transport-level error mapping

4. Prefer extracting reusable transport helpers over adding more domain methods to `MobileApiClient`.

### Important Constraints

- Do not rewrite every domain in one patch.
- Do not expose raw fetch logic to screens, hooks, stores, or providers.
- Do not change backend contracts in this tranche unless separately approved.

### Acceptance Criteria

- touched domain APIs own their endpoint details
- `mobileApiClient.ts` shrinks or, at minimum, stops accumulating domain methods
- new feature work no longer adds more business methods to the transport client

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile test -- --runInBand __tests__/lib/mobileApiClientBoundary.test.ts`
- targeted hook tests for each touched domain

## Tranche 5: Secondary Route Warning Band

### Goal

Keep the route warning band intentionally small without turning static-state screens into the main project.

### Scope

- `src/app/(shared)/app-update.tsx`
- `src/app/(shared)/network-error.tsx`
- `src/app/(shared)/session-expired.tsx`
- `src/app/(tasker)/verification/pending.tsx`
- `src/app/(tasker)/verification/rejected.tsx`

### Policy

These files are secondary debt, not primary blockers. Only touch them when:

1. a touched slice already needs the route simplified, or
2. a small extraction clearly reduces duplication without introducing new abstraction weight

### Acceptable Changes

- move static copy or view config into a feature/local content module
- extract shared state-screen composition if more than one touched route clearly benefits
- keep them in the warning band if the route remains mostly declarative

### Acceptance Criteria

- no new route warnings are introduced elsewhere
- touched warning-band routes become simpler if the extraction is low risk

### Verification

- `pnpm --filter @tasky/mobile structure:check`
- touched screen tests only

## Verification Loop

Run this loop at the end of every tranche.

Always run:

- `pnpm --filter @tasky/mobile structure:check`
- `pnpm --filter @tasky/mobile typecheck`

Choose targeted tests based on the slice:

- root/bootstrap/provider work:
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx`
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/navigation-wiring.test.tsx`
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/auth-flow.test.tsx`

- route-guard/current-user/store cleanup:
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/hooks/useRouteGuard.test.tsx`
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/route-guard-integration.test.tsx`

- transport/query work:
  - `pnpm --filter @tasky/mobile test -- --runInBand __tests__/lib/mobileApiClientBoundary.test.ts`
  - smallest relevant hook tests under `apps/mobile/__tests__/hooks/**`

Run broader verification only when the slice changes auth, onboarding, or app-shell wiring materially:

- `pnpm --filter @tasky/mobile test:e2e:smoke`

## Stop Conditions

Stop the tranche and report instead of guessing if:

1. removing store-mirrored profile state breaks flows that actually require a separate auth-status contract
2. a transport decomposition slice requires backend shape changes
3. provider/bootstrap cleanup exposes a broader lifecycle model that cannot be safely inferred from current tests
4. a domain API split would force broad changes across too many features to verify in one slice

## Completion Criteria

This spec is complete when all of the following are true:

1. root bootstrap/provider ownership is bounded and provider-order-safe
2. `authStore` no longer mirrors query-owned profile data
3. `queryKeys` is the default for touched domains and cache invalidation is specific
4. `mobileApiClient.ts` is trending toward transport-only infrastructure rather than remaining the de facto domain service layer
5. `structure:check` remains at zero fail items throughout
6. the remaining route warnings are either unchanged and tolerated or reduced opportunistically without churn

## Immediate Next Slice Recommendation

The highest-leverage first slice is:

1. Tranche 1: root bootstrap and provider ownership
2. the minimum part of Tranche 2 needed to remove `useProfileSync()` and the `authStore.profile` mirror

Reason:

- it fixes a real runtime/provider-order problem
- it aligns the code with the contract’s strongest store/query ownership rule
- it clears the way for later query-key and transport cleanup without reopening route or screen structure work
