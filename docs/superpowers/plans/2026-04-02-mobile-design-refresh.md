# Mobile Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution Note (2026-04-02):** Apply this file together with `docs/superpowers/plans/2026-04-02-mobile-design-refresh-comprehensive-plan.md` and `docs/superpowers/plans/2026-04-02-mobile-route-normalization-matrix.md` for corrected routing/workflow guidance and blocker handling.

**Goal:** Replace the visual shell of the Tasky mobile app with the Figma "Mobile" designs across 63 screens while preserving all existing business logic, data hooks, and navigation.

**Architecture:** Five parallel agents each own a domain (auth, inbox/profile/infra, customer task flow, customer booking flow, tasker flow). Each screen is implemented by combining three sources in priority order: (1) `docs/design/screen-specs/SCR-*.yaml` wins for component choice and state coverage, (2) Figma `get_design_context` wins for layout/spacing/visual hierarchy, (3) existing code wins for all hooks, navigation calls, and data props. No hardcoded hex values or pixel numbers — all via `mobileTheme` tokens.

**Tech Stack:** React Native (Expo), TypeScript, Expo Router, `mobileTheme` from `src/design/tokenAdapter.ts`, lucide-react-native icons, existing component library at `src/components/ui/`

---

## Execution Environment (Required)

Use **one git worktree per agent lane** to isolate parallel edits and keep TDD loops scoped.

Recommended worktree branches:
- `agent/mobile-refresh-a1-auth-onboarding`
- `agent/mobile-refresh-a2a-shared-profile`
- `agent/mobile-refresh-a2b-infra`
- `agent/mobile-refresh-a3-customer-task`
- `agent/mobile-refresh-a4-customer-booking`
- `agent/mobile-refresh-a5-tasker`

Rules:
- Each lane edits only files assigned in `docs/superpowers/plans/2026-04-02-mobile-route-normalization-matrix.md`.
- No cross-lane file edits without explicit reassignment.
- Run TDD per SCR/state slice in-lane before moving to the next SCR.
- Do not defer tests in autonomous mode; lane checks must pass before handoff.
- Rebase each lane branch on latest main before integration.

---

## Conflict-Resolution Rule (read before implementing any screen)

When sources contradict each other, apply this priority:

| What to decide | Winner | Example |
|---|---|---|
| Which component to render | **Spec** | Spec says `COMP-MODALSHEET`; Figma shows a full-page layout → use ModalSheetTemplate |
| Which states to implement | **Spec** | Spec lists 12 states; Figma only shows 3 → implement all 12 |
| Which copy to show | **Spec** (`copy:` block) | Figma has English placeholder; spec has Mongolian Cyrillic → use spec copy via `useTranslation()` |
| Spacing, padding, card shape | **Figma** | Spec says nothing about card corner radius; Figma shows 16px → use `radius.lg` |
| Color identity (which semantic token) | **Spec** / **global-context.yaml** | Figma hex `#1B3A5C` → `colors.primary` |
| Exact hex value | **mobileTheme token** (never raw hex) | Figma `#C49A3C` → `colors.secondary` |
| Hooks, API calls, navigation | **Existing code** (preserve unchanged) | Figma implies a different navigation pattern → keep `router.push()` calls as-is |

---

## Token Mapping Quick Reference

Map Figma hex values to `mobileTheme.colors` tokens. Never copy hex values verbatim.

| Figma hex | mobileTheme token | Role |
|---|---|---|
| `#1B3A5C` | `colors.primary` | Deep Sky Blue — buttons, headers |
| `#102638` | `colors.primaryDeep` | Deeper Sky — hero text |
| `#C49A3C` | `colors.secondary` | Steppe Gold — ratings, prices |
| `#6BA3BE` | `colors.accent` | Open Sky — links, accents |
| `#F9F8F5` | `colors.background` | Off-white surface |
| `#F3F1EC` | `colors.muted` | Muted backgrounds, benefit cards |
| `#EF4444` | `colors.danger` | Errors only |
| `#3568A1` | `colors.trust` | Trust badges |
| `#469178` | `colors.verified` | Verification badges |
| `#808D99` | `colors.textSecondary` | Secondary text |
| `rgba(0,0,0,N)` scrim | `colors.primaryDeep` at 50% opacity | `${colors.primaryDeep}80` |

Spacing tokens: `spacing.xs=4`, `spacing.sm=8`, `spacing.md=12`, `spacing.lg=16`, `spacing.xl=24`, `spacing['2xl']=32`.
Radius tokens: `radius.xs=6`, `radius.sm=8`, `radius.md=12`, `radius.lg=16`, `radius.full=9999`.
Typography: use `typography.*` keys; never hardcode `fontSize`.

---

## Figma Source

- **File key:** `IljfnTQPkq7vpkmK1NN1NC`
- **Call:** `get_design_context(fileKey="IljfnTQPkq7vpkmK1NN1NC", nodeId="<nodeId>", clientFrameworks="react-native,expo", clientLanguages="typescript")`
- Figma returns React/web code. Adapt every CSS property to RN `StyleSheet`:
  - `display: flex` → default RN (remove)
  - `background-color` → `backgroundColor`
  - `border-radius: 12px` → `borderRadius: radius.md`
  - `padding: 16px` → `padding: spacing.lg`
  - `font-size: 16px` → `fontSize: typography.body`
  - `gap: 8px` → `gap: spacing.sm` (RN 0.71+ supports gap in flex)
  - `box-shadow` → use `shadows.card` or `shadows.elevated` from `mobileTheme`

---

## Worked Example: SCR-SHARED-009 — Permission Primer (Notifications)

This example shows the complete adaptation process. All agents follow this same pattern.

**Figma node:** `2:362` | **Spec:** `docs/design/screen-specs/SCR-SHARED-009.yaml` | **File:** `app/(auth)/permission-notifications.tsx`

### Step 1: Read the spec

From `SCR-SHARED-009.yaml`:
- Template: `modal_sheet` (current code is full-screen — this must change)
- States: `default`, `granted`, `denied` (current code handles these ✓)
- Components: `COMP-MODALSHEET`, two `COMP-BUTTON` (primary + ghost)
- Critical acceptance criteria:
  - "Sheet has drag handle but is not dismissible by dragging"
  - "If denied, fallback message shows with settings hint"
  - Copy must use spec copy keys (e.g., `heading: "Мэдэгдлийн зөвшөөрөл"`)

