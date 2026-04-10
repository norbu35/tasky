# Mobile UI Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix visual quality across the top 20 mobile screens — enforce the existing design system through NativeWind classes, canonical components, and lint guardrails.

**Architecture:** Phase 1 builds the foundation (typography consolidation, two new components, deprecated prop cleanup, lint rules). Phase 2 migrates 20 high-impact screens to use the foundation. Phase 3 fixes platform-specific issues (FAB, shadows, tab bar). All phases gate on typecheck + lint.

**Tech Stack:** React Native 0.76, Expo 52, Expo Router 4, NativeWind v4, Tailwind CSS 3.4, class-variance-authority, @tasky/design-tokens

**Spec:** `docs/superpowers/specs/2026-04-11-mobile-ui-polish-design.md`

---

## File Structure

### New files (Phase 1)
| File | Responsibility |
|------|---------------|
| `src/components/ui/ListItemCard.tsx` | Canonical list-row card component for tasks, bookings, jobs |
| `src/components/ui/ActionRow.tsx` | Canonical settings/profile action row component |

### Modified files (Phase 1)
| File | Change |
|------|--------|
| `src/design/tailwind-screen-typography.ts` | Add `.font-screen-subtitle` and `.font-screen-label` utilities |
| `src/design/screenLayout.ts` | Remove dead `screenTypography` export (lines 66-87) |
| `src/lib/cn.ts` | Add new typography classes to font-size class group |
| `src/components/ui/index.ts` | Add ListItemCard and ActionRow exports |
| `src/components/templates/DetailTemplate.tsx` | Remove deprecated props (`headerTitle`, `onBack`, `rightAction`) |
| `src/app/(tabs)/profile.tsx` | Remove deprecated `headerTitle` prop from DetailTemplate call |
| `.eslintrc.cjs` | Add `no-restricted-syntax` rules for inline fontSize and hex colors |

### Modified files (Phase 2) — 20 screen files
Each screen file gets inline `style={}` replaced with NativeWind classes, hand-rolled cards replaced with `ListItemCard`, and hand-rolled action rows replaced with `ActionRow`.

### Modified files (Phase 3)
| File | Change |
|------|--------|
| `src/components/ui/FAB.tsx` | Replace `Dimensions.get('window')` with `useWindowDimensions()` |

---

## Phase 1 — Foundation

### Task 1: Consolidate typography system

**Files:**
- Modify: `src/design/tailwind-screen-typography.ts` (add 2 utilities)
- Modify: `src/design/screenLayout.ts:66-87` (remove dead export)
- Modify: `src/lib/cn.ts:16` (extend font-size class group)

- [ ] **Step 1: Add `.font-screen-subtitle` and `.font-screen-label` to Tailwind plugin**

In `apps/mobile/src/design/tailwind-screen-typography.ts`, add these utilities after `.font-screen-card-title`:

```typescript
    '.font-screen-subtitle': {
      fontSize: `${scale.subtitle}px`,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      lineHeight: `${Math.round(scale.subtitle * 1.35)}px`,
    },
    '.font-screen-label': {
      fontSize: `${scale.label}px`,
      fontFamily: 'PlusJakartaSans_500Medium',
      lineHeight: `${Math.round(scale.label * 1.3)}px`,
    },
```

- [ ] **Step 2: Remove dead `screenTypography` export from screenLayout.ts**

Delete lines 66-87 of `apps/mobile/src/design/screenLayout.ts` — the entire `export const screenTypography = { ... }` block. This object is never imported anywhere. The Tailwind plugin is the single source of truth.

- [ ] **Step 3: Update cn.ts font-size class group**

In `apps/mobile/src/lib/cn.ts`, update the `font-size` class group (line 16) to include screen typography utilities that the tailwind-merge needs to know about:

```typescript
      'font-size': [
        {
          text: ['hero-title', 'heading', 'title', 'subtitle', 'body', 'label', 'caption', 'micro', 'nav-label'],
        },
        {
          font: ['screen-greeting', 'screen-title', 'screen-section', 'screen-card-title', 'screen-subtitle', 'screen-label'],
        },
      ],
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: No new errors. `screenTypography` was never imported, so removal is safe.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design/tailwind-screen-typography.ts apps/mobile/src/design/screenLayout.ts apps/mobile/src/lib/cn.ts
git commit -m "refactor(mobile): consolidate typography — add subtitle/label utilities, remove dead screenTypography"
```

