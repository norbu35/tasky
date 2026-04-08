# Mobile UI Centralization — Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Scope:** `apps/mobile/` — 85 screen files needing migration + 16 trivial auto-pass files, 34 primitives (33 existing + 1 new `Touchable`), 9 templates, 3 shells

## Problem

The mobile app has a design system (tokens, primitives, templates, shells, screenLayout) but screens bypass it. 144 of 177 `.tsx` files define `StyleSheet.create` inline. 73 screen files in `src/app/` redeclare patterns that existing primitives already provide. NativeWind v4 is half-installed (config files present, zero screen adoption). A `screenRhythm → screenLayout` rename is in-flight. A parity audit (`docs/design/parity-post-restructure-2026-04-04.md`) lists 15 routes as `pending` validation against Figma.

The failure mode is not "no design system" — it is "LLMs bypassed the design system because `StyleSheet.create` is easier to generate than learning the primitive API."

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Styling foundation | NativeWind v4 | LLMs produce Tailwind reliably; co-location; reviewable diffs; `cva` for variants |
| Scope | Full sweep, risk-tiered | Audit rows first, then small screens, then mega-screens |
| Source of truth | Code floor + Figma reconciliation | Preserve current visuals by default; reconcile to Figma for the 15 audit rows and sibling drift |
| Figma access | Programmatic via `figma:get_design_context` | File key `IljfnTQPkq7vpkmK1NN1NC` |
| Verification | RTL + lint + TS on CI; Maestro screenshots locally | No `jest-image-snapshot`; Maestro is local-only (not in CI) |
| Migration executor | Fully autonomous LLM batches | All screens including mega-screens; per-batch contract enforces behavior preservation |
| Approach | Foundation-first | No screen work until all primitives/templates are on NativeWind v4 |
| Dark mode | Not in scope | No dark mode today; if added later, `tailwind.config.ts` needs `darkMode: 'class'` and color tokens need dark variants. Explicitly deferred. |

## Phase 0 — NativeWind v4 Commitment

### Current state (already done)

NativeWind v4.2.3 is already installed. Babel config has `jsxImportSource: 'nativewind'`, Metro config has `withNativeWind`. `tailwind.config.ts` already imports `nativeTokens` from `@tasky/design-tokens` and maps colors, spacing, radius, fontFamily (partial), and fontSize.

### Work

1. **Resolve `screenTypography` vs `nativeTokens.typography.styles` conflict.** The token system defines `heroTitle` with `fontWeight: '700'` and `fontFamily: 'Manrope_700Bold'`. But `screenLayout.ts` overrides to `fontWeight: '900'` for `screenTitle`. These must be reconciled before the Tailwind plugin encodes either. Resolution: `nativeTokens.typography.styles` is the canonical base type system. `screenTypography` is a screen-level override layer for display emphasis. The Tailwind plugin uses `screenTypography` values and is namespaced `font-screen-*` to distinguish from potential base `font-*` utilities.