### Step 2: Call get_design_context

```
get_design_context(
  fileKey="IljfnTQPkq7vpkmK1NN1NC",
  nodeId="2:362",
  clientFrameworks="react-native,expo",
  clientLanguages="typescript"
)
```

Note from result: Figma shows a bottom sheet with a large Bell icon centered above the heading, a description paragraph, and two stacked buttons at the bottom. Spacing around icon is generous (~32px). Card background is off-white. Button stack has `gap: 12px`.

### Step 3: Identify what to preserve from existing code

From `permission-notifications.tsx`, keep:
```typescript
// KEEP ALL OF THESE — do not modify
const { t } = useTranslation();
const router = useRouter();
const completeOnboarding = useAppStore((state) => state.completeOnboarding);
const [isDenied, setIsDenied] = React.useState(false);
const finishFlow = () => { completeOnboarding(); router.replace('/(tabs)'); };
const handleGrant = async () => { ... };
```

Remove: the existing `BENEFITS` array, `heroGlow`, `heroCard`, `heroAccent`, `benefits` section — spec doesn't list these components.

### Step 4: Implement

Apply Figma layout + spec components + token system + preserved hooks:

```typescript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { Button } from '../../components/ui';
import { ModalSheetTemplate } from '../../components/templates/ModalSheetTemplate';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function PermissionNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [isDenied, setIsDenied] = React.useState(false);

  // PRESERVED — do not change
  const finishFlow = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleGrant = async () => {
    const result = await requestNotificationPermission();
    if (result.status === 'granted') { finishFlow(); return; }
    setIsDenied(true);
  };

  return (
    <ModalSheetTemplate dismissible={false} testID="permission-notifications-screen">
      <View style={styles.iconContainer}>
        <Bell size={48} color={colors.primary} />
      </View>

      <Text style={styles.heading}>
        {t('auth.permissions.notificationsTitle', 'Мэдэгдлийн зөвшөөрөл')}
      </Text>
      <Text style={styles.description}>
        {t('auth.permissions.notificationsDescription',
          'Шинэ өргөдөл, захиалгын мэдээллийг цаг тухайд нь авахын тулд мэдэгдлийг зөвшөөрнө үү')}
      </Text>

      <View style={styles.actions}>
        {isDenied ? (
          <>
            <Text style={styles.deniedMessage}>
              {t('auth.permissions.notificationsDenied', 'Мэдэгдлийн зөвшөөрөл хаагдсан')}
            </Text>
            <Text style={styles.settingsHint}>
              {t('auth.permissions.notificationsSettings', 'Тохиргооноос мэдэгдлийг нээх боломжтой')}
            </Text>
            <Button
              testID="permission-continue-button"
              label={t('auth.permissions.continue', 'Үргэлжлүүлэх')}
              variant="primary"
              size="xl"
              onPress={finishFlow}
            />
          </>
        ) : (
          <>
            <Button
              testID="permission-allow-button"
              label={t('auth.permissions.allow', 'Зөвшөөрөх')}
              variant="primary"
              size="xl"
              onPress={() => { void handleGrant(); }}
            />
            <Button
              testID="permission-skip-button"
              label={t('auth.permissions.skip', 'Дараа хийх')}
              variant="ghost"
              size="md"
              onPress={finishFlow}
            />
          </>
        )}
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.pageHeading,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.6,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
  deniedMessage: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  settingsHint: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
```

### Step 5: Verify acceptance criteria

Check each item from `SCR-SHARED-009.yaml acceptance_criteria` against the implementation:
- [ ] "Bottom sheet displays bell icon, explanation heading, and description" → ✓ ModalSheetTemplate + Bell icon + Text
- [ ] "Allow button triggers the OS native push notification permission dialog" → ✓ `handleGrant()` calls `requestNotificationPermission()`
- [ ] "If role is CUSTOMER, screen replaces to My Tasks after grant/skip" → ✓ `finishFlow()` calls `router.replace('/(tabs)')`
- [ ] "If denied, fallback message shows with settings hint" → ✓ `isDenied` state renders `deniedMessage` + `settingsHint`
- [ ] "Sheet has drag handle but is not dismissible by dragging" → ✓ `dismissible={false}` prop on ModalSheetTemplate
- [ ] "No hardcoded hex values" → ✓ all via `mobileTheme.colors.*` tokens

---

## Task 0: Pre-flight (run once before dispatching any agent)

**Files:** Read-only setup

- [ ] Read `docs/design/component-contract.yaml` in full — this is your component reference
- [ ] Read `docs/design/prompts/global-context.yaml` — this is the design token reference
- [ ] Read `docs/design/prompts/generation-tracker.md` — note the 14 duplicate Stitch screens listed for removal
- [ ] Read `docs/superpowers/specs/2026-04-02-mobile-design-refresh-design.md` — the full design spec
- [ ] Confirm Figma MCP is available: call `get_design_context(fileKey="IljfnTQPkq7vpkmK1NN1NC", nodeId="2:87")` (Splash screen). If it errors, stop and report.
- [ ] Run `pnpm --filter @tasky/mobile typecheck` — baseline must pass before any changes

## Shared-File Conflict Matrix (read before parallel work)

Use this ownership map to prevent branch collisions. If you need to touch a file owned by another agent, sync with that owner first and rebase before commit.

| Shared file | Owner agent | Consumer agents | Rule |
|---|---|---|---|
| `app/(tabs)/index.tsx` | Agent 3 (customer states) | Agent 5 (tasker states) | Agent 3 lands first, Agent 5 rebases and edits only tasker branch |
| `app/task/[id].tsx` | Agent 5 | none | Tasker task detail only; customer detail is in `app/(customer)/tasks/[taskId]/index.tsx` |
| `components/templates/ErrorStateTemplate.tsx` | Agent 2 | Agents 1–5 | Keep props backward compatible; run targeted smoke on all screens using template |
| `app/(shared)/legal/privacy.tsx` | Agent 5 | Agent 2 (legal group) | Agent 5 owns edits; Agent 2 does not modify privacy screen |
| `app/(shared)/legal/terms.tsx` | Agent 2 | Agent 5 | Agent 2 owns edits; Agent 5 does not modify terms screen |
| `features/bookings/components/CustomerCancelSheet.tsx` | Agent 4 | none | Keep testIDs stable for existing tests |
| `features/bookings/components/TaskerCancelSheet.tsx` | Agent 5 | none | Keep testIDs stable for existing tests |
| `features/bookings/components/TaskerNoShowSheet.tsx` | Agent 5 | Agent 4 | Agent 5 owns tasker version; Agent 4 only touches customer no-show |