---

### Task 2: Build ListItemCard component

**Files:**
- Create: `src/components/ui/ListItemCard.tsx`
- Modify: `src/components/ui/index.ts` (add export)

- [ ] **Step 1: Create ListItemCard component**

Create `apps/mobile/src/components/ui/ListItemCard.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { elevations } from '../../design/elevations';
import { cn } from '../../lib/cn';

type IconSize = 'sm' | 'md';

const iconSizeMap: Record<IconSize, string> = {
  sm: 'w-11 h-11 rounded-md',
  md: 'w-12 h-12 rounded-md',
};

export interface ListItemCardProps {
  /** Left slot — typically a View wrapping an icon */
  icon?: React.ReactNode;
  /** Icon box visual size. sm: 44x44, md: 48x48. Default: md */
  iconSize?: IconSize;
  /** Primary text. Renders with font-screen-card-title, max 2 lines. */
  title: string;
  /** Secondary text. Renders as caption, max 1 line. */
  subtitle?: string;
  /** Top-left badge slot — renders above the title (e.g. StatusBadge, category chip). */
  badge?: React.ReactNode;
  /** Right-aligned slot — renders vertically centered (e.g. PriceTag, ChevronRight). */
  trailing?: React.ReactNode;
  onPress: () => void;
  testID?: string;
  className?: string;
}

export function ListItemCard({
  icon,
  iconSize = 'md',
  title,
  subtitle,
  badge,
  trailing,
  onPress,
  testID,
  className,
}: ListItemCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-md p-lg rounded-lg bg-card',
        className,
      )}
      style={({ pressed }) => [
        elevations.soft,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      {icon && (
        <View className={cn('items-center justify-center shrink-0', iconSizeMap[iconSize])}>
          {icon}
        </View>
      )}
      <View className="flex-1 gap-sm min-w-0">
        {badge}
        <Text
          className="font-screen-card-title text-primary-deep"
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-caption text-text-secondary"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && (
        <View className="shrink-0 self-center">
          {trailing}
        </View>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2: Add export to barrel**

In `apps/mobile/src/components/ui/index.ts`, add after the last export:

```typescript
export * from './ListItemCard';
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS — new component, no breaking changes.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/ListItemCard.tsx apps/mobile/src/components/ui/index.ts
git commit -m "feat(mobile): add ListItemCard — canonical list-row component"
```

---

### Task 3: Build ActionRow component

**Files:**
- Create: `src/components/ui/ActionRow.tsx`
- Modify: `src/components/ui/index.ts` (add export)

- [ ] **Step 1: Create ActionRow component**

Create `apps/mobile/src/components/ui/ActionRow.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

export interface ActionRowProps {
  /** Left icon — rendered inside a 40x40 tinted circle. */
  icon: React.ReactNode;
  /** Row label text. */
  label: string;
  onPress: () => void;
  /** Show bottom border. Default: true. */
  showDivider?: boolean;
  /** Right-aligned slot. Default: ChevronRight. */
  trailing?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function ActionRow({
  icon,
  label,
  onPress,
  showDivider = true,
  trailing,
  testID,
  className,
}: ActionRowProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center p-md gap-md',
        showDivider && 'border-b border-border/50',
        className,
      )}
      style={({ pressed }) => [pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10">
        {icon}
      </View>
      <Text className="flex-1 text-body font-sans-medium text-foreground">
        {label}
      </Text>
      {trailing ?? <ChevronRight size={20} color={colors.navInactive} />}
    </Pressable>
  );
}
```

- [ ] **Step 2: Add export to barrel**

In `apps/mobile/src/components/ui/index.ts`, add after the ListItemCard export:

```typescript
export * from './ActionRow';
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/ActionRow.tsx apps/mobile/src/components/ui/index.ts
git commit -m "feat(mobile): add ActionRow — canonical settings/profile action row"
```

---

### Task 4: Clean up deprecated DetailTemplate props

**Files:**
- Modify: `src/components/templates/DetailTemplate.tsx:14-38,53-59`
- Modify: `src/app/(tabs)/profile.tsx:39`

- [ ] **Step 1: Remove deprecated props from DetailTemplate interface**

In `apps/mobile/src/components/templates/DetailTemplate.tsx`, update the `DetailTemplateProps` interface (lines 14-38) to remove three deprecated props:

Remove these lines:
```typescript
  /** @deprecated Title is now set via Stack.Screen options in the layout. */
  headerTitle?: string;
  /** @deprecated Back navigation is now handled by the native Stack header. */
  onBack?: () => void;
