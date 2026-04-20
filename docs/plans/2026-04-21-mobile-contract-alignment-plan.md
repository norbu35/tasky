# Mobile Contract Alignment — Implementation Plan

Date: 2026-04-21
Source spec: `docs/plans/2026-04-21-mobile-contract-alignment-spec.md`
Normative contract: `docs/ARCHITECTURE.md` section 7.7
Status: plan — ready for tranche-by-tranche execution

## Purpose

This plan decomposes the alignment spec into concrete, file-level work items with explicit change descriptions, dependencies, risks, and verification gates. It is the execution companion to the spec — the spec defines _what_ and _why_; this plan defines _how_ and _in what order_.

## Baseline State (verified 2026-04-21)

| Metric                                   | Value                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `structure:check` fail items             | 0                                                                                       |
| `structure:check` warnings               | 5 (tolerated static-state routes)                                                       |
| `_layout.tsx`                            | 129 lines, 3 module-level side effects, `useProfileSync()` before `QueryClientProvider` |
| `authStore.ts`                           | 23 lines, 3 state fields (`session`, `profile`, `deviceToken`)                          |
| `mobileApiClient.ts`                     | 971 lines, ~40 domain methods                                                           |
| `queryKeys.ts`                           | 58 lines, 7 domains — exists but inconsistently used                                    |
| Direct `authStore.profile` readers       | 3 files                                                                                 |
| Direct `authStore.setProfile` writers    | 2 files                                                                                 |
| `deviceToken`/`setDeviceToken` consumers | 0 (dead code)                                                                           |
| Raw query-key literals (outside factory) | multiple hooks                                                                          |

## File Dependency Map

```
_layout.tsx
  ├── useProfileSync (from features/profile/hooks/useProfile.ts)
  ├── getSharedApiClient + setTokenRefreshDelegate (from lib/mobileApiClient.ts)
  ├── useAuthStore.getState() (from store/authStore.ts)
  ├── NotificationProvider (from providers/NotificationProvider.tsx)
  ├── RoleProvider (from providers/RoleProvider.tsx)
  └── queryClient (from lib/react-query.ts)

authStore.ts
  ├── read by: useRouteGuard, useChatConversation, useTasks (profile)
  ├── read by: 36+ files (session only — unaffected)
  └── written by: useAuth (after login), useProfileSync (cache mirror), useUpdateProfile

useProfile.ts
  ├── useMyProfile → queryKey: ['me', token] (inline, not factory)
  ├── useProfileSync → subscribes to queryCache, pushes to authStore.profile
  └── useUpdateProfile → writes authStore.profile + invalidates ['me']

useAuth.ts
  ├── useVerifyOtp → setSession + getMyProfile + setProfile
  └── useDevLogin → setSession + getMyProfile + setProfile + setRole
```

---

## Tranche 0: Baseline Verification and Working Map

### Goal

Establish a verified baseline before any edits.

### Work Items

| #   | Item                | Detail                                                                             |
| --- | ------------------- | ---------------------------------------------------------------------------------- |
| 0.1 | Run structure check | `pnpm --filter @tasky/mobile structure:check` — capture output                     |
| 0.2 | Run typecheck       | `pnpm --filter @tasky/mobile typecheck` — must pass                                |
| 0.3 | Run existing tests  | `pnpm --filter @tasky/mobile test:unit` — capture pass/fail counts                 |
| 0.4 | Document baseline   | Record structure-check output (0 fail, 5 warnings), typecheck status, test results |

### Acceptance

- All three commands produce clean output
- Baseline numbers recorded for comparison in later tranches

### Effort

~5 minutes (verification only, no code changes)

---

## Tranche 1: Root Bootstrap and Provider Ownership

### Goal

Make `_layout.tsx` provider-order-safe and remove module-level side effects, per contract section 7.7.3.

### Problems to Fix

