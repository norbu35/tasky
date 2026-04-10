# Mobile UI Polish — Design Spec

**Date:** 2026-04-11
**Status:** Draft
**Scope:** Fix visual quality across all mobile screens — spacing, typography, navigation, platform parity
**Builds on:** NativeWind v4 architectural decisions (2026-04-08, 6 decisions locked)

---

## 1. Problem Statement

The mobile app has a solid design token system (`@tasky/design-tokens`) and layout infrastructure (`screenLayout.ts`, templates, shells), but the screens themselves are visually inconsistent:

- **Spacing:** Task cards use `gap-micro` (4px) for all inner gaps. The design system says `itemGap` (12px) for related items and `micro` (4px) only for icon-to-label. Cards look like compressed blobs.
- **Typography:** Hardcoded sizes (`text-[20px]`), redundant weight declarations (`font-screen-card-title font-bold` — the class already sets 700), and two parallel typography systems (Tailwind plugin vs. runtime `screenTypography` object).
- **Styling architecture:** 948 inline `style={}` instances across 116/152 files for properties that have Tailwind equivalents (padding, backgroundColor, gap, borderRadius). This defeats centralized control — changing a token doesn't propagate.
- **Navigation:** User reports double back buttons and orphaned screens. Code-only audit found all screens technically reachable, but Expo Router nested stacks can produce runtime behavior (double headers, missing gestures) that code analysis misses. Requires runtime visual verification.
- **Platform drift:** Tab bar visual weight differs between iOS (BlurView) and Android (solid). FAB uses stale `Dimensions.get('window')`. Shadow/elevation parity untested.
- **Component duplication:** No canonical list-row component. TaskCard in `tasks/index.tsx`, booking rows, profile action rows, and TaskFeed cards are all hand-rolled with different spacing, alignment, and press feedback.

**Root cause:** NativeWind v4 is half-installed. `tailwind.config.ts`, `global.css`, and `nativewind-env.d.ts` exist, and some components use `className`, but the majority of styling is still inline `style={}`. This means the design tokens exist but most screens bypass them.

---

## 2. Prior Decisions Carried Forward

Six architectural decisions from the 2026-04-08 brainstorm are confirmed and incorporated:

| # | Decision | Implication for this spec |
|---|----------|--------------------------|
| 1 | **Commit fully to NativeWind v4.** Animated partials (Reanimated) stay as `style={}` alongside `className=`. | All token-backed properties (color, spacing, radius, typography) must use Tailwind classes. Inline `style={}` only for dynamic/computed values and Reanimated. |
| 2 | **Risk-tiered full sweep.** | Phase 2 migrates ~20 high-impact screens. Phase 4 covers the remaining ~55. |
| 3 | **Code is the floor.** Preserve current visuals by default; reconcile against Figma for the 14 parity rows + visible drift. | We fix what's broken, not redesign. Figma file key: `IljfnTQPkq7vpkmK1NN1NC`. |
| 4 | **Figma access via MCP tools.** | Can fetch node specs during migration for pixel-accurate reconciliation. |
| 5 | **Verification: RTL + lint + TypeScript in CI. Maestro screenshot gate locally.** | Tests are currently broken (100 files, not running). Verification is visual (Maestro) + lint until tests are restored. |
| 6 | **Fully autonomous LLM batches for screen migration.** | Phase 2 screens can be dispatched as parallel worktree agents. |

---

## 3. Scope

### In Scope

- Fix all visually broken screens (spacing, typography, alignment)
- Establish canonical reusable components (ListItemCard, ActionRow)
- Eliminate dual typography system (keep Tailwind plugin only)
- Migrate top ~20 screens from inline styles to NativeWind classes
- Runtime navigation audit — run app, verify every flow, fix double headers and orphaned screens
- Platform parity audit (iOS + Android) for critical flows
- Install lint rules to prevent regression

### Out of Scope

- Full migration of all 116 files (Phase 4 / backlog)
- Test suite restoration (separate initiative)
- Feature changes or new screens
- Design system token changes (tokens are correct; the problem is adoption)
- B2B stub screens (no real UI to polish)
- Web app (`apps/web`)

---

## 4. Architecture

### 4.1 Styling Policy

**Rule: NativeWind for all token-backed properties. Inline `style={}` only for:**
1. Reanimated animated values (`useAnimatedStyle`)
2. Values computed at runtime from props/state (e.g., `paddingBottom: insets.bottom + constant`)
3. Platform-conditional values that can't use Tailwind's `ios:` / `android:` prefixes
4. Values from `elevations.ts` (shadow spreads — no Tailwind equivalent for native shadows)

