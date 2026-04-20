# Mobile Agentic Hardening Remediation Spec

Date: 2026-04-20
Scope: `apps/mobile`, with supporting changes in `tooling/config`, `packages/*`, and mobile architecture docs
Primary inputs:

- `docs/ARCHITECTURE.md`
- `docs/plans/mobile-design-system-architecture-audit-2026-04-17.md`
- `docs/plans/mobile-design-system-architecture-handoff-2026-04-17.md`
- Mobile agentic-structure review performed on 2026-04-20

## Why This Spec Exists

`apps/mobile` is functional and well-covered, but it is not yet structured to maximize safe autonomous development work.

The current mobile app has the right top-level buckets and a real primitive layer, but several constraints that matter for high-autonomy agent work are still weak or inconsistently enforced:

- Route files are not consistently thin adapters.
- API access is too centralized and is occasionally bypassed.
- Large screens mix parsing, state orchestration, effects, and view composition.
- Multi-step draft state is threaded through route params instead of a typed state boundary.
- Verification breadth is strong, but verification precision and enforcement are incomplete.
- Unused deferred code remains inside the active source tree.

This spec defines a systematic remediation plan that makes mobile work more local, more predictable, and easier to verify automatically.

## Problem Statement

Autonomous agents work best when the codebase provides:

1. Small, well-bounded edit surfaces
2. Clear import and ownership boundaries
3. Stable semantic structure
4. Accurate local verification
5. Low ambiguity between production, prototype, and deferred code

The mobile app currently falls short in the following ways:

1. The route layer is too heavy.
   - Only a minority of route files are thin re-export or adapter files.
   - Many route files still carry business logic, side effects, and local helper components.

2. The data-access boundary is too coarse.
   - `src/lib/mobileApiClient.ts` is a large shared god-object.
   - Some screens bypass typed domain access and reach into transport internals.

3. Large screens are not decomposed by concern.
   - Parsing helpers, local subcomponents, orchestration logic, and presentation often live in the same file.

4. Draft workflow state is not modeled as a domain boundary.
   - The task-post flow passes large serialized state through route params across multiple steps.

5. Architecture rules are not fully enforced.
   - Route-layer import rules, file budgets, testability requirements, and layer ownership are partially social and partially documented, but not strongly guarded.

6. Verification is not strict enough in the dimensions that matter most for autonomous edits.
   - Unit tests pass and typecheck passes, but missing `testID`s are warnings, open handles are tolerated, and mobile coverage thresholds are not enforced in Jest.

7. The active tree contains deferred code that is not part of the supported production surface.
   - `src/future/**` expands the search and edit space without adding runtime value.

## Goals

This remediation is successful when the mobile app satisfies all of the following:

1. Route files are predictable, thin, and easy to scan.
2. Feature-local logic is grouped into stable modules with explicit ownership.
3. Data access is split by domain behind narrow interfaces.
4. Large screens follow a standard decomposition shape.
5. Multi-step workflows use typed draft state instead of serialized route-param plumbing.
6. Lint and structural checks catch boundary violations before review.
7. Test and verification signals are strict enough that passing local checks meaningfully reduce risk.
8. Deferred and prototype surfaces are clearly separated from supported production code.

## Non-Goals

This spec does not propose:

1. Replacing Expo Router
2. Replacing React Query, Zustand, or Jest
3. A wholesale redesign of the mobile UI
4. Rewriting every mobile screen in a single tranche
5. Introducing a new component library or changing the design-token source of truth

## Current-State Summary

### Strengths

- The top-level mobile tree is already sensible: `app`, `features`, `components`, `design`, `lib`, `providers`, `store`, `utils`.
- Shared mobile primitives and templates are real and already in use.
- Route grouping is coherent.
- Mobile typecheck passes.
- Mobile unit tests are broad and currently pass.

### Main Structural Risks

- The route layer is still a frequent implementation layer.
- Centralized API access encourages broad coupling.
- Screens remain too large in high-churn flows.
- Decomposition is inconsistent across domains.
- Tooling does not yet enforce the declared architecture strongly enough.

## Target Architecture

### Layer Model

The mobile app should converge on the following dependency flow:

`src/app` -> `src/features/*/screens` -> `src/features/*/{hooks,components,model,api}` -> shared `src/components`, `src/design`, `src/lib`

Allowed import intent:

- `src/app/**`
  - May import route-safe screen modules, route-param codecs, navigation helpers, and Expo Router APIs
  - Must not perform domain API calls directly
  - Must not define reusable business UI or local transport hacks

