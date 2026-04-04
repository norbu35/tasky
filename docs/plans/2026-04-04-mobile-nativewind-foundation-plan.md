# Tranche Plan: Mobile NativeWind Foundation + Token Consolidation

**Status:** planned
**Priority:** critical
**Depends on:** none

## Description
Restructure the mobile styling architecture in `apps/mobile` so the app has one coherent styling convention, one canonical design-token contract, and one clear ownership model for navigation chrome and screen shells. This plan supersedes parity-first sequencing: design parity is no longer an implementation driver and becomes a validation tranche after the architecture is stable. The refactor touches `packages/design-tokens`, Expo Router layouts, shared mobile templates/primitives, and the screen archetypes that currently bypass them.

## Architecture Decisions
- **Theming model:** build-time token swapping is the primary restyling mechanism for this refactor. Runtime theme switching is explicitly out of scope.
- **Token layers:** canonical tokens are split into `primitive` values, `semantic` aliases, and `platform outputs` so web and mobile consume the same meaning, not parallel ad hoc shapes.
- **Mobile styling convention:** NativeWind is the default for layout, spacing, colors, typography, radius, borders, and state styling. `StyleSheet.create` is reserved for the cases NativeWind does not express well: Reanimated styles, platform shadow/elevation helpers, safe-area/inset calculations, and third-party component APIs that require object styles.
- **Navigation chrome ownership:** Expo Router layouts own tab bars, FAB placement, stack headers, modal presentation, and safe-area policy. Route screens may compose approved shells but may not recreate navigation chrome locally.
- **Parity sequencing:** no new parity work runs during the migration. A parity re-audit happens only after the new foundation is merged and representative screens are stable.

## Tranches

### Tranche: Codify the architecture contract
**Status:** planned
**Priority:** critical
**Depends on:** none

#### Scope
- Update the canonical docs so they describe the real target stack: Expo Router ownership, NativeWind usage, token layering, and shell ownership boundaries.
- Mark older parity-first planning as superseded and point maintainers to this architecture-first plan.
- Define the allowed/forbidden styling patterns for mobile (`NativeWind` default, `StyleSheet` exceptions, shared shell boundaries, forbidden raw primitives).

#### Done When
- `docs/ARCHITECTURE.md` accurately describes the intended mobile stack and routing ownership model.
- The existing parity-first mobile plan is marked superseded and explicitly defers parity checks until after this refactor.
- The mobile architecture contract names the banned escape hatches: core `SafeAreaView`, screen-owned bottom nav/FAB/header chrome, raw `TextInput` outside approved wrappers, and ad hoc token lookups.
- Verification notes specify which static checks and test suites will enforce the contract in later tranches.

---

### Tranche: Consolidate the canonical token contract
**Status:** planned
**Priority:** critical
**Depends on:** Codify the architecture contract

#### Scope
- Collapse `packages/design-tokens` into one export contract with no parallel token shapes for web and mobile.
- Model token layers explicitly: primitive palette/scale, semantic aliases, and platform output bindings for CSS variables, Tailwind, and NativeWind.
- Carry typography metadata all the way through the contract, including font family, weight, line-height, and letter-spacing rules needed for Mongolian Cyrillic.

#### Done When
- `packages/design-tokens` exposes one canonical token graph and removes the current split-brain exports.
- Web and mobile consume the same semantic token names, not separate shape-specific adapters.
- Typography tokens include font-family and text-metric values rather than just numeric font sizes.
- Token tests prove that platform outputs are derived from the same semantic graph and that swapping token values restyles consumers without component changes.

---

### Tranche: Install the NativeWind platform foundation
**Status:** planned
**Priority:** critical
**Depends on:** Consolidate the canonical token contract

#### Scope
- Add NativeWind and the supporting React Native configuration for `apps/mobile`.
- Bind NativeWind theme values to the canonical token contract and define a small class composition strategy for shared primitives.
- Introduce a documented bridge period so existing `StyleSheet` components can migrate incrementally without ambiguous long-term ownership.

#### Done When
- `apps/mobile` builds and typechecks with NativeWind enabled.
- NativeWind theme values come from the canonical token package rather than mobile-local constants.
- The mobile codebase has a clear rule for when to use classes vs object styles, with examples for common component categories.
- A representative smoke slice proves NativeWind and the token bridge can coexist without breaking navigation or rendering.

---

### Tranche: Consolidate navigator-owned shells
**Status:** planned
**Priority:** critical
**Depends on:** Install the NativeWind platform foundation

#### Scope
- Standardize app shell ownership across Expo Router layouts and shared screen templates.
- Normalize safe-area behavior, modal presentation, sticky bottom actions, tab bar/FAB ownership, and header policies.
- Remove duplicate navigation chrome from route screens and move ownership into layouts/shells.

#### Done When
- Shared shell components own top/bottom safe-area behavior and do not rely on hard-coded inset padding.
- Tab bars, FABs, and modal presentation live in Expo Router layouts or shell wrappers only.
- The post-task journey, tab flows, and detail flows each have one clear shell owner.
- Tests cover shell ownership, safe-area behavior, and route-level presentation semantics on representative screens.

---

