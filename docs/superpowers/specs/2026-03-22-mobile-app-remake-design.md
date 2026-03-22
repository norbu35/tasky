# Tasky Mobile — App Remake & Completion Design

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Rewrite UI layer and complete all 65 Phase 0-1 screens via phased agent pipeline

---

## 1. Context & Goal

The Tasky mobile app (Expo 52 / React Native 0.76) has ~15 screens built with ~3 wired to the backend API. The design artifact stack specifies 81 total screens (65 Phase 0-1, 10 Phase 2, 6 Phase 3+) with full component contracts, state matrices, journey catalogs, and per-screen YAML specs.

**Existing wired screens:** TaskFeed (Browse), BookingList, and ProfileView are currently connected to the backend API via `useTasks`, `useBookings`, and `useProfile` hooks. All other screens use hardcoded/mock data or are unbuilt.

**Goal:** Rewrite the UI layer of the mobile app to match the design spec, keeping the existing infrastructure (auth, API client, hooks, stores), and build out all remaining Phase 0-1 screens. The result is a compilable, navigable, visually consistent app with 65 screens covering both Customer and Tasker roles.

**Approach:** Feature-Domain Batches with Shared Foundation (Approach B). A foundation session establishes shared infrastructure and visual system, then parallel agent batches build screens by feature domain across 4 subsequent sessions.

---

## 2. Architecture — What Changes, What Stays

### Keeping (infrastructure layer)
- Expo Router file-based routing
- `authStore` (Zustand) for auth state
- `mobileApiClient.ts` + `@tasky/sdk` for API calls
- React Query hooks pattern (`useTasks`, `useBookings`, etc.)
- i18next localization setup (mn primary, en secondary)
- Firebase messaging / Notifee for push notifications

### Rewriting (UI layer)
- All existing screen components — rebuilt to match the 81-screen spec's layout, states, and copy
- Tab layout — becomes **role-aware** (Customer: My Tasks / Bookings / Inbox / Profile; Tasker: Browse / My Jobs / Inbox / Profile)
- Route structure — expanded from flat to nested role-based groups: `(auth)/`, `(customer)/`, `(tasker)/`, `(shared)/`
- Component library — 15 existing components refactored + 17 new components per the component contract
- Design tokens — verified against BRAND.md v2.0 "Тэнгэр" palette

### New infrastructure (added in foundation)
- **Role context provider** — wraps the app, exposes `currentRole`, `switchRole()`, controls tab rendering
- **Screen template components** — 9 reusable templates (Auth, FeedList, Detail, FormWizard, Settings, ModalSheet, EmptyState, ErrorState, SuccessCelebration)
- **Route guard middleware** — checks auth + verification status before protected routes
- **Offline banner component** — shared across all async screens
- **Skeleton factory** — generates loading skeletons matching each template layout

---

## 3. Visual Design System

### 3.1 Spatial Rhythm

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Inline icon gaps, tight element pairs |
| `space-sm` | 8px | Within-component padding (chip content, badge) |
| `space-md` | 12px | Card internal padding, form field spacing |
| `space-lg` | 16px | Section separation within a screen |
| `space-xl` | 24px | Between content blocks, major sections |
| `space-2xl` | 32px | Screen top/bottom breathing room |
| `space-3xl` | 40px | Hero areas, celebration screens |

**Rule:** All spacing uses these tokens. No magic numbers in screen code.

**Precedence:** When this spec and the design artifacts (`design-system-additions.yaml`, `tokens.ts`) conflict on specific values, the design artifacts are authoritative. This spec describes intent and structure; the token files define exact values.

### 3.2 Card System — Hybrid Split-Card