Everything else — padding, margin, gap, backgroundColor, borderRadius, fontSize, fontWeight, fontFamily, flex properties, width/height from tokens — uses `className`.

### 4.2 Kill the Dual Typography System

**Remove:** `screenTypography` object from `screenLayout.ts` (lines 66-87). This is a runtime JS object that duplicates what the Tailwind plugin already provides.

**Keep:** `screenTypographyPlugin` in `tailwind-screen-typography.ts`. This is the single source of truth for screen-level typography:
- `.font-screen-greeting` — caption size, SemiBold, uppercase, tracking
- `.font-screen-title` — heroTitle size, Manrope Bold
- `.font-screen-section` — heading size, Manrope Bold
- `.font-screen-card-title` — body size, PlusJakartaSans Bold

**Extend** the plugin with two additional utilities:
- `.font-screen-subtitle` — subtitle size (18px), PlusJakartaSans SemiBold, for secondary titles
- `.font-screen-label` — label size (14px), PlusJakartaSans Medium, for form labels and metadata

All screens must use these classes. No inline `fontSize` or `fontWeight` for token-backed values.

### 4.3 New Canonical Components

#### `ListItemCard`

A single reusable card component for all list rows (tasks, bookings, jobs, applicants). Replaces hand-rolled cards in 8+ screens.

```
Props:
  icon?: ReactNode          — Left slot (icon box, avatar, etc.)
  iconSize?: 'sm' | 'md'   — sm: 44x44, md: 48x48 (default: md)
  title: string             — Primary text (numberOfLines={2})
  subtitle?: string         — Secondary text (numberOfLines={1})
  badge?: ReactNode         — Top-right badge (StatusBadge, category chip)
  trailing?: ReactNode      — Right slot (price, chevron, etc.)
  onPress: () => void
  testID?: string

Layout:
  ┌─ Card (p-lg rounded-lg bg-card elevation-soft) ──────────┐
  │  ┌────────┐  ┌─ Content (flex-1 gap-sm) ───────────────┐ │
  │  │  icon  │  │ badge (self-start)                       │ │
  │  │ 48x48  │  │ title (font-screen-card-title)           │ │
  │  │        │  │ subtitle (text-caption text-text-secondary)│ │
  │  └────────┘  └──────────────────────────────────────────┘ │
  │  gap-md                              trailing (self-center)│
  └───────────────────────────────────────────────────────────┘
```

Spacing: card padding `p-lg` (16px), icon-to-content gap `gap-md` (12px), inner content gap `gap-sm` (8px). These match the design system's intent: `lg` for card padding, `md` for item spacing, `sm` for tightly related text.

#### `ActionRow`

A single reusable row for settings/profile action lists. Replaces hand-rolled rows in profile, settings, and help screens.

```
Props:
  icon: ReactNode           — Left icon in circle
  label: string             — Row text
  onPress: () => void
  showDivider?: boolean     — Bottom border (default: true)
  trailing?: ReactNode      — Right slot (default: ChevronRight)
  testID?: string

Layout:
  ┌─ Pressable (flex-row items-center p-md) ──────────────────┐
  │  ┌──────┐  label (flex-1 text-body font-sans-medium)  ▸  │
  │  │ icon │  gap-md                                  trailing│
  │  └──────┘                                                  │
  └────────────────────────────────────────────────────────────┘
```

### 4.4 Navigation Fixes

**Runtime audit protocol:**
1. Run the app on iOS Simulator + Android Emulator
2. Navigate to every screen in every role (customer + tasker)
3. For each screen, verify:
   - Back button exists (or screen is intentionally terminal)
   - No double back buttons (nested Stack headers)
   - Header title matches i18n key
   - Safe area padding is correct (no content under status bar or notch)
4. Document findings with screenshots
5. Fix all issues found

**Known patterns that can cause double headers in Expo Router:**
- A screen inside a group that has `defaultStackScreenOptions` (header shown) ALSO inside another group that renders a header → two Stack headers
- A screen that uses `DetailTemplate` with `headerTitle` prop AND has a native Stack header → visual duplication (even though DetailTemplate ignores the prop now)

**Remediation strategy:**
- Tab screens: no stack header (tab layout sets `headerShown: false`). Templates handle their own top padding.
- Stack screens inside groups: native Stack header provides back + title. Templates do NOT add top padding or their own back button. `DetailTemplate`'s deprecated `headerTitle` and `onBack` props must be removed from all call sites.
- Modal screens: `presentation: 'modal'` provides dismiss gesture + close button. No additional close buttons unless explicitly needed.

