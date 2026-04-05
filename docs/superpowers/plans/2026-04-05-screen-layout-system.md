# Screen Layout System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `screenRhythm` with a zone-based `screenLayout` token system, fix screen spacing issues, redesign the Profile edit action, and make the FAB draggable.

**Architecture:** A single `screenLayout.ts` exports zone-grouped tokens (`header`, `body`, `actions`, `chrome`, `wizard`). Templates consume these internally. Screens pass content; templates handle rhythm. The FAB becomes draggable with edge-snapping via `react-native-gesture-handler`.

**Tech Stack:** React Native (Expo Router), TypeScript, react-native-reanimated, react-native-gesture-handler 2.x

**Spec:** `docs/superpowers/specs/2026-04-05-screen-layout-system-design.md`

---

## File Structure

**New:**
- `apps/mobile/src/design/screenLayout.ts` — zone-based token system

**Deleted:**
- `apps/mobile/src/design/screenRhythm.ts` — replaced by screenLayout

**Modified (templates & shells):**
- `apps/mobile/src/components/shells/StickyActionBar.tsx` — `insideTabNavigator` prop
- `apps/mobile/src/components/templates/DetailTemplate.tsx` — `screenLayout` + `rightActions` + `insideTabNavigator`
- `apps/mobile/src/components/templates/FeedListTemplate.tsx` — `screenLayout` migration
- `apps/mobile/src/components/templates/FormWizardTemplate.tsx` — `screenLayout` migration

**Modified (chrome):**
- `apps/mobile/src/app/(tabs)/_layout.tsx` — read height/bottom from `screenLayout.chrome`
- `apps/mobile/src/components/ui/FAB.tsx` — draggable + centralized positioning

**Modified (screens):**
- `apps/mobile/src/app/(customer)/tasks/index.tsx` — header spacing fix + migration
- `apps/mobile/src/app/(tabs)/profile.tsx` — edit action UX redesign
- `apps/mobile/src/app/(tabs)/inbox/index.tsx` — migration only
- `apps/mobile/src/app/(customer)/bookings/index.tsx` — migration only
- `apps/mobile/src/app/(customer)/rebook.tsx` — migration only
- `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx` — migration only
- `apps/mobile/src/app/(tasker)/stats.tsx` — migration only

---

### Task 1: Create `screenLayout.ts`

**Files:**
- Create: `apps/mobile/src/design/screenLayout.ts`

- [ ] **Step 1: Create the screenLayout token file**

```ts
// apps/mobile/src/design/screenLayout.ts
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
    /** Minimum clearance for scrollable content — clears tab bar */
    get contentBottomClearance() {
      return this.tabBarHeight + this.tabBarBottom + spacing.md;
    },
  },

  wizard: {
    /** Progress bar segment gap */
    stepIndicatorGap: spacing.xs,
  },
} as const;

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

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/mobile && npx tsc --noEmit src/design/screenLayout.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/design/screenLayout.ts
git commit -m "feat(design): add zone-based screenLayout token system"
```

---

### Task 2: Migrate `StickyActionBar` shell

**Files:**
- Modify: `apps/mobile/src/components/shells/StickyActionBar.tsx`

- [ ] **Step 1: Replace `extraBottomPadding` with `insideTabNavigator`**

Replace the full file content:

```tsx
// apps/mobile/src/components/shells/StickyActionBar.tsx
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenLayout } from '../../design/screenLayout';

type StickyActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** When true, adds tab bar clearance to bottom padding automatically. */
  insideTabNavigator?: boolean;
};

export function StickyActionBar({
  children,
  style,
  testID,
  insideTabNavigator = false,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const tabClearance = insideTabNavigator
    ? screenLayout.chrome.tabBarHeight + screenLayout.chrome.tabBarBottom
    : 0;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + screenLayout.actions.barPadding + tabClearance },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenLayout.actions.barPadding,
    paddingTop: screenLayout.actions.barPadding,
  },
});
```

- [ ] **Step 2: Run typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -30`
Expected: May show errors in files still importing old `extraBottomPadding` — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/shells/StickyActionBar.tsx
git commit -m "refactor(shell): StickyActionBar uses screenLayout + insideTabNavigator"
```

