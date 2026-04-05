# UI Consistency & Journey Coverage — Design Spec
**Date:** 2026-04-05
**Status:** Approved
**Scope:** `apps/mobile/` — all journeys in `docs/design/journey-catalog.yaml`

---

## Problem

AI agents generated mobile screens by reading AI-generated Figma designs through MCP. This produced three categories of defect:

1. **Runtime breakages** — Figma internal asset URLs (`figma.com/api/mcp/asset/...`) embedded as `<Image source>` props. These require Figma auth and fail silently in production.
2. **Component bypass** — screens rolled their own `Pressable` + `StyleSheet.create` instead of using the shared `Button`, `AuthTemplate`, `ScreenContainer`, etc.
3. **Coverage gaps** — ~17 screens referenced in the journey catalog have no implementation.

---

## Approach: Layer-by-Layer (B)

Three sequential layers. Each layer has a clear input, output, and completion criterion.

```
Layer 1: SWEEP          Layer 2: SCAFFOLD         Layer 3: WIRE
─────────────────       ──────────────────────    ────────────────────
Existing screens only   Missing screens only      All screens
Fix violations          Create from templates     Fix router.push() chains
~15 screens             ~17 screens               Per-journey smoke check
Output: clean files     Output: stub screens      Output: navigable paths
```

Layers run sequentially. Within each layer, work across journeys is parallelisable.

---

## Layer 1: Sweep — Violation Rules

Six violation classes. Each has a deterministic fix. No new `StyleSheet.create` blocks are permitted except for layout adjustments that cannot be expressed through component props.

