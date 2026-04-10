# Mobile Safe-Area Hardening Design

**Date:** 2026-04-10
**Status:** draft
**Scope:** All active mobile screens — ensure every screen respects device safe-area insets for heading and content positioning

## Problem

The April 2026 visual audit (see `docs/quality/mobile-visual-defects-2026-04.md`) fixed 12 defects but missed a class of issue: screen headings rendering behind the device notch or status bar. The root cause is that not all screen templates enforce safe-area insets, and several standalone screens have no safe-area wrapping at all.

Specifically:

- `FeedListTemplate` does not wrap its content in `SafeAreaView` or `ScreenContainer`. It applies a hard-coded `paddingTop` to the FlatList's `contentContainerStyle`, but this padding does not cover the `ListHeaderComponent` (which contains the `ScreenHeader`). Result: headings on all FeedListTemplate screens render at `(0, 0)`, overlapping the notch.
- Seven standalone screens use custom layouts with no safe-area protection.

The audit rubric includes "safe-area/keyboard behavior" as a review category, but the reviewers focused on keyboard-open states and missed static safe-area compliance for headings.

## Inventory

### Template SafeArea status

| Template/Shell             | Provides SafeAreaView? | How                                  | Screens using it |
| -------------------------- | ---------------------- | ------------------------------------ | ---------------- |
| ScreenContainer            | Yes                    | `SafeAreaView` edges: top/left/right | ~5 direct uses   |
| AuthTemplate               | Yes                    | Via ScreenContainer                  | 2                |
| DetailTemplate             | Yes                    | Via ScreenContainer                  | ~8               |
| FormWizardTemplate         | Yes                    | Via ScreenContainer                  | ~10              |
| SuccessCelebrationTemplate | Yes                    | Via ScreenContainer                  | ~3               |
| FeedListTemplate           | **No**                 | Plain `<View>` wrapper               | ~5               |
| ErrorStateTemplate         | **No**                 | Depends on parent                    | Fallback only    |
| PermissionPrimer           | **No**                 | Parent wraps in ScreenContainer      | 3 (protected)    |

### Screen categories

| Category                                                    | Count | Safe-area protected?  |
| ----------------------------------------------------------- | ----- | --------------------- |
| Template-backed (Auth/Detail/FormWizard/SuccessCelebration) | ~23   | Yes                   |
| ScreenContainer-wrapped directly                            | ~5    | Yes                   |
| FeedListTemplate-backed                                     | ~5    | **No — systemic gap** |
| Standalone (no template/shell)                              | ~7    | **Mixed — mostly No** |

### Standalone screens with safe-area gaps

| Screen            | Route                            | Content pattern            | Risk   |
| ----------------- | -------------------------------- | -------------------------- | ------ |
| Chat detail       | `(tabs)/inbox/[id].tsx`          | Custom KAV + manual header | High   |
| Notifications     | `(shared)/notifications.tsx`     | FlatList, no wrapper       | Medium |
| Network error     | `(shared)/network-error.tsx`     | Centered content           | Low    |
| App update        | `(shared)/app-update.tsx`        | Centered content           | Low    |
| Delete account    | `(shared)/profile/delete.tsx`    | Centered content           | Low    |
| Banned account    | `(shared)/account/banned.tsx`    | Centered content           | Low    |
| Suspended account | `(shared)/account/suspended.tsx` | Centered content           | Low    |

## Constraints

- Fixes must use the existing `ScreenContainer` shell for consistency. Do not introduce a new safe-area wrapper.
- Do not break existing Maestro flows — all `testID` attributes must be preserved.
- Do not change the visual design language — headings should look the same, just positioned correctly.
- The fix order is shared layers first, then screen-local, per the audit operating model.

## Approach

### Tier 1: Fix FeedListTemplate (systemic)

**What:** Wrap `FeedListTemplate`'s root `<View>` in `ScreenContainer` so that all screens using it automatically get safe-area protection on the top, left, and right edges.

**Why this works:** Every other content template (`DetailTemplate`, `FormWizardTemplate`, `AuthTemplate`, `SuccessCelebrationTemplate`) already wraps in `ScreenContainer`. Making `FeedListTemplate` consistent closes the systemic gap.