---

### Task 3: Migrate `DetailTemplate`

**Files:**
- Modify: `apps/mobile/src/components/templates/DetailTemplate.tsx`

- [ ] **Step 1: Update imports and add `rightActions` / `insideTabNavigator` props**

Replace the import line:

```tsx
// Old:
import { screenRhythm } from '../../design/screenRhythm';
// New:
import { screenLayout } from '../../design/screenLayout';
```

Replace the interface `DetailTemplateProps` (lines 14-40) with:

```tsx
export interface DetailTemplateProps {
  children: React.ReactNode;
  /** @deprecated Title is now set via Stack.Screen options in the layout. */
  headerTitle?: string;
  /** @deprecated Back navigation is now handled by the native Stack header. */
  onBack?: () => void;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaOnPress?: () => void;
  /** @deprecated Use rightActions instead. */
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  /** Multiple header action icons (e.g., edit + settings). Renders as a horizontal row. */
  rightActions?: Array<{ icon: React.ReactNode; onPress: () => void; testID?: string }>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  testID?: string;
  hideHeader?: boolean;
  /** When true, the sticky CTA bar adds tab bar clearance automatically. */
  insideTabNavigator?: boolean;
}
```

- [ ] **Step 2: Update the component implementation**

Replace the destructured props (adding `insideTabNavigator`, removing `ctaBarExtraBottomPadding`):

```tsx
export function DetailTemplate({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  headerTitle: _headerTitle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack: _onBack,
  ctaLabel,
  ctaOnPress,
  ctaLoading = false,
  ctaDisabled = false,
  secondaryCtaLabel,
  secondaryCtaOnPress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rightAction: _rightAction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rightActions: _rightActions,
  isLoading = false,
  isError = false,
  onRetry,
  errorMessage,
  testID,
  hideHeader = false,
  insideTabNavigator = false,
}: DetailTemplateProps) {
```

Update the `StickyActionBar` usage inside the JSX — replace `extraBottomPadding={ctaBarExtraBottomPadding}` with `insideTabNavigator={insideTabNavigator}`:

```tsx
        <StickyActionBar
          testID={testID ? `${testID}-bottom-bar` : undefined}
          insideTabNavigator={insideTabNavigator}
        >
```

- [ ] **Step 3: Update styles to use `screenLayout`**

Replace the styles block (lines 138-189) with:

```tsx
const styles = StyleSheet.create({
  safeAreaNoTop: {
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: screenLayout.header.topInset,
    paddingHorizontal: screenLayout.insetX,
  },
  scrollContentWithActionBar: {
    paddingBottom: screenLayout.body.sectionGap,
  },
  bottomBar: {
    padding: screenLayout.actions.barPadding,
    borderRadius: mobileTheme.radius.lg,
    overflow: 'hidden',
  },
  primaryCta: {
    alignSelf: 'stretch',
  },
  secondaryCta: {
    alignSelf: 'stretch',
    marginBottom: screenLayout.actions.buttonGap,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: screenLayout.insetX,
    paddingTop: screenLayout.header.topInset,
    gap: screenLayout.body.blockGap,
  },
  skeletonBlockLarge: {
    height: 200,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
  },
  skeletonBlockMedium: {
    height: spacing['3xl'],
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
    width: '70%',
  },
  skeletonBlockSmall: {
    height: spacing.xl,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
    width: '45%',
  },
});
```

Note: Keep `const { colors, spacing } = mobileTheme;` at the top since it's still used for skeleton block heights.

- [ ] **Step 4: Run typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -30`
Expected: May show error in `profile.tsx` using removed `ctaBarExtraBottomPadding` — will fix in Task 9.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/templates/DetailTemplate.tsx
git commit -m "refactor(template): DetailTemplate uses screenLayout + insideTabNavigator + rightActions"
```

---

### Task 4: Migrate `FeedListTemplate`

**Files:**
- Modify: `apps/mobile/src/components/templates/FeedListTemplate.tsx`

- [ ] **Step 1: Replace import and update styles**

Replace import:

