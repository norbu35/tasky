# Mobile App Remake & Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the UI layer and complete all 65 Phase 0-1 screens for the Tasky mobile app while keeping existing infrastructure (auth store, API client, React Query hooks).

**Architecture:** Feature-domain batches with shared foundation. Session 1 builds role-aware navigation, 9 screen templates, and 17 new components. Sessions 2-5 dispatch parallel agents per feature batch (auth, task posting, verification, bookings, etc.) — 13 agent dispatches total (1 foundation + 3 + 3 + 4 + 3 per session, with Session 1 running as a single agent). Each agent receives the foundation + its specific screen specs from `docs/design/screen-specs/`.

**Tech Stack:** Expo 52, React Native 0.76, TypeScript, Expo Router, React Query v5, Zustand, Reanimated, i18next, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-22-mobile-app-remake-design.md`

**Design Artifacts (source of truth):**
- `docs/design/screen-inventory.yaml` — 81 screens, routes, states, API endpoints
- `docs/design/component-contract.yaml` — 32 canonical components, variants, rules
- `docs/design/design-system-additions.yaml` — new tokens (extends `packages/design-tokens/tokens.ts`)
- `docs/design/screen-specs/SCR-*.yaml` — per-screen layout, components, copy, states
- `docs/design/journey-catalog.yaml` — user flows with all paths
- `docs/design/screen-graph.yaml` — navigation adjacency
- `docs/design/state-matrix.yaml` — state coverage matrix
- `docs/BRAND.md` — visual identity, typography, color rationale

**Token precedence:** When this plan and design artifacts conflict on specific values, the design artifacts (`design-system-additions.yaml`, `tokens.ts`) are authoritative.

**API client precedence:** `apps/mobile/src/lib/mobileApiClient.ts` is authoritative for HTTP methods, endpoint paths, and method signatures. When the spec says `PUT` but the client uses `POST`, the client wins. When the spec references an endpoint path that differs from the client, use the client's path.

---

## File Structure Overview

### New directories
```
apps/mobile/src/
├── design/
│   ├── tokenAdapter.ts          (existing — extend with overlays, elevations, animations)
│   ├── animations.ts            (NEW — reusable animation presets)
│   └── elevations.ts            (NEW — shadow presets mapped from tokens)
├── components/
│   ├── ui/                      (existing — refactor + add new)
│   └── templates/               (NEW — 9 screen templates)
├── providers/
│   └── RoleProvider.tsx          (NEW — role context + tab switching)
├── app/
│   ├── (auth)/                  (existing — refactor)
│   ├── (customer)/              (NEW — customer-role routes)
│   │   ├── tasks/
│   │   ├── bookings/
│   │   └── _layout.tsx
│   ├── (tasker)/                (NEW — tasker-role routes)
│   │   ├── browse/
│   │   ├── jobs/
│   │   ├── verification/
│   │   └── _layout.tsx
│   ├── (shared)/                (NEW — both-role routes)
│   │   ├── inbox/
│   │   ├── profile/
│   │   └── _layout.tsx
│   └── _layout.tsx              (existing — wrap with RoleProvider)
├── features/
│   ├── auth/                    (existing)
│   ├── tasks/                   (existing — extend)
│   ├── bookings/                (existing — extend)
│   ├── chat/                    (existing — extend)
│   ├── profile/                 (existing — extend)
│   ├── review/                  (existing — extend)
│   ├── verification/            (NEW)
│   ├── disputes/                (NEW)
│   └── notifications/           (existing — extend)
└── hooks/
    └── useRouteGuard.ts         (NEW — auth + verification check)
```

### Key existing files to modify
- `apps/mobile/src/app/_layout.tsx` — wrap with RoleProvider
- `apps/mobile/src/design/tokenAdapter.ts` — extend with overlay, elevation, animation tokens
- `apps/mobile/src/store/appStore.ts` — add `currentRole` to persisted state
- `apps/mobile/src/components/ui/index.ts` — re-export new components
- `apps/mobile/src/locales/en/translation.json` — all new screen keys
- `apps/mobile/src/locales/mn/translation.json` — all new screen keys

---

## Session 1: Foundation

**Goal:** Build the shared infrastructure that all subsequent screen agents depend on. No screens — just templates, components, navigation, and tokens.

**Gate:** App compiles, role switching toggles tabs, templates render with placeholder content.

### Task 1.1: Extend Design Token Adapter

**Files:**
- Create: `apps/mobile/src/design/animations.ts`
- Create: `apps/mobile/src/design/elevations.ts`
- Modify: `apps/mobile/src/design/tokenAdapter.ts`

- [ ] **Step 1: Create animation presets file**

```typescript
// apps/mobile/src/design/animations.ts
import { Easing } from 'react-native-reanimated';

// Motion tokens from design-system-additions.yaml
export const durations = {
    instant: 80,
    fast: 150,
    normal: 250,
    slow: 400,
    skeleton: 1500,
} as const;

