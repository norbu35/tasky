# Screen Layout System Design

> Replace the flat `screenRhythm` token file with a zone-based `screenLayout` system that groups spacing tokens by screen zone, derives FAB/tab-bar clearances from a single source of truth, and is consumed automatically by templates so individual screens never cherry-pick spacing values.

**Goal:** Every screen achieves balanced, consistent spacing by using templates that enforce `screenLayout` zones — no screen-level spacing improvisation.

**Architecture:** A single `design/screenLayout.ts` file exports zone-grouped tokens (`header`, `body`, `actions`, `chrome`, `wizard`). Templates (`FeedListTemplate`, `DetailTemplate`, `FormWizardTemplate`) consume these zones internally. Screens pass content; templates handle rhythm.

**Tech Stack:** React Native (Expo Router), TypeScript, existing `mobileTheme` spacing scale.

---

## 1. The `screenLayout` Token System

Replaces `design/screenRhythm.ts` with `design/screenLayout.ts`.

### Token Structure

```ts
import { Platform } from 'react-native';
import { mobileTheme } from './tokenAdapter';

const { spacing, typography } = mobileTheme;

export const screenLayout = {
  /** Horizontal padding for all screen content */
  insetX: spacing.lg,

  header: {
    /** Top of screen to first element */
    topInset: spacing.xl,
    /** Greeting label to screen title */
    greetingGap: spacing.xs,
    /** Screen title to subtitle or first body content */
    titleGap: spacing.sm,
    /** Entire header block to body content below */
    bottomGap: spacing.xl,
  },

  body: {
    /** Between major sections (stats -> info -> trust banner) */
    sectionGap: spacing.xl,
    /** Between sibling elements within a section */
    blockGap: spacing.lg,
    /** Between tightly related items (card rows, form fields) */
    itemGap: spacing.md,
    /** Micro spacing (chip padding, icon-to-label) */
    microGap: spacing.xs,
    /** Standard card internal padding */
    cardPadding: spacing.lg,
  },

  actions: {
    /** Sticky action bar internal padding */
    barPadding: spacing.md,
    /** Gap between stacked buttons in an action bar */
    buttonGap: spacing.sm,
  },

  chrome: {
    /** Tab bar total height */
    tabBarHeight: Platform.OS === 'ios' ? 88 : 64,
    /** Tab bar bottom offset from screen edge */
    tabBarBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    /** FAB diameter */
    fabSize: 60,
    /** FAB distance from right edge */
    fabInsetRight: spacing.lg,
    /** FAB bottom position — derived from tab bar geometry */
    get fabBottom() {
      return this.tabBarHeight + this.tabBarBottom + spacing.sm;
    },
    /** Minimum clearance for scrollable content — clears tab bar. FAB intentionally floats over scroll content (standard pattern). */
    get contentBottomClearance() {
      return this.tabBarHeight + this.tabBarBottom + spacing.md;
    },
  },

  wizard: {
    /** Progress bar segment gap */
    stepIndicatorGap: spacing.xs,
  },
} as const;
```

### Typography Presets

```ts
export const screenTypography = {
  greeting: {
    fontSize: typography.caption,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  screenTitle: {
    fontSize: typography.heroTitle,
    fontWeight: '900' as const,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '800' as const,
    lineHeight: Math.round(typography.heading * 1.25),
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700' as const,
    lineHeight: Math.round(typography.body * 1.35),
  },
} as const;
```

### Design Rationale

- **Zone grouping** makes it self-documenting: `screenLayout.header.greetingGap` is unambiguous; `screenRhythm.microGap` is not.
- **Derived getters** (`fabBottom`, `contentBottomClearance`) eliminate hardcoded magic numbers across screens.
- **`chrome` zone** is the single source of truth for tab bar and FAB geometry — the `(tabs)/_layout.tsx`, `FAB.tsx`, `StickyActionBar.tsx`, and `DetailTemplate` all read from here instead of each defining their own constants.

---

## 2. Template Changes

### 2.1 `FeedListTemplate`

**Current problems:**
- Uses `spacing.lg` directly instead of semantic tokens.
- No bottom clearance for tab bar or FAB — list items can scroll behind chrome.

**Changes:**
- `listContent.paddingHorizontal` -> `screenLayout.insetX`
- `listContent.paddingTop` -> `screenLayout.header.topInset`
- `separator.height` -> `screenLayout.body.itemGap`
- Add `listContent.paddingBottom` -> `screenLayout.chrome.contentBottomClearance`
- `skeletonList` padding matches the same tokens.

