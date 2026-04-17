# Mobile Design System And Architecture Audit

Date: 2026-04-17
Scope: `apps/mobile`, with supporting checks in `packages/design-tokens` and `docs/ARCHITECTURE.md`

## Audit Plan

1. Inspect the documented target architecture and compare it to the current mobile app structure.
2. Review the foundation layer: app config, TS config, Metro/Babel/Tailwind setup, root layout, and route layouts.
3. Review the design-system layer: shared tokens, mobile token adapters, surfaces, shells, templates, and primitives.
4. Review the composition layer: representative large routes and feature components, looking for thin-screen boundaries, reuse quality, and policy violations.
5. Produce a remediation plan ordered by risk and leverage.

## Executive Summary

The mobile app has a good architectural base, but it is drifting away from its own standards.

What is good:

- The top-level split is sensible: `src/app`, `src/components`, `src/design`, `src/features`, `src/lib`, `src/providers`, `src/store`, and `src/utils` is a maintainable shape.
- Expo Router layout ownership is mostly correct. Navigation chrome is centralized in `src/app/_layout.tsx` and group layouts such as `src/app/(tabs)/_layout.tsx`.
- A real mobile primitive layer exists in `src/components/ui`, and it is actually used across the app.
- Shared tokens are anchored in `@tasky/design-tokens`, which is the right bottom-most source of truth.
- Shells and templates are not theoretical. `ScreenContainer`, `InsetScrollView`, `StickyActionBar`, `FormWizardTemplate`, `FeedListTemplate`, and others are adopted in production screens.

What is not good:

- Documentation and config have drifted enough that the stated architecture is no longer fully trustworthy.
- The design-system boundary is too porous: some values are over-extracted into screen-specific “surface” constants, while other values are still hardcoded inline.
- Several routes and feature screens are too large and still own too much composition logic.
- Some screens bypass the approved shell and primitive rules, especially around `SafeAreaView`, `TextInput`, and bespoke headers/footers.
- Import ergonomics are weak. Deep relative imports are now widespread enough to create coupling and churn.

Overall assessment: the direction is good, but the app needs one cleanup tranche to re-align implementation with its declared architecture before more features land on top of the current drift.

## Bottom-Up Findings

### 1. Foundation And Global Files

#### What is good

- `apps/mobile/app.config.ts` is clean and minimal. It owns app identity, font loading, and location permissions without leaking app runtime logic into config.
- `apps/mobile/babel.config.js` and `apps/mobile/metro.config.js` are focused and appropriate for Expo + NativeWind + workspace packages.
- `apps/mobile/global.css` is properly minimal for NativeWind bootstrapping.
- `apps/mobile/src/app/_layout.tsx:110-124` correctly centralizes providers and the root stack.
- `apps/mobile/src/app/(tabs)/_layout.tsx:55-127` correctly owns tab bar chrome and the customer FAB in one place.

#### Problems

1. Documentation drift is already significant.
   Evidence:
   - `apps/mobile/README.md:9` says Expo SDK 52 / React Native 0.76.7.
   - `apps/mobile/package.json:34-55` shows Expo 55 and React Native 0.83.4.
     Impact:
   - The mobile README cannot be trusted as an implementation reference.
   - New work will be planned against the wrong runtime assumptions.

2. The README’s structure description is incomplete relative to the real app shape.
   Evidence:
   - `apps/mobile/README.md:23-56` documents `components/ui` and `components/templates`, but not `components/shells`.
   - The real tree includes `src/components/shells` and `src/future`, both of which are meaningful architectural buckets.
     Impact:
   - The documented layering is weaker than the implemented layering.
   - Onboarding into the mobile app requires reading the tree instead of trusting docs.

3. Tailwind/NativeWind content scanning does not include all route-bearing code.
   Evidence:
   - `apps/mobile/tailwind.config.ts:17-23` only scans `src/app`, `src/components`, `src/features`, `src/providers`, and `src/store`.
   - Future route files still use `className`, for example `apps/mobile/src/future/tasker/wallet/index.tsx:13-45`.
     Impact:
   - Any screen under `src/future` can silently lose generated NativeWind classes.
   - The current config disagrees with the current directory strategy.