export const easings = {
    standard: Easing.bezier(0.4, 0, 0.2, 1),
    decelerate: Easing.bezier(0, 0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0, 1, 1),
    spring: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const animationPresets = {
    press: { duration: durations.instant, easing: easings.standard },
    enter: { duration: durations.normal, easing: easings.decelerate },
    sheetOpen: { duration: durations.slow, easing: easings.decelerate },
    sheetClose: { duration: durations.normal, easing: easings.accelerate },
    fade: { duration: durations.fast, easing: easings.standard },
    skeleton: { duration: durations.skeleton, easing: easings.standard },
    celebration: { duration: durations.slow, easing: easings.spring },
} as const;

// Interactive state values from design-system-additions.yaml
export const interactiveStates = {
    pressed: { opacity: 0.85, scale: 0.98 },
    disabled: { opacity: 0.4 },
    hover: { opacity: 0.92 },
} as const;
```

- [ ] **Step 2: Create elevation presets file**

```typescript
// apps/mobile/src/design/elevations.ts
import { Platform, type ViewStyle } from 'react-native';
import { designTokens } from '../../../../packages/design-tokens/tokens';

const { shadows } = designTokens;

export const elevations = {
    none: {},
    card: {
        shadowColor: shadows.card.color,
        shadowOffset: shadows.card.offset,
        shadowOpacity: shadows.card.opacity,
        shadowRadius: shadows.card.radius,
        ...(Platform.OS === 'android' && { elevation: shadows.card.elevation }),
    },
    elevated: {
        shadowColor: shadows.elevated.color,
        shadowOffset: shadows.elevated.offset,
        shadowOpacity: shadows.elevated.opacity,
        shadowRadius: shadows.elevated.radius,
        ...(Platform.OS === 'android' && { elevation: shadows.elevated.elevation }),
    },
    navBar: {
        shadowColor: shadows.navBar.color,
        shadowOffset: shadows.navBar.offset,
        shadowOpacity: shadows.navBar.opacity,
        shadowRadius: shadows.navBar.radius,
        ...(Platform.OS === 'android' && { elevation: shadows.navBar.elevation }),
    },
} as const satisfies Record<string, ViewStyle>;

// Overlay scrims from design-system-additions.yaml
export const overlays = {
    modal: 'rgba(16, 38, 56, 0.50)',
    sheet: 'rgba(16, 38, 56, 0.35)',
    toast: 'rgba(16, 38, 56, 0.20)',
} as const;
```

- [ ] **Step 3: Update tokenAdapter to re-export new modules**

Add to end of `tokenAdapter.ts`:
```typescript
export { animationPresets, durations, easings, interactiveStates } from './animations';
export { elevations, overlays } from './elevations';
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd apps/mobile && pnpm typecheck`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design/
git commit -m "feat(mobile): add animation presets, elevation tokens, and overlay scrims"
```

### Task 1.2: Role Provider & Role-Aware State

**Files:**
- Create: `apps/mobile/src/providers/RoleProvider.tsx`
- Modify: `apps/mobile/src/store/appStore.ts`
- Modify: `apps/mobile/src/app/_layout.tsx`

- [ ] **Step 1: Extend appStore with currentRole**

Add to `appStore.ts` interface and state:
```typescript
interface AppState {
    hasSeenOnboarding: boolean;
    currentRole: 'customer' | 'tasker';
    completeOnboarding: () => void;
    resetOnboarding: () => void;
    setRole: (role: 'customer' | 'tasker') => void;
}
```
Default `currentRole: 'customer'`, add `setRole: (role) => set({ currentRole: role })`.

- [ ] **Step 2: Create RoleProvider**

```typescript
// apps/mobile/src/providers/RoleProvider.tsx
import React, { createContext, useContext } from 'react';
import { useAppStore } from '../store/appStore';

interface RoleContextValue {
    currentRole: 'customer' | 'tasker';
    switchRole: () => void;
    setRole: (role: 'customer' | 'tasker') => void;
    isCustomer: boolean;
    isTasker: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const currentRole = useAppStore((s) => s.currentRole);
    const setRole = useAppStore((s) => s.setRole);

    const value: RoleContextValue = {
        currentRole,
        setRole,
        switchRole: () => setRole(currentRole === 'customer' ? 'tasker' : 'customer'),
        isCustomer: currentRole === 'customer',
        isTasker: currentRole === 'tasker',
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
    const ctx = useContext(RoleContext);
    if (!ctx) throw new Error('useRole must be used within RoleProvider');
    return ctx;
}
```

- [ ] **Step 3: Wrap _layout.tsx with RoleProvider**

In `apps/mobile/src/app/_layout.tsx`, add `<RoleProvider>` inside `<QueryClientProvider>`:
```tsx
<QueryClientProvider client={queryClient}>
    <RoleProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
    </RoleProvider>
</QueryClientProvider>
```

Import: `import { RoleProvider } from '../providers/RoleProvider';`

- [ ] **Step 4: Verify typecheck passes**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/providers/ apps/mobile/src/store/appStore.ts apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): add RoleProvider and role-aware app state"
```

### Task 1.3: Role-Aware Tab Layout

**Files:**
- Rewrite: `apps/mobile/src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite tab layout with role-aware tabs**

The existing tab layout is tasker-only. Rewrite to render different tabs based on `useRole()`:

- **Customer tabs:** My Tasks (ListChecks), Bookings (ClipboardList), Inbox (MessageSquare), Profile (User)
- **Tasker tabs:** Browse (Search), My Jobs (ClipboardList), Inbox (MessageSquare), Profile (User)

Key changes:
- Import `useRole` from `../../providers/RoleProvider`
- Define `customerTabs` and `taskerTabs` arrays with `{ name, title, icon }` config
- Render `<Tabs.Screen>` dynamically from the active tab set
- FAB only renders for customer role on "My Tasks" tab
- Keep existing blur background, styling from `mobileTheme`

- [ ] **Step 2: Create role-specific tab index files**

Create placeholder route files so the tab names resolve:
- `apps/mobile/src/app/(tabs)/tasks.tsx` — Customer "My Tasks" (redirects or renders CUST-001)
- The existing `apps/mobile/src/app/(tabs)/index.tsx` remains as Tasker "Browse"
- The existing `apps/mobile/src/app/(tabs)/bookings.tsx` serves both roles

- [ ] **Step 3: Verify app compiles and tabs switch**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(tabs)/
git commit -m "feat(mobile): role-aware tab layout with customer/tasker tabs"
```

### Task 1.4: Route Guard Hook

**Files:**
- Create: `apps/mobile/src/hooks/useRouteGuard.ts`
- Modify: `apps/mobile/src/utils/routeGuard.ts`

- [ ] **Step 1: Create useRouteGuard hook**

```typescript
// apps/mobile/src/hooks/useRouteGuard.ts
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { isRestricted } from '../utils/routeGuard';

interface GuardOptions {
    requireAuth?: boolean;
    requireVerification?: boolean;
}

