# Mobile Visual Defect Log — April 2026

**Date:** 2026-04-10
**Status:** closed
**Batch scope:** Active (launch-live) screens, April 2026 audit cycle — see `mobile-visual-audit-ledger-2026-04.md`

---

## Summary

| Status    | Count  |
| --------- | ------ |
| Open      | 0      |
| Resolved  | 12     |
| Deferred  | 4      |
| **Total** | **16** |

> **Verification run:** 2026-04-10 — unit tests 740/740 passed (100 suites), Maestro smoke 3/3 flows passed, capture batches smoke/auth/shared all pass.

---

## Defect Entry Template

<!--
| DEF-ID  | Screenshot Ref            | Affected Screen(s)       | Classification                                           | Severity                         | Fix Layer                                   | Status                          | Notes |
| ------- | ------------------------- | ------------------------ | -------------------------------------------------------- | -------------------------------- | ------------------------------------------- | ------------------------------- | ----- |
| DEF-001 | capture/batch-1/scr-id/01 | SCR-SHARED-001           | systemic \| screen-local \| content-only \| not-worth-fixing | critical \| major \| minor   | template \| shell \| primitive \| screen     | open \| resolved \| deferred    |       |
-->

---

## Systemic Defects

_Defects rooted in shared templates, shells, or tokens. Fix these before screen-local work._

| DEF-ID  | Screenshot Ref                                                         | Affected Screen(s)                             | Classification | Severity | Fix Layer | Status   | Notes                                                                                                                                         |
| ------- | ---------------------------------------------------------------------- | ---------------------------------------------- | -------------- | -------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| DEF-002 | smoke/20260410-041528/screenshots/SCR-SHARED-002-login.png             | SCR-SHARED-002                                 | systemic       | major    | shell     | resolved | Locale toggle repositioned outside KeyboardAvoidingView at absolute top-right with safe-area inset guard (`Math.max(insets.right + 16, 24)`). |
| DEF-003 | smoke/20260410-041528/screenshots/SCR-SHARED-007-camera-permission.png | SCR-SHARED-007, SCR-SHARED-008, SCR-SHARED-009 | systemic       | major    | template  | resolved | PermissionPrimer illustration slot filled with icon hero (`ShieldCheck` + `Camera`/`MapPin`/`Bell`) rendered in upper area.                   |

---

## Screen-Local Defects

_Defects isolated to a single screen's composition. Fix only after systemic fixes have landed._

| DEF-ID  | Screenshot Ref                                                            | Affected Screen(s)     | Classification   | Severity | Fix Layer | Status   | Notes                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------- | ---------------------- | ---------------- | -------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| DEF-001 | smoke/20260410-041528/screenshots/SCR-SHARED-002-login.png                | SCR-SHARED-002         | screen-local     | critical | screen    | resolved | Splash bleed fixed via `contentStyle={{ backgroundColor: 'transparent' }}` on the auth `_layout`. The gradient is no longer in the auth tree during transition.                                                                                                                                                                        |
| DEF-004 | smoke/20260410-041528/screenshots/SCR-SHARED-006-role-confirm-sheet.png   | SCR-SHARED-006         | screen-local     | minor    | screen    | resolved | ModalSheet drag-handle class changed from `bg-border` to `bg-muted` which resolves correctly in NativeWind v4.                                                                                                                                                                                                                         |
| DEF-005 | smoke/20260410-041528/screenshots/SCR-CUST-006-schedule-budget.png        | SCR-CUST-006           | screen-local     | minor    | screen    | resolved | `budgetGoldHint` hint text token changed from `text-secondary` to `text-muted-foreground`.                                                                                                                                                                                                                                             |
| DEF-006 | smoke/20260410-041528/screenshots/SCR-SHARED-002-login.png                | SCR-SHARED-002         | content-only     | minor    | screen    | resolved | Copyright year updated 2024→2026 in both `en` and `mn` translation files.                                                                                                                                                                                                                                                              |
| DEF-007 | smoke/20260410-041528/screenshots/SCR-SHARED-002-login.png                | SCR-SHARED-002         | screen-local     | major    | screen    | resolved | Login subtitle given `flexShrink: 1` and `flexWrap: 'wrap'` to prevent mid-word line break.                                                                                                                                                                                                                                            |
| DEF-008 | smoke/20260410-041528/screenshots/SCR-CUST-007-review-submit.png          | SCR-CUST-007           | screen-local     | major    | screen    | resolved | `categoryName` param threaded through entire customer wizard chain (forward and edit-back paths); ReviewSubmitScreen now renders display name.                                                                                                                                                                                         |
| DEF-009 | smoke/20260410-041528/screenshots/SCR-CUST-008-success.png                | SCR-CUST-008           | screen-local     | minor    | screen    | resolved | Task success badge translation changed from VERIFIED→POSTED (`en`: "POSTED", `mn`: "НИЙТЛЭГДСЭН").                                                                                                                                                                                                                                     |
| DEF-010 | smoke/20260410-041528/screenshots/SCR-CUST-001-my-tasks-with-task.png     | SCR-CUST-001           | screen-local     | minor    | screen    | deferred | After returning from SCR-CUST-008 (task post success), My Tasks still shows the empty state ("No tasks yet"). The list does not reload on focus. Deferred: requires backend fixture to confirm actual task appears; empty state may be correct for dev-auth seeded data.                                                               |
| DEF-011 | shared/20260410-042846/screenshots/SCR-SHARED-012-profile-tasker.png      | SCR-SHARED-012         | screen-local     | major    | screen    | resolved | `verification.verified` and `verification.pending` i18n keys added to both `en` and `mn` translation files.                                                                                                                                                                                                                            |
| DEF-012 | shared/20260410-042846/screenshots/SCR-SHARED-016-notification-center.png | SCR-SHARED-016         | screen-local     | major    | screen    | resolved | Duplicate custom header removed from notifications screen; navigation delegates to Expo Router stack header.                                                                                                                                                                                                                           |
| DEF-013 | shared/20260410-042846/screenshots/SCR-INFRA-004-terms-of-service.png     | SCR-INFRA-004          | screen-local     | major    | screen    | resolved | Duplicate custom `< Back                                                                                                                                                                                                                                                                                                               | Terms of Service` header removed from terms screen; navigation delegates to Expo Router stack header. |
| DEF-014 | shared/20260410-042846/screenshots/SCR-SHARED-012-profile-customer.png    | SCR-SHARED-012         | not-worth-fixing | minor    | screen    | deferred | Profile secondary CTA ("Settings", outline) sits above primary CTA ("Edit Profile", filled). DetailTemplate places secondary above primary by design; the filled primary CTA is still visually dominant. No material usability impact. Deferred as cosmetic-only template design decision.                                             |
| DEF-015 | _(code review — no screenshot)_                                           | SCR-SHARED-002         | not-worth-fixing | minor    | template  | deferred | **Informational — code reviewer flag:** `AuthTemplate` applies `insets.right` to the `topRightSlot` position. On landscape devices where `ScreenContainer` already insets its children, `insets.right` may double-apply. Impact is cosmetic (extra right margin) and only manifests in landscape. Tracked for awareness; not blocking. |
| DEF-016 | _(code review — no screenshot)_                                           | SCR-SHARED-007/008/009 | not-worth-fixing | minor    | template  | deferred | **Informational — code reviewer flag:** `PermissionPrimer` accepts an `icon` prop used at two sizes (large hero at top, medium context icon) with no formal size contract or prop types for size variants. Risk is minor; tracked as follow-up to define explicit size enum. Not blocking.                                             |

