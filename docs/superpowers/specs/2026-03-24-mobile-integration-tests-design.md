# Mobile Integration Test Suite Design

**Date:** 2026-03-24
**Scope:** React Native / Expo Router mobile app (`apps/mobile/`)

## Problem

The mobile app has 72+ unit tests covering individual screens and components in isolation, but zero integration tests verifying that navigation wiring, provider chains, state-driven routing, role-based UI, and multi-screen user journeys work correctly when composed together.

## Approach

### Jest Integration Tests (7 test files)

All tests follow the existing mocking patterns (jest.mock for expo-router, i18next, reanimated, lucide, async-storage) but test **cross-component/cross-screen behavior** rather than individual components.

| File | What it verifies |
|------|-----------------|
| `navigation-wiring.test.tsx` | All layout files declare the correct screens; tab names match expectations per role |
| `provider-chain.test.tsx` | Full provider hierarchy (GestureHandler → SafeArea → Notification → QueryClient → Role) wires correctly; state flows from stores through providers to consuming components |
| `auth-flow.test.tsx` | Splash → onboarding → role-select → login → tabs transition chain driven by store state |
| `route-guard-integration.test.tsx` | useRouteGuard redirects work for BANNED/SUSPENDED/unauthenticated across multiple screen contexts |
| `role-based-ui.test.tsx` | Role switching changes tab labels, FAB visibility, profile content |
| `customer-journey.test.tsx` | Task feed → filter → detail; task creation wizard steps; booking list → detail |
| `tasker-journey.test.tsx` | Task feed browsing; verification gate flow; jobs list → detail |

### Maestro E2E Flows (5 flow files)

Device-level tests for real navigation. Requires `TASKY_RUN_MAESTRO=true` and a running dev build.

| File | What it verifies |
|------|-----------------|
| `auth-flow.yaml` | Onboarding → role select → login screen |
| `tab-navigation.yaml` | All 4 tabs reachable, correct labels |
| `customer-task-creation.yaml` | New task wizard from FAB press to success |
| `tasker-browse.yaml` | Task feed → filter → detail |
| `role-switching.yaml` | Profile → switch role → tab labels change |

## Key Design Decisions

1. **No `renderRouter`** — expo-router v4 doesn't ship a stable testing-library integration. We render individual screens/layouts with mocked router and verify behavior through store state and mock assertions.
2. **Shared test fixtures** — Common mock setups (stores, session, profile) are extracted to `__tests__/integration/fixtures.ts`.
3. **Zustand direct state manipulation** — Tests drive navigation logic by setting store state directly (e.g., `useAuthStore.setState({session: ...})`), same pattern as existing unit tests.
4. **Maestro is conditional** — Flows are idempotent and gated behind env var; CI runs Jest only.