The signature card pattern:
- **Header zone** (56px height): `primary` (#1B3A5C) background, white text — avatar (40px circle), name, price/status badge. Rounded top corners (`radius-lg` = 16px).
- **Body zone** (auto height): `background` (#F9F8F5), `space-md` padding — task details, category chip, schedule, location. Rounded bottom corners.
- **Interaction:** `Pressable` with `scale(0.98)` spring on press, navigates to detail.
- **Trust signal:** Verified badge anchored to avatar bottom-right corner in `verified` (#469178).

### 3.3 Elevation Tiers

Uses the existing shadow tokens from `tokens.ts`:

| Level | Token | React Native Shadow | Usage |
|-------|-------|---------------------|-------|
| `elevation-0` | — | none | Inline elements, flat surfaces |
| `elevation-1` | `shadows.card` | `offset: {0,1}, opacity: 0.05, radius: 2` | Cards, list items |
| `elevation-2` | `shadows.elevated` | `offset: {0,4}, opacity: 0.10, radius: 6` | Bottom sheets, modals, sticky bars |
| `elevation-3` | `shadows.navBar` | `offset: {0,-4}, opacity: 0.04, radius: 24` | FAB, tab bar, floating elements |

### 3.4 Animation Presets

Uses the motion system from `design-system-additions.yaml`:

| Preset | Duration | Easing | Usage |
|--------|----------|--------|-------|
| `press` | instant (80ms) | standard `(0.4,0,0.2,1)` | Button/card press feedback, scale(0.98) + opacity(0.85) |
| `enter` | normal (250ms) | decelerate `(0,0,0.2,1)` | Screen content entrance, fade + translateY |
| `sheet-open` | slow (400ms) | decelerate `(0,0,0.2,1)` | Bottom sheet opening |
| `sheet-close` | normal (250ms) | accelerate `(0.4,0,1,1)` | Bottom sheet closing |
| `fade` | fast (150ms) | standard `(0.4,0,0.2,1)` | Opacity transitions, state changes |
| `skeleton` | skeleton (1500ms) | standard | Shimmer loop for loading skeletons |
| `celebration` | slow (400ms) | spring `(0.34,1.56,0.64,1)` | Success checkmark SVG path draw |

### 3.5 Screen Template Visual Specs

**FeedList:** Sticky filter bar with horizontal-scroll chips, `space-md` card gap, `space-lg` horizontal margin, FAB bottom-right 56px with `elevation-3` and `secondary` background, pull-to-refresh via native RefreshControl, pagination footer spinner at 80% scroll.

**Detail:** Scrollable body with `space-xl` top padding, sticky bottom CTA bar with `elevation-2` and full-width primary button, back arrow top-left, share icon top-right.

**FormWizard:** Step indicator (dots or numbered) with `accent` for active, fields stacked with `space-lg` gap, sticky bottom Next/Back bar, inline validation errors in `danger` below fields.

**ModalSheet:** Backdrop `rgba(16, 38, 56, 0.35)` (branded primaryDeep scrim, not generic black), white sheet with `radius-lg` top corners and drag handle, max 70% screen height (scrollable if overflow), action buttons at bottom with `space-md` gap. Full-screen modals use `rgba(16, 38, 56, 0.50)` scrim.

**SuccessCelebration:** Centered layout with `space-3xl` top padding, hand-drawn checkmark SVG animation (path draw, slow/400ms duration), headline in `primary-deep`, body in `primary`, "what happens next" section in `accent`, CTA at bottom.

**Auth:** Centered content, single CTA, trust messaging, `primary-deep` headline.

**Settings:** Grouped list rows with disclosure indicators, section headers in `textTertiary`.

**EmptyState:** Centered illustration, headline, description, activation CTA.

**ErrorState:** Centered icon, error message, retry CTA button.

---

## 4. Session Pipeline

### Session 1: Foundation (single agent, 0 screens)

Build shared infrastructure all screen agents depend on:
- Role context provider + role-aware tab layout (Customer vs Tasker tabs)
- 9 screen template components with codified visual rhythm
- 17 new shared components from component contract
- Refactor 15 existing components to match design system
- Route structure: `(auth)/`, `(customer)/`, `(tasker)/`, `(shared)/`
- Route guard middleware (auth check + verification check)
- Skeleton factory, offline banner, animation presets as reusable modules
- Expand localization key structure for all 65 screens

**Gate:** App compiles, role switching works, templates render with placeholder content.

### Session 2: Entry Flows (3 parallel agents, 16 screens)

| Agent | Batch | Screens | Screen IDs |
|-------|-------|---------|------------|
| 2A | Auth & Onboarding | 7 | SHARED-001, 002, 005, 006, 007, 008, 009 |
| 2B | Tasker Browse & Apply | 4 | TASK-001, 002, 003, 011 |
| 2C | Infrastructure | 5 | INFRA-001, 002, 003, 004, 005 |

Zero cross-batch dependencies — these are independent entry points.

**Gate:** Auth flow works end-to-end, tasker can browse tasks, error/offline screens render.

### Session 3: Core Flows (3 parallel agents, 22 screens)

| Agent | Batch | Screens | Screen IDs |
|-------|-------|---------|------------|
| 3A | Customer Task Posting | 8 | CUST-001, 002, 003, 004, 005, 006, 007, 008 |
| 3B | Tasker Verification | 6 | TASK-004, 005, 007, 008, 009, 010 |
| 3C | Communication + Reviews + Account States | 8 | SHARED-010, 011, 016, 017, 018, 019, 020, 021 |

**Gate:** Customer can post a task, tasker can verify, chat renders, review form submits.

### Session 4: Transaction Flows (4 parallel agents, 23 screens)

| Agent | Batch | Screens | Screen IDs |
|-------|-------|---------|------------|
| 4A | Customer Task Detail & Applicants | 5 | CUST-009, 010, 011, 013, 026 |
| 4B | Customer Bookings | 8 | CUST-014, 015, 016, 017, 018, 019, 020, 023 |
| 4C | Tasker Jobs & Stats | 5 | TASK-012, 013, 014, 015, 016 |
| 4D | Profile & Settings | 5 | SHARED-012, 013, 014, 015, TASK-018 |

**Gate:** Full booking lifecycle navigable for both roles, profiles render, settings functional.

### Session 5: Completion & Integration (3 agents, 4 screens + validation)

| Agent | Batch | Screens | Screen IDs |
|-------|-------|---------|------------|
| 5A | Customer Cancellation & Disputes | 4 | CUST-021, 022, 024, 025 |
| 5B | Integration Review | — | Cross-batch consistency, style drift fixes, navigation edge cases |
| 5C | Quality Gate | — | Typecheck, lint, unit tests, route audit, localization completeness |

**Gate:** All 65 screens compile, navigate correctly, handle all specified states. Zero TS errors.

**Totals:** 5 sessions, 12 batches, ~16 agent dispatches, 65 screens.

---

## 5. Data & API Wiring Strategy

### Wiring Tiers

| Tier | Meaning | Approx Count |
|------|---------|--------------|
| **Fully wired** | Real API calls via React Query hooks | ~35 screens |
| **Hook-ready** | Hook typed correctly, endpoint may not exist yet | ~20 screens |
| **UI-only** | No API dependency (success screens, permission primers, static content) | ~10 screens |

### Existing Hooks (keep as-is)
- `useTasks()` — GET /tasks
- `useBookings()` — GET /bookings/mine
- `useProfile()` — GET /users/me
- `useAuth()` — POST /auth/facebook
- `useCategories()` — GET /categories

### New Hooks (from API wiring spec)
- `useApplications(taskId)` — GET /tasks/{taskId}/applications
- `useCreateTask()` — POST /tasks
- `useAcceptApplication()` — POST acceptance
- `useCompleteBooking()` — PUT /bookings/{id}/complete
- `useCancelBooking()` — PUT /bookings/{id}/cancel
- `useBookingDetail(bookingId)` — GET /bookings/{id}
- `useSubmitReview()` — POST /bookings/{id}/reviews
- `useReschedule()` — POST /bookings/{id}/reschedule
- `useTaskerProfile(userId)` — GET /users/{userId}

### Additional Hooks (new for expanded screens)
- `useConversations()` — GET /conversations
- `useMessages(conversationId)` — GET /conversations/{id}/messages
- `useSendMessage()` — POST /conversations/{id}/messages
- `useNotifications()` — GET /notifications (hook-ready, endpoint Phase 2)
- `useVerificationSubmit()` — POST /verification/submit
- `useVerificationStatus()` — GET /verification/status
- `useNoShowFlag()` — POST /bookings/{id}/no-show
- `useDisputeCreate()` — POST /disputes
- `useDisputeDetail(disputeId)` — GET /disputes/{id}
- `useUpdateProfile()` — PUT /users/me
- `useDeleteAccount()` — DELETE /users/me
- `useUserStats()` — GET /users/me/stats

### Pattern Rules
1. Every query hook returns `{ data, isLoading, isError, refetch }` — screens must handle all four
2. Every mutation hook returns `{ mutateAsync, isPending }` — buttons show loading during `isPending`
3. Idempotency keys via `crypto.randomUUID()` for POST/PUT mutations
4. Optimistic updates for complete/cancel booking
5. Cache invalidation follows dependency map in API wiring spec
6. Auth token always from `useAuthStore.getState().accessToken`

---

## 6. Testing & Quality Gates

### Per-Agent Quality Contract

Every agent must pass before returning:
1. **TypeScript** — `pnpm --filter @tasky/mobile typecheck` zero errors
2. **Lint** — `pnpm --filter @tasky/mobile lint` passes
3. **States coverage** — every screen handles all states listed in its YAML spec
4. **Localization** — every user-visible string uses `t()` with both `mn` and `en` keys
5. **Token compliance** — no hardcoded colors, font sizes, or spacing — all from design tokens
6. **Route registration** — every new screen has a corresponding Expo Router file

### Per-Session Gates

| Session | Gate | Verification |
|---------|------|-------------|
| 1 | App compiles, role switching toggles tabs, templates render | Manual + typecheck |
| 2 | Auth → Onboarding → Home works, Browse shows feed, error screens render | Typecheck + route audit |
| 3 | Task posting completes, verification flow works, chat renders | Typecheck + hook integration |
| 4 | Full booking lifecycle navigable, profile editable | Typecheck + navigation walk |
| 5 | All 65 screens compile, all routes registered, zero TS errors, lint clean | Full suite |

### Integration Review Agent (Session 5)
- Visual audit — spacing, tokens, typography consistency across batches
- Navigation audit — walk every journey from journey-catalog.yaml
- Import audit — no circular dependencies, canonical import paths
- Copy audit — no colliding translation keys, no untranslated strings

### Out of Scope for This Pipeline
- Visual pixel-fidelity (no Figma reference to compare)
- E2E on device (needs running backend + simulator)
- Performance profiling (FlatList optimization, bundle size)
- Full accessibility audit (basic a11y labels included, no VoiceOver/TalkBack testing)

---

## 7. Agent Context Package

Each screen-building agent receives this context:

1. **Foundation layer** — all template components, shared components, design tokens, animation presets (from Session 1)
2. **Screen spec YAMLs** — the specific `screen-specs/SCR-*.yaml` files for its batch
3. **Component contract** — `component-contract.yaml` (canonical components, variants, rules)
4. **Design system** — `design-system-additions.yaml` + `BRAND.md` v2.0
5. **API wiring spec** — relevant hooks and endpoint contracts
6. **Journey catalog** — the journeys that traverse its screens (for navigation correctness)
7. **Screen graph** — `screen-graph.yaml` (navigation adjacency, transition types, guards)
8. **State matrix** — `state-matrix.yaml` (cross-cutting state coverage for validation)
9. **Localization files** — `en/translation.json` and `mn/translation.json`

---

## 8. Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Visual drift between agents | Medium | Foundation templates + token compliance check |
| Merge conflicts across worktrees | Medium | Agents work in separate route directories; integration agent resolves |
| Backend endpoints missing | High for some | Hook-ready tier — typed hooks that work when endpoints arrive |
| Agent exceeds context window | Low | Each batch is 4-8 screens, well within limits |
| SecurityConfig gutted by subagent | Known risk | Verify SecurityConfig.java unchanged after each session (per memory) |
| Session gate partial failure | Medium | If a batch fails its gate, other batches in the same session may proceed if they have no dependency on the failing batch. The failing batch enters a fix-and-retry cycle before the next session starts. |

---

## 9. Success Criteria

The pipeline is complete when:
- [ ] 65 Phase 0-1 screens exist as Expo Router routes
- [ ] Role switching between Customer and Tasker works
- [ ] All screens handle their specified states (loading, error, empty, populated, offline)
- [ ] All user-visible text uses i18next with mn and en keys
- [ ] Zero TypeScript errors, zero lint errors
- [ ] Navigation matches journey-catalog.yaml — no dead ends
- [ ] All API hooks typed and connected (fully wired or hook-ready)
- [ ] Design tokens used exclusively — no hardcoded visual values