```

And remove:
```typescript
  /** @deprecated Use rightActions instead. */
  rightAction?: { icon: React.ReactNode; onPress: () => void };
```

- [ ] **Step 2: Remove destructuring of deprecated props in component body**

In the same file, update the destructuring in the `DetailTemplate` function (lines 53-66). Remove:

```typescript
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  headerTitle: _headerTitle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack: _onBack,
  rightAction,
```

And update the `effectiveActions` line (around line 80) from:
```typescript
  const effectiveActions = rightActions ?? (rightAction ? [rightAction] : null);
```
to:
```typescript
  const effectiveActions = rightActions ?? null;
```

- [ ] **Step 3: Remove deprecated prop from profile.tsx**

In `apps/mobile/src/app/(tabs)/profile.tsx`, line 39, remove:
```typescript
      headerTitle={t('shared.profile.title')}
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS. If any other file passes these removed props, TypeScript will catch it — fix those call sites by removing the props.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/templates/DetailTemplate.tsx apps/mobile/src/app/(tabs)/profile.tsx
git commit -m "refactor(mobile): remove deprecated DetailTemplate props — headerTitle, onBack, rightAction"
```

---

### Task 5: Enhance ESLint rules for NativeWind enforcement

**Files:**
- Modify: `apps/mobile/.eslintrc.cjs`

- [ ] **Step 1: Add inline fontSize and hex color bans to screen-level rules**

In `apps/mobile/.eslintrc.cjs`, update the `no-restricted-syntax` rule in the `src/app/**/*.{ts,tsx}` override (line 27). Add two new selectors after the existing `StyleSheet.create` ban:

```javascript
                "no-restricted-syntax": ["warn",
                    {
                        selector: "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
                        message: "Screens must use NativeWind className instead of StyleSheet.create."
                    },
                    {
                        selector: "Property[key.name='fontSize'][value.type!='MemberExpression']",
                        message: "Use typography classes (text-body, font-screen-card-title, etc.) instead of inline fontSize. See design spec."
                    }
                ]
```

Note: Change severity from `"error"` to `"warn"` for the existing `StyleSheet.create` rule. The current `"error"` level may block development on un-migrated screens. After Phase 2 migration is complete, promote back to `"error"`.

- [ ] **Step 2: Verify lint runs without new failures on already-clean files**

Run: `cd /Users/norov/workspace/projects/tasky/apps/mobile && npx eslint src/components/ui/ListItemCard.tsx src/components/ui/ActionRow.tsx --no-error-on-unmatched-pattern`
Expected: PASS — the new components use className, not inline styles.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/.eslintrc.cjs
git commit -m "chore(mobile): add ESLint rules — warn on inline fontSize in screens"
```

---

### Task 6: Runtime navigation audit

**This task is manual — it cannot be executed by an agent.** The user must run the app on a simulator/emulator and verify each flow.

- [ ] **Step 1: Document the audit protocol**

For each screen listed in `docs/superpowers/specs/2026-04-11-mobile-ui-polish-design.md` section 4.4, navigate to the screen and verify:
1. Back button exists (or screen is intentionally terminal — e.g., success, session-expired)
2. No double back buttons from nested Stack headers
3. Header title renders correctly in both English and Mongolian
4. Content does not render under the status bar or notch
5. Screen is reachable via the intended navigation path

- [ ] **Step 2: Test as Customer role**

Navigate through: Login → Home → My Tasks → Task Detail → Applicants → Back to list. Post a task through the full wizard (all 8 steps). View Bookings → Booking Detail → Timeline → Back. Open Profile → Settings → Back. Open Notifications → Back.

- [ ] **Step 3: Test as Tasker role**