---

## Task 1: Agent 1 — Auth & Onboarding (9 screens)

**Runs in parallel with Tasks 2–5.**

**Design docs to read first:**
- `docs/design/screen-specs/SCR-SHARED-001.yaml` through `SCR-SHARED-009.yaml`
- `docs/design/component-contract.yaml` (especially COMP-BUTTON, COMP-MODALSHEET)

### SCR-SHARED-001 — Splash / Launch Screen

**Spec:** `docs/design/screen-specs/SCR-SHARED-001.yaml` | **Figma:** `2:87` | **File:** `app/index.tsx` (update)

- [ ] Read `SCR-SHARED-001.yaml` — extract template, states, components, acceptance_criteria
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:87")` — note visual layout
- [ ] Read existing `app/index.tsx` — identify hooks/navigation to preserve
- [ ] Implement: spec template + Figma layout + mobileTheme tokens + preserved hooks
- [ ] Verify all acceptance_criteria items from spec

### SCR-SHARED-002 — Auth — Login

**Spec:** `docs/design/screen-specs/SCR-SHARED-002.yaml` | **Figma:** `2:320` | **File:** `app/(auth)/index.tsx` (or `app/(auth)/login.tsx` — follow spec `route:` field)

- [ ] Read `SCR-SHARED-002.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:320")`
- [ ] Read existing file — preserve all auth hooks, Facebook OAuth calls, `useTranslation`
- [ ] Implement — spec has 7 states; implement all (loading, idle, error, etc.)
- [ ] Verify all acceptance_criteria

### SCR-SHARED-003 — Auth — OTP Verification

**Spec:** `docs/design/screen-specs/SCR-SHARED-003.yaml` | **Figma:** `2:193` | **File:** `app/(auth)/otp.tsx` (create)

- [ ] Read `SCR-SHARED-003.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:193")`
- [ ] Implement with all 7 states (idle, loading, success, error, resend-cooldown, expired, invalid-code)
- [ ] Register screen in `app/(auth)/_layout.tsx`: add `<Stack.Screen name="otp" />`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-004 — Auth — OTP Migration Gate

**Spec:** `docs/design/screen-specs/SCR-SHARED-004.yaml` | **Figma:** `2:413` | **File:** `app/(auth)/otp-migration.tsx` (create)

- [ ] Read `SCR-SHARED-004.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:413")`
- [ ] Implement with all 5 states
- [ ] Register in `app/(auth)/_layout.tsx`: `<Stack.Screen name="otp-migration" />`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-005 — Onboarding Carousel

**Spec:** `docs/design/screen-specs/SCR-SHARED-005.yaml` | **Figma:** `2:2` | **File:** `app/onboarding.tsx` (update)

- [ ] Read `SCR-SHARED-005.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:2")` — note slide layout, pagination dots
- [ ] Implement 3-slide carousel with pagination — use `FlatList` with `pagingEnabled` or existing carousel pattern in codebase
- [ ] Check existing codebase for an `OnboardingCarousel` component before creating a new one: `grep -r "carousel\|Carousel" apps/mobile/src/`
- [ ] Do not register onboarding in `app/(auth)/_layout.tsx`; `app/onboarding.tsx` is root-level and auto-registered by Expo Router
- [ ] Verify all acceptance_criteria

### SCR-SHARED-006 — Role Selection

**Spec:** `docs/design/screen-specs/SCR-SHARED-006.yaml` | **Figma:** `2:38` | **File:** `app/(auth)/role-select.tsx` (update)

- [ ] Read `SCR-SHARED-006.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:38")`
- [ ] Read existing `app/(auth)/role-select.tsx` — preserve all role-setting logic
- [ ] Implement — spec has 2 states; Figma shows card-based role selector
- [ ] Verify all acceptance_criteria

### SCR-SHARED-007 — Permission Primer — Camera

**Spec:** `docs/design/screen-specs/SCR-SHARED-007.yaml` | **Figma:** `2:119` | **File:** `app/(auth)/permission-camera.tsx` (update)

- [ ] Read `SCR-SHARED-007.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:119")`
- [ ] Read existing `app/(auth)/permission-camera.tsx` — preserve `requestCameraPermission` hook calls
- [ ] Apply Figma layout — follow worked example pattern (Notification Primer)
- [ ] Implement all 3 states: default, granted, denied
- [ ] Verify all acceptance_criteria

### SCR-SHARED-008 — Permission Primer — Location

**Spec:** `docs/design/screen-specs/SCR-SHARED-008.yaml` | **Figma:** `2:250` | **File:** `app/(auth)/permission-location.tsx` (update)

- [ ] Read `SCR-SHARED-008.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:250")`
- [ ] Read existing `app/(auth)/permission-location.tsx` — preserve location permission hooks
- [ ] Implement all 3 states following worked example pattern
- [ ] Verify all acceptance_criteria

### SCR-SHARED-009 — Permission Primer — Notifications

**Spec:** `docs/design/screen-specs/SCR-SHARED-009.yaml` | **Figma:** `2:362` | **File:** `app/(auth)/permission-notifications.tsx` (update)

- [ ] Read `SCR-SHARED-009.yaml`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:362")`
- [ ] Read existing `app/(auth)/permission-notifications.tsx`
- [ ] Implement following the worked example above (see "Worked Example" section)
- [ ] Verify all acceptance_criteria

### Agent 1 — Finish

- [ ] `pnpm --filter @tasky/mobile typecheck` — must pass with zero errors
- [ ] Fix any type errors before committing
- [ ] `git add apps/mobile/src/app/(auth)/` && `git commit -m "feat(mobile): apply Figma designs to auth/onboarding screens (SCR-SHARED-001–009)"`

---

## Task 2: Agent 2 — Inbox, Profile & Infrastructure (17 screens)