1. **Provider-order hazard**: `useProfileSync()` is called at line 77 inside `RootLayout`, but `QueryClientProvider` is rendered at line 117 — the hook subscribes to a query cache that may not be ready yet.
2. **Module-level side effects**: Lines 25-43 wire the token-refresh delegate at import time via `useAuthStore.getState()`. Lines 52-74 set the Firebase background handler at import time. These run before any React tree mounts.
3. **Mixed concerns**: `_layout.tsx` mixes provider composition, Firebase foreground message handling (lines 89-111), AppState bridging (lines 79-87), and profile sync (line 77).

### Concrete Work Items

#### 1A: Extract bootstrap component for query-dependent logic

**New file**: `src/providers/AppBootstrapProvider.tsx`

This component renders as a child of `QueryClientProvider` and owns:

- `useProfileSync()` call (currently at `_layout.tsx:77`) — now runs under `QueryClientProvider` as required
- AppState → `focusManager` bridge (currently `_layout.tsx:79-87`)
- Foreground FCM `onMessage` handler (currently `_layout.tsx:89-111`)

**Structure**:

```
AppBootstrapProvider
  ├── useProfileSync()         // safe: under QueryClientProvider
  ├── useEffect: AppState → focusManager
  └── useEffect: FCM onMessage → notifee
```

This component may only import from: `providers/`, `store/`, `lib/`, `features/profile/hooks/`.

#### 1B: Move token-refresh delegate to a mounted surface

**Approach**: Move the `setTokenRefreshDelegate` call from module-level execution into `AppBootstrapProvider` (or a dedicated `useEffect` inside it), since it only needs to run once after the store is initialized.

The delegate reads `useAuthStore.getState()` imperatively — this works from a `useEffect` too, because by that time the store exists (Zustand stores are created at import time; the issue was running the _wiring_ at import time before any React lifecycle).

**Change in `_layout.tsx`**: Remove lines 24-43 (the `apiClient.setTokenRefreshDelegate(...)` block). Move to `AppBootstrapProvider` inside a `useEffect(..., [])`.

#### 1C: Keep Firebase background handler at module scope (intentional)

The `setBackgroundMessageHandler` at lines 59-70 is a **Firebase requirement** — it must be registered at the top level, outside any React lifecycle, because headless JS execution for background messages has no React tree. This stays at module scope but should have a clear comment explaining _why_ it's exempt.

**No change needed** beyond adding a clarifying comment.

#### 1D: Simplify `_layout.tsx` to provider composition + bounded bootstrap

After extracting to `AppBootstrapProvider`, `_layout.tsx` becomes:

```
module-level: side-effect imports (i18n, nativewind-interop, global.css)
module-level: LogBox.ignoreAllLogs()
module-level: Firebase setBackgroundMessageHandler (documented exception)

RootLayout:
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <AppBootstrapProvider>          // NEW — owns sync, AppState, FCM foreground
              <RoleProvider>
                <ReviewGateProvider>
                  <Stack />
                  <StatusBar />
                </ReviewGateProvider>
              </RoleProvider>
            </AppBootstrapProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
```

### Files Changed