2. **Complete `fontFamily` mapping in `tailwind.config.ts`.** Currently only 2 of 6 families are registered. React Native requires a separate `fontFamily` for each weight (can't use `font-bold` to switch weights). Register all 6:
   ```ts
   fontFamily: {
     sans: ['PlusJakartaSans_400Regular'],
     'sans-medium': ['PlusJakartaSans_500Medium'],
     'sans-semibold': ['PlusJakartaSans_600SemiBold'],
     'sans-bold': ['PlusJakartaSans_700Bold'],
     display: ['Manrope_600SemiBold'],
     'display-bold': ['Manrope_700Bold'],
   },
   ```

3. **Register semantic theme extensions** (extending what's already mapped):

   | Token source | Tailwind key | Example utility |
   |---|---|---|
   | `nativeTokens.colors.*` | `colors.*` | `bg-primary`, `text-foreground` (already mapped) |
   | `nativeTokens.spacing.*` | `spacing.*` | `p-lg`, `gap-md` (already mapped) |
   | `screenLayout.insetX` | `spacing.screen-x` | `px-screen-x` |
   | `screenLayout.header.*` | `spacing.header-top`, `gap.header-greeting`, `gap.header-title`, `gap.header-bottom` | `pt-header-top`, `gap-header-bottom` |
   | `screenLayout.body.*` | `gap.section`, `gap.block`, `gap.item`, `gap.micro`, `p.card` | `gap-section`, `gap-item`, `p-card` |
   | `screenLayout.actions.*` | `p.action-bar`, `gap.action-buttons` | `p-action-bar` |
   | `screenLayout.chrome.*` | `h.tab-bar`, `size.fab` | `h-tab-bar`, `size-fab` |
   | `nativeTokens.radius.*` | `borderRadius.*` | `rounded-md`, `rounded-lg` (already mapped) |
   | `nativeTokens.typography.scale.*` | `fontSize.*` | `text-body`, `text-caption`, `text-heading` (already mapped) |

   **Shadows are NOT mapped to Tailwind.** See "Imperative style exceptions" below.

4. **Create `cssInterop` registration file** (`src/design/nativewind-interop.ts`). NativeWind v4 requires `cssInterop()` to enable `className` on third-party components. Without this, `<Animated.View className="...">` silently ignores the className. Register:
   - `Animated.View` → `{ className: 'style' }`
   - `Animated.Text` → `{ className: 'style' }`
   - `Animated.ScrollView` → `{ className: 'style', contentContainerClassName: 'contentContainerStyle' }`
   - Any other non-RN-core components that need `className`

   Import this file in the root layout (`src/app/_layout.tsx`) so registrations are executed at app boot.

5. **Create a small Tailwind plugin for `screenTypography` composite presets** (namespaced `font-screen-*`):
   - `font-screen-greeting` → `{ fontSize: caption, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.8, textTransform: uppercase }`
   - `font-screen-title` → `{ fontSize: heroTitle, fontFamily: 'Manrope_700Bold' }`
   - `font-screen-section` → `{ fontSize: heading, fontFamily: 'Manrope_700Bold', lineHeight: heading * 1.25 }`
   - `font-screen-card-title` → `{ fontSize: body, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: body * 1.35 }`

   Note: these use explicit `fontFamily` values, not `fontWeight`, because RN requires distinct font files per weight.

6. Delete dead `className`/`labelClassName` props on components that accept but don't use them (unless wired up in Phase 1).
7. Install dependencies: `cva` (class-variance-authority), `tailwind-merge`.
8. Create `cn()` utility (`src/lib/cn.ts`) with `extendTailwindMerge` for custom theme keys. Out-of-the-box `tailwind-merge` only recognizes standard Tailwind utilities — custom keys like `gap-section`, `font-sans-bold`, `px-screen-x` would not be deduplicated correctly:
   ```ts
   import { extendTailwindMerge } from 'tailwind-merge';

   const twMerge = extendTailwindMerge({
     extend: {
       classGroups: {
         'font-family': [{ font: ['sans', 'sans-medium', 'sans-semibold', 'sans-bold', 'display', 'display-bold'] }],
         gap: [{ gap: ['section', 'block', 'item', 'micro', 'action-buttons'] }],
         'p': [{ p: ['card', 'action-bar'] }],
         'px': [{ px: ['screen-x'] }],
         'pt': [{ pt: ['header-top'] }],
       },
     },
   });

   export const cn = (...inputs: (string | undefined | false)[]) => twMerge(inputs.filter(Boolean).join(' '));
   ```

### `screenLayout.ts` treatment

`screenLayout.ts` stays as a runtime file for computed getters (`fabBottom`, `contentBottomClearance` that use `this`). Static values are *also* exposed through Tailwind theme. Screens use Tailwind utilities; runtime-computed values are imported from `screenLayout.ts` directly (e.g., `FlatList contentContainerStyle`).

**Import strategy for `tailwind.config.ts`:** Import `screenLayout` directly in `tailwind.config.ts` and pick out the static fields. This works because the static fields (`insetX`, `header.topInset`, `body.sectionGap`, etc.) are just `spacing.*` references that resolve at import time. The computed getters (`fabBottom`, `contentBottomClearance`) are NOT registered in Tailwind — they remain runtime-only imports. Example:
```ts
import { screenLayout } from './src/design/screenLayout';
// In theme.extend.spacing:
'screen-x': screenLayout.insetX,
'header-top': screenLayout.header.topInset,
```

### `tokenAdapter.ts` treatment

`tokenAdapter.ts` stays as a runtime adapter for imperative token access (Reanimated spring configs, dynamic style computation). It does NOT become the primary styling path.

### Imperative style exceptions

Three categories of styles CANNOT be expressed as NativeWind `className` and stay as imperative `style={}`:

1. **Shadows.** Shadow tokens (`nativeTokens.shadows`) use RN-native format (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) with platform-specific logic in `elevations.ts`. NativeWind's `shadow-*` utilities map through CSS box-shadow, which produces different values and can't replicate `elevations.soft` (a hand-tuned preset not in the token system). Components use `style={elevations.card}` alongside `className`.

2. **Dynamic color opacity.** Screens construct colors with hex opacity suffixes: `${colors.primary}14` (~8% opacity), `${colors.primaryForeground}99` (~60% opacity). Found in ~10 occurrences across task visuals, notifications, reviews, and categories. These stay as `style={{ backgroundColor: '...' }}` or as color props to icon components (e.g., lucide-react-native `color` prop). For the ~4 common opacity levels used as `className`-compatible backgrounds, register Tailwind utilities: `bg-primary/5`, `bg-primary/10`, `bg-primary/15`, `bg-primary/60`.

3. **Animated styles.** Reanimated `useAnimatedStyle` values stay on `style={}`. Covered in Phase 1 animated partials section.

### Exit gate

- `tailwind.config.ts` resolves all tokens from `@tasky/design-tokens` with all 6 font families
- Semantic spacing/typography extensions resolve correctly
- `screenTypography` Tailwind plugin produces correct composite utilities with explicit fontFamily
- `cssInterop` registrations file created and imported in root layout
- `cva`, `tailwind-merge` installed
- `cn()` utility created
- `pnpm -r typecheck` passes
- App builds and boots on simulator
- `Animated.View` with `className` renders correctly (manual verification)

## Phase 1 — Foundation Freeze

### Scope

All 33 existing primitives (`src/components/ui/*`) + 1 new primitive (`Touchable`), 9 templates (`src/components/templates/*`), 3 shells (`src/components/shells/*`).

**New primitive: `Touchable`** (`src/components/ui/Touchable.tsx`). A thin wrapper around `Pressable` for non-button tap targets (list items, card areas, swipe zones). Re-exports `Pressable` with `testID` enforcement. Created in Phase 1 so it exists before Phase 2 lint Rule 3 activates. This brings the primitive count to 34.

### Rules

- Public API (props interface) does not change. No new required props, no removed props, no renamed props.
- Replace `StyleSheet.create` blocks with NativeWind `className` strings.
- Where a component accepts `style?: StyleProp<ViewStyle>`, it keeps that prop. Merge via NativeWind's `style` prop.
- Where a component accepts `className?: string`, it stays and is the primary extension point.
- Where a component does NOT accept `className`, add it as an optional prop (the one additive API change).
- Every component that accepts `className` must merge it using `cn()` (from `src/lib/cn.ts`) to resolve Tailwind utility conflicts. Without `tailwind-merge`, a screen passing `className="p-2"` to a component with `cva` class `px-lg py-sm` produces conflicting padding. Pattern: `<View className={cn(baseClasses, className)}>`.
- `testID` and `accessibilityRole` are never modified.
- All existing RTL tests must pass. Test adjustments for NativeWind style assertion changes are counted as migration work, not regressions.

### `cva` adoption

These 6 components get `cva`:

| Component | Reason |
|---|---|
| `Button` | 5 variants x 4 sizes |
| `Card` | Sub-component variants |
| `StatusBadge` | Status-driven colors |
| `CategoryChip` | Visual theming |
| `PressableCard` | Press state |
| `FilterBar` | Active/inactive states |

Pattern:
```tsx
import { cn } from '../../lib/cn';

const buttonVariants = cva("flex-row items-center justify-center rounded-md", {
  variants: {
    variant: {
      default: "bg-primary",          // shadow applied via style={elevations.card}
      secondary: "bg-secondary",
      outline: "bg-transparent border border-input",
      ghost: "bg-transparent",
      destructive: "bg-danger",
    },
    size: {
      default: "px-lg py-sm min-h-[48px]",
      sm: "px-md min-h-[36px]",
      lg: "px-xl min-h-[52px]",
      icon: "w-[36px] h-[36px] p-0",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

// Usage in component — cn() merges parent className without conflicts:
<Pressable
  style={[variant === 'default' && elevations.card]}
  className={cn(buttonVariants({ variant, size }), className)}
>
```

Note: `font-sans-bold` (not `font-bold`) for button text, because RN needs explicit fontFamily per weight.

Components without meaningful variants skip `cva` and use plain `className` strings.

### Animated partials

Components using Reanimated (`Button` press-scale, `HandDrawnCheck`, `Toast`, etc.) keep animated transforms on `style={}`. Static styles go to `className`. This is the documented NativeWind v4 pattern:

```tsx
<Animated.View style={[animatedStyle]} className="flex-row items-center justify-center">
```

### Migration order within Phase 1

1. Shells (3 files) — every screen uses these, simplest
2. Primitives without `cva` (27 files) — mechanical class-string replacement
3. `cva` primitives (6 files) — needs `cva` dep from Phase 0
4. Templates (9 files) — compose primitives, so primitives must be done first

### Test migration strategy

Several RTL tests assert on style objects via `StyleSheet.flatten(element.props.style)`. After NativeWind migration, `props.style` may not contain the same structure. Known affected tests:
- `App.test.tsx` — 3 `StyleSheet.flatten` assertions (button, card, wizard progress styles)
- `RoleSelectScreen.test.tsx` — 2 assertions (selected/unselected card styles)
- `OnboardingScreen.test.tsx` — 2 assertions (active/inactive pagination dot styles)
- `Input.test.tsx` — 1 assertion (input field styles)

Migration approach per assertion:
1. **Prefer behavior/accessibility assertions** where possible. E.g., instead of asserting `backgroundColor` on a selected card, assert `accessibilityState.selected` or a testID indicating selection state.
2. **For assertions that truly need style verification** (e.g., testing that the correct variant applies), use NativeWind's test runtime. NativeWind v4 in test environments applies styles as inline style objects when configured with `NATIVEWIND_OS` env var — verify this during Phase 0 spike.
3. **Document each adjusted assertion** in the Phase 1 PR with before/after and justification.

This work is part of Phase 1, not Phase 2, because it affects component tests.

### Exit gate

- Zero `StyleSheet.create` in `src/components/**` except annotated animated partials (grep-verifiable). Note: `src/features/**/components/**` is NOT in Phase 1 scope — feature components are migrated opportunistically.
- All 34 + 9 + 3 = 46 files migrated (includes new `Touchable` primitive)
- `component-contract.yaml` updated to reflect NativeWind APIs
- All existing RTL tests pass
- Lint rule `no-stylesheet-in-screens` installed as warning
- App boots on simulator

## Phase 2 — Screen Migration

### Tier classification

**101 total screen files** in `src/app/`:
- 16 trivial files (<20 lines: redirects, re-exports, bare layouts) — **auto-pass**, no migration needed, just verify lint passes
- 64 small/medium screens (20–300 lines) — standard migration
- 21 mega-screens (>300 lines) — migration with behavior-preservation checklist

Auto-pass files (no `StyleSheet.create`, no styles to migrate):
`tasks/new/index.tsx` (1L), `review/[bookingId].tsx` (1L), 3x `_layout.tsx` stubs (5L each), `task/_layout.tsx` (10L), `create.tsx` (11L), `profile/[id].tsx` (11L), `task/[id]/applicants.tsx` (11L), `(tasker)/tasks/[taskId].tsx` (12L), `verification/index.tsx` (14L), `tasks/new/_layout.tsx` (16L), `(auth)/_layout.tsx` (18L), `(tabs)/bookings.tsx` (19L), `verification/approved.tsx` (19L), `verification/submitted.tsx` (19L)

### Wave 1 — Audit Rows (15 routes, Figma reconciliation)

Source of truth: Figma file `IljfnTQPkq7vpkmK1NN1NC`, fetched via `figma:get_design_context`.

| Batch | Screens | Lines |
|---|---|---|
| 1a | `(tasker)/wallet/payout` (81L), `(tasker)/verification/consent` (174L), `(customer)/tasks/new/success` (196L) | ≤200L |
| 1b | `(auth)/index` (230L), `(auth)/role-select` (235L), `(tabs)/index` (262L), `onboarding` (272L) | ≤300L |
| 1c | `(auth)/otp` (322L), `(customer)/tasks/new/category` (342L), `(shared)/legal/terms` (391L) | 300–400L |
| 1d | `(customer)/bookings/confirmed` (402L), `(customer)/tasks/[taskId]/applicants` (492L) | 400–500L |
| 1e | `(shared)/help` (547L) | 500L+ |
| 1f | `(customer)/bookings/[bookingId]/reschedule` (651L) | 600L+ |
| 1g | `(customer)/disputes/[disputeId]/index` (759L) | 700L+ — highest-risk file in codebase |

**Feature component scope for Wave 1:** Feature components rendered within Wave 1 audit-row screens (e.g., `TaskFeed` in `tasks/index.tsx`, `BookingList` in `bookings/index.tsx`) are in scope for visual reconciliation against Figma in that batch. Internal NativeWind migration of the feature component is optional; visual outcome against Figma is mandatory.

### Wave 2 — Remaining Small Screens (57 routes, code-is-floor)

Batches of 5, grouped by route family:
- `(auth)/*` remaining
- `(customer)/bookings/*` remaining
- `(customer)/tasks/*` remaining
- `(customer)/business/*`
- `(tasker)/*` remaining
- `(shared)/*` remaining
- `(tabs)/*` remaining
- Layout files (`_layout.tsx`)

No Figma reconciliation unless ≥3 siblings style the same concept differently.

### Wave 3 — Remaining Mega Screens (13 routes, code-is-floor)

Batches of 1–2. Same contract as Wave 1c–1e minus Figma reconciliation.

Remaining Tier 3 screens:
- `(customer)/tasks/new/location` (327L)
- `(tasker)/profile/polish` (394L)
- `(customer)/tasks/new/intake` (401L)
- `(customer)/tasks/[taskId]/instant-match` (403L)
- `(shared)/notifications` (404L)
- `(customer)/bookings/[bookingId]/timeline` (409L)
- `(customer)/bookings/[bookingId]/index` (427L)
- `(customer)/tasks/new/schedule` (442L)
- `(tabs)/inbox/[id]` (473L)
- `(customer)/tasks/[taskId]/index` (502L)
- `(customer)/bookings/index` (586L)
- `(customer)/tasks/index` (594L)
- `(customer)/tasks/new/review` (603L)

### Per-batch contract

Each autonomous agent batch receives:

**Inputs:**
1. Frozen `tailwind.config.ts` (from Phase 0)
2. Frozen `component-contract.yaml` (from Phase 1)
3. Component index files (`components/ui/index.ts`, `components/templates/index.ts`)
4. `screenLayout.ts` (for runtime-only values)
5. `src/design/elevations.ts` (shadow application patterns — imperative exception)
6. `src/lib/cn.ts` (className merge utility)
7. `components/ui/Touchable.tsx` (Pressable replacement for non-button tap targets)
8. The specific screen files for this batch
9. For Wave 1: Figma node spec from `figma:get_design_context` per screen

**Rules:**
- Replace all `StyleSheet.create` blocks with NativeWind `className`
- Replace inline-styled blocks that duplicate existing primitives/templates with the actual primitive/template
- Use semantic Tailwind tokens (`gap-section`, `px-screen-x`, `text-heading`), never raw values (`gap-6`, `px-4`, `text-[18px]`)
- **Imperative exceptions (do NOT convert to className):**
  - Shadows: keep `style={elevations.card}`, `style={elevations.soft}`, etc. — NativeWind shadow utilities produce different values
  - Dynamic color opacity: keep `style={{ backgroundColor: `${colors.primary}14` }}` and color props on icon components (e.g., lucide `color` prop) — no Tailwind equivalent for computed hex+opacity
  - Animated styles: keep `style={[animatedStyle]}` for Reanimated `useAnimatedStyle` values
  - Runtime-computed values: keep `style={{ paddingBottom: screenLayout.chrome.contentBottomClearance }}` for `this`-based getters
- Preserve all `testID` props unchanged
- Preserve all `accessibilityRole` and `accessibilityLabel` props unchanged
- Preserve all navigation calls (`router.push`, `router.replace`, `router.back`)
- Preserve all analytics calls
- Preserve all hook calls and their argument shapes
- Preserve all mutation/query hooks and their usage patterns
- Do not change any feature flag checks
- For Wave 1: reconcile to Figma spec where current code deviates; log each reconciliation in the PR
- For Waves 2–3: preserve current visuals (code-is-floor); only dedupe when ≥3 siblings diverge

**Outputs (per batch PR):**
- Migrated screen files
- Changelog comment listing: styles removed, primitives adopted, outliers kept (with reason), Figma reconciliations applied (Wave 1 only)
- RTL tests passing
- Lint passing
- TypeScript passing

**Mega-screen additions (>300L):**
- List every hook call in the file and confirm preserved
- List every navigation call and confirm preserved
- List every conditional render and confirm condition + branches preserved
- These go in the PR changelog as a behavior-preservation checklist

### Maestro screenshot gate

1. Before the batch: run Maestro flows touching the batch's screens, capture `takeScreenshot`. Commit baselines to `apps/mobile/maestro/baselines/<screen-id>/before.png`.
2. After the batch: re-run same flows. Compare `after.png` against `before.png`.
3. Wave 1 (Figma reconciliation): diff expected non-empty. PR logs what changed and why.
4. Waves 2–3 (code-is-floor): diff should be empty or near-empty. Non-empty diff requires justification.

### Exit gate

- All 15 Wave 1 audit rows migrated and marked "validated" in `parity-post-restructure-2026-04-04.md`
- All 57 Wave 2 screens migrated
- All 13 Wave 3 mega-screens migrated
- All 16 auto-pass files verified lint-clean
- Zero lint warnings from rules 1, 2, 3 across `src/app/**`
- All RTL tests pass
- TypeScript clean
- Maestro screenshot baselines captured for all migrated routes

## Phase 3 — Lint Ratchet & Cleanup

### Work

1. Promote lint rules 1, 2, 3 from warning to error
2. Delete `screenRhythm.ts` references if any survive
3. Remove NativeWind v2/v3 artifacts if any remain
4. Delete orphaned `StyleSheet` imports across the codebase
5. Regenerate final Maestro screenshot baselines as the canonical set

### Exit gate

- `pnpm -r lint` clean
- Zero `StyleSheet.create` in `src/app/` (grep: `grep -r "StyleSheet.create" apps/mobile/src/app/` returns zero)
- Parity audit doc marked complete and archived
- All three lint rules are errors, not warnings

## Lint Guardrails

### Rule 1: `no-stylesheet-in-screens`

- **Scope:** `src/app/**/*.tsx`
- **Bans:** `StyleSheet.create` calls
- **Exceptions:** None. One-off computed styles use inline `style={{ }}` with token references.
- **Phase 2:** warning
- **Phase 3:** error

### Rule 2: `no-literal-style-values`

- **Scope:** `src/app/**/*.tsx`
- **Bans:** Literal hex colors (`#fff`, `#1a2b3c`), rgb/rgba calls, literal pixel numbers in style props, arbitrary Tailwind values (`text-[18px]`, `bg-[#ff0]`)
- **Must resolve via:** Tailwind theme tokens or `mobileTheme`/`screenLayout` imports for runtime-computed values
- **Phase 2:** warning
- **Phase 3:** error

### Rule 3: `no-raw-pressable-in-screens`

- **Scope:** `src/app/**/*.tsx`
- **Implementation:** `no-restricted-imports` rule banning `import { Pressable }` from `react-native` in `src/app/**`. Screens must use `<Button>`, `<PressableCard>`, or `<Touchable>` (a thin wrapper created in `components/ui/Touchable.tsx` that re-exports `Pressable` with testID enforcement for non-button tap targets).
- **Escape hatch:** `// eslint-disable-next-line no-restricted-imports -- <reason>` for legitimate framework API requirements (e.g., `tabBarButton` in `_layout.tsx` that requires a raw `Pressable` per expo-router API).
- **Known false positives:** `_layout.tsx` (tabBarButton), `inbox/[id].tsx` (chat input compose area). These get the escape hatch with documented reason.
- **Phase 2:** warning
- **Phase 3:** error

### Ratchet mechanism

Each batch PR updates `.eslintrc` to move migrated files from the warning allowlist to the clean set. Phase 3 deletes the allowlist and promotes all rules to error.

## Feature migration rules

Feature-level components (`src/features/*/components/*.tsx`) are NOT in scope for internal NativeWind migration in this spec. They follow the same token/NativeWind patterns but are migrated opportunistically, not in the campaign. The lint rules do not apply to `src/features/` — only to `src/app/` and `src/components/`.

**Exception:** Feature components rendered within Wave 1 audit-row screens must produce correct visual output against Figma. If a visual deviation originates in a feature component, the Wave 1 batch may adjust the feature component's styling (but is not required to do a full NativeWind migration of its internals).

## Risk register

| Risk | Mitigation |
|---|---|
| Behavior loss in mega-screens | Behavior-preservation checklist mandatory for >300L screens; Wave 1 batches 1e/1f/1g are single-screen batches |
| NativeWind v4 style parity gaps | Shadows, dynamic color opacity, and animated styles stay imperative `style={}`; documented in "Imperative style exceptions" |
| `cssInterop` missing for third-party components | Registration file created in Phase 0; manual verification that `Animated.View` + `className` renders correctly before Phase 1 starts |
| RTL tests break on `StyleSheet.flatten` assertions | Concrete test migration strategy in Phase 1; 8 known assertions identified and pre-planned |
| `className` merge conflicts (prop soup) | `cn()` utility (tailwind-merge) mandatory for all components accepting `className`; enforced in Phase 1 code review |
| fontFamily/fontWeight mismatch in RN | All 6 font families registered in tailwind.config.ts; `cva` and plugin use explicit `font-sans-bold` not `font-bold` |
| Figma file is stale for some audit rows | Agent compares Figma spec to current code; if obviously stale, falls back to code-is-floor and logs it |
| Autonomous agent produces prop soup | Component contract limits: >6 props or >2 booleans = wrong abstraction; reviewer rejects |
| Mid-migration foundation instability | Hard phase gate: zero screen work until Phase 1 exit gate passes |
| Lint rule false positives | Phase 2 rules are warnings, not errors; issues surface and are tuned before Phase 3 promotion; Rule 3 has documented escape hatch |
| Maestro baselines are simulator-dependent | Baselines pinned to a single simulator model/OS version; determined during Phase 0 and recorded in `apps/mobile/maestro/baselines/DEVICE.md` (e.g., "iPhone 15 Pro, iOS 17.4") |