**Runs in parallel with Tasks 1, 3, 4, 5.**

**Design docs to read first:**
- `docs/design/screen-specs/SCR-SHARED-010.yaml` through `SCR-SHARED-021.yaml`
- `docs/design/screen-specs/SCR-INFRA-001.yaml` through `SCR-INFRA-005.yaml`
- `docs/design/component-contract.yaml` (especially COMP-LISTROW, COMP-TOGGLE, COMP-REVIEWCARD, COMP-TOAST)

### SCR-SHARED-010 — Inbox — Conversation List

**Figma:** `2:451` | **File:** `app/(tabs)/inbox/index.tsx` (update)

- [ ] Read `SCR-SHARED-010.yaml` — note 6 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:451")`
- [ ] Read existing `app/(tabs)/inbox/index.tsx` — preserve `useConversations` hook
- [ ] Implement all 6 states (loading, empty, populated, refreshing, error, offline)
- [ ] Verify all acceptance_criteria

### SCR-SHARED-011 — Inbox — Chat Detail

**Figma:** `2:553` | **File:** `app/(tabs)/inbox/[id].tsx` (update)

- [ ] Read `SCR-SHARED-011.yaml` — note 7 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:553")`
- [ ] Read existing `app/(tabs)/inbox/[id].tsx` — preserve `useMessages`, `useSendMessage` hooks
- [ ] Implement all 7 states; note keyboard-avoiding behavior for chat input
- [ ] Verify all acceptance_criteria

### SCR-SHARED-012 — Profile — My Profile

**Figma:** `2:817` | **File:** `app/(tabs)/profile.tsx` (update)

- [ ] Read `SCR-SHARED-012.yaml` — note 4 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:817")`
- [ ] Read existing `app/(tabs)/profile.tsx` — preserve all profile data hooks
- [ ] Verify all acceptance_criteria

### SCR-SHARED-013 — Profile — Edit Profile

**Figma:** `2:756` | **File:** `app/(shared)/profile/edit.tsx` (create)

- [ ] Read `SCR-SHARED-013.yaml` — note 7 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:756")`
- [ ] Check if edit profile screen exists: `find apps/mobile/src -name "edit*" -o -name "*edit*profile*"`
- [ ] Implement — use `COMP-INPUT`, `COMP-FORMFIELD`, `COMP-PHOTOPICKER` per spec
- [ ] Add route to `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-014 — Profile — Settings

**Figma:** `2:634` | **File:** `app/(shared)/profile/settings.tsx` (update)

- [ ] Read `SCR-SHARED-014.yaml` — note 7 states, `COMP-LISTROW`, `COMP-TOGGLE`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:634")`
- [ ] Check existing: `find apps/mobile/src -name "settings*" -o -path "*/settings/*"`
- [ ] Implement using `COMP-LISTROW` for each setting row, `COMP-TOGGLE` for toggles
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-015 — Account Deletion Confirmation

**Figma:** `2:902` | **File:** `app/(shared)/profile/delete.tsx` (update)

- [ ] Read `SCR-SHARED-015.yaml` — note 5 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:902")`
- [ ] Check existing tests: `__tests__/screens/shared/profile/` for expected component testIDs
- [ ] Preserve `useDeleteAccount` hook from `features/profile/hooks/useDeleteAccount.ts`
- [ ] Register in `app/(shared)/_layout.tsx` if route options are needed; do not create `app/(shared)/settings/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-016 — Notification Center

**Figma:** `2:988` | **File:** `app/(shared)/notifications.tsx` (update)

- [ ] Read `SCR-SHARED-016.yaml` — note 5 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:988")`
- [ ] Preserve `useNotifications` hook from `features/notifications/hooks/useNotifications.ts`
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-017 — Review Form

**Figma:** `2:1089` | **File:** `app/(shared)/review/[bookingId].tsx` (update)

- [ ] Read `SCR-SHARED-017.yaml` — note 8 states, `COMP-STARRATING`, `COMP-INPUT`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1089")`
- [ ] Star rating: use existing `RatingStars` component at `components/ui/RatingStars.tsx`
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-018 — Review Reminder

**Figma:** `2:1180` | **File:** `features/review/components/ReviewReminder.tsx` (update)

- [ ] Read `SCR-SHARED-018.yaml` — note 2 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1180")`
- [ ] Use `ModalSheetTemplate` — this is a bottom sheet, not a full screen
- [ ] Verify all acceptance_criteria

### SCR-SHARED-019 — Review Hard Lock

**Figma:** `2:1215` | **File:** `features/review/components/ReviewHardLock.tsx` (update)

- [ ] Read `SCR-SHARED-019.yaml` — note 3 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1215")`
- [ ] Use `ModalSheetTemplate` — bottom sheet variant
- [ ] Verify all acceptance_criteria

### SCR-SHARED-020 — Suspended Account

**Figma:** `2:1270` | **File:** `app/(shared)/account/suspended.tsx` (update)

- [ ] Read `SCR-SHARED-020.yaml` — note 3 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1270")`
- [ ] Use `ErrorStateTemplate` — full-screen error with CTA
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-SHARED-021 — Banned Account

**Figma:** `2:1325` | **File:** `app/(shared)/account/banned.tsx` (update)

- [ ] Read `SCR-SHARED-021.yaml` — note 1 state
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1325")`
- [ ] Use `ErrorStateTemplate`
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-INFRA-001 — Network Error / Offline

**Figma:** `2:1360` | **File:** `components/templates/ErrorStateTemplate.tsx` (update)

- [ ] Read `SCR-INFRA-001.yaml` — note 4 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1360")`
- [ ] Read existing `ErrorStateTemplate.tsx` — this is a shared template, update carefully
- [ ] Do not break existing usages: `grep -r "ErrorStateTemplate" apps/mobile/src/`
- [ ] Verify all acceptance_criteria

### SCR-INFRA-002 — App Update Required

**Figma:** `2:1557` | **File:** `app/(shared)/app-update.tsx` (update)

- [ ] Read `SCR-INFRA-002.yaml` — note 2 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1557")`
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-INFRA-003 — Session Expired

**Figma:** `2:1390` | **File:** `app/(shared)/session-expired.tsx` (update)