### 2.2 `DetailTemplate`

**Current problems:**
- `ctaBarExtraBottomPadding` prop forces each screen to know tab bar height.
- Sticky CTA positioning is manual.

**Changes:**
- `scrollContent.paddingTop` -> `screenLayout.header.topInset`
- `scrollContent.paddingHorizontal` -> `screenLayout.insetX`
- Remove `ctaBarExtraBottomPadding` prop. The `StickyActionBar` shell computes clearance itself via `insideTabNavigator`.
- When `DetailTemplate` is used inside a tab navigator, it passes `insideTabNavigator={true}` to its `StickyActionBar`. When used in a Stack screen (e.g., task detail), it passes `false` (default). Consumers of `DetailTemplate` signal this via a new `insideTabNavigator?: boolean` prop (default `false`).
- `scrollContentWithActionBar.paddingBottom` -> `screenLayout.body.sectionGap`
- `bottomBar.padding` -> `screenLayout.actions.barPadding`

### 2.3 `FormWizardTemplate`

**Current problems:**
- Imports `screenRhythm` — needs migration.

**Changes:**
- `stepIndicatorRow` padding -> `screenLayout.header.topInset` (top), `screenLayout.insetX` (horizontal)
- `stepIndicator` gap -> `screenLayout.wizard.stepIndicatorGap`
- `scrollContent` padding -> `screenLayout.insetX` (horizontal), `screenLayout.body.blockGap` (gap)
- `bottomBarInner` padding -> `screenLayout.actions.barPadding`

### 2.4 `StickyActionBar` Shell

**Current problems:**
- `extraBottomPadding` prop is a manual escape hatch. Each consumer guesses tab bar height.

**Changes:**
- Replace `extraBottomPadding: number` prop with `insideTabNavigator: boolean` (default `false`).
- When `true`, adds `screenLayout.chrome.tabBarHeight + screenLayout.chrome.tabBarBottom` to the bottom padding automatically.
- `paddingHorizontal` -> `screenLayout.actions.barPadding`

---

## 3. Screen Fixes

### 3.1 My Tasks (Customer) — Spacing

**File:** `apps/mobile/src/app/(customer)/tasks/index.tsx`

**Problem:** Greeting, title, and hero card are squished. `headerWrap.paddingTop` is `screenRhythm.itemGap` (12px) — far too tight for a screen header.

**Fix:**
- `headerWrap.paddingTop` -> `screenLayout.header.topInset` (24px)
- `headerWrap.paddingBottom` -> `screenLayout.header.bottomGap` (24px)
- `headerCopy` gap (greeting to title): `screenLayout.header.greetingGap` (4px)
- `pageTitle.marginTop` -> `screenLayout.header.greetingGap` (replacing `screenRhythm.microGap`)
- Hero card gap to first list item: `screenLayout.header.bottomGap` (24px)
- `listContent.paddingBottom` -> `screenLayout.chrome.contentBottomClearance`
- All `screenRhythm.*` imports replaced with `screenLayout.*` equivalents.

### 3.2 Profile Tab — Edit Action UX Redesign

**File:** `apps/mobile/src/app/(tabs)/profile.tsx`

**Problem:** A full-width sticky "Профайл засах" button sits at the bottom, colliding with the FAB. This is the wrong pattern for a low-frequency action — editing your profile is not a primary call-to-action that needs constant visibility.

**Fix:**
- Remove `ctaLabel`, `ctaOnPress`, `secondaryCtaLabel`, `secondaryCtaOnPress`, and `ctaBarExtraBottomPadding` from the `DetailTemplate` usage.
- Add a pencil (edit) icon button to the screen header, next to the existing Settings gear icon. This is the standard modern pattern (Instagram, Airbnb, Grab). The screen already has `rightAction` wired for Settings — extend `DetailTemplate` to accept `rightActions: Array<{ icon: ReactNode; onPress: () => void; testID?: string }>` (plural) alongside the existing singular `rightAction` (kept for backward compat). When `rightActions` is provided, render them as a horizontal row with `body.microGap` spacing. Profile passes both Edit (pencil) and Settings (gear) via `rightActions`.
- If tasker stats CTA is needed, render it as an inline tonal card/link within the body content (e.g., inside the stats section), not as a sticky bar.
- `content` bottom padding: `screenLayout.chrome.contentBottomClearance` — prevents scroll content from hiding behind tab bar.
- Remove the hardcoded `TAB_BAR_HEIGHT` constant.