| File                                     | Action                                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/_layout.tsx`                    | Remove `useProfileSync` call, remove token-refresh wiring, remove AppState effect, remove FCM foreground effect. Add `AppBootstrapProvider` child. |
| `src/providers/AppBootstrapProvider.tsx` | **New file**. Contains `AppBootstrapProvider` with `useProfileSync`, AppState bridge, FCM foreground handler, and token-refresh delegate wiring.   |

### Contract Alignment Check

| Contract rule (7.7.3)                                       | Before                                        | After                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `_layout.tsx` owns provider composition + bootstrap         | Mixed concerns                                | Provider composition only                                                              |
| No query-dependent hook before its provider                 | `useProfileSync` before `QueryClientProvider` | Under `QueryClientProvider` via `AppBootstrapProvider`                                 |
| No module-level side effects for runtime wiring             | `setTokenRefreshDelegate` at import time      | Inside `useEffect` in `AppBootstrapProvider`                                           |
| Providers may call feature APIs/hooks for app-wide concerns | N/A                                           | `AppBootstrapProvider` calls `useProfileSync` (app-wide profile hydration) — justified |

### Risk Assessment

| Risk                                          | Likelihood                                                                                                      | Mitigation                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Token-refresh timing changes                  | Low — delegate wiring moves to `useEffect` but runs synchronously on first render (before any 401 could arrive) | Verify with `provider-chain.test.tsx`                                          |
| `useProfileSync` no longer hydrates pre-mount | Low — it was already relying on query cache events which require `QueryClientProvider`                          | The profile was always populated _after_ the query resolved, not synchronously |
| Background message handler break              | None — intentionally left at module scope                                                                       |

### Verification

```bash
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/navigation-wiring.test.tsx
```

### Estimated Effort

1-2 focused sessions. The changes are mechanical but the provider chain is security-sensitive — verify carefully.

---

## Tranche 2: Remove Query-Owned Profile Mirroring From Zustand

### Goal

Remove `profile` from `authStore` and stop query-cache mirroring, per contract section 7.7.3: "Global stores must not mirror data that already has a stable query key."

### Migration Surface

**Direct readers of `authStore.profile`** (must change):

| File                                               | Line | What it reads                                     | Replacement                        |
| -------------------------------------------------- | ---- | ------------------------------------------------- | ---------------------------------- |
| `src/hooks/useRouteGuard.ts`                       | 14   | `profile` → checks `status` for BANNED/SUSPENDED  | Derive from `useMyProfile()` query |
| `src/features/chat/screens/useChatConversation.ts` | 18   | `profile?.id` as `myId`                           | Derive from `useMyProfile()` query |
| `src/features/tasks/hooks/useTasks.ts`             | 37   | `profile?.status === 'VERIFIED'` for `isVerified` | Derive from `useMyProfile()` query |

**Writers of `authStore.setProfile`** (must change):

| File                                       | Line           | Why it writes                                                                         | Replacement                                                                                                                                                                                                                                |
| ------------------------------------------ | -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/auth/hooks/useAuth.ts`       | 23, 34, 47, 59 | After OTP verify + dev login, fetches profile and writes to store                     | Remove `setProfile` calls. `useMyProfile()` will auto-fetch when `session` changes (query key includes `token`, which changes on login). Optionally call `queryClient.setQueryData()` to pre-populate cache with the just-fetched profile. |
| `src/features/profile/hooks/useProfile.ts` | 23, 37         | `useUpdateProfile.onSuccess` writes to store; `useProfileSync` mirrors cache to store | Remove `setProfile` from `useUpdateProfile` (just invalidate). Delete `useProfileSync` entirely.                                                                                                                                           |

**Dead code to remove**:

| File                     | What                                                     | Reason                                                                           |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/store/authStore.ts` | `profile`, `setProfile`, `deviceToken`, `setDeviceToken` | Zero consumers of `deviceToken`. `profile`/`setProfile` removed in this tranche. |

### Concrete Work Items

#### 2A: Create `useMyUserId()` helper hook

**File**: `src/features/profile/hooks/useProfile.ts` (or new file `src/features/profile/hooks/useMyUserId.ts`)

A minimal derived hook for consumers that only need `id` or `status`:

```typescript
export function useMyUserId(): string | undefined {
  const { data } = useMyProfile();
  return data?.id;
}
```

This avoids requiring every consumer to know the full `Profile` shape.

#### 2B: Create `useCurrentUserStatus()` helper hook

For `useRouteGuard` and `useTasks` which need verification/ban status:

```typescript
export function useCurrentUserStatus() {
  const { data: profile, isLoading } = useMyProfile();
  return {
    status: profile?.status,
    isBanned: profile?.status === 'BANNED',
    isSuspended: profile?.status === 'SUSPENDED',
    isVerified: profile?.status === 'VERIFIED',
    isLoading,
  };
}
```

#### 2C: Migrate `useRouteGuard`

**File**: `src/hooks/useRouteGuard.ts`

**Before**: Reads `profile` from `authStore`, calls `isRestricted(profile)`, checks `profile.status`.
**After**: Uses `useCurrentUserStatus()` or directly `useMyProfile()`.

**Constraint**: `useRouteGuard` currently runs a `useEffect` that fires on `session`/`profile` change. After migration, it will fire on `session`/`queryData` change. The behavior is equivalent — React Query re-renders when cache data changes.

**Risk**: Profile data may not be available on first render (query loading). The guard must handle `isLoading` — currently `profile` is `null` before sync, so this is already handled (guard only acts when `profile` exists with a restricted status).

#### 2D: Migrate `useChatConversation`

**File**: `src/features/chat/screens/useChatConversation.ts`

**Before**: `const profile = useAuthStore((s) => s.profile); const myId = profile?.id;`
**After**: `const { data: profile } = useMyProfile(); const myId = profile?.id;`

Or use the `useMyUserId()` helper.

#### 2E: Migrate `useTaskDetail`

**File**: `src/features/tasks/hooks/useTasks.ts`

**Before**: `const profile = useAuthStore((s) => s.profile); ... isVerified = profile?.status === 'VERIFIED'`
**After**: Use `useCurrentUserStatus()` or `useMyProfile()`.

#### 2F: Update auth hooks — remove `setProfile`, pre-populate query cache

**File**: `src/features/auth/hooks/useAuth.ts`

**Before**: After login, calls `getMyProfile(token)` then `setProfile(profile)`.
**After**: After login, calls `getMyProfile(token)` then `queryClient.setQueryData(queryKeys.me.all(token), profile)`.

This pre-populates the React Query cache so `useMyProfile()` returns data immediately after login without an extra network round-trip. The `setSession` call (which changes the `token` value) would normally trigger a new `useMyProfile` fetch — but since the cache is already populated, React Query returns the cached data.

**Imports to add**: `useQueryClient` from `@tanstack/react-query`, `queryKeys` from `@/lib/queryKeys`.

#### 2G: Update `useUpdateProfile` — remove `setProfile`

**File**: `src/features/profile/hooks/useProfile.ts`

**Before**: `onSuccess` calls `setProfile(updatedProfile)` + `invalidateQueries({ queryKey: ['me'] })`.
**After**: `onSuccess` calls `queryClient.setQueryData(queryKeys.me.all(token), updatedProfile)` — this updates the cache in place, avoiding a refetch.

#### 2H: Delete `useProfileSync`

**File**: `src/features/profile/hooks/useProfile.ts`

Remove the `useProfileSync` function. Remove from `src/features/profile/index.ts` barrel export.

Update `src/providers/AppBootstrapProvider.tsx` (created in Tranche 1): remove the `useProfileSync()` call. The query cache is now the single source of truth.

#### 2I: Clean `authStore`

**File**: `src/store/authStore.ts`

Remove:

- `profile: Profile | null` state
- `setProfile` action
- `deviceToken: string | null` state
- `setDeviceToken` action

Update `signOut()`: currently sets `session: null, profile: null`. Change to just `session: null`.

Remove `Profile` from the import (only `AuthTokens` remains).

**Final `authStore.ts` shape**:

```typescript
import { create } from 'zustand';
import type { AuthTokens } from '../lib/api/types';