Navigate through: Login → Browse → Task Detail → Apply → Back. My Jobs → Job Detail → Back. Stats → Back. Verification flow (all steps). Profile → Settings → Back.

- [ ] **Step 4: Document findings**

Create a file listing any navigation issues found, with screenshots. Fix all issues found before proceeding to Phase 2. Typical fixes:
- Double header: add `headerShown: false` to the offending Stack.Screen in the group layout
- Missing back button: ensure the parent layout doesn't set `headerShown: false` for that screen, OR add an in-screen back button
- Content under status bar: ensure ScreenContainer has `edges={['top', 'left', 'right']}`

- [ ] **Step 5: Commit any navigation fixes**

```bash
git add -A
git commit -m "fix(mobile): navigation audit — fix [describe specific issues found]"
```

---

## Phase 2 — High-Impact Screen Migration

> **Parallelization:** Tasks 7-18 are independent of each other. They can be dispatched as parallel worktree agents after Phase 1 is committed. Each task depends only on Phase 1 foundation components.

### Migration rules (apply to ALL Phase 2 tasks)

Every screen migration follows these rules:

1. **Replace inline `style={}` with NativeWind classes** for: `padding`, `margin`, `gap`, `backgroundColor`, `borderRadius`, `flex`, `alignItems`, `justifyContent`, `flexDirection`, `width`/`height` (when using token values).
2. **Keep inline `style={}` only for:** Reanimated animated styles, computed values with `insets.*`, elevation spreads (`...elevations.soft`), and `pressed` opacity/scale feedback.
3. **Replace hand-rolled list cards** with `ListItemCard` from `src/components/ui/ListItemCard`.
4. **Replace hand-rolled action rows** with `ActionRow` from `src/components/ui/ActionRow`.
5. **Replace hardcoded font sizes** (e.g., `text-[20px]`) with typography token classes (e.g., `text-title`).
6. **Remove redundant weight declarations** — e.g., `font-screen-card-title font-bold` becomes just `font-screen-card-title` (it already sets 700 weight via the font family).
7. **Use semantic spacing classes** — `gap-sm` (8px), `gap-md`/`gap-item` (12px), `gap-lg`/`gap-block` (16px), `gap-xl`/`gap-section` (24px).
8. **Verify** with `pnpm -r typecheck` after each migration.

---

### Task 7: Migrate (customer)/tasks/index.tsx — task list card fix

This is the highest-priority screen — the broken task list the user specifically called out.

**Files:**
- Modify: `src/app/(customer)/tasks/index.tsx`

- [ ] **Step 1: Read the current file**

Read `apps/mobile/src/app/(customer)/tasks/index.tsx` to understand current state.

- [ ] **Step 2: Replace hand-rolled TaskCard with ListItemCard**

The current `TaskCard` component (lines 65-118) uses inline styles with 4px inner gaps. Replace it entirely:

```tsx
import { ListItemCard } from '../../../components/ui/ListItemCard';

// Delete the entire TaskCard function (lines 65-118) and replace with:

function TaskCard({ task, onPress }: { task: TaskLike; onPress: () => void }) {
  const { t } = useTranslation();
  const status = mapStatus(task.status ?? 'open');
  const visual = getTaskVisual(task.category?.name, t);
  const Icon = visual.Icon;

  return (
    <View className="mx-screen-x">
      <ListItemCard
        testID={`task-card-${task.id}`}
        onPress={onPress}
        icon={
          <View
            className="w-12 h-12 rounded-md items-center justify-center"
            style={{ backgroundColor: visual.tone }}
          >
            <Icon color={visual.tint} size={24} />
          </View>
        }
        title={task.description ?? t('customer.taskList.noTitle')}
        badge={
          <View className="flex-row items-center justify-between gap-sm">
            <View
              className="self-start px-sm py-xs rounded-full shrink"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text
                className="text-micro font-sans-bold tracking-widest uppercase text-primary-deep"
                numberOfLines={1}
              >
                {task.category?.name ?? t('customer.taskList.categoryFallback')}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>
        }
        trailing={<PriceTag amount={task.budget ?? 0} size="sm" />}
      />
    </View>
  );
}
```