```tsx
// Old:
import { mobileTheme } from '../../design/tokenAdapter';
// New:
import { mobileTheme } from '../../design/tokenAdapter';
import { screenLayout } from '../../design/screenLayout';
```

Replace the styles block (lines 186-233) with:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: screenLayout.insetX,
    paddingTop: screenLayout.header.topInset,
    paddingBottom: screenLayout.chrome.contentBottomClearance,
  },
  separator: {
    height: screenLayout.body.itemGap,
  },
  skeletonList: {
    paddingHorizontal: screenLayout.insetX,
    paddingTop: screenLayout.header.topInset,
  },
  skeletonCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: screenLayout.body.cardPadding,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: spacing.lg,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    alignSelf: 'stretch',
  },
  skeletonLineShort: {
    height: spacing.md,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    width: '60%',
  },
  skeletonLineMiddle: {
    height: spacing.md,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.xs,
    width: '80%',
  },
  filterBarWrapper: {
    flexShrink: 0,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/templates/FeedListTemplate.tsx
git commit -m "refactor(template): FeedListTemplate uses screenLayout tokens"
```

---

### Task 5: Migrate `FormWizardTemplate`

**Files:**
- Modify: `apps/mobile/src/components/templates/FormWizardTemplate.tsx`

- [ ] **Step 1: Replace import**

```tsx
// Old:
import { screenRhythm } from '../../design/screenRhythm';
// New:
import { screenLayout } from '../../design/screenLayout';
```

- [ ] **Step 2: Update styles**

Replace the styles block (starting at `const styles = StyleSheet.create({`) with:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: screenLayout.header.topInset,
    paddingBottom: screenLayout.body.itemGap,
    paddingHorizontal: screenLayout.insetX,
    gap: spacing.md,
  },
  stepIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenLayout.wizard.stepIndicatorGap,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: radius.md,
  },
  barFilled: {
    backgroundColor: colors.primary,
  },
  barEmpty: {
    backgroundColor: colors.chipInactive,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: screenLayout.insetX,
    gap: screenLayout.body.blockGap,
    paddingBottom: screenLayout.body.sectionGap,
  },
  bottomBar: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bottomBarInner: {
    paddingTop: screenLayout.actions.barPadding,
    paddingHorizontal: screenLayout.insetX,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  nextButtonFull: {
    alignSelf: 'stretch',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/templates/FormWizardTemplate.tsx
git commit -m "refactor(template): FormWizardTemplate uses screenLayout tokens"
```

---

### Task 6: Migrate tab bar to `screenLayout.chrome`

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add import and update styles**

Add import at the top (after existing imports):

```tsx
import { screenLayout } from '../../design/screenLayout';
```

In the `styles.tabBar` object, replace the `height` and `bottom` lines:

```tsx
// Old:
height: Platform.OS === 'ios' ? 88 : 64,
bottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
// New:
height: screenLayout.chrome.tabBarHeight,
bottom: screenLayout.chrome.tabBarBottom,
```

Remove the `Platform` import from `react-native` if it's no longer used elsewhere in the file. Check first — `Platform` may still be used. If not used elsewhere, remove it from the import.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/app/(tabs)/_layout.tsx
git commit -m "refactor(tabs): tab bar reads height/bottom from screenLayout.chrome"
```

---

### Task 7: Draggable FAB with centralized positioning

**Files:**
- Modify: `apps/mobile/src/components/ui/FAB.tsx`

- [ ] **Step 1: Rewrite FAB with drag + edge-snap**

Replace the entire file:

```tsx
// apps/mobile/src/components/ui/FAB.tsx
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { screenLayout } from '../../design/screenLayout';

const { colors, radius } = mobileTheme;
const { fabSize, fabInsetRight, fabBottom, tabBarHeight, tabBarBottom } = screenLayout.chrome;
const DRAG_THRESHOLD = 8;
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

type FABProps = {
  testID?: string;
  authGuard?: boolean;
};

export function FAB({ testID = 'global-fab', authGuard = true }: FABProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Default position: bottom-right, above tab bar
  const defaultX = screenWidth - fabSize - fabInsetRight;
  const defaultY = screenHeight - insets.bottom - fabBottom - fabSize;

  // Boundaries
  const minX = fabInsetRight;
  const maxX = screenWidth - fabSize - fabInsetRight;
  const minY = insets.top + mobileTheme.spacing.md;
  const maxY = screenHeight - insets.bottom - tabBarHeight - tabBarBottom - fabSize;

  const translateX = useSharedValue(defaultX);
  const translateY = useSharedValue(defaultY);
  const startX = useSharedValue(defaultX);
  const startY = useSharedValue(defaultY);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const navigateToNewTask = () => {
    if (authGuard && !session) {
      router.push('/(auth)');
    } else {
      router.push('/(customer)/tasks/new');
    }
  };

  const tap = Gesture.Tap()
    .onEnd(() => {
      if (!isDragging.value) {
        runOnJS(navigateToNewTask)();
      }
    });

  const pan = Gesture.Pan()
    .minDistance(DRAG_THRESHOLD)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = false;
      scale.value = withSpring(0.95, SPRING_CONFIG);
    })
    .onUpdate((event) => {
      isDragging.value = true;
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;
      translateX.value = Math.max(minX, Math.min(maxX, newX));
      translateY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      // Snap to nearest horizontal edge
      const midX = screenWidth / 2;
      const snapX = translateX.value + fabSize / 2 < midX ? minX : maxX;
      translateX.value = withSpring(snapX, SPRING_CONFIG);
      scale.value = withSpring(1, SPRING_CONFIG);
      isDragging.value = false;
    });

  const composed = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.fab, animatedStyle]} testID={testID}>
        <Plus color={colors.primaryForeground} size={28} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: fabSize,
    height: fabSize,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevations.elevated,
    zIndex: 999,
  },
});
```

Key changes:
- Position is now managed via `translateX`/`translateY` shared values (starting at default position), not `right`/`bottom` CSS.
- `left: 0, top: 0` as anchor; animated transforms move it to position.
- `Gesture.Race(pan, tap)` — pan activates after 8px threshold, tap fires if no drag detected.
- On pan end, snaps to left or right edge with spring animation.
- Boundaries clamp position within safe area above tab bar.
- Removed `bottomOffset` prop entirely.

- [ ] **Step 2: Verify the parent renders inside GestureHandlerRootView**

Check `apps/mobile/src/app/_layout.tsx` — Expo projects with `react-native-gesture-handler` typically wrap the root in `GestureHandlerRootView`. If not present, add it. This is required for `GestureDetector` to work.

Run: `grep -n 'GestureHandlerRootView' apps/mobile/src/app/_layout.tsx`

If not found, wrap the root layout's outermost component in `<GestureHandlerRootView style={{ flex: 1 }}>`.

- [ ] **Step 3: Run typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -30`
Expected: Clean or only errors from files not yet migrated.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/FAB.tsx
git commit -m "feat(fab): draggable FAB with edge-snapping, position from screenLayout.chrome"
```

---

### Task 8: Fix My Tasks (customer) header spacing

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/index.tsx`

