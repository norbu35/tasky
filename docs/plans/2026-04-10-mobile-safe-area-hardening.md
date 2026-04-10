# Mobile Safe-Area Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every active mobile screen renders headings and content below the device safe-area boundary, fixing a systemic gap in `FeedListTemplate` and 7 standalone screens.

**Architecture:** The fix is split into two tiers. Tier 1 wraps `FeedListTemplate` in the existing `ScreenContainer` shell (which provides `SafeAreaView`), closing the gap for ~5 screens in one change. Tier 2 wraps 7 standalone screens in `ScreenContainer` individually. A final task updates the visual audit rubric to prevent this class of defect from being missed.

**Tech Stack:** React Native, Expo Router, NativeWind, `react-native-safe-area-context`, `@tasky/design-tokens`, shared mobile templates/shells under `apps/mobile/src/components/`

---

## Execution Rules

- Fix shared layers (Tier 1) before screen-local layers (Tier 2).
- Preserve all existing `testID` props — these are required by Maestro flows.
- Do not change the visual design language — headings look the same, just positioned correctly.
- Run typecheck + tests after each task.

---

### Task 1: Wrap FeedListTemplate in ScreenContainer

**Files:**

- Modify: `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- Test: `apps/mobile/__tests__/components/templates/FeedListTemplate.test.tsx`

**Step 1: Read the file and understand the current structure**

Read `apps/mobile/src/components/templates/FeedListTemplate.tsx`. Note:

- Lines 1-15: imports — no `ScreenContainer` imported
- Line 164: root element is `<View className={cn('flex-1 bg-background', className)} testID={testID}>`
- Lines 171-175: `contentContainerStyle` has `paddingTop: screenLayout.header.topInset` (24px hard-coded, not safe-area-aware)
- Lines 116-131: loading state also uses `<View>` root (same pattern)
- Lines 133-145: error state also uses `<View>` root
- Lines 147-161: empty state also uses `<View>` root

All four render paths use the same `<View className={cn('flex-1 bg-background', className)} testID={testID}>` wrapper. The fix must apply to all four paths.

**Step 2: Import ScreenContainer**

Add the import at the top of `FeedListTemplate.tsx`:

```typescript
import { ScreenContainer } from "../shells/ScreenContainer";
```

**Step 3: Replace all root `<View>` wrappers with `<ScreenContainer>`**

In all four render paths (loading, error, empty, data), replace:

```tsx
<View className={cn('flex-1 bg-background', className)} testID={testID}>
```

with:

```tsx
<ScreenContainer className={className} testID={testID}>
```

This works because `ScreenContainer` already applies `flex-1 bg-background` via its own `className` prop and passes `testID` through to the `SafeAreaView`.

**Step 4: Remove the redundant hard-coded `paddingTop`**

In the FlatList's `contentContainerStyle` (line 171-175), remove `paddingTop: screenLayout.header.topInset`:

Before:

```typescript
contentContainerStyle={{
  paddingHorizontal: screenLayout.insetX,
  paddingTop: screenLayout.header.topInset,
  paddingBottom: screenLayout.chrome.contentBottomClearance,
}}
```

After:

```typescript
contentContainerStyle={{
  paddingHorizontal: screenLayout.insetX,
  paddingBottom: screenLayout.chrome.contentBottomClearance,
}}
```

Also in the loading skeleton branch (line 121), the class `pt-header-top` serves the same purpose. Remove it:

Before:

```tsx
<View className="px-screen-x pt-header-top">
```

After:

```tsx
<View className="px-screen-x">
```

**Step 5: Verify**

```bash
cd /Users/norov/workspace/projects/tasky
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --passWithNoTests --testPathPattern="FeedListTemplate"
```

Both must pass. The existing test `does not use hard-coded template bottom padding values` checks `paddingBottom` not `paddingTop`, so it should still pass. If any test references `paddingTop`, update it to reflect the removal.

**Step 6: Commit**

```bash
git add apps/mobile/src/components/templates/FeedListTemplate.tsx apps/mobile/__tests__/components/templates/FeedListTemplate.test.tsx
git commit -m "fix(mobile): wrap FeedListTemplate in ScreenContainer for safe-area protection"
```

---

### Task 2: Wrap chat detail screen in ScreenContainer

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/inbox/[id].tsx`