Key changes:
- Icon shrinks from 60x60 to 48x48 (`w-12 h-12`)
- Inner card gap changes from `gap-micro` (4px) to `gap-sm` (8px) via ListItemCard
- Card padding is now `p-lg` (16px) via ListItemCard
- `backgroundColor: visual.tone` stays inline because it's a computed color with opacity

- [ ] **Step 3: Update SkeletonCard to match new card proportions**

Replace the `SkeletonCard` function (lines 120-133):

```tsx
function SkeletonCard() {
  return (
    <View className="mx-screen-x">
      <View className="bg-card rounded-lg p-lg flex-row gap-md items-start" style={elevations.soft}>
        <View className="w-12 h-12 rounded-md bg-muted shrink-0" />
        <View className="flex-1 gap-sm pt-xs">
          <View className="h-2.5 rounded-full bg-muted w-2/5" />
          <View className="h-4 rounded-full bg-muted w-11/12" />
          <View className="h-3 rounded-full bg-muted w-3/4" />
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Fix FlatList item separator spacing**

In the `MyTasksListScreen` function, change the `ItemSeparatorComponent` (around line 351) from:
```tsx
ItemSeparatorComponent={() => <View className="h-md" />}
```
to:
```tsx
ItemSeparatorComponent={() => <View className="h-item" />}
```

This changes the gap between cards from 12px (`md`) to 12px (`item`) — same value but using the semantic name for consistency with FeedListTemplate.

- [ ] **Step 5: Fix hero card stat chips spacing**

In the `Header` component (around line 170), change the stat chips container from:
```tsx
<View className="flex-row gap-micro">
```
to:
```tsx
<View className="flex-row gap-sm">
```

This changes chip spacing from 4px to 8px — appropriate for sibling stat cards.

- [ ] **Step 6: Add missing ListItemCard import**

Add to the imports at the top of the file:
```tsx
import { ListItemCard } from '../../../components/ui/ListItemCard';
```

Remove the `elevations` import from the TaskCard if it's no longer used directly (ListItemCard handles elevation internally). Keep it if SkeletonCard or other components still use it.

- [ ] **Step 7: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/index.tsx
git commit -m "fix(mobile): task list card spacing — adopt ListItemCard, fix icon size and inner gaps"
```

---

### Task 8: Migrate (tabs)/profile.tsx — ActionRow adoption

**Files:**
- Modify: `src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Read the current file**

Read `apps/mobile/src/app/(tabs)/profile.tsx` to understand current state.

- [ ] **Step 2: Replace hardcoded font size**

Change line 59 from:
```tsx
<Text className="text-[20px] font-semibold text-primary-deep text-center">
```
to:
```tsx
<Text className="text-title font-sans-semibold text-primary-deep text-center">
```

`text-title` resolves to 20px from the design token scale. `font-sans-semibold` maps to `PlusJakartaSans_600SemiBold`.

- [ ] **Step 3: Replace hand-rolled action rows with ActionRow**

Add import:
```tsx
import { ActionRow } from '../../components/ui/ActionRow';
```

Replace the action rows block (lines 108-155). Current code has three hand-rolled `Pressable` rows inside a `<View className="bg-muted rounded-md overflow-hidden">`. Replace with:

```tsx
          <View className="bg-muted rounded-md overflow-hidden">
            <ActionRow
              testID="action-row-edit-profile"
              icon={<UserPen size={20} color={colors.primary} />}
              label={t('shared.profile.editProfile')}
              onPress={() => router.push('/(shared)/profile/edit')}
            />
            {isTasker && (
              <ActionRow
                testID="action-row-view-stats"
                icon={<BarChart2 size={20} color={colors.secondary} />}
                label={t('shared.profile.viewStats')}
                onPress={() => router.push('/(tasker)/stats')}
              />
            )}
            <ActionRow
              testID="action-row-settings"
              icon={<Settings size={20} color={colors.textSecondary} />}
              label={t('shared.profile.settings')}
              onPress={() => router.push('/(shared)/profile/settings')}
              showDivider={false}
            />
          </View>
```

- [ ] **Step 4: Remove unused imports**

After replacing the action rows, `ChevronRight` is no longer used directly. Remove it from the lucide import:
```tsx
import { UserPen, Settings, BarChart2 } from 'lucide-react-native';
```

Add the `mobileTheme` import if not present (needed for `colors` in ActionRow icon colors):
```tsx
import { mobileTheme } from '../../design/tokenAdapter';
const { colors } = mobileTheme;
```

- [ ] **Step 5: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/(tabs)/profile.tsx
git commit -m "fix(mobile): profile tab — replace hardcoded font size, adopt ActionRow"
```