### Tranche: Migrate form and action primitives
**Status:** planned
**Priority:** high
**Depends on:** Consolidate navigator-owned shells

#### Scope
- Rebuild the core interaction primitives on top of NativeWind and canonical tokens: `Button`, `Input`, `FormField`, action rows, CTA bars, and text/heading helpers where needed.
- Normalize form states and text metrics across auth, review, dispute, and posting flows.
- Replace direct use of raw text inputs and legacy touch primitives in the shared layer.

#### Done When
- Shared form/action primitives render from NativeWind classes backed by canonical tokens.
- Mobile input, error, disabled, loading, and pressed states are consistent across the shared layer.
- Direct `TextInput` and `TouchableOpacity` usage is removed from the shared primitives and replaced with approved boundaries.
- React Native Testing Library coverage exists for the primary state matrix of the migrated primitives.

---

### Tranche: Migrate list, detail, and sheet templates
**Status:** planned
**Priority:** high
**Depends on:** Migrate form and action primitives

#### Scope
- Rebuild the shared mobile templates and surfaces used by many screens: feed/list, detail, wizard, settings, empty/error states, and modal sheets.
- Move repeated spacing, typography, and CTA treatments into reusable template variants.
- Preserve the few object-style helpers still needed for blur, bottom sheets, and animated states.

#### Done When
- `DetailTemplate`, `FeedListTemplate`, `FormWizardTemplate`, `ModalSheetTemplate`, and adjacent shared surfaces use NativeWind-backed primitives and the canonical token contract.
- Shared templates no longer hard-code bottom padding or recreate safe-area policy internally.
- Representative list/detail/wizard/sheet screens are migrated onto the new template layer without local shell duplication.
- Tests cover template rendering, error/loading/empty states, and sticky action behavior.

---

### Tranche: Migrate route archetypes onto the new foundation
**Status:** planned
**Priority:** high
**Depends on:** Migrate list, detail, and sheet templates

#### Scope
- Move route screens onto the new shells and primitives by archetype rather than by Figma batch: auth/shared, feed/list, detail, wizard, modal/sheet, and messaging.
- Remove duplicated local headers, FABs, bottom navs, safe-area wrappers, and bespoke field styling from screen files.
- Keep parity work out of scope except where migration exposes obvious shell regressions that block correctness.

#### Done When
- Each route archetype has an approved shell and primitive composition path, and screens use that path rather than local reinvention.
- Messaging, booking, and task flows no longer mix incompatible shell patterns within the same journey.
- The remaining `StyleSheet` usage in route screens is limited to justified exceptions documented in the architecture contract.
- Touched screen suites pass and are expanded where screen-level structural behavior changed.

---

### Tranche: Enforce and clean up the new boundaries
**Status:** planned
**Priority:** high
**Depends on:** Migrate route archetypes onto the new foundation

#### Scope
- Remove deprecated token adapters, dead styles, and parallel styling paths.
- Add static enforcement for the boundaries this refactor introduces.
- Lock in the new architecture so future mobile work cannot drift back to bespoke screen styling.

#### Done When
- The old token shape and compatibility-only adapters are removed or isolated behind clearly temporary migration boundaries.
- Lint rules, tests, or static checks block core `SafeAreaView`, screen-owned nav chrome, raw `TextInput`, and legacy touch primitives where the shared alternatives are required.
- The mobile docs explain how to build new screens with shells, primitives, and NativeWind classes.
- `pnpm --filter @tasky/mobile typecheck`, `pnpm --filter @tasky/mobile lint`, and `pnpm --filter @tasky/mobile test` pass after cleanup.

---

### Tranche: Re-audit parity against the design source
**Status:** planned
**Priority:** medium
**Depends on:** Enforce and clean up the new boundaries

#### Scope
- Run a focused parity check against representative screens after the new architecture is stable.
- Fix residual visual drift that remains after the structural migration.
- Produce verification evidence that the new foundation did not materially regress approved screen designs.

#### Done When
- A representative parity checklist maps route files to design references and notes any remaining intentional deviations.
- Residual spacing, typography, shell, and state mismatches found during the re-audit are fixed or explicitly documented.
- The parity check is treated as validation only and does not re-open the architecture decisions already made in prior tranches.
- `CHANGELOG.md` records the architectural migration and follow-up parity validation.

## Verification Requirements
- Per tranche: `pnpm --filter @tasky/mobile typecheck`
- Per tranche touching shared UI: `pnpm --filter @tasky/mobile test`
- Per tranche introducing new build/config behavior: `pnpm --filter @tasky/mobile lint`
- Shell and route tranches require targeted simulator/manual checks for safe-area behavior, tab/FAB ownership, modal presentation, and sticky bottom actions.

## Dependencies and Risks
- NativeWind adoption will expose ambiguous ownership boundaries unless the shell contract is merged before broad screen migration.
- Token consolidation will break consumers quickly if the platform-output contract is not designed before migration starts.
- Typography migration can regress Mongolian Cyrillic rendering if font fallback and text metrics are not validated early.
- A long compatibility bridge will reduce immediate risk but increase the chance of permanent mixed patterns unless the cleanup tranche is enforced.