4. Import ergonomics are brittle.
   Evidence:
   - `apps/mobile/tsconfig.json` only defines a path mapping for `@tasky/core`.
   - The current codebase contains 423 imports using three or more `../` segments.
   - Example: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx` and many sibling screens import four levels up for shared UI and design modules.
     Impact:
   - Refactors are more expensive than they need to be.
   - The route tree leaks directly into module ergonomics.

### 2. Design Tokens, Theme Adapters, And Values

#### What is good

- `packages/design-tokens` is correctly structured as primitives -> semantic tokens -> platform outputs.
- `apps/mobile/tailwind.config.ts:27-56` derives colors, spacing, radii, font families, and font sizes from `nativeTokens`, which is the correct direction.
- `apps/mobile/src/design/theme.ts` is thin and stays close to the shared token graph.
- `apps/mobile/src/design/screenLayout.ts` is a good example of useful extraction: it captures app-wide spacing and chrome geometry without pretending to be a full design system.

#### Problems

1. `mobileSurfaces` is carrying too much screen-specific detail to still qualify as design-system infrastructure.
   Evidence:
   - `apps/mobile/src/design/surfaces.ts:19-241` contains screen-specific buckets such as `onboarding`, `help`, `otp`, `otpMigration`, `reschedule`, `splash`, `roleSelect`, `taskDetail`, `bookingTimeline`, `bookingConfirmed`, `referrals`, and `dispute`.
     Impact:
   - The “design” layer now contains route- and feature-specific measurements.
   - This makes the foundation look reusable while actually encoding screen implementations.
   - It creates a false sense of standardization: values are extracted, but not at the right abstraction level.

2. The value strategy is inconsistent: some values are over-extracted, while others are still hardcoded in leaf components.
   Evidence:
   - `apps/mobile/src/design/surfaces.ts:132-138, 228-230` still includes raw `#FFFFFF` and `#FFDDB838`.
   - `apps/mobile/src/lib/notifications.ts:19` hardcodes `#FF231F7C`.
   - `apps/mobile/src/components/templates/SettingsTemplate.tsx:41-44` and `apps/mobile/src/components/ui/ActionRow.tsx:43` both hardcode the same pressed background `rgba(0,0,0,0.05)`.
     Impact:
   - The project is paying the complexity cost of a token layer without fully receiving the consistency benefit.
   - Interaction-state values are duplicated rather than normalized.

3. The design API is broader than it needs to be.
   Evidence:
   - Some code imports `mobileTheme` from `./theme`, while most of the app imports it from `tokenAdapter`.
   - `tokenAdapter` re-exports both real cross-cutting design helpers and screen-specific surface data.
     Impact:
   - The design entrypoint mixes foundation and product-screen convenience values.
   - This will make it harder to enforce what belongs in the design layer later.

### 3. Shells, Templates, And Primitive Reuse

#### What is good

- `apps/mobile/src/components/shells/ScreenContainer.tsx:17-39` is the right kind of shell: small, focused, and policy-setting.
- `apps/mobile/src/components/templates/FormWizardTemplate.tsx:77-179` is a strong composition primitive. It centralizes safe area, step progress, keyboard avoidance, scroll insets, sticky CTA ownership, and button usage.
- `apps/mobile/src/components/templates/FeedListTemplate.tsx` is another strong abstraction. It owns loading, empty, error, pull-to-refresh, reveal animation, and bottom clearance in one reusable place.
- The UI primitive layer is real, not decorative. `Button`, `Input`, `FormField`, `Card`, `ModalSheet`, `Toast`, `Touchable`, and related tests indicate a healthy foundation.

#### Problems