---

### Task 9: Migrate (tabs)/index.tsx — tab home screen

**Files:**
- Modify: `src/app/(tabs)/index.tsx`

- [ ] **Step 1: Read the current file**

Read `apps/mobile/src/app/(tabs)/index.tsx` to understand current state.

- [ ] **Step 2: Apply migration rules**

This screen is the tab home that routes to either customer task browse or tasker browse. Apply the standard migration rules:
- Replace all inline `style={}` for token-backed properties with NativeWind classes
- Replace hardcoded font sizes with typography classes
- Ensure spacing uses semantic gap/padding classes
- If it contains hand-rolled list cards, replace with `ListItemCard`

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(tabs)/index.tsx
git commit -m "fix(mobile): tab home — migrate inline styles to NativeWind classes"
```

---

### Task 10: Migrate (customer)/tasks/new/category.tsx — category selection grid

**Files:**
- Modify: `src/app/(customer)/tasks/new/category.tsx`

- [ ] **Step 1: Read the current file**

Read `apps/mobile/src/app/(customer)/tasks/new/category.tsx` to understand current state.

- [ ] **Step 2: Apply migration rules**

This screen renders a grid of category cards. Apply:
- Replace inline `style={{ height: 14, width: '65%', borderRadius: 4, backgroundColor: colors.border }}` patterns with NativeWind classes
- Replace `style={{ gap: spacing.md }}` with `className="gap-md"`
- Replace inline padding/backgroundColor/borderRadius with Tailwind equivalents
- Keep `style={{ backgroundColor: visual.tone }}` if it's a computed color

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/new/category.tsx
git commit -m "fix(mobile): category screen — migrate inline styles to NativeWind classes"
```

---

### Task 11: Migrate wizard screens — location, intake, schedule, photos

**Files:**
- Modify: `src/app/(customer)/tasks/new/location.tsx`
- Modify: `src/app/(customer)/tasks/new/intake.tsx`
- Modify: `src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `src/app/(customer)/tasks/new/photos.tsx`

- [ ] **Step 1: Read all four files**

Read each file to understand current state.

- [ ] **Step 2: Migrate location.tsx**

Apply migration rules. Key patterns to convert:
- Form field containers: inline gap/padding → `gap-item`, `p-lg`
- Input wrapper backgrounds: inline `backgroundColor` → `bg-card`, `bg-muted`
- Map container sizing: keep inline `style` if height is dynamic or percentage-based

- [ ] **Step 3: Migrate intake.tsx**

Apply migration rules. This is a larger file (~400 lines). Key patterns:
- Form fields with inline padding → `p-lg`, `gap-item`
- Section headers with inline fontSize → `font-screen-section`
- Textarea containers with inline borderRadius → `rounded-md`

- [ ] **Step 4: Migrate schedule.tsx**

Apply migration rules. Key patterns:
- Date/time picker containers with inline gap → `gap-block`
- Section dividers with inline margin → `mt-section`

- [ ] **Step 5: Migrate photos.tsx**

Apply migration rules. Key patterns:
- Photo grid containers with inline gap → `gap-sm`
- Photo placeholder boxes with inline dimensions → keep if dynamic, convert if token-based

- [ ] **Step 6: Verify typecheck passes for all four files**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/new/location.tsx apps/mobile/src/app/(customer)/tasks/new/intake.tsx apps/mobile/src/app/(customer)/tasks/new/schedule.tsx apps/mobile/src/app/(customer)/tasks/new/photos.tsx
git commit -m "fix(mobile): wizard screens — migrate location/intake/schedule/photos to NativeWind"
```

---

### Task 12: Migrate wizard screens — review and success

**Files:**
- Modify: `src/app/(customer)/tasks/new/review.tsx`
- Modify: `src/app/(customer)/tasks/new/success.tsx`

- [ ] **Step 1: Read both files**

Read `review.tsx` (~600 lines, mega-screen) and `success.tsx`.