- `src/features/*/screens/**`
  - May compose feature hooks, feature components, shared templates, and shared primitives
  - May own screen orchestration, but not raw transport details

- `src/features/*/hooks/**`
  - May call feature API modules and shared state/query utilities
  - Must not import route files

- `src/features/*/api/**`
  - Owns domain endpoint calls and response mapping
  - Must be the only feature-local layer that depends on the mobile transport client

- `src/components/**`
  - Shared UI only
  - No feature data fetching

- `src/design/**`
  - Shared cross-cutting visual foundation only
  - No route- or feature-specific measurements

- `src/future/**`
  - Must not be part of the supported active source surface

### Standard Screen Shape

All large or high-churn screens should converge on a consistent shape:

```text
features/<domain>/screens/
  <ScreenName>Screen.tsx          # assembly/composition only
  <ScreenName>.model.ts           # parsing, formatting, derived state helpers
  <ScreenName>.parts.tsx          # screen-local presentational sections
  use<ScreenName>.ts              # orchestration/effects
```

Not every screen needs all four files. The rule is not mandatory symmetry; the rule is bounded ownership.

When a screen exceeds either threshold below, it must be decomposed:

- `> 220` lines total, or
- mixes three or more of:
  - route param parsing
  - async side effects
  - domain mutations
  - local presentational subcomponents
  - formatting/parsing helpers

### Route File Contract

Target contract for non-layout route files:

- Preferred target size: `<= 40` lines
- Hard warning threshold: `> 60` lines
- Responsibilities limited to:
  - `Stack.Screen` options
  - route param decoding / route aliasing
  - rendering a feature screen

Route files must not:

- import `createMobileApiClient`
- define local UI sections intended for reuse
- implement upload flows
- parse business payloads beyond route-param decoding

### Domain API Contract

`src/lib/mobileApiClient.ts` should be reduced to transport-only responsibilities:

- base URL resolution
- auth header composition
- token refresh handling
- shared `requestJson` / `requestVoid` primitives
- transport-level error mapping

Domain methods should move to feature-local modules, for example:

```text
src/features/tasks/api.ts
src/features/bookings/api.ts
src/features/profile/api.ts
src/features/chat/api.ts
src/features/disputes/api.ts
src/features/review/api.ts
src/features/verification/api.ts
src/features/notifications/api.ts
```

The transport client should not be imported from route files or shared UI.

### Workflow Draft Contract

Multi-step customer task creation should move from route-param state threading to a typed draft boundary.

Target shape:

```text
src/features/tasks/draft/
  taskDraft.store.ts
  taskDraft.types.ts
  taskDraft.validation.ts
  useTaskDraft.ts
```

Navigation should pass only:

- `draftId`
- current step or route slug when needed

Navigation should not pass:

- serialized intake answers
- serialized uploaded photo arrays
- repeated copies of category metadata
- repeated copies of location and scheduling payloads

### Deferred Surface Contract

Deferred or prototype mobile surfaces must not live in the default active edit surface under `src/`.

Acceptable end state:

1. Move `src/future/**` to a non-runtime directory such as `docs/prototypes/mobile/` or `archive/mobile-future/`
2. Or keep it under app ownership but outside `src/` with explicit no-import enforcement

If retained locally, it must be:

- excluded from runtime entrypoints
- excluded from Tailwind content scanning unless intentionally active
- blocked by lint from being imported into production surfaces

## Enforcement Rules

The following rules must move from documentation into tooling.

### ESLint Rules

Add or tighten the following:

1. Route boundary rule
   - `src/app/**` cannot import `createMobileApiClient`
   - `src/app/**` cannot import feature `api.ts` directly unless explicitly designated as a thin alias route

2. Layering rule
   - `src/components/**` cannot import from `src/features/**`
   - `src/design/**` cannot import from `src/app/**` or `src/features/**`

3. Future-surface rule
   - Production code cannot import from `src/future/**`

4. Screen-size rule
   - Add a repo script or ESLint custom rule that reports route files over the chosen size threshold

5. Interactive testability rule
   - Missing `testID` on shared interactive primitives becomes a failure in tests and lint for supported surfaces

### Repository Scripts

Add lightweight structure checks such as:

- `pnpm --filter @tasky/mobile structure:check`

This command should validate:

- route file line budgets
- banned imports by layer
- no imports from deferred surfaces
- optional warning report for large screens

