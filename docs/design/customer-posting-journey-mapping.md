# Customer Posting Journey Mapping

Date: 2026-03-29

## Scope

This document maps the first five screens in the customer posting journey reached after a customer signs in through the mobile dev login flow and starts posting a task.

Journey:

1. `SCR-CUST-001` My Tasks
2. `SCR-CUST-002` Post Task - Category Selection
3. `SCR-CUST-003` Post Task - Intake Form
4. `SCR-CUST-004` Post Task - Photo Upload
5. `SCR-CUST-005` Post Task - Location Pin

## Source Of Truth

Behavioral truth:

- `docs/design/screen-specs/SCR-CUST-001.yaml`
- `docs/design/screen-specs/SCR-CUST-002.yaml`
- `docs/design/screen-specs/SCR-CUST-003.yaml`
- `docs/design/screen-specs/SCR-CUST-004.yaml`
- `docs/design/screen-specs/SCR-CUST-005.yaml`

Design truth:

- Stitch project `Tasky Mobile v2` (`projects/15920227283524999360`)

Implementation rule:

- When the authored screen spec and the Stitch design disagree, preserve the spec for route, state, copy intent, and navigation behavior.
- Use Stitch for visual hierarchy, spacing, composition, and component styling where it does not conflict with the spec.

## Mapping

| Screen ID | Screen Spec | Stitch Screen | Expo Route | Current Test |
|---|---|---|---|---|
| `SCR-CUST-001` | My Tasks - Task List | `Tasky Mobile v2` screen title `My Tasks — Task List` | `apps/mobile/src/app/(customer)/tasks/index.tsx` and `apps/mobile/src/app/(tabs)/tasks.tsx` | `apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx` |
| `SCR-CUST-002` | Post Task - Category Selection | Exact Stitch title not recovered from MCP listing; visual treatment derived from the connected `Tasky Mobile v2` posting-wizard screens while the authored spec remains the behavioral source of truth | `apps/mobile/src/app/(customer)/tasks/new/category.tsx` | `apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx` |
| `SCR-CUST-003` | Post Task - Intake Form | `Tasky Mobile v2` screen title `Post Task - Intake Form` | `apps/mobile/src/app/(customer)/tasks/new/intake.tsx` | `apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx` |
| `SCR-CUST-004` | Post Task - Photo Upload | `Tasky Mobile v2` screen title `Add Photos` | `apps/mobile/src/app/(customer)/tasks/new/photos.tsx` | `apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx` |
| `SCR-CUST-005` | Post Task - Location Pin | `Tasky Mobile v2` screen title `Post Task - Location Pin` | `apps/mobile/src/app/(customer)/tasks/new/location.tsx` | `apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx` |

## Resolved Journey

Entry:

- Dev login as customer lands in the customer task surface through the tab alias.
- `apps/mobile/src/app/(tabs)/tasks.tsx` re-exports `apps/mobile/src/app/(customer)/tasks/index.tsx`.

Posting flow:

1. My Tasks FAB or empty-state CTA pushes `/(customer)/tasks/new/category`
2. Category selection pushes `/(customer)/tasks/new/intake?categoryId=...`
3. Intake pushes `/(customer)/tasks/new/photos`
4. Photos pushes `/(customer)/tasks/new/location`
5. Location pushes `/(customer)/tasks/new/schedule`

## Alignment Notes

### `SCR-CUST-001` My Tasks

- Functional mapping exists directly to the connected Stitch screen `My Tasks — Task List`.
- The authored spec does not mention filter tabs, but the product decision is to keep them as an approved extension because they improve task management.
- The implementation now uses the spec copy for the activation empty state and keeps the posting CTA visible as an extended FAB.

### `SCR-CUST-002` Category Selection

- Behavioral mapping still comes from the screen spec.
- Visual structure is now treated as a category grid derived from the connected posting-wizard design language in `Tasky Mobile v2`.
- Category description text is synthesized from the shared category translation keys when present.

### `SCR-CUST-003` Intake Form

- Route mapping exists and the wizard step semantics were already correct because `FormWizardTemplate` is zero-based internally.
- Current implementation remains a minimal schema-backed fallback with a single description field, but the screen is now framed with the same progress and editorial guidance pattern used in Stitch.

### `SCR-CUST-004` Photo Upload

- Route mapping exists and the wizard step semantics were already correct because `FormWizardTemplate` is zero-based internally.
- The implementation now uses multi-slot add-photo placeholders in the grid, keeping the spec behavior while moving closer to the `Add Photos` Stitch composition.

### `SCR-CUST-005` Location Pin

- Route mapping exists and the wizard step semantics were already correct because `FormWizardTemplate` is zero-based internally.
- The implementation now disables the Next CTA until a pin is placed, which matches the authored spec more closely than the previous post-tap validation fallback.

## Alignment Decisions

- Keep the existing route structure.
- Preserve the existing wizard step numbering because the route code already rendered the authored step numbers correctly.
- Keep current data flow params between screens, but make the screens visually and structurally closer to the Stitch layouts.
- Keep My Tasks filter tabs as an intentional product extension beyond the current authored spec.
- Prefer inline errors and helper copy from the specs.
- Preserve the customer posting flow order exactly as documented in the specs.