### 3.3 FAB — Centralized Positioning + Draggable

**File:** `apps/mobile/src/components/ui/FAB.tsx`

**Problem:** `bottomOffset` prop defaults to `72` — a magic number. Position uses `insets.bottom + bottomOffset` which doesn't account for the floating tab bar. Also, the FAB intentionally floats over scroll content, but users have no way to move it if it covers something they need to read.

**Fix — positioning:**
- Remove `bottomOffset` prop.
- `bottom` -> `screenLayout.chrome.fabBottom` (no longer needs safe area insets since the tab bar already accounts for them).
- `right` -> `screenLayout.chrome.fabInsetRight`
- `width` / `height` -> `screenLayout.chrome.fabSize`

**Fix — draggable:**
- Wrap the FAB in a `PanGestureHandler` (from `react-native-gesture-handler`, already a project dependency via Expo).
- Track position with `useSharedValue` for `translateX` and `translateY`.
- On drag end, snap to the nearest screen edge (left or right) using `withSpring` — the FAB always hugs the left or right edge, never floats in the middle. Vertical position is unconstrained within safe bounds (above tab bar, below status bar).
- Short press triggers navigation (existing behavior). Drag gesture must exceed a small threshold (e.g., 8px) before it activates, so taps don't misfire as drags.
- Position resets to default (`fabBottom`, right edge) on tab change — no persistence needed.
- Boundary clamping: `minY` = status bar inset + `spacing.md`, `maxY` = screen height - `chrome.tabBarHeight` - `chrome.tabBarBottom` - `chrome.fabSize`.

### 3.4 Tab Bar — Read From `screenLayout.chrome`

**File:** `apps/mobile/src/app/(tabs)/_layout.tsx`

**Problem:** Tab bar height and bottom offset are hardcoded in styles.

**Fix:**
- `tabBar.height` -> `screenLayout.chrome.tabBarHeight`
- `tabBar.bottom` -> `screenLayout.chrome.tabBarBottom`
- This makes the tab bar values authoritative from `screenLayout` — if they change, FAB and content clearance update automatically.

---

## 4. Migration & Cleanup

### 4.1 Delete `screenRhythm`

Delete `apps/mobile/src/design/screenRhythm.ts` after all imports are migrated.

### 4.2 Import Migration Map

| Old (`screenRhythm.*`)       | New (`screenLayout.*`)               |
|------------------------------|--------------------------------------|
| `contentInsetX`              | `insetX`                             |
| `contentInsetTop`            | `header.topInset`                    |
| `sectionGap`                 | `body.sectionGap`                    |
| `blockGap`                   | `body.blockGap`                      |
| `itemGap`                    | `body.itemGap`                       |
| `microGap`                   | `body.microGap`                      |
| `cardPadding`                | `body.cardPadding`                   |
| `stickyBarPadding`           | `actions.barPadding`                 |
| `stepIndicatorGap`           | `wizard.stepIndicatorGap`            |

Old `screenTypography` exports are replaced by the expanded `screenTypography` in the new file.

### 4.3 Files Touched

**New:**
- `apps/mobile/src/design/screenLayout.ts`

**Deleted:**
- `apps/mobile/src/design/screenRhythm.ts`

**Modified (templates & shells):**
- `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- `apps/mobile/src/components/templates/DetailTemplate.tsx`
- `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
- `apps/mobile/src/components/shells/StickyActionBar.tsx`

**Modified (screens):**
- `apps/mobile/src/app/(customer)/tasks/index.tsx` — header spacing
- `apps/mobile/src/app/(tabs)/profile.tsx` — edit action UX
- `apps/mobile/src/app/(tabs)/_layout.tsx` — tab bar reads from chrome zone
- `apps/mobile/src/components/ui/FAB.tsx` — position from chrome zone

**Modified (migration only — swap import, 1:1 token rename):**
- Any other file that imports `screenRhythm` (grep to find all).

---

## 5. Out of Scope

- Changing the raw `mobileTheme.spacing` scale values — `screenLayout` is a semantic layer on top, not a replacement.
- Component-internal spacing (card internals, badge padding) — those stay in components.
- Adding new screens or features.
- Changing the tab bar visual design (blur, icons, colors) — only its height/position constants move to `screenLayout.chrome`.