**Step 1: Read the file**

Read `apps/mobile/src/app/(tabs)/inbox/[id].tsx`. Note:

- The screen's root is a `KeyboardAvoidingView` (or a plain `<View>` wrapping it)
- The custom header uses hard-coded NativeWind classes like `pt-lg` for top padding — not safe-area-aware
- No `ScreenContainer` or `SafeAreaView` wrapping

**Step 2: Import ScreenContainer**

```typescript
import { ScreenContainer } from "../../../components/shells/ScreenContainer";
```

**Step 3: Wrap the root in ScreenContainer**

Wrap the outermost element in `<ScreenContainer>`. Keep `KeyboardAvoidingView` inside it:

```tsx
<ScreenContainer testID="SCR-SHARED-011">
  <KeyboardAvoidingView ... >
    {/* existing content */}
  </KeyboardAvoidingView>
</ScreenContainer>
```

**Step 4: Remove hard-coded top padding from the header**

The custom header row likely has `pt-lg` or similar class for top padding. Remove it — `ScreenContainer`'s `SafeAreaView` now handles the top inset dynamically.

If the header has `className="pt-lg pb-md ..."`, change to `className="pb-md ..."`.

**Step 5: Verify**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --passWithNoTests --testPathPattern="ChatDetail"
```

Both must pass.

**Step 6: Commit**

```bash
git add "apps/mobile/src/app/(tabs)/inbox/[id].tsx"
git commit -m "fix(mobile): wrap chat detail screen in ScreenContainer for safe-area protection"
```

---

### Task 3: Wrap notifications screen in ScreenContainer

**Files:**

- Modify: `apps/mobile/src/app/(shared)/notifications.tsx`

**Step 1: Read the file**

Read `apps/mobile/src/app/(shared)/notifications.tsx`. After DEF-012, the duplicate header was removed and the screen relies on the Expo Router native Stack header for the title. Check whether the root element is already wrapped in `ScreenContainer` or `SafeAreaView`.

**Step 2: Determine if a fix is needed**

- If the screen's root is a plain `<View>` with a `<FlatList>` inside, it needs wrapping.
- The native Stack header handles the title safe-area, but the content FlatList may bleed under the header.
- Wrap in `<ScreenContainer edges={['left', 'right']}>` — top is handled by the native Stack header.

**Step 3: Import ScreenContainer and wrap**

```typescript
import { ScreenContainer } from "../../components/shells/ScreenContainer";
```

Replace the root `<View>` with:

```tsx
<ScreenContainer edges={['left', 'right']} testID="SCR-SHARED-016">
```

Move the existing `testID` from the old root to `ScreenContainer`.

**Step 4: Verify**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --passWithNoTests --testPathPattern="NotificationCenter"
```

Both must pass.

**Step 5: Commit**

```bash
git add "apps/mobile/src/app/(shared)/notifications.tsx"
git commit -m "fix(mobile): wrap notifications screen in ScreenContainer for safe-area protection"
```

---

### Task 4: Wrap centered-content standalone screens in ScreenContainer

**Files:**

- Modify: `apps/mobile/src/app/(shared)/network-error.tsx`
- Modify: `apps/mobile/src/app/(shared)/app-update.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/delete.tsx`
- Modify: `apps/mobile/src/app/(shared)/account/banned.tsx`
- Modify: `apps/mobile/src/app/(shared)/account/suspended.tsx`

All five screens follow the same pattern: a root `<View className="flex-1 justify-center items-center px-... bg-background">` with centered content (icon, text, button). None use `ScreenContainer`.

**Step 1: For each screen, import ScreenContainer**