## Verification Contract

### Required Verification For Every Tranche

At minimum:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile lint`
- `pnpm --filter @tasky/mobile test:unit`

For route, auth, navigation, and workflow changes:

- targeted Jest suites for the touched screens

For task-post flow and navigation boundary changes:

- `pnpm --filter @tasky/mobile test:e2e:smoke`
  - Requires Maestro and a booted simulator/emulator

### Verification Hardening Work

1. Add coverage thresholds for the mobile Jest run or add a coverage-producing CI lane with enforced thresholds consistent with repo policy.
2. Add a non-default CI lane using `--detectOpenHandles` to surface hanging async work instead of relying on `--forceExit` alone.
3. Promote missing interactive `testID`s from runtime warnings to test failures for supported surfaces.
4. Consolidate mobile-local test utilities into the shared test-utils path expected by repo conventions.

## Remediation Workstreams

## Tranche 1: Documentation And Structural Rule Baseline

### Objective

Make the intended mobile layering explicit and enforceable before refactoring hotspots.

### Changes

1. Update `docs/ARCHITECTURE.md` mobile section with:
   - explicit allowed-import graph
   - route adapter contract
   - standard screen decomposition shape
   - deferred-surface policy

2. Update `apps/mobile/README.md` so it reflects the current runtime and directory shape.

3. Add tooling checks for:
   - banned imports in routes
   - banned imports from `src/future/**`
   - route file size warnings

### Exit Criteria

- Architecture docs match reality
- Mobile contributors can infer the intended structure without scanning the tree
- Structural violations can be detected automatically

## Tranche 2: API Boundary Decomposition

### Objective

Break the centralized API god-object into domain-scoped modules while preserving one shared transport layer.

### Changes

1. Reduce `src/lib/mobileApiClient.ts` to transport concerns.
2. Introduce feature-local API modules by domain.
3. Migrate all hook-level data access to the new domain APIs.
4. Remove route-layer imports of `createMobileApiClient`.
5. Replace transport bypasses such as reverse-geocode `requestJson` casts with supported domain APIs.

### Priority Hotspots

- `src/lib/mobileApiClient.ts`
- `src/app/(customer)/tasks/new/location.tsx`
- `src/app/task/[id].tsx`
- `src/app/(shared)/profile/edit.tsx`

### Exit Criteria

- No route file imports the shared API client factory
- Shared client is transport-only
- Domain hooks depend on domain APIs, not a giant method bag

## Tranche 3: Route Layer Thinning

### Objective

Make `src/app/**` uniformly predictable.

### Changes

1. Convert route files to thin adapters or re-exports.
2. Move route-local subcomponents and formatting helpers into feature screen modules.
3. Keep `Stack.Screen` metadata in route files only where needed.

### Priority Routes

- `src/app/(customer)/tasks/new/intake.tsx`
- `src/app/(customer)/tasks/new/location.tsx`
- `src/app/(customer)/tasks/new/schedule.tsx`
- `src/app/(customer)/bookings/index.tsx`
- `src/app/(customer)/bookings/[bookingId]/index.tsx`
- `src/app/(tabs)/inbox/[id].tsx`
- `src/app/(shared)/notifications.tsx`

### Exit Criteria

- Most route files are re-exports or thin wrappers
- Non-layout routes stay within the defined line budget except explicitly documented exceptions

## Tranche 4: Large-Screen Decomposition

### Objective

Standardize decomposition for the highest-churn and highest-risk screens.

### Changes

1. Split parsing helpers into `.model.ts`
2. Split local view sections into `.parts.tsx`
3. Move orchestration/effects into `use<Screen>.ts`
4. Keep screen files focused on composition

### Priority Screens

- `src/features/tasks/screens/TaskReviewSubmitScreen.tsx`
- `src/features/disputes/screens/DisputeStatusScreen.tsx`
- `src/features/bookings/screens/BookingRescheduleScreen.tsx`
- `src/features/help/screens/HelpCenterScreen.tsx`
- `src/features/tasks/screens/CustomerTaskDetailScreen.tsx`

### Exit Criteria

- High-churn screens conform to the standard shape
- Helper logic is discoverable without opening a 400-600 line screen file

## Tranche 5: Task Draft State Remediation

### Objective

Replace serialized route-param state threading in the task-post wizard with a typed draft boundary.

### Changes

1. Introduce task draft state modules
2. Define explicit draft types and validation
3. Migrate wizard steps to use `draftId`
4. Shrink route param contracts to navigation-only data
5. Update tests for step transitions and persistence behavior

### Flows Covered

- category
- intake
- photos
- location
- schedule
- review
- success

### Exit Criteria

- Wizard state is no longer duplicated across route params
- Adding a new field to the flow touches draft state and relevant screen logic, not the entire route chain

## Tranche 6: Verification Hardening

### Objective

Raise the trustworthiness of passing local checks.

### Changes

1. Enforce mobile coverage thresholds
2. Add open-handle detection in CI or a dedicated verification lane
3. Promote missing interactive `testID`s to failures
4. Move test helpers toward `@tasky/test-utils` or align repo docs to the actual supported pattern
5. Add structure checks to the default mobile verification workflow

### Exit Criteria

- Passing mobile verification means boundary violations and obvious testability regressions are unlikely
- Runtime warnings do not silently normalize bad structure

## Tranche 7: Deferred Surface Quarantine

### Objective

Reduce active search and edit noise.

### Changes

1. Move or quarantine `src/future/**`
2. Add no-import enforcement
3. Remove it from active architecture references unless explicitly marked as prototype/deferred

### Exit Criteria

- Deferred code is clearly separated from the production surface
- Agents and humans do not have to continuously distinguish active from inactive code during routine work

## File Budget Policy

These are target budgets, not rigid style theater. They exist to keep edit surfaces local.

| Surface             | Target         | Warning Threshold | Expected Action                       |
| ------------------- | -------------- | ----------------- | ------------------------------------- |
| Route file          | `<= 40` lines  | `> 60` lines      | move logic into feature screen        |
| Screen file         | `<= 180` lines | `> 220` lines     | split into model/parts/hook           |
| Feature hook        | `<= 120` lines | `> 160` lines     | split concerns or extract helpers     |
| Shared UI primitive | `<= 140` lines | `> 180` lines     | extract variants or helper utils      |
| Domain API module   | `<= 180` lines | `> 220` lines     | split by subdomain or endpoint family |

Exceptions are allowed only when:

- the file is intentionally generated, or
- the exception is documented inline and still respects the architecture boundaries

## Migration Order

Recommended order:

1. Tranche 1: docs and enforcement
2. Tranche 2: API boundary decomposition
3. Tranche 3: route thinning
4. Tranche 4: large-screen decomposition
5. Tranche 5: task draft state remediation
6. Tranche 6: verification hardening
7. Tranche 7: deferred-surface quarantine

Reasoning:

- Structural rules should land before broad code motion.
- API decomposition unlocks cleaner screen and route refactors.
- Draft-state refactoring is easier after route and API boundaries are stabilized.
- Verification hardening should mature alongside refactors, not trail them indefinitely.

## Risks And Mitigations

### Risk: Refactor churn across too many screens at once

Mitigation:

- Work in vertical slices by domain
- Keep each tranche independently verifiable
- Do not mix draft-state migration with unrelated UI restyling

### Risk: New rules create high initial lint noise

Mitigation:

- Stage rules as warn first where necessary
- Convert to errors once hotspots are remediated

### Risk: API decomposition breaks hook and test assumptions

Mitigation:

- Keep transport behavior stable
- Migrate one domain at a time
- Add domain-level boundary tests before deleting old paths

### Risk: Task wizard migration introduces state-loss bugs

Mitigation:

- Add explicit tests for step navigation, back navigation, and draft persistence
- Keep one compatibility window if necessary during migration

## Completion Criteria

This spec is complete when all of the following are true:

1. Route files are thin and predictable
2. Shared transport is no longer a domain god-object
3. Large screens follow a consistent decomposition pattern
4. Task-post draft state is typed and local to a workflow boundary
5. Layering and deferred-surface rules are enforced automatically
6. Verification catches missing testability and structural regressions early
7. Mobile architecture docs accurately describe the supported structure

## Immediate Next Slice Recommendation

The first implementation slice should combine only the smallest high-leverage work:

1. Update mobile architecture docs and README
2. Add route boundary lint rules
3. Add `src/future/**` no-import enforcement
4. Add a simple structure-check script for route size and banned imports
5. Refactor the three direct-route API offenders:
   - `src/app/(customer)/tasks/new/location.tsx`
   - `src/app/task/[id].tsx`
   - `src/app/(shared)/profile/edit.tsx`

This slice is small enough to land safely and establishes the guardrails needed for the larger refactors that follow.
