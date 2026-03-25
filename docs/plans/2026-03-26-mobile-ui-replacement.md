# Mobile UI Replacement — Stitch-to-Code Implementation Plan

> **For Codex:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Replace and patch the current mobile application screens to match the 81 Stitch design screens, using the design docs as source of truth, in a phased vertical-slice approach.

**Architecture:** The app is an Expo Router (React Native) project at `apps/mobile/` with an established design system (`packages/design-tokens`), 31 UI primitives, 9 screen templates, and i18n. Most route files exist but render minimal skeletons. The work is **visual uplift** — replacing skeleton screens with Stitch-quality implementations by enhancing templates, primitives, and screen-level composition. The Stitch project (ID: `15920227283524999360`) provides the visual reference for each screen.

**Tech Stack:** React Native (Expo), TypeScript, Expo Router, `@tasky/design-tokens`, `react-i18next`, Reanimated

---

## Approach: How to Use the Design Docs

The design documentation forms a 4-layer reference stack:

| Layer                  | File(s)                               | Use During Implementation                                        |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| **Visual reference**   | Stitch project screens                | Primary pixel-level reference for layout, spacing, visual weight |
| **Screen spec**        | `docs/design/screen-specs/SCR-*.yaml` | States, acceptance criteria, component IDs, copy, API bindings   |
| **Component contract** | `docs/design/component-contract.yaml` | Variant rules, composition rules, forbidden patterns             |
| **Design tokens**      | `packages/design-tokens/tokens.ts`    | Colors, spacing, typography, radius, shadows — already in code   |

**Workflow per screen:**

1. Open Stitch screen for visual reference
2. Read `screen-specs/SCR-*.yaml` for states and acceptance criteria
3. Check `component-contract.yaml` for any composition rules that apply
4. Implement using existing templates and primitives (enhancing them when needed)

---

## Phase Gate

Per `docs/design/evaluation-report.md`:

- **Phase 0-1 (65 screens):** Implementation-ready — APIs exist, designs exist
- **Phase 2 (10 screens):** Design-ready but some APIs are forward-reference only
- **Phase 3 (6 screens):** Design-ready but APIs are feature-gated

This plan covers **Phase 0-1 (65 screens)** fully. Phase 2/3 screens are included as tasks but marked with API dependency gates.

---

## Pre-Implementation: Foundation Tasks

### Task 0: Token & Template Audit

**Goal:** Ensure the design token system and templates match the Stitch design language before touching individual screens.

**Files:**

- Audit: `packages/design-tokens/tokens.ts`
- Audit: `apps/mobile/src/design/tokenAdapter.ts`
- Audit: `apps/mobile/src/components/templates/*.tsx` (all 9)
- Reference: `docs/design/prompts/global-context.yaml`
- Reference: `docs/design/component-contract.yaml`

**Steps:**

1. **Compare token values.** Open `global-context.yaml` and `tokens.ts` side by side. Verify every color hex, spacing value, radius, and typography size matches. Document any drift.

2. **Verify template structure.** For each of the 9 templates, check that the layout structure (SafeArea → ScrollView → Content → StickyFooter) matches the `component-contract.yaml` template specifications. Key templates:
   - `AuthTemplate` — centered content, no nav bar
   - `DetailTemplate` — scrollable with sticky bottom CTA
   - `FeedListTemplate` — FlatList with filter bar + empty state
   - `FormWizardTemplate` — step indicator + form content + CTA
   - `ModalSheetTemplate` — bottom sheet with handle + scrim
   - `SuccessCelebrationTemplate` — centered icon + confetti + CTA
   - `EmptyStateTemplate` — centered illustration + text + CTA
   - `ErrorStateTemplate` — centered error icon + reason + retry
   - `SettingsTemplate` — grouped list sections

3. **Fix any token/template drift.** Update tokens or templates where they don't match Stitch.

4. **Verify Mongolian font rendering.** Ensure Manrope and Plus Jakarta Sans are loaded in `app.json` and render Cyrillic correctly.

5. **Commit:** `chore(design): align tokens and templates with Stitch designs`

---

## Implementation Order

Screens are grouped by **vertical slice** (matching the generation order), not by component. Each slice ships a coherent user flow.

### Slice 1: Auth & Onboarding (SCR-SHARED-001 → 009) — 9 screens

#### Task 1: Splash & Login (SCR-SHARED-001, 002)

**Files:**