```typescript
import { ScreenContainer } from "../../components/shells/ScreenContainer"; // adjust relative path per file
```

For files in `account/`, the import path is:

```typescript
import { ScreenContainer } from "../../../components/shells/ScreenContainer";
```

**Step 2: Replace root `<View>` with `<ScreenContainer>`**

For each screen, replace:

```tsx
<View
  testID="SCR-..."
  className="flex-1 justify-center items-center px-xl bg-background"
>
```

with:

```tsx
<ScreenContainer testID="SCR-...">
  <View className="flex-1 justify-center items-center px-xl">
```

And add a closing `</View>` before the closing `</ScreenContainer>`.

This preserves the centered layout (the inner `<View>` handles `justify-center items-center px-xl`) while `ScreenContainer` handles safe-area and `bg-background`.

**Step 3: Verify**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false --passWithNoTests --testPathPattern="NetworkError|AppUpdate|AccountDeletion|BannedAccount|SuspendedAccount"
```

Both must pass.

**Step 4: Commit**

```bash
git add \
  "apps/mobile/src/app/(shared)/network-error.tsx" \
  "apps/mobile/src/app/(shared)/app-update.tsx" \
  "apps/mobile/src/app/(shared)/profile/delete.tsx" \
  "apps/mobile/src/app/(shared)/account/banned.tsx" \
  "apps/mobile/src/app/(shared)/account/suspended.tsx"
git commit -m "fix(mobile): wrap 5 centered-content screens in ScreenContainer for safe-area protection"
```

---

### Task 5: Update visual audit rubric and defect log

**Files:**

- Modify: `docs/quality/mobile-visual-rubric.md`
- Modify: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Update the rubric**

In `docs/quality/mobile-visual-rubric.md`, find the "Safe-Area / Keyboard Behavior" category. Add explicit guidance that reviewers must check:

- **Pass:** All headings and top-of-screen content render below the safe-area boundary on notched devices. No content overlaps the notch or status bar. Keyboard-open states do not obscure inputs or action bars.
- **Fail:** Any heading, title, or top-of-screen content renders behind the notch or status bar. Content is obscured by the keyboard without a scroll/avoidance mechanism.

The key addition is the heading/safe-area compliance check — the original rubric only mentioned keyboard behavior.

**Step 2: Add defect entries to the defect log**

Reopen the defect log status to `in-progress`. Add new defect entries:

- **DEF-017** (systemic, major, template): FeedListTemplate missing SafeAreaView — headings render behind notch on all FeedListTemplate screens. Fix: wrapped in ScreenContainer.
- **DEF-018** (screen-local, major, screen): Chat detail screen missing SafeAreaView — custom header overlaps notch. Fix: wrapped in ScreenContainer.
- **DEF-019** (screen-local, minor, screen): 5 centered-content screens (network-error, app-update, delete, banned, suspended) missing SafeAreaView. Fix: wrapped in ScreenContainer.

After fixes land, update status to `resolved`. Update summary counts.

**Step 3: Verify formatting**

```bash
pnpm exec prettier --check docs/quality/mobile-visual-rubric.md docs/quality/mobile-visual-defects-2026-04.md
```

Apply `--write` if needed, then re-check.

**Step 4: Commit**

```bash
git add docs/quality/mobile-visual-rubric.md docs/quality/mobile-visual-defects-2026-04.md
git commit -m "docs(mobile): update audit rubric and defect log for safe-area hardening"
```

---

### Task 6: Full verification

**Step 1: Run full typecheck and test suite**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

Both must pass.

**Step 2: Run Maestro smoke (if simulator is running)**

```bash
cd apps/mobile && ./scripts/run-e2e-smoke.sh
```

All 3 flows must pass.

**Step 3: Final prettier check**

```bash
pnpm exec prettier --check docs/quality/mobile-visual-rubric.md docs/quality/mobile-visual-defects-2026-04.md apps/mobile/src/components/templates/FeedListTemplate.tsx
```

Must pass.