- [ ] Read `SCR-INFRA-003.yaml` — note 1 state (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1390")`
- [ ] Use `ModalSheetTemplate`
- [ ] Verify all acceptance_criteria

### SCR-INFRA-004 — Terms of Service

**Figma:** `2:1462` | **File:** `app/(shared)/legal/terms.tsx` (update)

- [ ] Read `SCR-INFRA-004.yaml` — note 3 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1462")`
- [ ] Register in `app/(shared)/legal/_layout.tsx` (create if needed, follow privacy screen pattern)
- [ ] Verify all acceptance_criteria

### SCR-INFRA-005 — Help & Support / FAQ

**Figma:** `2:1594` | **File:** `app/(shared)/help.tsx` (update)

- [ ] Read `SCR-INFRA-005.yaml` — note 3 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1594")`
- [ ] Register in `app/(shared)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### Agent 2 — Finish

- [ ] `pnpm --filter @tasky/mobile typecheck` — must pass with zero errors
- [ ] `git add apps/mobile/src/app/(tabs)/inbox/ apps/mobile/src/app/(tabs)/profile.tsx apps/mobile/src/app/(shared)/ apps/mobile/src/features/` && `git commit -m "feat(mobile): apply Figma designs to inbox/profile/infra screens (SCR-SHARED-010–021, SCR-INFRA-001–005)"`

---

## Task 3: Agent 3 — Customer Task Flow (13 screens)

**Runs in parallel with Tasks 1, 2, 4, 5.**

**Design docs to read first:**
- `docs/design/screen-specs/SCR-CUST-001.yaml` through `SCR-CUST-013.yaml`
- `docs/design/component-contract.yaml` (especially COMP-SPLITCARD, COMP-FAB, COMP-FILTERBAR, COMP-STEPINDICATOR, COMP-PHOTOPICKER, COMP-MAPPICKER)

### SCR-CUST-001 — My Tasks — Task List

**Figma:** `2:1689` | **File:** `app/(tabs)/index.tsx` (customer view, update)

- [ ] Read `SCR-CUST-001.yaml` — note 6 states, `COMP-SPLITCARD`, `COMP-FAB`, `COMP-EMPTYSTATE`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1689")`
- [ ] Read existing `app/(tabs)/index.tsx` — note `useRole()` conditional rendering; customer and tasker share this file
- [ ] Implement only the customer branch (`isCustomer === true`); do not change the tasker branch (that is SCR-TASK-001, Task 5)
- [ ] SplitCard header: dark teal (`colors.primary`) background; body: light (`colors.background`)
- [ ] FAB hides on scroll-down, reappears on scroll-up (use `useAnimatedScrollHandler` from reanimated if already present; don't add a new dependency)
- [ ] Implement all 6 states: loading_initial, empty_activation, populated, loading_refresh, error_network, offline_cached
- [ ] Verify all acceptance_criteria

### SCR-CUST-002 — Post Task — Category Selection

**Figma:** `2:1783` | **File:** `app/(customer)/tasks/new/category.tsx`

- [ ] Read `SCR-CUST-002.yaml` — note 3 states, `COMP-STEPINDICATOR` at step 1 of 5
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1783")`
- [ ] Check if file exists: `find apps/mobile/src -path "*/tasks/new/category*"`
- [ ] `COMP-STEPINDICATOR`: use existing `StepIndicator` component; step 1 of 5
- [ ] Categories are grid of tappable chips — use `COMP-CATEGORYCHIP` per contract
- [ ] Register in `app/(customer)/_layout.tsx` if new file
- [ ] Verify all acceptance_criteria

### SCR-CUST-003 — Post Task — Intake Form

**Figma:** `2:1880` | **File:** `app/(customer)/tasks/new/intake.tsx`

- [ ] Read `SCR-CUST-003.yaml` — note 3 states, `COMP-INPUT`, `COMP-FORMFIELD`, step 2 of 5
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1880")`
- [ ] Check existing file; preserve any form submission hooks
- [ ] All inputs: 16px minimum font size (Mongolian rule from global-context.yaml)
- [ ] Inline error display below each field (not toast) per COMP-INPUT rules
- [ ] Verify all acceptance_criteria

### SCR-CUST-004 — Post Task — Photo Upload

**Figma:** `2:1956` | **File:** `app/(customer)/tasks/new/photos.tsx`

- [ ] Read `SCR-CUST-004.yaml` — note 6 states, `COMP-PHOTOPICKER`, step 3 of 5
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:1956")`
- [ ] `COMP-PHOTOPICKER`: max 3 photos, use existing `PhotoPicker` if present, else use existing `Add Photos` feature component
- [ ] Verify all acceptance_criteria

### SCR-CUST-005 — Post Task — Location Pin

**Figma:** `2:2021` | **File:** `app/(customer)/tasks/new/location.tsx`

- [ ] Read `SCR-CUST-005.yaml` — note 4 states, `COMP-MAPPICKER`, step 4 of 5
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:2021")`
- [ ] `COMP-MAPPICKER`: pin-drop map selector — check existing: `grep -r "MapPicker\|MapView\|map-picker" apps/mobile/src/`
- [ ] Preserve any location permission and geocoding hooks
- [ ] Verify all acceptance_criteria

### SCR-CUST-006 — Post Task — Schedule & Budget

**Figma:** `2:2080` | **File:** `app/(customer)/tasks/new/schedule.tsx`

- [ ] Read `SCR-CUST-006.yaml` — note 5 states, `COMP-DATEPICKER`, step 5 of 5
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:2080")`
- [ ] `COMP-DATEPICKER`: min date tomorrow; format `YYYY.MM.DD` (Mongolian convention)
- [ ] Budget input: `price_display` typography (`typography.priceDisplay`), currency format `₮{amount}` with comma thousands separator
- [ ] Verify all acceptance_criteria

### SCR-CUST-007 — Post Task — Review & Submit

**Figma:** `2:2212` | **File:** `app/(customer)/tasks/new/review.tsx`

- [ ] Read `SCR-CUST-007.yaml` — note 4 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:2212")`
- [ ] Preserve any task submission mutation hooks
- [ ] Verify all acceptance_criteria

### SCR-CUST-008 — Task Posted — Success

**Figma:** `2:16276` | **File:** `app/(customer)/tasks/new/success.tsx` (update)

- [ ] Read `SCR-CUST-008.yaml` — note 1 state, `COMP-ANIMATEDCHECKMARK`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16276")`
- [ ] Read existing `app/(customer)/tasks/new/success.tsx` and `__tests__/screens/customer/TaskPostedSuccessScreen.test.tsx`
- [ ] Use existing `SuccessCelebrationTemplate` — do not remove animated checkmark
- [ ] Verify all acceptance_criteria

### SCR-CUST-009 — Task Detail (Customer)

**Figma:** `2:16205` | **File:** `app/(customer)/tasks/[taskId]/index.tsx` (update)

- [ ] Read `SCR-CUST-009.yaml` — note 9 states (largest screen in this task)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16205")`
- [ ] Check existing: `find apps/mobile/src/app/(customer)/tasks -name \"[taskId]\" -o -name \"index.tsx\"`
- [ ] Spec wins for state coverage — implement all 9 states; do not skip "no_applicants", "applicant_timeout", "booking_confirmed" states
- [ ] Preserve any task detail and applicant hooks
- [ ] Verify all acceptance_criteria

### SCR-CUST-010 — Task Cancel Confirmation

**Figma:** `2:16325` | **File:** `features/tasks/components/TaskCancelSheet.tsx` (update)

- [ ] Read `SCR-CUST-010.yaml` — note 4 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16325")`
- [ ] Read existing `TaskCancelSheet.tsx` and `__tests__/screens/customer/TaskCancelSheet.test.tsx`
- [ ] Use `ModalSheetTemplate`; destructive action (cancel task) must use `COMP-BUTTON` danger variant
- [ ] Verify all acceptance_criteria

### SCR-CUST-011 — Applicants List

**Figma:** `2:16393` | **File:** `app/(customer)/tasks/[taskId]/applicants.tsx` (update)

- [ ] Read `SCR-CUST-011.yaml` — note 6 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16393")`
- [ ] Read existing `app/(customer)/tasks/[taskId]/applicants.tsx` and `__tests__/screens/customer/ApplicantsListScreen.test.tsx`
- [ ] Preserve applicant selection and booking confirmation hooks
- [ ] Verify all acceptance_criteria

### SCR-CUST-012 — Applicant Timeout/Decline

**Figma:** `2:16512` | **File:** `features/tasks/components/ApplicantDeclineSheet.tsx` (create)

- [ ] Read `SCR-CUST-012.yaml` — note 3 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16512")`
- [ ] Use `ModalSheetTemplate`
- [ ] Verify all acceptance_criteria

### SCR-CUST-013 — Tasker Public Profile

**Figma:** `2:16551` | **File:** `app/(customer)/taskers/[taskerId].tsx` (update)

- [ ] Read `SCR-CUST-013.yaml` — note 3 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16551")`
- [ ] Read existing `app/(customer)/taskers/[taskerId].tsx` and `__tests__/screens/customer/TaskerProfileScreen.test.tsx`
- [ ] Preserve `useTaskerProfile` hook; show `COMP-VERIFICATIONBADGE`, `COMP-REVIEWCARD`, `COMP-STARRATING`
- [ ] Verify all acceptance_criteria

### Agent 3 — Finish

- [ ] `pnpm --filter @tasky/mobile typecheck` — must pass with zero errors
- [ ] `git add apps/mobile/src/app/(tabs)/index.tsx apps/mobile/src/app/(customer)/tasks/ apps/mobile/src/app/task/ apps/mobile/src/features/tasks/` && `git commit -m "feat(mobile): apply Figma designs to customer task flow (SCR-CUST-001–013)"`

---

## Task 4: Agent 4 — Customer Booking Flow (14 screens)

**Runs in parallel with Tasks 1, 2, 3, 5.**

**Design docs to read first:**
- `docs/design/screen-specs/SCR-CUST-014.yaml` through `SCR-CUST-027.yaml`
- `docs/design/component-contract.yaml` (especially COMP-TIMELINEEVENT, COMP-SPLITCARD, COMP-MODALSHEET)

### SCR-CUST-014 — Booking Confirmation

**Figma:** `2:16679` | **File:** `app/(customer)/bookings/confirm.tsx` (update)

- [ ] Read `SCR-CUST-014.yaml` — note 5 states; liability disclaimer acceptance is a critical requirement
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16679")`
- [ ] Read existing `app/(customer)/bookings/confirm.tsx` and `__tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx`
- [ ] Preserve disclaimer acceptance logic — do not remove the liability checkbox or its state
- [ ] Verify all acceptance_criteria

### SCR-CUST-015 — Booking Confirmed — Success

**Figma:** `2:16767` | **File:** `app/(customer)/bookings/confirmed.tsx` (update)

- [ ] Read `SCR-CUST-015.yaml` — note 1 state, `COMP-ANIMATEDCHECKMARK`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16767")`
- [ ] Read existing `app/(customer)/bookings/confirmed.tsx` and `__tests__/screens/customer/bookings/BookingConfirmedScreen.test.tsx`
- [ ] Use `SuccessCelebrationTemplate`; "what happens next" guidance is required per visual_rules
- [ ] Verify all acceptance_criteria

### SCR-CUST-016 — Customer Bookings List

**Figma:** `2:16826` | **File:** `app/(tabs)/bookings.tsx` (update)

- [ ] Read `SCR-CUST-016.yaml` — note 7 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16826")`
- [ ] Read existing `app/(tabs)/bookings.tsx` — preserve `useBookings` hook and status filter
- [ ] Implement all 7 states including loading_refresh and pagination
- [ ] Verify all acceptance_criteria

### SCR-CUST-017 — Booking Detail (Customer)

**Figma:** `2:16933` | **File:** `app/(customer)/bookings/[bookingId]/index.tsx` (update)

- [ ] Read `SCR-CUST-017.yaml` — note 12 states (most complex screen in the plan)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:16933")`
- [ ] Check existing: `find apps/mobile/src/app/(customer)/bookings -name \"[bookingId]\" -o -name \"index.tsx\"`
- [ ] Spec wins for all 12 states — implement every one; do not skip "reschedule_requested", "no_show_flagged", "dispute_open" states
- [ ] Preserve `useBookingDetail`, `useBookingTimeline` hooks
- [ ] Register in `app/(customer)/bookings/_layout.tsx` or `app/(customer)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-CUST-018 — Confirm Completion — Decision

**Figma:** `2:17017` | **File:** `features/bookings/components/ConfirmCompletionSheet.tsx` (create)

- [ ] Read `SCR-CUST-018.yaml` — note 2 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17017")`
- [ ] Use `ModalSheetTemplate`; max 2 buttons per visual_rules
- [ ] Preserve `useCompleteBooking` hook from `features/bookings/hooks/useCompleteBooking.ts`
- [ ] Verify all acceptance_criteria

### SCR-CUST-019 — Booking Timeline

**Figma:** `2:17093` | **File:** `app/(customer)/bookings/[bookingId]/timeline.tsx` (update)

- [ ] Read `SCR-CUST-019.yaml` — note 3 states, `COMP-TIMELINEEVENT`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17093")`
- [ ] Check existing: `components/ui/TimelineStepper.tsx` — may be usable
- [ ] `COMP-TIMELINEEVENT`: vertical timeline entry per component contract
- [ ] Preserve `useBookingTimeline` hook
- [ ] Verify all acceptance_criteria

### SCR-CUST-020 — Reschedule

**Figma:** `2:17223` | **File:** `features/bookings/components/RescheduleModal.tsx` (update)

- [ ] Read `SCR-CUST-020.yaml` — note 6 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17223")`
- [ ] Read existing `RescheduleModal.tsx` — preserve `useReschedule` hook
- [ ] `COMP-DATEPICKER`: min date tomorrow, format YYYY.MM.DD
- [ ] Verify all acceptance_criteria

### SCR-CUST-021 — No-Show Flag + Reminder

**Figma:** `2:17362` | **File:** `features/bookings/components/CustomerNoShowSheet.tsx` (update)

- [ ] Read `SCR-CUST-021.yaml` — note 4 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17362")`
- [ ] Read existing `CustomerNoShowSheet.tsx` and `__tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx`
- [ ] Preserve `useFlagNoShow` hook
- [ ] Verify all acceptance_criteria

### SCR-CUST-022 — Booking Cancel (Customer)

**Figma:** `2:17462` | **File:** `features/bookings/components/CustomerCancelSheet.tsx` (create/update)

- [ ] Read `SCR-CUST-022.yaml` — note 4 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17462")`
- [ ] Check existing: `__tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx` — match expected testIDs
- [ ] Preserve `useCancelBooking` hook; cancel button uses `COMP-BUTTON` danger variant
- [ ] Verify all acceptance_criteria

### SCR-CUST-023 — Rebook Shortcut

**Figma:** `2:17568` | **File:** `app/(customer)/rebook.tsx` (update)

- [ ] Read `SCR-CUST-023.yaml` — note 5 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17568")`
- [ ] Use `ModalSheetTemplate` with pre-filled form summary
- [ ] Verify all acceptance_criteria

### SCR-CUST-024 — Dispute — Raise

**Figma:** `2:17672` | **File:** `app/(customer)/bookings/[bookingId]/dispute.tsx` (update)

- [ ] Read `SCR-CUST-024.yaml` — note 8 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17672")`
- [ ] Preserve `useDisputeCreate` hook from `features/disputes/hooks/useDisputeCreate.ts`
- [ ] Verify all acceptance_criteria

### SCR-CUST-025 — Dispute — Status

**Figma:** `2:17747` | **File:** `app/(customer)/disputes/[disputeId]/index.tsx` (update)

- [ ] Read `SCR-CUST-025.yaml` — note 7 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17747")`
- [ ] Preserve `useDisputeDetail` hook from `features/disputes/hooks/useDisputeDetail.ts`
- [ ] Verify all acceptance_criteria

### SCR-CUST-026 — No Applicant Rescue

**Figma:** `2:17850` | **File:** `features/tasks/components/NoApplicantRescue.tsx` (update)

- [ ] Read `SCR-CUST-026.yaml` — note 5 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17850")`
- [ ] Read existing `NoApplicantRescue.tsx` and `__tests__/screens/customer/NoApplicantRescue.test.tsx`
- [ ] Verify all acceptance_criteria

### SCR-CUST-027 — Instant Match — Customer

**Figma:** `2:17939` | **File:** `app/(customer)/tasks/[taskId]/instant-match.tsx` (create)

- [ ] Read `SCR-CUST-027.yaml` — note 5 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:17939")`
- [ ] Use `ModalSheetTemplate`
- [ ] Verify all acceptance_criteria

### Agent 4 — Finish

- [ ] `pnpm --filter @tasky/mobile typecheck` — must pass with zero errors
- [ ] `git add apps/mobile/src/app/(customer)/bookings/ apps/mobile/src/app/(tabs)/bookings.tsx apps/mobile/src/features/bookings/ apps/mobile/src/features/disputes/ apps/mobile/src/features/tasks/` && `git commit -m "feat(mobile): apply Figma designs to customer booking flow (SCR-CUST-014–027)"`

---

## Task 5: Agent 5 — Tasker Flow (10 screens)

**Runs in parallel with Tasks 1, 2, 3, 4.**

**Design docs to read first:**
- `docs/design/screen-specs/SCR-TASK-001.yaml`, `SCR-TASK-002.yaml`, `SCR-TASK-011.yaml` through `SCR-TASK-018.yaml`
- `docs/design/component-contract.yaml` (especially COMP-SPLITCARD, COMP-TRUSTBANNER, COMP-STATCARD)
- **Do not implement** SCR-TASK-003–010 (verification) — those are deferred

### SCR-TASK-001 — Browse — Task Feed (Tasker)

**Figma:** `2:18034` | **File:** `app/(tabs)/index.tsx` (tasker view, update)

- [ ] Read `SCR-TASK-001.yaml` — note 9 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:18034")`
- [ ] Read existing `app/(tabs)/index.tsx` — implement only the tasker branch (`isCustomer === false`); the customer branch was done in Task 3
- [ ] `COMP-TRUSTBANNER`: existing `TrustBanner` component — update per Figma if layout changed
- [ ] `COMP-FILTERBAR`: existing `FilterBar` component — update per Figma if layout changed
- [ ] Implement all 9 states including "verification_gate" state (shows `VerificationGate` component)
- [ ] Verify all acceptance_criteria

### SCR-TASK-002 — Task Detail (Tasker)

**Figma:** `2:18192` | **File:** `app/task/[id].tsx` (tasker view update)

- [ ] Read `SCR-TASK-002.yaml` — note 6 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:18192")`
- [ ] Note: customer task detail is `app/(customer)/tasks/[taskId]/index.tsx`; tasker task detail is `app/task/[id].tsx`. Do not merge these into one screen.
- [ ] Implement tasker-specific states without breaking customer states
- [ ] Verify all acceptance_criteria

### SCR-TASK-011 — Application Sent

**Figma:** `2:18408` | **File:** `features/tasks/components/ApplicationSentSuccess.tsx` (update)

- [ ] Read `SCR-TASK-011.yaml` — note 1 state, `COMP-ANIMATEDCHECKMARK`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:18408")`
- [ ] Read existing `ApplicationSentSuccess.tsx` and `__tests__/screens/tasker/ApplicationSent.test.tsx`
- [ ] Use `SuccessCelebrationTemplate`
- [ ] Verify all acceptance_criteria

### SCR-TASK-012 — My Jobs — Tasker View

**Figma:** `2:48522` | **File:** `app/(tasker)/jobs/index.tsx` (update)

- [ ] Read `SCR-TASK-012.yaml` — note 7 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:48522")`
- [ ] Read existing `app/(tasker)/jobs/index.tsx` and `__tests__/screens/tasker/jobs/MyJobsScreen.test.tsx`
- [ ] Preserve job list and status filter hooks
- [ ] Verify all acceptance_criteria

### SCR-TASK-013 — Booking Detail (Tasker)

**Figma:** `2:48874` | **File:** `app/(tasker)/jobs/[bookingId]/index.tsx` (update)

- [ ] Read `SCR-TASK-013.yaml` — note 9 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:48874")`
- [ ] Check existing: `find apps/mobile/src/app/(tasker)/jobs -name \"[bookingId]\" -o -name \"index.tsx\"`
- [ ] Preserve `useBookingDetail`, `useMarkBookingDone` hooks
- [ ] Register in `app/(tasker)/jobs/_layout.tsx` if new
- [ ] Verify all acceptance_criteria

### SCR-TASK-014 — No-Show Flag (Tasker)

**Figma:** `2:48978` | **File:** `features/bookings/components/TaskerNoShowSheet.tsx` (create/update)

- [ ] Read `SCR-TASK-014.yaml` — note 4 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:48978")`
- [ ] Check existing: `__tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx` — match testIDs
- [ ] Preserve `useFlagNoShow` hook
- [ ] Verify all acceptance_criteria

### SCR-TASK-015 — Booking Cancel (Tasker)

**Figma:** `2:19029` | **File:** `features/bookings/components/TaskerCancelSheet.tsx` (create/update)

- [ ] Read `SCR-TASK-015.yaml` — note 4 states (bottom sheet)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:19029")`
- [ ] Check existing: `__tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx` — match testIDs
- [ ] Cancellation reason selector is required — spec includes Safety/Fraud as a reason option
- [ ] Preserve `useCancelBooking` hook
- [ ] Verify all acceptance_criteria

### SCR-TASK-016 — Tasker Stats Dashboard

**Figma:** `2:49048` | **File:** `app/(tasker)/stats.tsx` (update)

- [ ] Read `SCR-TASK-016.yaml` — note 3 states, `COMP-STATCARD`, `COMP-PROGRESSTRACKER`
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:49048")`
- [ ] `COMP-STATCARD`: use existing `StatCard` component from `components/ui/StatCard.tsx`
- [ ] Preserve `useMyStats` hook from `features/profile/hooks/useMyStats.ts`
- [ ] Register in `app/(tasker)/_layout.tsx`
- [ ] Verify all acceptance_criteria

### SCR-TASK-017 — Lead Unlock — Accept/Decline

**Figma:** `2:48641` | **File:** `features/bookings/components/LeadUnlockSheet.tsx` (update)

- [ ] Read `SCR-TASK-017.yaml` — note 7 states (bottom sheet, credit cost shown)
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:48641")`
- [ ] `COMP-CREDITBALANCE`: use existing or check `components/ui/` — show credit cost with warning if balance low
- [ ] Use `ModalSheetTemplate`
- [ ] Verify all acceptance_criteria

### SCR-TASK-018 — Privacy Policy

**Figma:** `2:48774` | **File:** `app/(shared)/legal/privacy.tsx` (update)

- [ ] Read `SCR-TASK-018.yaml` — note 2 states
- [ ] `get_design_context("IljfnTQPkq7vpkmK1NN1NC", "2:48774")`
- [ ] Read existing `app/(shared)/legal/privacy.tsx` and `__tests__/screens/shared/profile/PrivacyPolicyScreen.test.tsx`
- [ ] Verify all acceptance_criteria

### Agent 5 — Finish

- [ ] `pnpm --filter @tasky/mobile typecheck` — must pass with zero errors
- [ ] Note: Agent 3 owns `app/(customer)/tasks/[taskId]/index.tsx`; Agent 5 owns `app/task/[id].tsx`. Keep ownership split to avoid conflicts.
- [ ] `git add apps/mobile/src/app/(tabs)/index.tsx apps/mobile/src/app/(tasker)/ apps/mobile/src/features/` && `git commit -m "feat(mobile): apply Figma designs to tasker flow (SCR-TASK-001, 002, 011–018)"`

---

## Post-Parallel: Integration Check

Run after all 5 agents have committed.

- [ ] Merge all 5 agent branches (or commits if working in the same branch) onto a single integration branch
- [ ] `pnpm --filter @tasky/mobile typecheck` — full pass across the combined changes
- [ ] `pnpm --filter @tasky/mobile test` — run all mobile tests; check for testID regressions
- [ ] If tests fail: read the failing test, identify the changed testID or missing component, fix the production code (never the test unless the testID genuinely changed per spec)
- [ ] Run repo submit gates from `AGENTS.md`: `./gradlew test`, `./gradlew openApiValidate`, `pnpm -r typecheck`, `pnpm -r test`
- [ ] `git commit -m "chore(mobile): integration typecheck pass after design refresh"`
- [ ] For AI-authored commits, include trailer: `Co-Authored-By: Pi <noreply@pi.dev>`