export function useRouteGuard(options: GuardOptions = { requireAuth: true }) {
    const router = useRouter();
    const session = useAuthStore((s) => s.session);
    const profile = useAuthStore((s) => s.profile);

    useEffect(() => {
        if (options.requireAuth && !session) {
            router.replace('/(auth)');
            return;
        }
        if (profile && isRestricted(profile)) {
            if (profile.status === 'BANNED') {
                router.replace('/account/banned');
            } else {
                router.replace('/account/suspended');
            }
            return;
        }
    }, [session, profile, options.requireAuth]);

    return { isAuthenticated: !!session, isRestricted: isRestricted(profile) };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/
git commit -m "feat(mobile): add useRouteGuard hook for auth and status checks"
```

### Task 1.5: Screen Templates

**Files:**
- Create: `apps/mobile/src/components/templates/AuthTemplate.tsx`
- Create: `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- Create: `apps/mobile/src/components/templates/DetailTemplate.tsx`
- Create: `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
- Create: `apps/mobile/src/components/templates/SettingsTemplate.tsx`
- Create: `apps/mobile/src/components/templates/ModalSheetTemplate.tsx`
- Create: `apps/mobile/src/components/templates/EmptyStateTemplate.tsx`
- Create: `apps/mobile/src/components/templates/ErrorStateTemplate.tsx`
- Create: `apps/mobile/src/components/templates/SuccessCelebrationTemplate.tsx`
- Create: `apps/mobile/src/components/templates/index.ts`

Each template is a reusable layout wrapper. Agents building screens compose from these. Templates codify the visual rhythm from the spec (Section 3.5).

- [ ] **Step 1: Create FeedListTemplate**

The most-used template (11 screens). Provides:
- Optional sticky filter bar (horizontal ScrollView of chips)
- FlatList with `space-md` (12px) item separator
- `space-lg` (16px) horizontal padding
- Pull-to-refresh via `RefreshControl`
- Loading state → skeleton list
- Empty state → `EmptyStateTemplate`
- Error state → `ErrorStateTemplate` with retry
- Pagination footer spinner

Props: `data`, `renderItem`, `keyExtractor`, `onRefresh`, `isLoading`, `isError`, `isEmpty`, `emptyConfig`, `errorConfig`, `onRetry`, `filterBar?`, `ListHeaderComponent?`

- [ ] **Step 2: Create DetailTemplate**

Used by 20 screens. Provides:
- ScrollView body with `space-xl` (24px) top padding
- Sticky bottom CTA bar with `elevation-2` shadow, `space-md` padding
- Header with back arrow (top-left) and optional action icon (top-right)
- Loading state → skeleton
- Error state → error component with retry

Props: `children`, `headerTitle?`, `onBack`, `ctaLabel?`, `ctaOnPress?`, `ctaLoading?`, `rightAction?`, `isLoading?`, `isError?`, `onRetry?`

- [ ] **Step 3: Create FormWizardTemplate**

Used by 12 screens. Provides:
- Step indicator (dots, `accent` for active, `chipInactive` for inactive)
- ScrollView body with `space-lg` (16px) field gap
- Sticky bottom bar with Next/Back buttons
- Keyboard-aware scroll behavior
- Progress tracking via `currentStep` / `totalSteps`

Props: `currentStep`, `totalSteps`, `children`, `onNext`, `onBack?`, `nextLabel?`, `nextDisabled?`, `nextLoading?`, `showBack?`

- [ ] **Step 4: Create ModalSheetTemplate**

Used by 17 screens. Wraps `@gorhom/bottom-sheet`. Provides:
- Branded scrim backdrop: `rgba(16, 38, 56, 0.35)`
- White sheet with `radius-lg` (16px) top corners
- Drag handle indicator
- Max 70% screen height, scrollable if overflow
- Action buttons at bottom with `space-md` gap

Props: `isOpen`, `onClose`, `title?`, `children`, `snapPoints?`

- [ ] **Step 5: Create SuccessCelebrationTemplate**

Used by 8 screens. Provides:
- Centered layout with `space-3xl` (40px) top padding
- Animated hand-drawn checkmark (SVG path draw, 400ms slow/spring easing)
- Headline in `primaryDeep`, body in `primary`
- "What happens next" section with `accent` text
- CTA button at bottom

Props: `headline`, `body`, `nextSteps?`, `ctaLabel`, `ctaOnPress`, `secondaryCtaLabel?`, `secondaryCtaOnPress?`

- [ ] **Step 6: Create remaining templates**

- **AuthTemplate:** Centered content, logo/branding area, `primaryDeep` headline, single CTA, trust messaging footer
- **SettingsTemplate:** Grouped section list with headers in `textTertiary`, disclosure chevrons, row separators
- **EmptyStateTemplate:** Centered illustration placeholder, headline, description, activation CTA button
- **ErrorStateTemplate:** Centered alert icon, error message, retry CTA button, optional "go back" secondary action

- [ ] **Step 7: Create index barrel export**

```typescript
// apps/mobile/src/components/templates/index.ts
export { AuthTemplate } from './AuthTemplate';
export { FeedListTemplate } from './FeedListTemplate';
export { DetailTemplate } from './DetailTemplate';
export { FormWizardTemplate } from './FormWizardTemplate';
export { SettingsTemplate } from './SettingsTemplate';
export { ModalSheetTemplate } from './ModalSheetTemplate';
export { EmptyStateTemplate } from './EmptyStateTemplate';
export { ErrorStateTemplate } from './ErrorStateTemplate';
export { SuccessCelebrationTemplate } from './SuccessCelebrationTemplate';
```

- [ ] **Step 8: Typecheck**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/components/templates/
git commit -m "feat(mobile): add 9 screen templates with codified visual rhythm"
```

### Task 1.6: New Shared Components

**Files:** Create 17 new components in `apps/mobile/src/components/ui/`

Reference: `docs/design/component-contract.yaml` — section `new_components`

- [ ] **Step 1: Build new components**

Per the component contract, create these components (each in its own file under `components/ui/`):

| Component | File | Purpose |
|-----------|------|---------|
| `VerifiedBadge` | `VerifiedBadge.tsx` | DAN verification badge anchored to avatar |
| `SplitCard` | `SplitCard.tsx` | Hybrid dark-header/light-body card (the signature Tasky card) |
| `StepIndicator` | `StepIndicator.tsx` | Dot-based progress for FormWizard |
| `FilterBar` | `FilterBar.tsx` | Horizontal scrollable chip filter |
| `SkeletonLoader` | `SkeletonLoader.tsx` | Shimmer skeleton with configurable rows |
| `OfflineBanner` | `OfflineBanner.tsx` | Top banner when no network |
| `PressableCard` | `PressableCard.tsx` | Animated pressable wrapper with scale(0.98) |
| `PermissionPrimer` | `PermissionPrimer.tsx` | Pre-permission explanation bottom sheet |
| `TimelineStepper` | `TimelineStepper.tsx` | Vertical timeline for booking events |
| `RatingStars` | `RatingStars.tsx` | Interactive star rating input |
| `PriceTag` | `PriceTag.tsx` | Formatted ₮ price with `secondary` color |
| `LocationPin` | `LocationPin.tsx` | Map pin with text fallback |
| `PhotoGrid` | `PhotoGrid.tsx` | 1-4 photo grid with upload placeholder |
| `ActionSheet` | `ActionSheet.tsx` | Bottom sheet with action list |
| `ConfirmSheet` | `ConfirmSheet.tsx` | Destructive action confirmation sheet |
| `InfoRow` | `InfoRow.tsx` | Key-value display row for details |
| `HandDrawnCheck` | `HandDrawnCheck.tsx` | Animated SVG checkmark (brand signature) |

Each component must:
- Use only `mobileTheme` tokens for colors, spacing, radius
- Support `testID` prop for testing
- Include basic `accessibilityLabel`
- Use `useTranslation()` for any visible text

- [ ] **Step 2: Update barrel export**

Add all 17 new exports to `apps/mobile/src/components/ui/index.ts`.

- [ ] **Step 3: Typecheck + lint**

Run: `cd apps/mobile && pnpm typecheck && pnpm lint`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/
git commit -m "feat(mobile): add 17 new shared components from component contract"
```

### Task 1.7: Localization Structure

**Files:**
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`

- [ ] **Step 1: Add key structure for all 65 screens**

Organize by feature domain with consistent naming:
```json
{
  "nav": { "findWork": "FIND WORK", "myTasks": "MY TASKS", ... },
  "auth": { "login": { ... }, "onboarding": { ... }, "roleSelection": { ... } },
  "customer": { "taskList": { ... }, "postTask": { ... }, "bookings": { ... } },
  "tasker": { "browse": { ... }, "verification": { ... }, "jobs": { ... } },
  "shared": { "inbox": { ... }, "profile": { ... }, "review": { ... } },
  "infra": { "networkError": { ... }, "appUpdate": { ... }, "sessionExpired": { ... } }
}
```

Add at minimum: screen titles, button labels, empty state messages, error messages for each screen. Use the bilingual copy from the screen spec YAML files.

- [ ] **Step 2: Mirror structure in mn/translation.json**

Copy the key structure, fill with Mongolian copy from the screen spec YAMLs.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/locales/
git commit -m "feat(mobile): add localization keys for all 65 Phase 0-1 screens"
```

### Task 1.8: Extend API Client with Missing Methods

**Files:**
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`

Six methods referenced by screen hooks do not exist in the current API client interface. Add them so downstream agents can type their hooks correctly. These are "hook-ready" — typed correctly but the backend endpoint may not exist yet.

- [ ] **Step 1: Add missing methods to MobileApiClient interface**

```typescript
// Add to MobileApiClient interface:
flagNoShow(accessToken: string, bookingId: string): Promise<void>;
// POST /bookings/{bookingId}/no-show

deleteMyAccount(accessToken: string): Promise<void>;
// DELETE /users/me

getMyStats(accessToken: string): Promise<{
    jobs_completed: number;
    average_rating: number;
    response_time_minutes: number;
    reliability_score: number;
}>;
// GET /users/me/stats

listMyTasks(accessToken: string): Promise<CursorPage<Task>>;
// GET /tasks/mine

markBookingDone(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;
// PUT /bookings/{bookingId}/mark-done

getBookingTimeline(accessToken: string, bookingId: string): Promise<Array<{
    event: string;
    timestamp: string;
    actor: string;
}>>;
// GET /bookings/{bookingId}/timeline
```

- [ ] **Step 2: Add stub implementations in HttpMobileApiClient**

Each stub follows the existing pattern: call `resolveApiUrl()`, `fetch()`, check response, parse JSON. For endpoints that don't exist yet, the implementation is correct — it will just 404 until the backend catches up.

- [ ] **Step 3: Typecheck**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/mobileApiClient.ts
git commit -m "feat(mobile): add 6 missing API client methods for downstream screen hooks"
```

### Task 1.9: Route Group Layouts

**Files:**
- Create: `apps/mobile/src/app/(customer)/_layout.tsx`
- Create: `apps/mobile/src/app/(tasker)/_layout.tsx`
- Create: `apps/mobile/src/app/(shared)/_layout.tsx`

Without these layout files, Expo Router uses defaults. Each group needs a Stack navigator.

- [ ] **Step 1: Create layout files for each route group**

Each layout file is minimal — a Stack with `headerShown: false`:
```tsx
import { Stack } from 'expo-router';
export default function Layout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/mobile && pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/(customer)/ apps/mobile/src/app/(tasker)/ apps/mobile/src/app/(shared)/
git commit -m "feat(mobile): add _layout.tsx for customer, tasker, and shared route groups"
```

### Task 1.10: Foundation Gate Check

- [ ] **Step 1: Full typecheck**

Run: `cd apps/mobile && pnpm typecheck`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `cd apps/mobile && pnpm lint`
Expected: 0 errors (or only pre-existing warnings)

- [ ] **Step 3: Verify role switching**

Start app, confirm:
- Customer tabs: My Tasks / Bookings / Inbox / Profile
- Tasker tabs: Browse / My Jobs / Inbox / Profile
- Switching role changes tabs

- [ ] **Step 4: Commit all remaining changes and tag**

```bash
git add -A
git commit -m "feat(mobile): complete Session 1 foundation — templates, components, role provider"
```

---

## Session 2: Entry Flows (3 parallel agents, 16 screens)

Each agent below runs independently in its own worktree. Agent receives: foundation layer + its specific screen spec YAMLs + component contract + design system + brand doc + localization files.

### Agent 2A: Auth & Onboarding (7 screens)

**Screen specs:** `SCR-SHARED-001.yaml` through `SCR-SHARED-009.yaml` (excluding 003, 004 which are Phase 2)

**Files to create/modify:**
- Rewrite: `apps/mobile/src/app/(auth)/index.tsx` → Login screen (SCR-SHARED-002)
- Rewrite: `apps/mobile/src/app/index.tsx` → Splash screen (SCR-SHARED-001)
- Rewrite: `apps/mobile/src/app/onboarding.tsx` → Onboarding carousel (SCR-SHARED-005)
- Create: `apps/mobile/src/app/(auth)/role-select.tsx` → Role selection (SCR-SHARED-006)
- Create: `apps/mobile/src/app/(auth)/permission-camera.tsx` → Camera permission (SCR-SHARED-007)
- Create: `apps/mobile/src/app/(auth)/permission-location.tsx` → Location permission (SCR-SHARED-008)
- Create: `apps/mobile/src/app/(auth)/permission-notifications.tsx` → Notification permission (SCR-SHARED-009)
- Modify: `apps/mobile/src/features/auth/components/LoginForm.tsx`

**Per-screen requirements:**

| Screen | Template | Key States | API |
|--------|----------|------------|-----|
| Splash | Auth | default, loading | — |
| Login | Auth | default, loading, facebook_loading, error | POST /auth/facebook |
| Onboarding | Auth | slide_1, slide_2, slide_3 | — |
| Role Selection | Auth | default, confirming | PUT /users/me/role |
| Permission Camera | ModalSheet | default, granted, denied | — |
| Permission Location | ModalSheet | default, granted, denied | — |
| Permission Notifications | ModalSheet | default, granted, denied | — |

**Agent instructions:**
1. Read each screen's YAML spec for exact layout, components, copy, and states
2. Use `AuthTemplate` for auth screens, `ModalSheetTemplate` for permission primers
3. Login must support Facebook OAuth. The existing API client has `requestOtp`/`verifyOtp`/`devLogin` but no `loginWithFacebook`. Check `useAuth` hook for any existing Facebook login method; if none, add `loginWithFacebook(facebookToken: string): Promise<AuthTokens>` to the API client wrapping `POST /auth/facebook`
4. Onboarding carousel: 3 swipeable slides with dot indicator, "Skip" and "Next" buttons
5. Role selection: two large cards (Customer / Tasker), calls `setRole()` from `useRole()` + `PUT /users/me/role`
6. Permission primers: explain why the permission is needed, offer Grant/Skip. Use `expo-camera`, `expo-location`, `expo-notifications` permission APIs
7. After last permission → navigate to home screen based on selected role
8. All text via `useTranslation()` — fill `mn` and `en` keys
9. Run `pnpm typecheck && pnpm lint` before completing

### Agent 2B: Tasker Browse & Apply (4 screens)

**Screen specs:** `SCR-TASK-001.yaml`, `SCR-TASK-002.yaml`, `SCR-TASK-003.yaml`, `SCR-TASK-011.yaml`

**Files to create/modify:**
- Rewrite: `apps/mobile/src/app/(tabs)/index.tsx` → Task Feed / Browse (SCR-TASK-001)
- Rewrite: `apps/mobile/src/app/task/[id].tsx` → Task Detail Tasker (SCR-TASK-002)
- Create: `apps/mobile/src/features/tasks/components/VerificationGate.tsx` (SCR-TASK-003)
- Create: `apps/mobile/src/features/tasks/components/ApplicationSentSuccess.tsx` → inline success (SCR-TASK-011, route: null — rendered as overlay/inline after apply)
- Rewrite: `apps/mobile/src/features/tasks/components/TaskFeed.tsx`

**Per-screen requirements:**

| Screen | Template | Key States | API |
|--------|----------|------------|-----|
| Task Feed (Browse) | FeedList | loading, empty_activation, populated, refreshing, filtering, error, offline | GET /tasks |
| Task Detail (Tasker) | Detail | loading, viewable_unverified, apply_verified, already_applied, cap_reached, error | GET /tasks/:id, POST /tasks/:id/applications |
| Verification Gate | Auth | encouraging_interstitial | — |
| Application Sent | SuccessCelebration | default | — (component, not a route — rendered inline on Task Detail after successful apply) |

**Agent instructions:**
1. Task Feed: use `FeedListTemplate` with `SplitCard` for each task. Dark header shows customer name + budget (`PriceTag`), light body shows description + category chip + schedule + location. Include `FilterBar` for category/distance filtering. Use existing `useTasks()` hook.
2. Task Detail (Tasker): use `DetailTemplate`. Bottom CTA: "Apply" if verified, "Get Verified" if not. Show full task info, customer trust signals, photo grid. Apply calls `applyToTask()` from API client.
3. Verification Gate: encouraging interstitial screen explaining benefits of verification. CTA navigates to verification flow.
4. Application Sent: `SuccessCelebrationTemplate` with "Your application has been sent" + next steps.
5. Trust signals: show `VerifiedBadge` on customer avatar if verified.
6. Run `pnpm typecheck && pnpm lint` before completing

### Agent 2C: Infrastructure Screens (5 screens)

**Screen specs:** `SCR-INFRA-001.yaml` through `SCR-INFRA-005.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(shared)/network-error.tsx` (SCR-INFRA-001)
- Create: `apps/mobile/src/app/(shared)/app-update.tsx` (SCR-INFRA-002)
- Create: `apps/mobile/src/app/(shared)/session-expired.tsx` (SCR-INFRA-003)
- Create: `apps/mobile/src/app/(shared)/legal/terms.tsx` (SCR-INFRA-004)
- Create: `apps/mobile/src/app/(shared)/help.tsx` (SCR-INFRA-005)

**Per-screen requirements:**

| Screen | Template | Key States |
|--------|----------|------------|
| Network Error | ErrorState | no_connection, slow_connection, retry_loading |
| App Update | ErrorState | soft_update, force_update |
| Session Expired | ModalSheet | default |
| Terms of Service | Detail | loading, loaded |
| Help & Support | FeedList | loading, loaded, error |

**Agent instructions:**
1. Network Error: detect with NetInfo, show appropriate message + retry button
2. App Update: `soft_update` shows dismiss + update, `force_update` shows only update (links to app store)
3. Session Expired: bottom sheet explaining session expired, CTA re-navigates to login
4. Terms of Service: scrollable static content via `DetailTemplate`
5. Help & Support: FAQ list using `FeedListTemplate`, can be static content for now
6. Run `pnpm typecheck && pnpm lint` before completing

---

## Session 3: Core Flows (3 parallel agents, 22 screens)

### Agent 3A: Customer Task Posting (8 screens)

**Screen specs:** `SCR-CUST-001.yaml` through `SCR-CUST-008.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(customer)/tasks/index.tsx` (SCR-CUST-001 My Tasks)
- Create: `apps/mobile/src/app/(customer)/tasks/new/category.tsx` (SCR-CUST-002)
- Create: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx` (SCR-CUST-003)
- Create: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx` (SCR-CUST-004)
- Create: `apps/mobile/src/app/(customer)/tasks/new/location.tsx` (SCR-CUST-005)
- Create: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx` (SCR-CUST-006)
- Create: `apps/mobile/src/app/(customer)/tasks/new/review.tsx` (SCR-CUST-007)
- Create: `apps/mobile/src/app/(customer)/tasks/new/success.tsx` (SCR-CUST-008)
- Create: `apps/mobile/src/features/tasks/hooks/useCreateTask.ts`

**Agent instructions:**
1. My Tasks list: `FeedListTemplate`, filter by `role: customer`, show task cards with status badges. Empty state encourages posting first task. FAB navigates to category selection.
2. Post Task wizard (screens 002-007): `FormWizardTemplate` with 6 steps. Each step is its own route file. Use `useCategories()` for category list. Photo upload uses `expo-image-picker`. Location uses text input (map picker is out of scope). Schedule uses date/time pickers. Budget uses numeric input with ₮ prefix.
3. Review & Submit: `DetailTemplate` showing summary of all fields with edit buttons per section. Submit calls `useCreateTask().mutateAsync()`.
4. Success: `SuccessCelebrationTemplate` — "Task posted!" with next steps guidance.
5. Payload transformation per API wiring spec: category key → UUID, combine date+time → ISO 8601, budget string → number.

### Agent 3B: Tasker Verification (6 screens)

**Screen specs:** `SCR-TASK-004.yaml`, `SCR-TASK-005.yaml`, `SCR-TASK-007.yaml` through `SCR-TASK-010.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(tasker)/verification/consent.tsx` (SCR-TASK-004)
- Create: `apps/mobile/src/app/(tasker)/verification/upload.tsx` (SCR-TASK-005)
- Create: `apps/mobile/src/app/(tasker)/verification/pending.tsx` (SCR-TASK-007)
- Create: `apps/mobile/src/app/(tasker)/verification/approved.tsx` (SCR-TASK-008)
- Create: `apps/mobile/src/app/(tasker)/verification/rejected.tsx` (SCR-TASK-009)
- Create: `apps/mobile/src/app/(tasker)/verification/submitted.tsx` (SCR-TASK-010)
- Create: `apps/mobile/src/features/verification/hooks/useVerification.ts`

**Agent instructions:**
1. Consent: explain what verification involves and why. Checkbox to agree. CTA → upload screen.
2. Upload: `FormWizardTemplate` with 3 steps — ID front, ID back, selfie. Use `expo-image-picker` for camera/gallery. Upload to presigned URLs via `getVerificationUploadUrl()`, then `submitVerification()`.
3. Submitted success: `SuccessCelebrationTemplate`.
4. Pending: `EmptyStateTemplate` — "Under review" with SLA messaging.
5. Approved: `SuccessCelebrationTemplate` — "Verified! You can now apply to tasks."
6. Rejected: `ErrorStateTemplate` with admin_notes reason and "Resubmit" CTA.
7. Hook `useVerification()` wraps `getVerificationStatus()` + `submitVerification()`.

### Agent 3C: Communication + Reviews + Account States (8 screens)

**Screen specs:** `SCR-SHARED-010.yaml`, `SCR-SHARED-011.yaml`, `SCR-SHARED-016.yaml` through `SCR-SHARED-021.yaml`

**Files to create/modify:**
- Rewrite: `apps/mobile/src/app/(tabs)/inbox/index.tsx` (SCR-SHARED-010) — inbox stays under `(tabs)/` since it's a tab root for both roles
- Rewrite: `apps/mobile/src/app/(tabs)/inbox/[id].tsx` (SCR-SHARED-011)
- Create: `apps/mobile/src/app/(shared)/notifications.tsx` (SCR-SHARED-016)
- Rewrite: `apps/mobile/src/features/review/components/ReviewForm.tsx` (SCR-SHARED-017)
- Create: `apps/mobile/src/features/review/components/ReviewReminder.tsx` (SCR-SHARED-018)
- Create: `apps/mobile/src/features/review/components/ReviewHardLock.tsx` (SCR-SHARED-019)
- Create: `apps/mobile/src/app/(shared)/account/suspended.tsx` (SCR-SHARED-020)
- Create: `apps/mobile/src/app/(shared)/account/banned.tsx` (SCR-SHARED-021)

**Agent instructions:**
1. Conversation List: `FeedListTemplate`, use `useConversations()` (new hook wrapping `listConversations()`). Each row shows other participant avatar + name, last message preview, timestamp, unread indicator.
2. Chat Detail: custom layout (not a standard template). Message list with sent/received bubbles. Input bar at bottom. Phone number detection warning. Use `useMessages()` + `useSendMessage()`.
3. Notification Center: `FeedListTemplate`. Hook-ready (`useNotifications()` exists but endpoint is Phase 2). Show mock structure.
4. Review Form: `FormWizardTemplate`. Star ratings per category using `RatingStars` component. Optional comment. Submit via `useSubmitReview()` with field mapping per API wiring spec.
5. Review Reminder: `ModalSheetTemplate`. 24h and 72h variants. CTA navigates to review form.
6. Review Hard Lock: `ErrorStateTemplate`. Full-screen blocker for dispute/missed reviews/investigation.
7. Suspended Account: `ErrorStateTemplate` with expiry info and appeal option.
8. Banned Account: `ErrorStateTemplate`. Terminal screen, no actions available.

---

## Session 4: Transaction Flows (4 parallel agents, 23 screens)

### Agent 4A: Customer Task Detail & Applicants (5 screens)

**Screen specs:** `SCR-CUST-009.yaml` through `SCR-CUST-011.yaml`, `SCR-CUST-013.yaml`, `SCR-CUST-026.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx` (SCR-CUST-009)
- Create: `apps/mobile/src/app/(customer)/tasks/[taskId]/cancel.tsx` (SCR-CUST-010)
- Create: `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx` (SCR-CUST-011)
- Create: `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx` (SCR-CUST-013)
- Create: `apps/mobile/src/features/tasks/components/NoApplicantRescue.tsx` (SCR-CUST-026)

**Agent instructions:**
1. Task Detail (Customer): `DetailTemplate`. Shows all task info + status-dependent CTAs. States: open (show applicant count), assigned (show tasker info + message CTA), tasker_marked_done (confirm completion CTA), completed, cancelled, no_show.
2. Task Cancel: `ModalSheetTemplate`. Different copy for open vs assigned tasks. Late cancel warning. Calls existing `cancelBooking()` or `DELETE /tasks/:id`.
3. Applicants List: `FeedListTemplate` with `useApplications(taskId)`. Each row shows tasker avatar + `VerifiedBadge` + name + rating + message. Accept button → `useAcceptApplication()` → navigate to booking confirmation.
4. Tasker Public Profile: `DetailTemplate`. Shows full profile, stats, reviews list. Use `useTaskerProfile(userId)`.
5. No Applicant Rescue: `ModalSheetTemplate`. Triggered at 120min with 0 applicants. Options: adjust budget, adjust schedule, request concierge.

### Agent 4B: Customer Bookings (8 screens)

**Screen specs:** `SCR-CUST-014.yaml` through `SCR-CUST-020.yaml`, `SCR-CUST-023.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(customer)/bookings/confirm.tsx` (SCR-CUST-014)
- Create: `apps/mobile/src/app/(customer)/bookings/confirmed.tsx` (SCR-CUST-015)
- Create: `apps/mobile/src/app/(customer)/bookings/index.tsx` (SCR-CUST-016)
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx` (SCR-CUST-017)
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/complete.tsx` (SCR-CUST-018)
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx` (SCR-CUST-019)
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx` (SCR-CUST-020)
- Create: `apps/mobile/src/app/(customer)/rebook.tsx` (SCR-CUST-023)

**Agent instructions:**
1. Booking Confirmation: `DetailTemplate`. Disclaimer review, liability acceptance checkbox, "Confirm Booking" CTA. Add-to-calendar option. Calls `acceptApplication()`.
2. Booking Confirmed: `SuccessCelebrationTemplate`.
3. Customer Bookings List: `FeedListTemplate` with `useBookings({ role: 'customer' })`. `SplitCard` for each booking showing tasker info + status + schedule.
4. Booking Detail (Customer): `DetailTemplate`. Status-dependent layout. Assigned: show tasker contact, timeline link, reschedule/cancel buttons. Completed: rebook CTA + review prompt.
5. Confirm Completion: `ModalSheetTemplate`. "Was the job done?" Yes/No. Calls `useCompleteBooking()`.
6. Booking Timeline: `DetailTemplate` with `TimelineStepper` component showing chronological booking events.
7. Reschedule: `FormWizardTemplate`. Date/time picker + reason field. Calls `useReschedule()`.
8. Rebook: `FormWizardTemplate`. Prefilled from previous task/booking data. Calls `useCreateTask()`.

### Agent 4C: Tasker Jobs & Stats (5 screens)

**Screen specs:** `SCR-TASK-012.yaml` through `SCR-TASK-016.yaml`

**Files to create:**
- Create: `apps/mobile/src/app/(tasker)/jobs/index.tsx` (SCR-TASK-012)
- Create: `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx` (SCR-TASK-013)
- Create: `apps/mobile/src/features/bookings/components/TaskerNoShow.tsx` (SCR-TASK-014)
- Create: `apps/mobile/src/features/bookings/components/TaskerCancelBooking.tsx` (SCR-TASK-015)
- Create: `apps/mobile/src/app/(tasker)/stats.tsx` (SCR-TASK-016)

**Agent instructions:**
1. My Jobs: `FeedListTemplate` with `useBookings({ role: 'tasker' })`. Show booking cards with customer info + task title + schedule + status.
2. Booking Detail (Tasker): `DetailTemplate`. Assigned state: "Mark Done" CTA. Show customer info, task details, timeline link. Calls `completeBooking()` for mark done (marks tasker's side — customer confirms separately).
3. No-Show Flag (Tasker): `ModalSheetTemplate`. Timer-based: reminder at 10min, flag available at 15min. Calls `POST /bookings/:id/no-show`.
4. Booking Cancel (Tasker): `ModalSheetTemplate`. Strike warning explaining impact on reliability score. Confirm → calls `cancelBooking()`.
5. Tasker Stats: `DetailTemplate` with `StatCard` components. Jobs completed, rating, response time, reliability score. Uses `useUserStats()` (new hook wrapping `GET /users/me/stats`).

### Agent 4D: Profile & Settings (5 screens)

**Screen specs:** `SCR-SHARED-012.yaml` through `SCR-SHARED-015.yaml`, `SCR-TASK-018.yaml`

**Files to create/modify:**
- Rewrite: `apps/mobile/src/app/(tabs)/profile.tsx` (SCR-SHARED-012)
- Create: `apps/mobile/src/app/(shared)/profile/edit.tsx` (SCR-SHARED-013)
- Create: `apps/mobile/src/app/(shared)/profile/settings.tsx` (SCR-SHARED-014)
- Create: `apps/mobile/src/app/(shared)/profile/delete.tsx` (SCR-SHARED-015)
- Create: `apps/mobile/src/app/(shared)/legal/privacy.tsx` (SCR-TASK-018)

**Agent instructions:**
1. My Profile: `DetailTemplate`. Role-aware: customer view shows task history summary, tasker view shows stats + verification badge + reviews. Edit button → edit screen. Settings gear → settings.
2. Edit Profile: `FormWizardTemplate`. Name, avatar upload (presigned URL via `getAvatarUploadUrl()`), bio. Calls `updateMyProfile()`.
3. Settings: `SettingsTemplate`. Language toggle (i18next), notification toggle, role switch (with confirm sheet), account deletion link. Links to Terms, Privacy, Help.
4. Account Deletion: `ModalSheetTemplate`. Warns about data loss. Blocked if active bookings. Confirm → `DELETE /users/me`.
5. Privacy Policy: `DetailTemplate`. Static content, scrollable.

---

## Session 5: Completion & Integration (3 agents, 4 screens + validation)

### Agent 5A: Customer Cancellation & Disputes (4 screens)

**Screen specs:** `SCR-CUST-021.yaml`, `SCR-CUST-022.yaml`, `SCR-CUST-024.yaml`, `SCR-CUST-025.yaml`

**Files to create:**
- Create: `apps/mobile/src/features/bookings/components/CustomerNoShow.tsx` (SCR-CUST-021)
- Create: `apps/mobile/src/features/bookings/components/CustomerCancelBooking.tsx` (SCR-CUST-022)
- Create: `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx` (SCR-CUST-024)
- Create: `apps/mobile/src/app/(customer)/disputes/[disputeId].tsx` (SCR-CUST-025)

**Agent instructions:**
1. No-Show Flag + Reminder: `ModalSheetTemplate`. Timer-based stages: reminder at 10min, flag at 15min. Calls `POST /bookings/:id/no-show`.
2. Booking Cancel (Customer): `ModalSheetTemplate`. Free cancel vs late cancel warning with different copy. Calls `useCancelBooking()`.
3. Dispute Raise: `FormWizardTemplate`. Reason selection, evidence upload (photos), description. Calls `useDisputeCreate()` (new hook wrapping `raiseDispute()`).
4. Dispute Status: `DetailTemplate`. Shows dispute state: open, escalated, resolved (customer/tasker), closed_insufficient. Read-only timeline of dispute events.

### Agent 5B: Integration Review

**No new files.** This agent reviews all work from Sessions 1-4.

Checklist:
- [ ] Walk every journey from `docs/design/journey-catalog.yaml` — verify navigation works
- [ ] Check cross-batch import consistency — all shared components imported from `components/ui`
- [ ] Check all screens use templates from `components/templates`
- [ ] Verify no hardcoded colors, spacing, or font sizes — all from `mobileTheme`
- [ ] Check translation key consistency — no collisions, no untranslated strings
- [ ] Verify route guard is applied to all protected screens
- [ ] Spot-check 3 screens from different batches for visual consistency (spacing, typography, card style)
- [ ] Fix any issues found

### Agent 5C: Quality Gate

Run the full quality suite:

- [ ] `cd apps/mobile && pnpm typecheck` — zero errors
- [ ] `cd apps/mobile && pnpm lint` — zero errors
- [ ] `cd apps/mobile && pnpm test:unit` — all tests pass
- [ ] Route audit: verify every Phase 0-1 screen ID maps to an Expo Router file
- [ ] Localization audit: verify every `t()` key exists in both `en` and `mn` translation files
- [ ] Export audit: verify all new components are re-exported from barrel files

---

## Per-Agent Quality Contract (applies to ALL agents)

Before an agent reports completion, it MUST:

1. Run `cd apps/mobile && pnpm typecheck` — zero TS errors
2. Run `cd apps/mobile && pnpm lint` — passes
3. Every screen handles ALL states listed in its screen-spec YAML (loading, error, empty, populated, offline where applicable)
4. Every user-visible string uses `t('key', 'fallback')` — no raw string literals
5. All colors from `mobileTheme.colors`, all spacing from `mobileTheme.spacing`, all radius from `mobileTheme.radius`
6. Every new route file is in the correct Expo Router directory matching the screen-spec YAML `route` field
7. Commit all changes with descriptive commit message

## Cross-Agent Data Contracts

Screens built by different agents sometimes depend on route params from a predecessor screen. Document these handoffs so agents wire navigation correctly:

| From Screen (Agent) | To Screen (Agent) | Route Params |
|---------------------|-------------------|--------------|
| CUST-011 Applicants List (4A) | CUST-014 Booking Confirmation (4B) | `{ taskId, applicationId, taskerId, liabilityDisclaimerAccepted }` |
| CUST-009 Task Detail (4A) | CUST-019 Booking Timeline (4B) | `{ bookingId }` |
| CUST-011 Applicants List (4A) | CUST-013 Tasker Profile (4A) | `{ taskerId }` |
| TASK-001 Task Feed (2B) | TASK-002 Task Detail (2B) | `{ taskId }` |
| TASK-002 Task Detail (2B) | TASK-003 Verification Gate (2B) | — (no params) |
| SHARED-010 Inbox (3C) | SHARED-011 Chat Detail (3C) | `{ conversationId }` |
| CUST-017 Booking Detail (4B) | CUST-024 Dispute Raise (5A) | `{ bookingId }` |

Agents receiving params should use `useLocalSearchParams<{ paramName: string }>()` from Expo Router.

## Critical Reminders

- **SecurityConfig.java:** Verify `src/main/java/.../SecurityConfig.java` is UNCHANGED after any agent session touching auth/controller work (known risk from memory)
- **Token precedence:** `design-system-additions.yaml` and `tokens.ts` are authoritative over this plan for specific values
- **API client precedence:** `mobileApiClient.ts` is authoritative for HTTP methods and endpoint paths over this plan and the spec
- **Partial failure:** If a batch fails its gate, other batches without dependencies on it may proceed. Failing batch enters fix-and-retry before next session.