- [ ] **Step 2: Migrate review.tsx**

This is a mega-screen. Apply migration rules methodically:
- Replace all inline `style={{ padding: ... }}` with `p-*` classes
- Replace all inline `style={{ gap: ... }}` with `gap-*` classes
- Replace all inline `style={{ backgroundColor: ... }}` with `bg-*` classes
- Replace all inline `style={{ borderRadius: ... }}` with `rounded-*` classes
- Keep elevation spreads and computed styles inline

- [ ] **Step 3: Migrate success.tsx**

Apply migration rules. Success screens are typically simpler — centered layout with icon, title, description, and CTAs.

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/(customer)/tasks/new/review.tsx apps/mobile/src/app/(customer)/tasks/new/success.tsx
git commit -m "fix(mobile): wizard screens — migrate review and success to NativeWind"
```

---

### Task 13: Migrate customer booking screens

**Files:**
- Modify: `src/app/(customer)/bookings/index.tsx`
- Modify: `src/app/(customer)/bookings/[bookingId]/index.tsx`
- Modify: `src/app/(customer)/bookings/confirmed.tsx`

- [ ] **Step 1: Read all three files**

Read each file. `bookings/index.tsx` is a mega-screen (~586 lines).

- [ ] **Step 2: Migrate bookings/index.tsx**

This is a list screen. If it builds a custom FlatList instead of using FeedListTemplate, consider refactoring to use FeedListTemplate. At minimum:
- Replace all inline styles with NativeWind classes
- Replace hand-rolled booking cards with `ListItemCard` where the card layout matches (icon + title + badge + trailing)
- Use semantic spacing classes

- [ ] **Step 3: Migrate bookings/[bookingId]/index.tsx**

Detail screen using DetailTemplate. Apply migration rules to the content inside the template.

- [ ] **Step 4: Migrate bookings/confirmed.tsx**

Success/confirmation screen. Apply migration rules.

- [ ] **Step 5: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/(customer)/bookings/
git commit -m "fix(mobile): booking screens — migrate to NativeWind and ListItemCard"
```

---

### Task 14: Migrate (tabs)/bookings.tsx

**Files:**
- Modify: `src/app/(tabs)/bookings.tsx`

- [ ] **Step 1: Read the file**

Read `apps/mobile/src/app/(tabs)/bookings.tsx`.

- [ ] **Step 2: Apply migration rules**

This is the bookings tab screen. Apply standard migration rules — inline styles to NativeWind classes, adopt ListItemCard for booking rows if applicable.

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(tabs)/bookings.tsx
git commit -m "fix(mobile): bookings tab — migrate inline styles to NativeWind"
```

---

### Task 15: Migrate tasker screens

**Files:**
- Modify: `src/app/(tasker)/tasks/[taskId].tsx`
- Modify: `src/app/(tasker)/jobs/index.tsx`
- Modify: `src/app/(tasker)/jobs/[bookingId]/index.tsx`

- [ ] **Step 1: Read all three files**

- [ ] **Step 2: Migrate tasker task detail**

Apply migration rules. DetailTemplate content — replace inline styles.

- [ ] **Step 3: Migrate tasker jobs list**

List screen — replace inline styles, adopt ListItemCard for job rows.

- [ ] **Step 4: Migrate tasker job detail**

DetailTemplate content — replace inline styles.

- [ ] **Step 5: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/(tasker)/
git commit -m "fix(mobile): tasker screens — migrate task detail, jobs list, job detail to NativeWind"
```

---

### Task 16: Migrate shared screens — settings, notifications

**Files:**
- Modify: `src/app/(shared)/profile/settings.tsx`
- Modify: `src/app/(shared)/notifications.tsx`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Migrate settings.tsx**

This screen likely has hand-rolled action rows. Replace with `ActionRow` component. Apply standard inline style migration.

- [ ] **Step 3: Migrate notifications.tsx**

List screen — apply standard migration rules.

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/(shared)/profile/settings.tsx apps/mobile/src/app/(shared)/notifications.tsx
git commit -m "fix(mobile): shared screens — migrate settings (ActionRow) and notifications to NativeWind"
```

---

### Task 17: Migrate (auth)/index.tsx — login screen

**Files:**
- Modify: `src/app/(auth)/index.tsx`

- [ ] **Step 1: Read the file**

- [ ] **Step 2: Apply migration rules**

Login screen — replace inline backgroundColor, padding, gap, borderRadius with NativeWind classes. Replace hardcoded font sizes with typography classes.

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(auth)/index.tsx
git commit -m "fix(mobile): auth login — migrate inline styles to NativeWind"
```