interface AuthState {
  session: AuthTokens | null;
  setSession: (session: AuthTokens | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  signOut: () => set({ session: null }),
}));
```

#### 2J: Update `_layout.tsx` / `AppBootstrapProvider`

If Tranche 1 created `AppBootstrapProvider` with `useProfileSync()`, remove that import and call from the provider. The provider now only owns: AppState bridge, FCM foreground handler, token-refresh delegate.

### Dependencies

- **2C, 2D, 2E** are independent of each other — can be done in parallel.
- **2H** depends on 2C, 2D, 2E (all consumers migrated).
- **2I** depends on 2F, 2G, 2H (all writers and readers removed).
- **2A, 2B** should be done before 2C, 2D, 2E (consumers use the new helpers).

### Execution Order

```
2A + 2B (create helpers)  →  2C + 2D + 2E (migrate readers, parallel)  →  2F + 2G (migrate writers)  →  2H (delete useProfileSync)  →  2I (clean authStore)  →  2J (update bootstrap)
```

### Contract Alignment Check

| Contract rule (7.7.3)                   | Before                                     | After                           |
| --------------------------------------- | ------------------------------------------ | ------------------------------- |
| Stores must not mirror React Query data | `authStore.profile` mirrors `['me']` query | `authStore` owns `session` only |
| React Query owns server state           | Profile is in both RQ and Zustand          | Profile in RQ only              |
| Stores own session/bootstrap state only | `authStore` has `profile` + `deviceToken`  | `authStore` has `session` only  |

### Risk Assessment

| Risk                                                          | Likelihood                                                                                            | Mitigation                                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Flash of missing profile data on app launch                   | Medium — `useMyProfile()` query loads async; `authStore.profile` was pre-populated at login           | Pre-populate query cache via `setQueryData` in auth hooks (2F). Profile screens already handle loading state.                       |
| `useRouteGuard` acts on stale data                            | Low — currently reads from store that was mirrored from cache; after change reads from cache directly | Identical freshness, just one fewer copy step                                                                                       |
| Race condition between `setSession` and `useMyProfile` enable | Low — `useMyProfile` key includes `token`, so it only fetches when token exists                       | Same as current behavior (key gating)                                                                                               |
| `signOut` no longer clears profile from query cache           | Medium — stale profile data sits in cache after logout                                                | Add `queryClient.removeQueries({ queryKey: ['me'] })` to `signOut` or the sign-out flow. Or call `queryClient.clear()` on sign-out. |

### Verification

```bash
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand __tests__/hooks/useRouteGuard.test.tsx
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/route-guard-integration.test.tsx
# Plus smallest touched hook tests for chat/tasks/profile
```

### Estimated Effort

2-3 focused sessions. The migration surface is small (5 files) but the runtime behavior change (cache vs store) needs careful verification.

---

## Tranche 3: Query Key Normalization and Cache Semantics

### Goal

Make query-key usage consistent enough that invalidation is predictable and no hook depends on literal prefix matching.

### Current State

| Domain       | Factory exists?            | Hooks using factory | Hooks using inline keys                                             |
| ------------ | -------------------------- | ------------------- | ------------------------------------------------------------------- |
| me/profile   | `queryKeys.me.all(token)`  | —                   | `useMyProfile`: `['me', token]`                                     |
| tasks        | `queryKeys.tasks.*`        | —                   | `useTasks`: `['tasks', token]`, `useTaskDetail`: `['tasks', token]` |
| bookings     | `queryKeys.bookings.*`     | —                   | Need to verify per-hook                                             |
| chat         | `queryKeys.chat.*`         | —                   | Need to verify per-hook                                             |
| reviews      | `queryKeys.reviews.*`      | —                   | Need to verify per-hook                                             |
| verification | `queryKeys.verification.*` | —                   | Need to verify per-hook                                             |

### Concrete Work Items

#### 3A: Normalize `useMyProfile` key

**File**: `src/features/profile/hooks/useProfile.ts`

```typescript
// Before
queryKey: ['me', token],

// After
queryKey: queryKeys.me.all(token!),
```

#### 3B: Normalize `useUpdateProfile` invalidation

```typescript
// Before
void queryClient.invalidateQueries({ queryKey: ['me'] });