### 4.5 Platform Parity

| Area | iOS current | Android current | Target |
|------|-------------|-----------------|--------|
| Tab bar | BlurView, frosted glass | Solid `colors.card`, elevation 8 | Keep divergent — platform-idiomatic. Ensure shadow opacity matches visual weight. |
| FAB | `Dimensions.get('window')` | Same | Switch to `useWindowDimensions()` hook for both. Handles rotation and multi-window. |
| Shadows | Native shadow properties | `elevation` property | Keep platform-native. Audit that `elevations.ts` presets produce similar visual weight. |
| Keyboard | KeyboardAvoidingView `behavior="padding"` | `behavior="height"` | Verify per-template. `FormWizardTemplate` and `AuthTemplate` should already handle this. |
| Status bar | Light content on dark headers | Same | Verify `StatusBar style="auto"` works correctly with both light and dark header backgrounds. |

---

## 5. Phased Execution

### Phase 1 — Foundation (prerequisite for all other phases)

**Goal:** Establish the canonical components, kill dual systems, install lint guardrails. No screen migration yet.

**Deliverables:**
1. Remove `screenTypography` export from `screenLayout.ts`. Add `.font-screen-subtitle` and `.font-screen-label` to the Tailwind plugin. Update `cn.ts` class groups.
2. Build `ListItemCard` component in `src/components/ui/`. Wire into component barrel export.
3. Build `ActionRow` component in `src/components/ui/`. Wire into component barrel export.
4. Remove deprecated `headerTitle` and `onBack` props from `DetailTemplate` interface. Remove the suppressed eslint-disable lines. Update all call sites to stop passing these props.
5. Install ESLint rules (or a custom rule via `eslint-plugin-local-rules`):
   - Ban `StyleSheet.create` in `src/app/**` (screens should use NativeWind)
   - Ban literal hex colors in `className` and `style` (must use token names)
   - Ban `style={{ fontSize:` outside `src/design/**` (must use typography classes)
6. Run the runtime navigation audit. Document and fix all findings.

**Gate:** All lint rules pass on existing code (may require targeted fixes or temporary `eslint-disable` on files scheduled for Phase 2). Navigation audit complete with no blocking issues.

### Phase 2 — High-Impact Screen Migration (~20 screens)

**Goal:** Fix the screens users interact with most. These are the screens where visual quality issues are most visible.

**Target screens (priority order):**

| # | Screen | Key issues | Est. complexity |
|---|--------|-----------|-----------------|
| 1 | `(customer)/tasks/index.tsx` | Card spacing, icon sizing, inline styles, custom FlatList should use FeedListTemplate | High (mega-screen, ~380 lines) |
| 2 | `(tabs)/index.tsx` | Tab home — whatever template it uses, ensure consistency | Medium |
| 3 | `(tabs)/profile.tsx` | Hardcoded `text-[20px]`, deprecated `headerTitle`, action rows → ActionRow | Medium |
| 4 | `(customer)/tasks/new/category.tsx` | Card grid spacing, inline styles | Medium |
| 5 | `(customer)/tasks/new/location.tsx` | Form layout spacing | Medium |
| 6 | `(customer)/tasks/new/review.tsx` | Mega-screen (~600 lines), inline styles throughout | High |
| 7 | `(customer)/tasks/new/intake.tsx` | Form fields spacing | Medium |
| 8 | `(customer)/tasks/new/schedule.tsx` | Date picker layout | Medium |
| 9 | `(customer)/tasks/new/photos.tsx` | Photo grid spacing | Low |
| 10 | `(customer)/tasks/new/success.tsx` | Success layout | Low |
| 11 | `(customer)/bookings/index.tsx` | Mega-screen (~586 lines), list layout | High |
| 12 | `(customer)/bookings/[bookingId]/index.tsx` | Detail layout, inline styles | Medium |
| 13 | `(customer)/bookings/confirmed.tsx` | Success layout | Low |
| 14 | `(tabs)/bookings.tsx` | List template usage | Low |
| 15 | `(tasker)/tasks/[taskId].tsx` | Detail layout | Medium |
| 16 | `(tasker)/jobs/index.tsx` | List layout | Medium |
| 17 | `(tasker)/jobs/[bookingId]/index.tsx` | Detail layout | Medium |
| 18 | `(shared)/profile/settings.tsx` | Settings rows → ActionRow | Low |
| 19 | `(shared)/notifications.tsx` | List layout | Low |
| 20 | `(auth)/index.tsx` | Login form layout, inline styles | Medium |