**Details:**

1. Import `ScreenContainer` into `FeedListTemplate`.
2. Replace the outermost `<View>` with `<ScreenContainer>`.
3. Remove or adjust the hard-coded `paddingTop: screenLayout.header.topInset` from the FlatList's `contentContainerStyle` — this is no longer needed because `ScreenContainer`'s `SafeAreaView` handles the top inset dynamically.
4. Verify that `ListHeaderComponent` (containing `ScreenHeader`) now renders below the safe-area boundary, not behind the notch.
5. Verify that screens which nest `FeedListTemplate` inside another wrapper do not double-inset. Check all ~5 consumers:
   - `(tabs)/index.tsx`
   - `(tabs)/bookings.tsx`
   - `(tabs)/inbox/index.tsx`
   - `(tasker)/jobs/index.tsx`
   - Any other FeedListTemplate consumer

**Risk:** If any consumer already wraps `FeedListTemplate` in `ScreenContainer`, the top inset would be applied twice. Mitigation: audit all consumers before changing the template.

### Tier 2: Fix standalone screens (screen-local)

Each standalone screen gets a targeted fix, prioritized by risk.

#### 2a. Chat detail — `(tabs)/inbox/[id].tsx` (High priority)

**Problem:** Custom `KeyboardAvoidingView` layout with a manually-padded header (`pt-lg pb-md`). No `SafeAreaView` — heading overlaps the notch on notched devices.

**Fix:** Wrap the screen's root in `ScreenContainer`. Replace the hard-coded `pt-lg` top padding on the header with the dynamic safe-area inset provided by `ScreenContainer`. Keep the `KeyboardAvoidingView` inside `ScreenContainer`.

#### 2b. Notifications — `(shared)/notifications.tsx` (Medium priority)

**Problem:** After DEF-012 removed the duplicate custom header, this screen now relies on the Expo Router native Stack header for the title. The Stack header is safe-area-aware, so the heading itself is fine. However, the content area (FlatList) may bleed under the native header if not properly inset.

**Fix:** Verify that the content area respects the native header height. If it doesn't, wrap content in `ScreenContainer` with `edges={['left', 'right']}` (top is handled by the native header). If it already works correctly, mark as no-fix-needed.

#### 2c. Centered-content screens — network-error, app-update, delete, banned, suspended (Low priority)

**Problem:** These screens render centered content (icons, text, buttons) in a plain `<View>`. On notched devices, the top of the screen is unprotected. For centered layouts the visual impact is low (content is centered, not near the notch), but it is still incorrect.

**Fix:** Wrap each screen's root `<View>` in `ScreenContainer`. This is a minimal, low-risk change that brings them in line with the rest of the app.

## Verification

### Per-change verification

After each template/screen fix:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit -- --passWithNoTests --testPathPattern="<relevant test pattern>"
```

### Full verification after all changes

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

Maestro smoke (if simulator is running):

```bash
cd apps/mobile && ./scripts/run-e2e-smoke.sh
```

### Documentation updates

- Update `docs/quality/mobile-visual-defects-2026-04.md` with new defect entries for the heading positioning issue.
- Update `docs/quality/mobile-visual-audit-ledger-2026-04.md` to reflect any status changes.
- Update `docs/quality/mobile-visual-rubric.md` to add explicit guidance under "safe-area/keyboard behavior": reviewers must check that headings and top-of-screen content render below the safe-area boundary, not just that keyboard behavior is correct.

## Success Criteria

1. Every screen in the app renders its heading/title below the device safe-area boundary.
2. No screen content overlaps the notch or status bar on notched devices (iPhone 15 Pro / iOS 17 canonical environment).
3. All existing tests pass.
4. Maestro smoke flows pass.
5. The visual audit rubric is updated to prevent this class of defect from being missed in future audits.

## Non-Goals

- Redesigning headings or changing the visual design language.
- Adding new shared components — `ScreenContainer` already exists and is sufficient.
- Fixing deferred/unreachable screens — only active launch-live screens are in scope.