// After
void queryClient.invalidateQueries({ queryKey: queryKeys.me.all(token!) });
```

Note: The factory key includes `token`, which makes invalidation token-scoped. If the intent is to invalidate _all_ `me` queries regardless of token (e.g., after profile update where token hasn't changed), the invalidation should use a prefix: `{ queryKey: ['me'] }` — this is valid React Query prefix matching. Evaluate whether token-scoped or prefix invalidation is correct here.

#### 3C: Normalize task-related hooks

**Files**: `src/features/tasks/hooks/useTasks.ts`, all task hooks using inline `['tasks', token]`, `['task', token, taskId]`, etc.

Replace with `queryKeys.tasks.all(token!)`, `queryKeys.tasks.detail(token!, taskId)`, etc.

#### 3D: Normalize booking hooks

**Files**: `src/features/bookings/hooks/useBookings.ts` and related hooks.

Replace inline keys with `queryKeys.bookings.*`.

#### 3E: Normalize chat hooks

**Files**: `src/features/chat/hooks/useConversations.ts`, `useMessages.ts`, `useSendMessage.ts`.

Replace inline keys with `queryKeys.chat.*`.

#### 3F: Normalize remaining domains

Reviews, verification, notifications, profile (public). Same pattern.

#### 3G: Fix `useProfileSync` removal fallout

In Tranche 2, `useProfileSync` was deleted. If any code relied on the literal `'me'` prefix for cache subscriptions, update those to use the factory key.

### Dependency Note

Tranche 3 can proceed **in parallel with Tranche 2** for domains that don't overlap with the profile migration (tasks, bookings, chat, etc.). Profile/me keys should be normalized as part of Tranche 2's changes (2F, 2G) to avoid double-touching the same files.

### Recommended Approach

- **Profile/me keys**: Normalize as part of Tranche 2 items 2F, 2G (since those files are already being edited).
- **Other domains**: Normalize domain-by-domain in separate slices (tasks → bookings → chat → rest).
- **Per domain**: Update query keys, then update invalidation calls in mutation hooks for the same domain.

### Verification

```bash
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx
# Plus targeted hook tests for each touched domain
```

### Estimated Effort

2-3 sessions. Mechanical changes across many files, but each domain is independent and safe.

---

## Tranche 4: Transport Decomposition Behind Real Feature APIs

### Goal

Move domain logic out of `mobileApiClient.ts` into feature-local `api.ts` files, leaving `mobileApiClient.ts` as transport-only infrastructure.

### Current State

`mobileApiClient.ts` (971 lines) contains ~40 domain methods across:

| Domain        | Method count | Representative methods                                                  |
| ------------- | ------------ | ----------------------------------------------------------------------- |
| Auth          | 3            | `requestOtp`, `verifyOtp`, `devLogin`                                   |
| Profile       | 6            | `getMyProfile`, `updateMyProfile`, `activateTaskerRole`, avatar upload  |
| Tasks         | 7            | `createTask`, `listTasks`, `applyToTask`, `listMyTasks`, photo upload   |
| Bookings      | 9            | `createBookingIntent`, `confirmBookingIntent`, `listBookings`, timeline |
| Reviews       | 3            | `submitReview`, `getMyPendingReviews`, `getUserReviews`                 |
| Disputes      | 2            | `raiseDispute`, `getDispute`                                            |
| Chat          | 3            | `listConversations`, `listMessages`, `sendMessage`                      |
| Notifications | 2            | `registerDevice`, `unregisterDevice`                                    |
| Verification  | 3            | `getVerificationStatus`, upload, submit                                 |
| Account       | 4            | `deleteMyAccount`, `flagNoShow`, `getMyStats`, `reverseGeocode`         |

### Target Architecture

```
mobileApiClient.ts  →  transport layer only:
                        - base URL resolution
                        - auth header composition
                        - token refresh handling
                        - request primitives (get, post, put, delete, upload)
                        - transport-level error mapping

features/<domain>/api.ts  →  domain API:
                        - endpoint path construction
                        - request payload shaping
                        - response type mapping
                        - calls transport primitives