- [ ] **Step 1: Replace import**

```tsx
// Old:
import { screenRhythm, screenTypography } from '../../../design/screenRhythm';
// New:
import { screenLayout, screenTypography } from '../../../design/screenLayout';
```

- [ ] **Step 2: Update `headerWrap` style — the main spacing fix**

```tsx
// Old:
headerWrap: {
  paddingHorizontal: screenRhythm.contentInsetX,
  paddingTop: screenRhythm.itemGap,
  paddingBottom: screenRhythm.itemGap,
  gap: screenRhythm.itemGap,
},
// New:
headerWrap: {
  paddingHorizontal: screenLayout.insetX,
  paddingTop: screenLayout.header.topInset,
  paddingBottom: screenLayout.header.bottomGap,
  gap: screenLayout.body.itemGap,
},
```

- [ ] **Step 3: Update `headerCopy` and `pageTitle` — greeting-to-title gap**

```tsx
// Old:
headerCopy: {
  flex: 1,
  paddingRight: spacing.md,
},
pageTitle: {
  marginTop: screenRhythm.microGap,
  fontSize: typography.heroTitle,
  fontWeight: '900',
  color: colors.primaryDeep,
},
// New:
headerCopy: {
  flex: 1,
  paddingRight: spacing.md,
  gap: screenLayout.header.greetingGap,
},
pageTitle: {
  fontSize: typography.heroTitle,
  fontWeight: '900',
  color: colors.primaryDeep,
},
```