1. Not all interactive row patterns have converged on shared primitives.
   Evidence:
   - `apps/mobile/src/components/templates/SettingsTemplate.tsx` has its own `SettingsRowItem`.
   - `apps/mobile/src/components/ui/ActionRow.tsx` implements a very similar pattern separately.
     Impact:
   - The app has near-duplicate reusable components rather than one canonical row primitive with variants.
   - Interaction styling is duplicated, which is already visible in the shared hardcoded pressed color.

2. Primitive policy is only partially enforced.
   Evidence:
   - `apps/mobile/src/components/ui/Touchable.tsx:11-12` states that screens should use `Touchable` instead of raw `Pressable`.
   - Large screens and feature components still use raw `Pressable` directly in many places.
     Impact:
   - The component library is present, but not consistently the default path.

### 4. Route Structure, Feature Split, And Screen Extraction

#### What is good

- The high-level route grouping is sensible: `(auth)`, `(customer)`, `(tasker)`, `(tabs)`, and `(shared)` map well to navigation concerns.
- Shared layouts and tabs are properly centralized instead of recreated inside screens.
- Features are organized by domain, which is the right default for a mobile app of this size.

#### Problems

1. Too many route files are still large enough to be feature components.
   Evidence:
   - Largest route files include:
     - `src/app/(customer)/tasks/new/review.tsx` at 576 lines
     - `src/app/(customer)/disputes/[disputeId]/index.tsx` at 520 lines
     - `src/app/(shared)/help.tsx` at 448 lines
     - `src/app/(customer)/bookings/[bookingId]/reschedule.tsx` at 444 lines
     - `src/app/(customer)/tasks/[taskId]/index.tsx` at 429 lines
       Impact:
   - Route files are not reliably thin assembly layers.
   - Navigation files still absorb domain formatting, presentational subcomponents, and UX state handling.

2. Representative route screens still define their own reusable-looking UI pieces locally.
   Evidence:
   - `apps/mobile/src/app/(customer)/tasks/new/review.tsx:139-248` defines `SectionCard` and `PhotosCard` inside the route file.
   - The same file also contains parsing and formatting helpers at `:24-137`.
     Impact:
   - Reuse is trapped inside route files.
   - The route layer is doing too much view composition work.

3. Some large feature components are effectively screen implementations rather than reusable feature components.
   Evidence:
   - `apps/mobile/src/features/review/components/ReviewForm.tsx:182-321` renders a full-screen flow with its own safe area, header, scroll container, footer CTA bar, and modal state.
   - `apps/mobile/src/features/tasks/components/ApplicantsList.tsx:230-264` owns a full-page header, screen padding, sectioning, list rendering, and local cards.
     Impact:
   - The route/feature split exists, but some feature components are still page shells in disguise.
   - Composition boundaries are inconsistent across domains.

### 5. Standards Compliance Versus The Declared Mobile Rules

`docs/ARCHITECTURE.md` defines several clear mobile rules: shells own safe areas and chrome, approved primitives wrap `TextInput`, and raw interaction elements should be rare exceptions.

#### Clear violations

1. `ReviewForm` bypasses the approved shell and input wrappers.
   Evidence:
   - `apps/mobile/src/features/review/components/ReviewForm.tsx:17` imports `SafeAreaView`.
   - `apps/mobile/src/features/review/components/ReviewForm.tsx:182-321` renders a full-page layout with its own header and footer.
   - `apps/mobile/src/features/review/components/ReviewForm.tsx:255-265` uses raw `TextInput` instead of the approved `Input` / form wrapper path.
     Impact:
   - This is the strongest example of the standards not being consistently followed.

2. `ApplicantsList` duplicates shell concerns instead of composing existing ones.
   Evidence:
   - `apps/mobile/src/features/tasks/components/ApplicantsList.tsx:230-264` renders top safe-area padding, a custom header, and a page-level `FlatList`.
   - It also defines multiple local subcomponents and a large `StyleSheet` block starting at `:269`.
     Impact:
   - The feature owns both data flow and screen chrome, which should be split.