---

## Localization Stress Check — 2026-04-10

Spot-checked key Mongolian (`mn`) strings against English (`en`) counterparts for overflow risk at narrow widths (flag if MN string is more than 2x EN length).

| Key                                       | EN (chars) | MN (chars) | Ratio | Risk  | Notes                                                                                                                                                               |
| ----------------------------------------- | ---------- | ---------- | ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.login.subtitle`                     | 44         | 50         | 1.14× | none  | "Найдвартай гүйцэтгэгчтэй холбогдож, ажлаа хялбар захиалаарай" — within range; DEF-007 `flexShrink`/`flexWrap` fix guards wrap behavior                             |
| `auth.login.copyright`                    | 32         | 47         | 1.47× | none  | "© 2026 Tasky. Бүх эрх хуулиар хамгаалагдсан." — acceptable; text-center on narrow line                                                                            |
| `TaskPostedSuccessScreen.successBadge`    | 6          | 14         | 2.33× | minor | "НИЙТЛЭГДСЭН" vs "POSTED" — badge chip is wider in MN; badge component uses fixed padding, no truncation. Monitor on narrow badge widths but not a blocking defect. |
| `verification.verified`                   | 8          | 14         | 1.75× | none  | "Баталгаажсан" — within range for chip label                                                                                                                        |
| `verification.pending`                    | 7          | 17         | 2.43× | minor | "Хүлээгдэж буй" — chip is wider; same badge chip comment as above. Not blocking.                                                                                    |
| `onboarding.notifications.allow`          | 18         | 23         | 1.28× | none  | "Мэдэгдэл зөвшөөрөх" — button label width acceptable                                                                                                                |
| `onboarding.notifications.skipPermission` | 10         | 12         | 1.20× | none  | "Дараа хийх" — fine                                                                                                                                                 |

**Conclusion:** Two strings (`successBadge` and `verification.pending`) exceed the 2× threshold. Both are badge/chip labels with intrinsic padding. Neither causes truncation in the current layout; they result in slightly wider chips in MN locale. These are content-only, minor, and not worth fixing at this time.

---

## Keyboard and Safe-Area Behavior — 2026-04-10

Reviewed source for `KeyboardAvoidingView` and scroll handling on three screens.

| Screen                  | File                                                    | KAV present                    | ScrollView/equivalent                                              | Notes                                                                                                                        |
| ----------------------- | ------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Login (SCR-SHARED-002)  | `apps/mobile/src/app/(auth)/index.tsx`                  | Yes (via `AuthTemplate`)       | Yes (`InsetScrollView` with `keyboardShouldPersistTaps="handled"`) | Clean. `topRightSlot` (locale toggle) is outside KAV, avoiding clipping. `extraBottomInset={210}` when `bottomSlot` present. |
| Intake (SCR-CUST-003)   | `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`   | Yes (via `FormWizardTemplate`) | Yes (`InsetScrollView` with `extraBottomInset={96}`)               | Clean. Sticky action bar is inside KAV so it rises with keyboard.                                                            |
| Schedule (SCR-CUST-006) | `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx` | Yes (via `FormWizardTemplate`) | Yes (same `InsetScrollView`)                                       | Clean. Budget input is a standard text field; DateTimePicker is a native picker overlay, not obscured by keyboard.           |

**Conclusion:** No keyboard handling defects found. All three screens use `KeyboardAvoidingView` (either directly or via template) with a scrollable content area and appropriate `extraBottomInset`. No new defects to log.