- Modify: `apps/mobile/src/app/(auth)/index.tsx` (splash)
- Modify: `apps/mobile/src/app/(auth)/index.tsx` (login — may be same file)
- Spec: `docs/design/screen-specs/SCR-SHARED-001.yaml`, `SCR-SHARED-002.yaml`
- Stitch: "Tasky Splash Screen", "Auth — Login"

**Steps:**

1. Read screen spec for accepted states
2. Open Stitch screen for layout reference
3. Implement splash with animated logo, loading spinner, Tasky branding per Stitch
4. Implement login with Facebook OAuth button, deep blue (#1B3A5C) background gradient, Mongolian copy
5. Test: both states render, Facebook button triggers auth flow
6. Commit: `feat(auth): implement splash and login screens per Stitch design`

#### Task 2: OTP Screens (SCR-SHARED-003, 004) — Phase 2

**Files:**

- Create or modify: OTP verification and migration gate screens
- i18n keys in `src/locales/mn.json`

**Note:** Phase 2 API dependency. Implement UI shell with mock data.

#### Task 3: Onboarding (SCR-SHARED-005, 006)

**Files:**

- Modify: `apps/mobile/src/app/(auth)/role-select.tsx`
- Stitch: "Onboarding Carousel — Slide 1", "Role Selection"

**Steps:**

1. Implement 3-slide carousel with Reanimated page transitions
2. Implement role selection with customer/tasker cards per Stitch design
3. Commit

#### Task 4: Permission Primers (SCR-SHARED-007, 008, 009)

**Files:**

- Modify: `apps/mobile/src/app/(auth)/permission-camera.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-location.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- Template: `PermissionPrimer` component already exists

**Steps:**

1. Read Stitch screens for each permission primer
2. Update PermissionPrimer composition to match Stitch illustrations and copy
3. Commit

---

### Slice 2: Profile & Inbox (SCR-SHARED-010 → 016) — 7 screens

#### Task 5: Inbox (SCR-SHARED-010, 011)

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- Stitch: "Inbox — Conversation List", "Inbox — Chat Detail"

#### Task 6: Profile & Settings (SCR-SHARED-012, 013, 014, 015)

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/profile.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/edit.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/settings.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/delete.tsx`

#### Task 7: Notifications (SCR-SHARED-016)

**Files:**

- Modify: `apps/mobile/src/app/(shared)/notifications.tsx`

---

### Slice 3: Review & Account Status (SCR-SHARED-017 → 021) — 5 screens

#### Task 8: Review Flow (SCR-SHARED-017, 018, 019)

**Files:**

- Modify: `apps/mobile/src/app/(shared)/review/[bookingId].tsx`
- Stitch: "Review Form", "Review Reminder Bottom Sheet", "Review Hard Lock"

#### Task 9: Account Status (SCR-SHARED-020, 021)

**Files:**

- Modify: `apps/mobile/src/app/(shared)/account/suspended.tsx`
- Modify: `apps/mobile/src/app/(shared)/account/banned.tsx`

---

### Slice 4: Infrastructure (SCR-INFRA-001 → 005) — 5 screens

#### Task 10: System Screens

**Files:**

- Modify: `apps/mobile/src/app/(shared)/network-error.tsx`
- Modify: `apps/mobile/src/app/(shared)/app-update.tsx`
- Modify: `apps/mobile/src/app/(shared)/session-expired.tsx`
- Modify: `apps/mobile/src/app/(shared)/legal/terms.tsx`
- Modify: `apps/mobile/src/app/(shared)/help.tsx`

---

### Slice 5: Customer — Task Posting (SCR-CUST-001 → 008) — 8 screens

#### Task 11: Task List (SCR-CUST-001)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/tasks.tsx` (tab entry)
- Stitch: "My Tasks — Task List"

#### Task 12: Post Task Flow (SCR-CUST-002 → 007)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Stitch: "Post Task — Category Selection" through "Post Task — Review & Submit"

#### Task 13: Post Success (SCR-CUST-008)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/new/success.tsx`
- Stitch: "Task Posted — Success"

---

### Slice 6: Customer — Task Management (SCR-CUST-009 → 015) — 7 screens

#### Task 14: Task Detail & Cancellation (SCR-CUST-009, 010)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`

#### Task 15: Applicants & Booking (SCR-CUST-011 → 015)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- Modify: `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`

---

### Slice 7: Customer — Bookings & Disputes (SCR-CUST-016 → 027) — 12 screens

#### Task 16: Booking List & Detail (SCR-CUST-016, 017)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/bookings/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`

#### Task 17: Booking Actions (SCR-CUST-018 → 023)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/rebook.tsx`

#### Task 18: Disputes & Rescue (SCR-CUST-024 → 027)

**Files:**

- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- Modify: `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`
- Stitch: "Dispute — Raise", "Dispute — Status", "No Applicant Rescue", "Instant Match — Customer"

---

### Slice 8: Tasker — Browse & Verify (SCR-TASK-001 → 011) — 11 screens

#### Task 19: Browse & Task Detail (SCR-TASK-001, 002)

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/index.tsx` (tasker home / browse)
- Stitch: "Browse — Task Feed", "Task Detail (Tasker View)"

#### Task 20: Verification Flow (SCR-TASK-003 → 010) — 8 screens

**Files:**

- Modify: `apps/mobile/src/app/(tasker)/verification/consent.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/upload.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/pending.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/approved.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/rejected.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/submitted.tsx`
- Create: `apps/mobile/src/app/(tasker)/verification/index.tsx` (gate screen)
- Create: `apps/mobile/src/app/(tasker)/verification/dan.tsx` (Phase 2 DAN fast-path)
- Stitch: "Verification Gate" through "Verification Submitted — Success" + "DAN Fast-Path"

**This is the critical slice identified in the gap review. The 8 verification screens need the most work.**

#### Task 21: Application Sent (SCR-TASK-011)

Use `SuccessCelebrationTemplate`.

---

### Slice 9: Tasker — Jobs & Management (SCR-TASK-012 → 018) — 7 screens

#### Task 22: My Jobs & Booking Detail (SCR-TASK-012, 013)

**Files:**

- Modify: `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`

#### Task 23: No-Show, Cancel, Stats (SCR-TASK-014, 015, 016)

**Files:**

- Modify: `apps/mobile/src/app/(tasker)/stats.tsx`
- Create: No-show modal sheet component
- Stitch: "No-Show Flag (Tasker)", "Booking Cancel (Tasker)", "Tasker Stats Dashboard"

#### Task 24: Lead Unlock & Privacy (SCR-TASK-017, 018) — Phase 2

**Files:**

- Create: Lead unlock modal
- Modify: `apps/mobile/src/app/(shared)/legal/privacy.tsx`
- **Note:** Lead unlock is Phase 2 API-gated.

---

### Slice 10: Phase 2 Screens (SCR-P2-001 → 005) — 5 screens

#### Task 25: Credits & Referral

**Files:** Create credit balance, QPay payment, transaction history, low balance alert, and referral screens.
**Note:** All Phase 2 API-gated. Implement UI shells.

---

### Slice 11: Phase 3 Screens (SCR-P3-001 → 005) — 5 screens

#### Task 26: Wallet, Escrow, Subscription, Instant Match

**Files:** Create wallet, payout, escrow, subscription, and tasker instant-match screens.
**Note:** All Phase 3 API-gated. Implement UI shells.

---

## Verification Plan

### Per-Screen Verification

1. Compare rendered screen vs Stitch screenshot — layout, spacing, color, typography
2. Verify all states from `screen-specs/SCR-*.yaml` render correctly
3. Verify Mongolian (Cyrillic) copy renders without overflow or clipping
4. Verify template usage matches `component-contract.yaml` rules
5. Run `TID-*` tests per ARCHITECTURE.md §7.5

### Cross-Flow Verification

1. Walk through each journey from `docs/design/journey-catalog.yaml`
2. Verify navigation transitions match `screen-graph.yaml` edges
3. Test offline/error states per `state-matrix.yaml`

### Automated Tests

- `cd apps/mobile && npx jest --coverage` — component tests
- Maestro E2E flows in `apps/mobile/maestro/`

### Manual Verification

- Side-by-side Stitch screenshot comparison for each completed slice
- Device testing on iOS and Android simulators

---

## Execution Notes

- **Commit granularity:** One commit per task (1-2 screens)
- **Branch:** `agent/mobile-ui-replacement`
- **Review gate:** After each slice, review before proceeding to next
- **Dependencies:** Slices 1-9 have no external API dependencies. Slices 10-11 require Phase 2/3 APIs
- **Estimated LOC per screen:** 50-150 lines (template-driven composition)
- **Total estimated effort:** ~26 tasks across 11 slices