3. Styling exceptions are too common in high-level screens.
   Evidence:
   - Large route and feature files use `StyleSheet.create`, raw `Pressable`, and inline style objects extensively.
   - Some of those exceptions are justified for animation or 3rd-party APIs, but many are simply screen-local UI composition.
     Impact:
   - The project is not consistently living inside the NativeWind + shell + primitive contract it defined.

## Overall Assessment By Area

- Directory structure: good
  The top-level split is correct and scalable.

- Module split: mixed
  Feature grouping is correct, but route files and some feature “components” are still too heavy.

- Global files and templates: mostly good
  Configs are generally proper and modern, but the README and Tailwind content config need correction.

- Layout ownership: good direction, inconsistent execution
  Root and group layouts are proper. A few screens still recreate chrome locally.

- Component extraction and reuse: good base, incomplete convergence
  Reusable primitives and templates exist and are used, but several domains still define local one-off cards/rows/headers.

- Value extraction: mixed
  Shared tokens are strong. `screenLayout` is healthy. `mobileSurfaces` is too broad, and stray hardcoded values still exist.

## Remediation Plan

### Phase 1: Re-align Documentation And Tooling

1. Update `apps/mobile/README.md` to match the current runtime and real folder structure.
2. Expand `apps/mobile/tailwind.config.ts` content globs to include every directory that renders styled JSX, especially `src/future`.
3. Decide on a local import alias strategy for mobile app internals and apply it consistently.

### Phase 2: Tighten The Design-System Boundary

1. Keep canonical tokens in `@tasky/design-tokens`.
2. Keep app-wide layout/chrome constants in `screenLayout`.
3. Move screen-specific constants out of `src/design/surfaces.ts` into their owning feature or route module unless they are reused across multiple screens.
4. Centralize recurring interaction-state colors and scrims instead of repeating raw RGBA values.
5. Reduce `tokenAdapter` to a smaller, clearer public surface.

### Phase 3: Thin The Route Layer

