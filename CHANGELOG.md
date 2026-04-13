# Changelog

## 2026-04-13 — Tranche 10: Core flows to v2 architecture (Phase 0 + Slice 1)

### Phase 0: Workflow handler idempotency (infra gate)

- **Event idempotency table** — Flyway V25 adds `event_idempotency` (`event_id` TEXT PRIMARY KEY) for deduplicating workflow handler side effects on event redelivery.
- **WorkflowIdempotencyGuard** — new `kernel.idempotency` component using `EventIdempotencyDao` with `claim()` / `find()` / `purge()` operations.
- **AbstractEventHandler** — now provides `tryClaimEvent(envelope)` for subclass handlers; `@Nullable` injection keeps handlers functional when broker is disabled.
- **All three workflow handlers guarded**:
  - `TaskApplicationAcceptedHandler` — duplicate events won't create duplicate conversations or notifications.
  - `PaymentConfirmedHandler` — duplicate events won't resend push notifications.
  - `BookingCompletedHandler` — duplicate events won't duplicate wallet credits (financial safety).
- **7 duplicate-delivery tests** (SCN-T10-IDEM-001 through SCN-T10-IDEM-007) verify first-delivery side effects execute once and duplicate deliveries are skipped.

### Slice 2: Booking completion v2 seam progress

- **BookingLifecycleService → TrustQueryPort**: Replaced direct `DisputeDao` dependency with `TrustQueryPort.hasOpenDispute()`, eliminating the last DAO dependency from the booking lifecycle layer.
- **Remaining gap**: `BookingLifecycleService.completeBooking()` still delegates the actor-aware completion command to `BookingService.completeBooking()` (not yet through a port). Full lifecycle cutover deferred to a dedicated architectural slice.

### Slice 3: Verification review — already on v2 ports (no changes needed)

- **Verification flow audit confirmed clean**: `VerificationController` and `AdminVerificationController` both delegate exclusively through `IdentityCommandPort`/`IdentityQueryPort` and composition services. No direct DAO or concrete service dependencies in the verification path.
- **Note**: Verification application logic lives in `AuthService` rather than a dedicated `VerificationService` — this is a bounded-context extraction concern for a future pass, not a port-migration gap.

### Slice 4: Dispute aftermath — already on v2 ports (no changes needed)

- **Dispute flow audit confirmed clean**: `DisputeController` → `DisputeRaiseService` → `TrustCommandPort`, and `AdminDisputeController` → `AdminDisputeResolutionService` → `TrustCommandPort`. Both paths use idempotency guards and port delegation. The `DisputeEvidenceGraceScheduler` auto-close runs independently and does not need port wrapping.
- **Note**: Dispute aftermath is intentionally minimal — no wallet refunds, booking status changes, or notifications on resolution per current product behavior.

### Slice 1: Task apply/accept v2 seam completion

- **TaskService → BookingCommandPort**: `TaskService.acceptApplication()` now delegates through `BookingCommandPort.createBooking()` instead of the concrete `BookingService`, eliminating the last cross-module concrete service dependency in the task module.
- **ArchUnit boundary test** confirms `TaskController` depends only on public ports and composition services (no `TaskService`, no `BookingService`).

## 2026-04-11 — Frontend dependency cascade

**Branch:** `upgrade/frontend-cascade` | **Baseline → Postflight:** web 264/264 ✓, mobile 741/741 ✓, typecheck 0 errors, lint 0 errors

### Web (apps/web)