**Per-screen migration checklist:**
1. Replace all inline `style={}` for token-backed properties with NativeWind classes
2. Replace hand-rolled list cards with `ListItemCard` where applicable
3. Replace hand-rolled action rows with `ActionRow` where applicable
4. Replace custom FlatList with `FeedListTemplate` where applicable
5. Replace hardcoded font sizes with typography classes
6. Remove redundant weight/family declarations
7. Ensure proper spacing using design token gap/padding classes
8. Verify iOS + Android visual output (Maestro screenshot or manual)

**Gate:** All 20 screens visually verified on both platforms. New lint rules pass without `eslint-disable` on migrated files.

### Phase 3 — Platform Polish

**Goal:** Cross-platform visual parity for all Phase 2 screens.

**Deliverables:**
1. FAB: Replace `Dimensions.get('window')` with `useWindowDimensions()`. Test Android multi-window and rotation.
2. Tab bar: Audit Android shadow to match iOS BlurView visual weight. Adjust `elevation` or add subtle border if needed.
3. Shadow audit: Run all card/elevated/navBar shadows on both platforms. Adjust `elevations.ts` if visual weight diverges.
4. Keyboard audit: Verify `KeyboardAvoidingView` behavior in `FormWizardTemplate`, `AuthTemplate`, and any screen with text inputs. Fix platform-specific behavior.
5. Status bar: Verify `StatusBar style="auto"` produces correct contrast on all header backgrounds.

**Gate:** Visual parity confirmed on iPhone 17 Pro Simulator and Pixel 8 emulator for all Phase 2 screens.

### Phase 4 — Long-Tail Migration (backlog, ~55 remaining screens)

**Goal:** Complete the NativeWind migration for all remaining screens.

**Execution:** Autonomous LLM batches (per Decision 6), risk-tiered:
- Wave 1: Small screens (<200 lines) — ~30 screens
- Wave 2: Medium screens (200-500 lines) — ~15 screens
- Wave 3: Mega-screens (>500 lines) — ~6 screens (disputes, reschedule, help, etc.)
- Wave 4: B2B stubs — ~7 screens (minimal, just ensure consistent template usage)

**Gate:** All lint rules pass across entire `src/app/` without any `eslint-disable`. All screens visually verified.

---

## 6. Verification Strategy

**Primary verification: Visual (Maestro + manual).** Tests are currently non-functional (100 test files, 0 passing). Restoring tests is a separate initiative.

**Per-phase verification:**
- Phase 1: Lint rules pass. Runtime navigation audit documented.
- Phase 2: iOS + Android screenshots for each migrated screen. Maestro flows for critical journeys (task creation, booking, login).
- Phase 3: Side-by-side iOS/Android comparison screenshots for all Phase 2 screens.
- Phase 4: Lint clean. Maestro smoke pass.

**Regression prevention:**
- ESLint rules (installed in Phase 1) enforce NativeWind usage for new code
- `tailwind.config.ts` is the single token gateway — changes propagate to all screens using classes
- `screenLayout.ts` remains the authoritative layout constants file — but consumed via Tailwind spacing keys, not direct import for static values

---

## 7. Non-Goals

- **Redesign.** We are not changing the design language. We're enforcing the existing design system.
- **Restore tests.** Tests need their own initiative. This spec uses visual verification.
- **Animation overhaul.** Reanimated animations stay as inline `style={}` (per Decision 1). We don't touch them.
- **New features.** No new screens, no new flows, no new components beyond `ListItemCard` and `ActionRow`.
- **Token changes.** The design token values are correct. The problem is adoption, not definition.

---

## 8. Success Criteria

After Phase 3 (the "done enough to ship" milestone):

1. **Task list screen** renders with proper card spacing (12px inner content gap, 16px card padding, 16px between cards), correctly sized icon (48x48), and readable typography.
2. **No screen** has double back buttons or missing exit paths (verified by runtime audit).
3. **All 20 Phase 2 screens** use NativeWind classes for all token-backed properties. Zero inline `style={}` for colors, spacing, radius, or typography.
4. **Typography** uses exactly one system (Tailwind plugin). `screenTypography` runtime object is deleted.
5. **iOS and Android** render Phase 2 screens with equivalent visual weight (tab bar, shadows, spacing).
6. **ESLint rules** are installed and passing. New code cannot introduce inline styling for token-backed properties.
7. **FAB** responds correctly to screen dimension changes (rotation, multi-window on Android).