1. Treat `src/app/**` files as assembly and navigation glue only.
2. Move local presentational sections from large routes into `src/features/**/components`.
3. Start with the highest-return files:
   - `src/app/(customer)/tasks/new/review.tsx`
   - `src/app/(customer)/disputes/[disputeId]/index.tsx`
   - `src/app/(shared)/help.tsx`
   - `src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
   - `src/app/(customer)/tasks/[taskId]/index.tsx`

### Phase 4: Enforce Shell And Primitive Standards

1. Refactor full-screen feature components like `ReviewForm` and `ApplicantsList` to compose `ScreenContainer`, templates, and approved inputs/buttons.
2. Consolidate near-duplicate row primitives such as `ActionRow` and the settings-row pattern.
3. Add or strengthen lint rules for:
   - raw `TextInput` outside `components/ui`
   - raw `SafeAreaView` outside shells
   - raw `Pressable` in route screens where `Touchable` or `Button` should be used

## Priority Order

### High

- Fix README/runtime drift.
- Fix Tailwind content scanning.
- Refactor `ReviewForm` back inside the shell/primitive contract.
- Start thinning the heaviest route files.

### Medium

- Split `mobileSurfaces` into real design tokens versus feature-local constants.
- Consolidate duplicate interactive row patterns.
- Introduce mobile-local import aliases.

### Low

- Normalize the remaining hardcoded RGBA/hex values.
- Reduce duplicate design entrypoints and simplify `tokenAdapter`.

## Execution Model

This audit should be executed in ordered tranches, not as opportunistic cleanup.

Selection rules:

- Every change must map back to at least one finding in this document.
- Work should always be pulled from the highest-priority tranche that is still open.
- A tranche is only considered complete after code changes and verification are both done.
- Follow-up cleanups discovered during implementation are allowed only if they are in the same tranche or remove drift introduced by the same screen/module.
- If a change does not clearly improve layering, reuse, standards compliance, or documentation accuracy, it should not be included in this remediation pass.

Completion rules:

- Route-layer work must make `src/app/**` thinner, not just move code sideways.
- Design-layer work must reduce shared API surface or remove false-global values.
- i18n cleanup is in-scope only when it removes opaque keys in modules already being touched.
- Each tranche should leave behind a simpler architectural boundary than it started with.

## Tranche Tracker

### Tranche 1: Foundation And Documentation Alignment

Status: completed
Priority: high
Findings:

- Foundation And Global Files / Problems 1, 2, 3

Scope:

- Bring `apps/mobile/README.md` in line with the real Expo / React Native runtime and folder structure.
- Expand Tailwind content scanning to cover all styled mobile source directories.

Implemented:

- Updated `apps/mobile/README.md` to reflect Expo 55, React Native 0.83.4, `components/shells`, and `src/future`.
- Updated `apps/mobile/tailwind.config.ts` content globs to scan `src/**/*.{ts,tsx}`.

Verification:

- `pnpm --filter @tasky/mobile typecheck`

### Tranche 2: Shell, Primitive, And Reuse Convergence

Status: completed
Priority: high
Findings:

- Shells, Templates, And Primitive Reuse / Problems 1, 2
- Standards Compliance / Violations 1, 2

Scope:

- Pull obvious full-screen feature implementations back onto the approved shell and primitive stack.
- Remove duplicated row patterns where one canonical primitive is enough.

Implemented:

- Refactored `features/review/components/ReviewForm.tsx` to use `ScreenContainer`, `InsetScrollView`, `StickyActionBar`, `Touchable`, and `Input`.
- Replaced the stale applicants screen split with a shared `ApplicantsSelectionScreen` and removed the duplicated legacy `ApplicantsList.tsx`.
- Converged settings-row behavior onto `ActionRow`.
- Centralized duplicated row pressed-state color handling with `withAlpha(colors.foreground, 0.05)`.

Verification:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm exec jest __tests__/screens/shared/ReviewForm.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/ApplicantsListScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/ReviewSubmitScreen.test.tsx --runInBand`

### Tranche 3: Design-System Boundary Tightening

Status: completed
Priority: high
Findings:

- Design Tokens, Theme Adapters, And Values / Problems 1, 2, 3

Scope:

- Move one-file-only surface constants out of `src/design/surfaces.ts`.
- Remove opaque translation keys in modules already touched during this tranche.
- Keep shared design entrypoints focused on reusable, cross-cutting values only.

Implemented:

- Moved `detailTemplate`, `terms`, `help`, `roleSelect`, and `applicant` surface buckets into their owning modules and removed them from `src/design/surfaces.ts`.
- Moved the dispute status screen timeline surface bucket into its owning screen and removed `dispute` from `src/design/surfaces.ts`.
- Moved the booking reschedule screen surface bucket into its owning screen and removed `reschedule` from `src/design/surfaces.ts`.
- Renamed applicant selection copy keys to semantic `customer.applicants.*` keys.
- Switched help screen copy to existing semantic `infra.help.*` keys and removed `HelpScreen.copy*`.
- Switched terms screen copy to existing semantic `infra.terms.*` keys and removed `TermsScreen.copy*`.
- Switched dispute status screen copy to semantic `customer.disputes.*` keys and removed `DisputeStatusScreen.copy*`.
- Switched booking reschedule screen copy to semantic `customer.bookings.*` keys and removed `RescheduleScreen.copy*`.
- Replaced the audit-called hardcoded white, bonus-surface, and notification light colors with theme-derived semantic colors.
- Removed `mobileSurfaces` from `design/tokenAdapter.ts`; surface consumers now import directly from `design/surfaces`.

Decision:

- Remaining hardcoded colors under `src/future/**` are deferred prototype debt unless those screens are promoted into the supported mobile surface area.