Note: `marginTop` on `pageTitle` is removed — the gap is now on the parent `headerCopy` container.

- [ ] **Step 4: Replace all remaining `screenRhythm.*` references with `screenLayout.*`**

Apply these replacements throughout the styles block:

| Old | New |
|-----|-----|
| `screenRhythm.contentInsetX` | `screenLayout.insetX` |
| `screenRhythm.itemGap` | `screenLayout.body.itemGap` |
| `screenRhythm.microGap` | `screenLayout.body.microGap` |
| `screenRhythm.blockGap` | `screenLayout.body.blockGap` |
| `screenRhythm.cardPadding` | `screenLayout.body.cardPadding` |
| `screenRhythm.sectionGap` | `screenLayout.body.sectionGap` |

Also update `listContent.paddingBottom`:

```tsx
// Old:
paddingBottom: spacing['3xl'],
// New:
paddingBottom: screenLayout.chrome.contentBottomClearance,
```

- [ ] **Step 5: Run typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -30`
Expected: Clean for this file.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/index.tsx
git commit -m "fix(my-tasks): balanced header spacing via screenLayout.header zone"
```

---

### Task 9: Profile tab — edit action UX redesign

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Add Pencil import and remove TAB_BAR_HEIGHT**

```tsx
// Add to lucide imports:
import { Pencil, Settings } from 'lucide-react-native';

// Add screenLayout import:
import { screenLayout } from '../../design/screenLayout';
```

Remove the `TAB_BAR_HEIGHT` constant (line 37):
```tsx
// DELETE this line:
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
```

Remove the `Platform` import from `react-native` if no longer used.

- [ ] **Step 2: Replace DetailTemplate usage — remove CTA bar, add rightActions**

Replace the `<DetailTemplate>` opening tag and its props:

```tsx
    <DetailTemplate
      testID="SCR-SHARED-012"
      headerTitle={t('shared.profile.title', 'Профайл')}
      rightActions={[
        {
          icon: <Pencil size={22} color={colors.primary} />,
          onPress: () => router.push('/(shared)/profile/edit'),
          testID: 'profile-edit-action',
        },
        {
          icon: <Settings size={22} color={colors.primary} />,
          onPress: () => router.push('/(shared)/profile/settings'),
          testID: 'profile-settings-action',
        },
      ]}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      errorMessage={t('shared.profile.errorNetwork', 'Сүлжээний алдаа гарлаа')}
    >
```

Removed: `ctaLabel`, `ctaOnPress`, `secondaryCtaLabel`, `secondaryCtaOnPress`, `ctaBarExtraBottomPadding`, `rightAction`.

- [ ] **Step 3: Add inline stats CTA for taskers (replaces sticky bar)**

After the `{/* Trust Banner for Taskers */}` section, add an inline stats link for taskers:

```tsx
          {/* Stats Link for Taskers */}
          {isTasker && (
            <Pressable
              onPress={() => router.push('/(tasker)/stats')}
              style={styles.statsLink}
              testID="profile-stats-link"
            >
              <Text style={styles.statsLinkText}>
                {t('shared.profile.viewStats', 'Статистик харах')}
              </Text>
            </Pressable>
          )}
```

Add `Pressable` and `Text` to the `react-native` import if not already there. Add `Pressable` to the existing import line.

- [ ] **Step 4: Update styles — add `statsLink`, update `content` bottom padding**

Add to styles:

```tsx
  content: {
    gap: spacing.xl,
    paddingBottom: screenLayout.chrome.contentBottomClearance,
  },
  statsLink: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  statsLinkText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/(tabs)/profile.tsx
git commit -m "fix(profile): replace sticky edit CTA with header icon, add inline stats link"
```

---

### Task 10: Migrate remaining screens (5 files — mechanical replacement)