| # | Violation | Affected Files | Fix |
|---|-----------|---------------|-----|
| V1 | Figma MCP asset URL as `<Image source>` | `login.tsx`, `onboarding.tsx` | Remove `<Image>`. Replace brand icon with Lucide `Zap` in a styled `View`, Facebook button icon with Lucide `Facebook`, onboarding slides with a coloured `View` + per-slide Lucide icon |
| V2 | Raw `Pressable` used as a CTA button | `login.tsx` (Facebook btn), `onboarding.tsx` (Next/Skip) | Swap for `<Button variant="default">` or `<Button variant="outline">` as appropriate. Role-selection tiles in `role-select.tsx` are exempt — they are selection tiles, not CTA buttons |
| V3 | Screen root is bare `<View>` instead of `ScreenContainer` | `permission-location.tsx`, `permission-notifications.tsx` | Wrap in `<ScreenContainer testID="SCR-xxx">` |
| V4 | Auth screen does not use `AuthTemplate` | `login.tsx` | Refactor to `<AuthTemplate showLogo topRightSlot={<LanguageSwitcher>} bottomSlot={<Button label="Facebook-ээр нэвтрэх">}>` |
| V5 | Hardcoded user-visible strings (no `t()`) | `permission-location.tsx`, `permission-notifications.tsx`, `review.tsx` (`'Flexible'`), `intake.tsx` (`'Yes'`/`'No'`) | Wrap every user-visible string in `t('namespace.key', 'fallback')` following existing key conventions |
| V6 | Duplicate step label inside `FormWizardTemplate` children | `intake.tsx` (renders own "Step X of Y" text while template's progress bar already shows position) | Remove the manual `<Text>` step label — `FormWizardTemplate`'s progress bar is the sole authoritative indicator |

---

## Layer 2: Scaffold — Template Selection Matrix

Every scaffolded screen must:
- Have `testID="SCR-xxx"` matching the catalog ID
- Use `t('key', 'fallback')` for all user-visible strings
- Show a functional loading/empty state
- Include a `// TODO: wire real data` comment at the data-fetch site

### Template decision rules

| Screen type | Template |
|---|---|
| Auth / permission / role selection | `AuthTemplate` |
| Multi-step form wizard | `FormWizardTemplate` |
| Single entity detail | `DetailTemplate` |
| Scrollable list with filters | `FeedListTemplate` |
| Success / celebration | `SuccessCelebrationTemplate` |
| Settings list | `SettingsTemplate` |
| Inline confirmation (not a route) | `ConfirmSheet` component on parent screen |
| Error / blocked state | `ErrorStateTemplate` |
| Splash | Custom `LinearGradient` — already correct, exempt |

### Missing screens by phase

**Phase 0-1**

| Screen ID | Name | Template | Route |
|---|---|---|---|
| SCR-SHARED-018 | Review reminder | `ConfirmSheet` on review screen | inline on `(shared)/review/[bookingId].tsx` |
| SCR-SHARED-019 | Review hard lock | `ErrorStateTemplate` | `(shared)/review/hard-lock.tsx` |
| SCR-CUST-010 | Cancel task confirmation | `ConfirmSheet` on task detail | inline on `(customer)/tasks/[taskId]/index.tsx` |
| SCR-CUST-012 | Tasker decline notification | inline state on applicants list | inline on `(customer)/tasks/[taskId]/applicants.tsx` |
| SCR-CUST-018 | Confirm complete | `ConfirmSheet` on booking detail | inline on `(customer)/bookings/[bookingId]/index.tsx` |
| SCR-CUST-021 | Customer no-show flag | `ConfirmSheet` on booking detail | inline on `(customer)/bookings/[bookingId]/index.tsx` |
| SCR-CUST-022 | Customer cancellation flow | `ModalSheetTemplate` | `(customer)/bookings/[bookingId]/cancel.tsx` |
| SCR-CUST-026 | No-applicant rescue | `DetailTemplate` | `(customer)/tasks/[taskId]/rescue.tsx` |
| SCR-TASK-011 | Application submitted success | `SuccessCelebrationTemplate` | `(tasker)/tasks/applied.tsx` |
| SCR-TASK-014 | Tasker no-show flag | `ConfirmSheet` on job detail | inline on `(tasker)/jobs/[bookingId]/index.tsx` |
| SCR-TASK-015 | Tasker cancel booking | `ModalSheetTemplate` | `(tasker)/jobs/[bookingId]/cancel.tsx` |

**Phase 2**

| Screen ID | Name | Template | Route |
|---|---|---|---|
| SCR-TASK-017 | Lead unlock accept/decline | `DetailTemplate` | `(tasker)/jobs/[bookingId]/lead-unlock.tsx` |
| SCR-CUST-028 | Task boost selection | `DetailTemplate` | `(customer)/tasks/[taskId]/boost.tsx` |
| SCR-CUST-029 | Task boost payment | `DetailTemplate` | `(customer)/tasks/[taskId]/boost-pay.tsx` |
| SCR-B2B-001 | Business dashboard | `FeedListTemplate` | `(customer)/business/index.tsx` |
| SCR-B2B-002 | Business setup — details | `FormWizardTemplate` step 1 | `(customer)/business/new/details.tsx` |
| SCR-B2B-003 | Business setup — location | `FormWizardTemplate` step 2 | `(customer)/business/new/location.tsx` |
| SCR-B2B-004 | Business setup — invite manager | `FormWizardTemplate` step 3 | `(customer)/business/new/invite.tsx` |
| SCR-B2B-005 | Select business account | `ModalSheetTemplate` | `(customer)/business/select.tsx` |
| SCR-B2B-006 | Business task list | `FeedListTemplate` | `(customer)/business/[businessId]/tasks.tsx` |
| SCR-B2B-007 | Business subscription billing | `DetailTemplate` | `(customer)/business/[businessId]/billing.tsx` |

**Phase 3+:** Wallet, payout, and subscription screens already exist — no scaffolding needed.

---

## Layer 3: Wire — Navigation Verification Rules

For each journey, an agent reads the catalog's `happy_path` steps and verifies:

1. **Entry reachable** — the `entry:` screen exists as a file and is reachable from a tab, FAB, or prior screen's CTA.
2. **Steps navigate forward** — each screen's primary `onNext`/CTA handler calls `router.push/replace` with a pathname matching the `next:` screen in the catalog.
3. **Exit is terminal** — the `exit:` screen has no auto-navigation (`Redirect` or immediate `router.replace`) that would skip it.

**Navigation param contract:** When a `next:` transition passes data (e.g. `categoryId` through the task wizard), confirm the receiving screen declares all required params in `useLocalSearchParams` and that they are forwarded in the push call.

**Scope:** Happy path only. Alternate paths are out of scope for this effort.

**Completion output:** A smoke-check table with one row per journey:

```
JRN-SHARED-01: entry ✓ / 7 steps ✓ / exit ✓
JRN-CUST-01:   entry ✓ / 8 steps ✓ / exit ✓
...
```

---

## Quality Gate — Done When

All three conditions are true:

**Gate 1 — Zero violations**
```bash
grep -r "figma.com/api/mcp" apps/mobile/src/  # must return no matches
```

**Gate 2 — Full catalog coverage**
Every `screen:` ID in `journey-catalog.yaml` is either:
- Implemented as a file with matching `testID="SCR-xxx"`, OR
- Listed in the known-inline set below (a `ConfirmSheet` or inline state on a parent screen, not a route)

**Known inline screens** (hardcoded in coverage script):
`SCR-SHARED-018`, `SCR-CUST-010`, `SCR-CUST-012`, `SCR-CUST-018`, `SCR-CUST-021`, `SCR-TASK-014`

A coverage script reads the catalog, extracts all `screen:` values, subtracts the known-inline set, then checks that every remaining ID appears in a `testID` prop somewhere in `apps/mobile/src/`.

**Gate 3 — All happy paths navigable**
The smoke-check table (Layer 3 output) is fully populated with ✓ on all three checks for all 29 journeys (7 shared, 9 customer, 8 tasker, 4 B2B, 1 infra).

---

## Constraints (apply to all layers)

- No new `StyleSheet.create` blocks unless layout cannot be expressed through component props
- No Figma MCP asset URLs anywhere in source
- All user-visible strings use `t('key', 'fallback')`
- Every screen file has `testID="SCR-xxx"` matching the catalog
- Scaffolded screens are functional stubs — not empty files, not placeholder JSX returning `null`