- **Vite 5.4 → 8.0** with Rolldown bundler + **@vitejs/plugin-react 4.5 → 6.0.1**
- **Vitest 3 → 4** (co-upgraded with Vite; vitest@4 peers vite@8)
- **TypeScript 5.9 → 6.0** (added `declare module '*.css' {}` for side-effect CSS import support)
- **Tailwind CSS 3.4 → 4.2** — migrated `@tailwind` directives to `@import "tailwindcss"` + `@config`, replaced `autoprefixer` with `@tailwindcss/postcss` plugin, removed `tailwindcss-animate`
- **React 19.2.3 → 19.2.5** — patch alignment to unify React instance across workspace (core package resolves against mobile's 19.2.5 peer; mismatched versions caused "Invalid hook call" in tests)
- **i18next 25 → 26** + **react-i18next 16 → 17** — added `react: { useSuspense: false }` to i18n config (react-i18next@17 defaults `useSuspense: true` in React 19 concurrent environments)
- **react-router-dom 6 → 7**, **lucide-react 0.575 → 1.8** (replaced removed brand icons: `Facebook→Share2`, `Twitter→MessageCircle`, `Instagram→Camera`), **zod 3 → 4**, **Stryker 8 → 9**, **eslint-plugin-react-hooks 5 → 7**
- **pnpm override:** `postcss: 8.5.9` added to root to resolve dual-postcss version conflict introduced by Vite 8
- **Test fix:** `AdminFeaturesPage.test.tsx` — stabilised `useAppContext` mock to return a constant reference (React 19 useCallback dep stability requirement)

### Mobile (apps/mobile)

- **TypeScript 5.9 → 6.0** — added `declare module '*.css' {}` to `nativewind-env.d.ts`
- **i18next 25 → 26** + **react-i18next 16 → 17**, **lucide-react-native 0.575 → 1.8** (`Facebook→LogIn`)
- **eslint-plugin-react-hooks pinned to 5.2.0** — pnpm was hoisting web's v7 to root, bleeding React Compiler rules into mobile's ESLint (mobile stays on eslint-config-expo@55 which bundles v5)
- **Jest 30 deferred** — jest-expo@55 is hard-coupled to Jest 29; deferred to jest-expo@56 upgrade cycle
- **Reanimated v4 Jest mock** — replaced `react-native-reanimated/mock` (which imports native worklets in v4) with lightweight `__tests__/test-utils/reanimated-mock.js`; added `moduleNameMapper` + `react-native-worklets` mock

### Packages

- **packages/core:** TypeScript 5.9 → 6.0, zod 3 → 4
- **packages/sdk:** TypeScript 5.9 → 6.0

## 2026-04-11

- chore: upgrade frontend safe dependencies (Playwright 1.59, testing-library, postcss, openapi-typescript 7.13, react-query 5.97)
- **Repo dead-code cleanup**: Removed an unreferenced web feature component bundle, trimmed unused web/core dependencies and internal helper exports, and fixed locale-safe district geocoding normalization.

## 2026-04-10

- **Mobile Android local startup**: Added an Android emulator launcher, documented the one-time AVD setup path, and defaulted local Android API traffic to `10.0.2.2`.
- fix(mobile): visual audit — fix 12 defects across auth/onboarding, customer wizard, tasker, and shared screens; harden shared templates and PermissionPrimer illustration
- **Mobile Maestro realignment**: Split launch-live flows into deterministic, fixture-required, deferred, and legacy buckets; updated active smoke/full E2E runners to execute only deterministic launch-live journeys; repaired stale selectors in customer/tasker/profile flows; and refreshed mobile verification docs to match the new automation surface.
- **Frontend scope hardening complete**: Executed all four workstreams of the frontend scope hardening plan:
  - **Web**: Removed admin payouts/pricing routes and nav, deleted legacy `/verification` route, removed `/customer/booking-payment` alias, moved deferred pages to `apps/web/src/future/`, cleaned escrow/payment/boost copy from launch-live pages and translation files.
  - **Mobile**: Moved 10 deferred routes (OTP, escrow, instant match, credits, referrals, subscription, wallet, lead unlock, profile polish) to `apps/mobile/src/future/`, deleted thin shells (boost, boost-pay, business, DAN verification), wired real SDK hooks for booking cancel/completion/no-show and review hard-lock navigation.
  - **Tests**: Removed 14 mobile Jest test files for deferred surfaces, moved 18 Maestro flows to `deferred/` subdirectory, updated `run-e2e.sh` to exclude deferred flows, verified web tests and Playwright specs are clean.
  - **Docs**: Updated frontend alignment matrix to post-Tranche-4 hardened state, marked all scope hardening actions complete, updated verification matrix and test trust audit to reflect the deferred-surface test removals.
- **Frontend alignment kickoff**: Added the frontend alignment design/implementation plans plus the route classification/cut manifest, removed the legacy web `/verification` route and stale export, and tightened web scope verification around removed launch-incompatible routes and admin navigation.

## 2026-04-09

- **Staging and production control surface**: Added private VPS sandbox bootstrap/push/deploy/smoke path, published staging runbook/toggle posture/seed guidance, and added production-readiness plus feature-activation governance docs.
- **Test-signal pruning**: Retired low-signal Playwright route smoke checks (`smoke.spec.ts`, `auth-guard.spec.ts`) so browser smoke now reflects only customer, tasker, and admin outcome journeys.
- **Docs realignment**: Rewrote PRD and strategy to center the Phase 1 launch baseline, separate latent capability from launch scope, and remove toggle-only rollout assumptions.
- **Repository hardening**: Archived stale superpowers docs, removed tracked test-results.json, archived 6 non-canonical Maestro flows, fixed stale references in ARCHITECTURE.md and quality docs.
- **CI and verification gates**: Removed dead self-verify pipeline from release-gate.yml, made mobile E2E scripts require Maestro (no silent Jest fallback), aligned verification matrix with actual repo state.
- **Backend test trust**: Closed all 13 untested scenarios across analytics, messaging, notification, and booking domains (104/104 scenarios now covered). Synced registry.
- **Web contract and E2E**: Fixed CursorPage type to match API contract (added has_more, removed prev), added Playwright auth-guard, customer, and tasker E2E suites (15 tests). Fixed all 272 web unit tests.
- **Mobile routing**: Fixed customer post-auth routing to land in tabs layout (restores bottom navigation).
- **Mobile UI**: Converted SplitCard header from fixed height to minHeight for text overflow safety.
- **Mobile auth onboarding routing**: Restored first-login post-auth routing so new mobile sessions enter onboarding before landing in customer/tasker home, with focused auth routing regressions.

## 2026-04-04

- **Mobile NativeWind foundation + token/shell consolidation**: Completed architecture-first mobile styling migration to shared NativeWind/token boundaries, moved route-level shell ownership to shared containers/action bars, removed most route-local raw input primitives, added lint guardrails for route primitive imports (with OTP exception), stabilized auth/env test behavior, and re-verified mobile suites (`typecheck`, `lint`, full `test`).

## 2026-04-03

- **Infrastructure & Mobile Navigation**: Remediated Docker Compose environment variables for PgBouncer/Flyway connectivity and standardized mobile application navigation by migrating customer/tasker screen headers to a native Expo Router stack-based configuration.

## 2026-04-02

- **Booking confirmation sources**: Added API-first booking intents for rebook confirmation (`REBOOK`) with phase-gated instant-match deferment, wired web/mobile source-aware confirmation flows, and updated SDK/test coverage.
- **Maintenance-mode realignment**: Enforced monorepo architecture boundaries, rehabilitated cleanup-critical deterministic tests, archived superseded greenfield superpowers plans/specs, and ratified the maintenance operating model plus trusted verification gates.

## 2026-03-28

- **Scaffolding restructure**: Replaced greenfield multi-agent scaffolding with lean maintenance-mode structure. Deleted ~6,000 lines of ticket specs, self-verify pipeline, and agent coordination scripts. Added simple task management (`scripts/task.sh`), rewrote AGENTS.md and CLAUDE.md, simplified CI to 3 parallel jobs.