These files need only `screenRhythm` -> `screenLayout` import swap and token rename. No layout changes.

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/rebook.tsx`
- Modify: `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/stats.tsx`

- [ ] **Step 1: Migrate inbox screen**

In `apps/mobile/src/app/(tabs)/inbox/index.tsx`:

Replace import:
```tsx
// Old:
import { screenRhythm } from '../../../design/screenRhythm';
// New:
import { screenLayout } from '../../../design/screenLayout';
```

Replace all `screenRhythm.*` references:
- `screenRhythm.contentInsetX` -> `screenLayout.insetX`
- `screenRhythm.contentInsetTop` -> `screenLayout.header.topInset`
- `screenRhythm.itemGap` -> `screenLayout.body.itemGap`

- [ ] **Step 2: Migrate bookings screen**

In `apps/mobile/src/app/(customer)/bookings/index.tsx`:

Replace import:
```tsx
// Old:
import { screenRhythm } from '../../../design/screenRhythm';
// New:
import { screenLayout } from '../../../design/screenLayout';
```

Replace all references:
- `screenRhythm.contentInsetX` -> `screenLayout.insetX`
- `screenRhythm.itemGap` -> `screenLayout.body.itemGap`
- `screenRhythm.sectionGap` -> `screenLayout.body.sectionGap`
- `screenRhythm.blockGap` -> `screenLayout.body.blockGap`
- `screenRhythm.cardPadding` -> `screenLayout.body.cardPadding`

- [ ] **Step 3: Migrate rebook screen**

In `apps/mobile/src/app/(customer)/rebook.tsx`:

Replace import:
```tsx
// Old:
import { screenRhythm, screenTypography } from '../../design/screenRhythm';
// New:
import { screenLayout, screenTypography } from '../../design/screenLayout';
```

Replace all references:
- `screenRhythm.itemGap` -> `screenLayout.body.itemGap`
- `screenRhythm.sectionGap` -> `screenLayout.body.sectionGap`
- `screenRhythm.cardPadding` -> `screenLayout.body.cardPadding`

- [ ] **Step 4: Migrate disputes screen**

In `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`:

Replace import:
```tsx
// Old:
import { screenRhythm } from '../../../../design/screenRhythm';
// New:
import { screenLayout } from '../../../../design/screenLayout';
```

Replace all references:
- `screenRhythm.contentInsetX` -> `screenLayout.insetX`
- `screenRhythm.microGap` -> `screenLayout.body.microGap`
- `screenRhythm.blockGap` -> `screenLayout.body.blockGap`

- [ ] **Step 5: Migrate tasker stats screen**

In `apps/mobile/src/app/(tasker)/stats.tsx`:

Replace import:
```tsx
// Old:
import { screenRhythm, screenTypography } from '../../design/screenRhythm';
// New:
import { screenLayout, screenTypography } from '../../design/screenLayout';
```

Replace all references:
- `screenRhythm.blockGap` -> `screenLayout.body.blockGap`
- `screenRhythm.itemGap` -> `screenLayout.body.itemGap`
- `screenRhythm.microGap` -> `screenLayout.body.microGap`

- [ ] **Step 6: Run full typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -40`
Expected: Clean — no more references to `screenRhythm`.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/(tabs)/inbox/index.tsx \
       apps/mobile/src/app/(customer)/bookings/index.tsx \
       apps/mobile/src/app/(customer)/rebook.tsx \
       apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx \
       apps/mobile/src/app/(tasker)/stats.tsx
git commit -m "refactor: migrate 5 screens from screenRhythm to screenLayout"
```

---

### Task 11: Delete `screenRhythm.ts` + verify

**Files:**
- Delete: `apps/mobile/src/design/screenRhythm.ts`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -r "screenRhythm" apps/mobile/src/`
Expected: No matches (only the file itself, which we're about to delete).

- [ ] **Step 2: Delete the file**

```bash
rm apps/mobile/src/design/screenRhythm.ts
```

- [ ] **Step 3: Run full typecheck**

Run: `cd apps/mobile && npx tsc --noEmit 2>&1 | head -20`
Expected: Clean compilation — no file references the deleted module.

- [ ] **Step 4: Run existing tests**

Run: `cd apps/mobile && npx jest --passWithNoTests 2>&1 | tail -20`
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete screenRhythm.ts — fully replaced by screenLayout"
```