```

### Concrete Work Items — Per Domain

For each domain (recommended order: profile → notifications → tasks → bookings → chat → reviews/disputes/verification/account):

#### 4.X.1: Audit current feature `api.ts`

Read the feature-local `api.ts` to see what it currently does. Most are thin wrappers:

```typescript
// Example: src/features/tasks/api.ts (current)
export function listTasks(token: string, filters?: ...) {
  return getSharedApiClient().listTasks(token, filters);
}
```

#### 4.X.2: Move endpoint construction to feature `api.ts`

Move the URL path, query params, and response mapping from `mobileApiClient.ts` into the feature `api.ts`. The feature API should call a transport primitive instead:

```typescript
// Example: src/features/tasks/api.ts (target)
export function listTasks(token: string, filters?: ...) {
  return transport.get('/api/v1/tasks', token, { params: filters });
}
```

#### 4.X.3: Remove domain method from `mobileApiClient.ts`

Delete the corresponding method from `HttpMobileApiClient` class and the `MobileApiClient` interface.

#### 4.X.4: Expose transport primitives

`mobileApiClient.ts` needs to expose reusable request primitives:

```typescript
export const transport = {
  get: <T>(path: string, token: string, opts?: RequestOptions) => ...,
  post: <T>(path: string, token: string, body?: unknown) => ...,
  put: <T>(path: string, token: string, body?: unknown) => ...,
  delete: <T>(path: string, token: string) => ...,
  upload: <T>(path: string, token: string, file: ...) => ...,
};
```

This may already exist internally. If not, extract from the existing request method.

### Scope Boundaries

- **Must NOT change**: backend API contracts, feature hook interfaces (hooks call `api.ts` the same way)
- **Must NOT expose**: raw `fetch` or transport primitives to screens, hooks, stores, or providers
- **Must NOT break**: `getSharedApiClient()` for any domains not yet migrated

### Migration Strategy: Incremental by Domain

Each domain migration is a **single PR-able slice**:

1. Read current feature `api.ts` + `mobileApiClient.ts` domain methods
2. Refactor feature `api.ts` to own endpoint construction
3. Remove domain methods from `mobileApiClient.ts`
4. Verify typecheck + structure:check + domain hook tests
5. Commit as one domain slice

**Do NOT merge domains** — each domain is a separate slice for safe review and rollback.

### Acceptance Criteria (per domain)

- Feature `api.ts` owns its endpoint paths and response mapping
- No new domain methods added to `mobileApiClient.ts`
- `mobileApiClient.ts` line count decreases
- All hooks calling the migrated `api.ts` work unchanged

### Risk Assessment

| Risk                                                                    | Likelihood                           | Mitigation                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Feature `api.ts` needs transport features not yet exposed as primitives | Medium — upload, SSE, custom headers | Add transport primitives as needed, don't work around them                                 |
| Type mismatches between old and new response mapping                    | Low — same SDK types                 | TypeScript catches these at compile time                                                   |
| Incomplete migration leaves two patterns coexisting                     | Expected — by design                 | Each domain slice is self-contained; remaining domains follow old pattern until their turn |

### Verification (per domain)

```bash
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand __tests__/lib/mobileApiClientBoundary.test.ts
# Plus domain-specific hook tests
```

### Estimated Effort

1-2 sessions per domain. Profile + notifications (smallest) in one session. Tasks + bookings (largest) in 2 sessions each. Total: 6-10 sessions.

---

## Tranche 5: Secondary Route Warning Band

### Goal

Opportunistically simplify tolerated warning-band routes without making them a primary project.

### Scope

These 5 files (current warnings):

- `src/app/(shared)/app-update.tsx`
- `src/app/(shared)/network-error.tsx`
- `src/app/(shared)/session-expired.tsx`
- `src/app/(tasker)/verification/pending.tsx`
- `src/app/(tasker)/verification/rejected.tsx`

### Policy

Only touch when:

1. A touched slice already needs the route simplified, OR
2. A small extraction clearly reduces duplication without introducing new abstraction weight

### Concrete Work Items

#### 5A: Audit each warning route for duplication

Read each file. If two or more share composition patterns (e.g., centered text + icon + button), consider extracting a shared state-screen template.

#### 5B: Extract shared content (if warranted)

If audit reveals duplication, create a shared state-screen component under `src/components/templates/` and use it in the warning routes.

#### 5C: Leave alone if mostly declarative

If the routes are already simple (under 60 lines, mostly JSX), leave them in the warning band.

### Acceptance Criteria

- No new route warnings introduced elsewhere
- Touched routes become simpler only if the extraction is low risk

### Estimated Effort

0.5-1 session. Only proceed if Tranche 1-4 work touches these routes or if a clear win exists.

---

## Cross-Tranche Verification Loop

Run at the end of **every** tranche, without exception:

```bash
# Always
pnpm --filter @tasky/mobile structure:check    # must remain 0 fail
pnpm --filter @tasky/mobile typecheck          # must pass