Verification:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm exec jest __tests__/screens/infra/Help.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/infra/Terms.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/ApplicantsListScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/disputes/DisputeStatusScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/bookings/RescheduleScreen.test.tsx --runInBand`

### Tranche 4: Route Thinning

Status: completed
Priority: high
Findings:

- Route Structure, Feature Split, And Screen Extraction / Problems 1, 2, 3

Scope:

- Convert oversized route files into thin route exports or thin assembly layers.
- Move screen composition into feature-owned modules without changing behavior.

Implemented:

- Moved customer task review submit screen logic into `features/tasks/screens/TaskReviewSubmitScreen.tsx` and reduced the route file to a re-export.
- Moved shared help screen implementation into `features/help/screens/HelpCenterScreen.tsx` and reduced the route file to a re-export.
- Moved customer dispute status screen implementation into `features/disputes/screens/DisputeStatusScreen.tsx` and reduced the route file to a re-export.
- Moved customer booking reschedule screen implementation into `features/bookings/screens/BookingRescheduleScreen.tsx` and reduced the route file to a re-export.
- `src/app/(customer)/tasks/[taskId]/index.tsx`
- Moved customer task detail screen implementation into `features/tasks/screens/CustomerTaskDetailScreen.tsx` and reduced the route file to a re-export.

Verification:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm exec jest __tests__/screens/customer/ReviewSubmitScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/infra/Help.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/disputes/DisputeStatusScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/bookings/RescheduleScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/TaskDetailCustomerScreen.test.tsx --runInBand`

### Tranche 5: Import Ergonomics

Status: completed
Priority: medium
Findings:

- Foundation And Global Files / Problem 4

Scope:

- Introduce mobile-local import aliases and migrate the worst deep-relative import hotspots.

Entry criteria:

- Start only after the current high-priority route and design-boundary tranches are stable.

Implemented:

- Added `"@/*": ["./src/*"]` to `apps/mobile/tsconfig.json` paths (Expo 55 / Metro resolves tsconfig paths natively — no babel or metro config changes needed).
- Added `"^@/(.*)$": "<rootDir>/src/$1"` to `apps/mobile/jest.config.js` moduleNameMapper.
- Migrated 36 source files covering all hotspot files with 6+ deep-relative imports (3+ `../` segments):
  - `app/(tabs)/inbox/` (3 files)
  - `app/(customer)/tasks/` and `app/(customer)/tasks/new/` (9 files)
  - `app/(customer)/bookings/` and `app/(customer)/bookings/[bookingId]/` (8 files)
  - `app/(shared)/profile/` (3 files)
  - `app/(tasker)/jobs/` and `app/(tasker)/jobs/[bookingId]/` (3 files)
  - `features/review/components/ReviewForm.tsx`
  - `features/tasks/screens/` (3 files)
  - `features/disputes/screens/DisputeStatusScreen.tsx`
  - `features/profile/components/ProfileView.tsx`
  - `features/bookings/screens/BookingRescheduleScreen.tsx`
  - `features/help/screens/HelpCenterScreen.tsx`
- Remaining deep-relative imports in lower-frequency files and `src/future/**` are deferred per the hotspots-first mandate.

Verification:

- `pnpm --filter @tasky/mobile typecheck`
- `pnpm exec jest __tests__/screens/customer/disputes/DisputeStatusScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/bookings/RescheduleScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/TaskDetailCustomerScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/ApplicantsListScreen.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/infra/Help.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/shared/ReviewForm.test.tsx --runInBand`
- `pnpm exec jest __tests__/screens/customer/ReviewSubmitScreen.test.tsx --runInBand`

## Conclusion

The mobile app is not architecturally broken. The foundation is better than average, especially around routing, shared tokens, and the existence of real shells/templates/primitives.

The problem is discipline drift, not absence of structure. The next tranche should not add more surfaces, templates, or feature folders. It should make the existing layers stricter:

- docs that match reality
- route files that assemble instead of build
- design infrastructure that stays generic
- primitives and shells that are the default, not optional