---

## Phase 3 — Platform Polish

### Task 18: Fix FAB dimension handling

**Files:**
- Modify: `src/components/ui/FAB.tsx`

- [ ] **Step 1: Read the current file**

Read `apps/mobile/src/components/ui/FAB.tsx`.

- [ ] **Step 2: Replace Dimensions.get with useWindowDimensions**

Replace the `Dimensions.get('window')` call (line 35) with the `useWindowDimensions` hook:

Remove:
```tsx
import { Dimensions, Pressable } from 'react-native';
```

Add:
```tsx
import { Pressable, useWindowDimensions } from 'react-native';
```

Replace line 35:
```tsx
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
```
with:
```tsx
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
```

This makes the FAB respond to dimension changes (rotation, Android multi-window, iPad split view) reactively instead of reading stale values.

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/ui/FAB.tsx
git commit -m "fix(mobile): FAB — use useWindowDimensions for reactive dimension handling"
```

---

### Task 19: Shadow and elevation audit

**Files:**
- Possibly modify: `src/design/elevations.ts`

- [ ] **Step 1: Visual audit on both platforms**

Run the app on iOS Simulator and Android Emulator. For each elevation preset (`soft`, `card`, `elevated`, `navBar`), compare visual shadow weight across platforms. Take screenshots.

- [ ] **Step 2: Adjust Android elevation if needed**

If Android elevation produces significantly different visual weight than iOS shadows, adjust the elevation values in `apps/mobile/src/design/elevations.ts`. Common issue: Android elevation renders a hard shadow while iOS renders a soft diffuse shadow. Typical fix: reduce Android elevation by 1 level.

- [ ] **Step 3: Verify tab bar shadow parity**

The tab bar uses custom shadow on iOS and `elevation: 8` on Android. If the visual weight differs significantly, adjust the tab bar shadow in `(tabs)/_layout.tsx` or the elevation value.

- [ ] **Step 4: Keyboard behavior audit**

Test all screens with text inputs on both platforms:
- `FormWizardTemplate` screens (task creation wizard, profile edit, dispute) — verify keyboard pushes content up without clipping the sticky action bar
- `AuthTemplate` screens (login) — verify keyboard doesn't obscure the form
- `KeyboardAvoidingView` behavior: iOS should use `behavior="padding"`, Android should use `behavior="height"`. Check `FormWizardTemplate.tsx` line 105 — currently both platforms use `"height"`, verify this works correctly on iOS (may need `"padding"` on iOS).

- [ ] **Step 5: Status bar contrast audit**

Verify `StatusBar style="auto"` (set in root `_layout.tsx`) produces correct text color contrast on all header backgrounds. The app uses a light background (`#F9F8F5`), so status bar text should be dark. Check on both platforms.

- [ ] **Step 6: Commit any changes**

```bash
git add apps/mobile/src/design/elevations.ts apps/mobile/src/app/(tabs)/_layout.tsx
git commit -m "fix(mobile): shadow parity — adjust Android elevation to match iOS visual weight"
```

---

### Task 20: Final verification and lint clean

**Files:**
- All Phase 1-2-3 files

- [ ] **Step 1: Run full typecheck**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm -r typecheck`
Expected: PASS with no new errors.

- [ ] **Step 2: Run lint on all migrated screen files**

Run: `cd /Users/norov/workspace/projects/tasky/apps/mobile && npx eslint src/app/ --ext .ts,.tsx --max-warnings 50`
Expected: No errors. Warnings should only be for un-migrated files (Phase 4 backlog).

- [ ] **Step 3: Verify no regressions in component imports**

Run: `cd /Users/norov/workspace/projects/tasky/apps/mobile && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors.

- [ ] **Step 4: Commit clean state**

If any final fixups were needed:
```bash
git add -A
git commit -m "chore(mobile): Phase 1-3 complete — lint and typecheck clean"
```