# Slice-specific
# Root/bootstrap/provider:
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/provider-chain.test.tsx
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/navigation-wiring.test.tsx
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/auth-flow.test.tsx

# Route-guard/current-user:
pnpm --filter @tasky/mobile test -- --runInBand __tests__/hooks/useRouteGuard.test.tsx
pnpm --filter @tasky/mobile test -- --runInBand __tests__/integration/route-guard-integration.test.tsx

# Transport/query:
pnpm --filter @tasky/mobile test -- --runInBand __tests__/lib/mobileApiClientBoundary.test.ts
```

Broader verification (only when auth/onboarding/app-shell changes materially):

```bash
pnpm --filter @tasky/mobile test:e2e:smoke
```

---

## Dependency Graph and Execution Order

```
Tranche 0 (baseline)  ← must complete first
    │
    ├── Tranche 1 (bootstrap)  ← highest leverage, fixes runtime hazard
    │       │
    │       └── Tranche 2 (profile de-mirror)  ← depends on 1 (bootstrap provider)
    │               │
    │               ├── Tranche 3 (query keys)  ← can start during T2 for non-profile domains
    │               │
    │               └── Tranche 4 (transport)   ← can start after T2 (stable profile access pattern)
    │                       │
    │                       └── Tranche 5 (route warnings)  ← opportunistic, any time
    │
    └── Tranche 3 (non-profile domains)  ← can run parallel with T1/T2
```

**Critical path**: T0 → T1 → T2 → T4
**Parallel track**: T3 (non-profile domains) can start immediately after T0

### Recommended First PR

**Slice**: Tranche 0 (baseline) + Tranche 1 (bootstrap)

This is the highest-leverage first delivery because:

1. It fixes the provider-order hazard (runtime correctness)
2. It establishes `AppBootstrapProvider` which Tranche 2 needs
3. It makes the root layout contract-compliant without touching store or query logic

### Branch Strategy

Per `AGENTS.md`: `agent/TASK-{id}-{slug}` branches. One branch per tranche or per domain slice (for Tranche 4). Update `CHANGELOG.md` before each PR.

---

## Stop Conditions

Stop and **report instead of guessing** if:

1. Removing `profile` from `authStore` reveals flows that actually require separate auth-status state not derivable from the query — the contract may need an amendment.
2. A transport decomposition slice requires backend API shape changes — out of scope for this effort.
3. Provider cleanup exposes a lifecycle model that cannot be verified with current tests — write the test first, then proceed.
4. A domain API split would touch too many features to verify in one slice — break it into sub-slices.

---

## Success Criteria (Completion Checklist)

- [ ] `useProfileSync()` deleted; no query-cache mirroring to Zustand
- [ ] `authStore` contains only `session` + `setSession` + `signOut`
- [ ] No `profile`, `setProfile`, `deviceToken`, `setDeviceToken` in `authStore`
- [ ] `_layout.tsx` reads as provider composition + bounded bootstrap only
- [ ] `useProfileSync` not called before `QueryClientProvider`
- [ ] Token-refresh delegate not wired at module level
- [ ] `queryKeys` factory used consistently in touched domains
- [ ] No `['me']` literal prefix matching in cache subscriptions
- [ ] `mobileApiClient.ts` line count decreased; no new domain methods added
- [ ] `structure:check` remains at 0 fail items throughout
- [ ] `typecheck` passes after every tranche
- [ ] All targeted integration and hook tests pass
