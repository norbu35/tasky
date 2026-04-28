# Tasky Architecture — Mobile App

This document defines the mobile architecture for `apps/mobile`.

Read this after:

1. `AGENTS.md`
2. `docs/PRD.md`, `docs/STRATEGY.md`, and `docs/ROLLOUT_PHASES.md`
3. `apps/mobile/AGENTS.md`
4. `docs/architecture/mobile.md` (this file)
5. `docs/architecture/shared-frontend.md` — only when shared UI/tokens/parity/test naming matter
6. `docs/architecture/common.md` — only when cross-cutting runtime/dev workflow context matters

## Scope

This document owns mobile-specific architecture, structural boundaries, and enforcement expectations. Shared system rules remain in `common.md`. Cross-platform frontend contracts (tokens, parity, test naming) remain in `shared-frontend.md`. Backend API contracts remain in `api.md`.

Use `docs/PRD.md` as the authority for active Phase 1 mobile behavior. `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`,
and relevant `docs/maintenance/*.md` constrain launch posture, deferred behavior, and activation policy before mobile
architecture or screen specs. Use `docs/ROLLOUT_PHASES.md` only to understand deferred mobile surfaces that may already
have dormant navigation, components, or state scaffolding. Future-phase references here must not be read as launch
commitments.

## Platform Contract

- Framework: React Native + Expo Router.
- Build native component equivalents. Never import `shadcn/ui` into the mobile app.
- NativeWind backed by `@tasky/design-tokens` is the default styling pipeline.
- `StyleSheet.create` and inline object styles are exceptions reserved for Reanimated styles, platform shadow/elevation helpers, safe-area/inset calculations, and third-party APIs that require object styles.
- Mobile Tailwind exposes token-backed touch and badge utilities such as `min-h-touch-lg`, `min-h-touch-xl`, `size-touch`, `size-touch-sm`, and `tracking-badge`; prefer them over bracketed one-off values when they match the design-system token.
- Expo Router layouts and shared shell components own tab bars, FAB placement, stack headers, modal presentation, and safe-area policy.
- Bottom-sheet presentation is centralized in `src/components/templates/ModalSheetTemplate.tsx`. Shared sheet primitives such as `ActionSheet` and `ConfirmSheet` wrap that template rather than owning separate modal stacks.
- Forbidden escape hatches: core `SafeAreaView`, raw `TextInput` outside approved wrappers, `TouchableOpacity` where shared primitives apply, and ad hoc token lookups outside the canonical token graph.
- If a component exists in `apps/web/src/components/ui/`, a functionally and visually parallel component must exist in `apps/mobile/src/components/ui/` when that primitive is needed on mobile.
- Mobile screen implementation starts from the traceable screen spec in `docs/design/screen-specs/SCR-*.yaml`: read the linked PRD refs, journey refs, screen graph node, and scenario refs before changing route, screen, state, copy, or tests.

---

## 1. Mobile Layer Model and Structural Contract

This document is the derived architecture contract for `apps/mobile`.
Treat this document as the maintained mobile contract. If a mobile rule changes, update the doc and the enforcing tooling in the same change.

#### 7.7.1 Dependency Flow

The mobile app follows a strict unidirectional dependency flow:

```
src/app → src/features/*/screens → src/features/*/{hooks,components,api} → shared src/components, src/design, src/lib, src/utils
```

One-way flow matters more than directory names. Logic should move downward into bounded feature modules, not upward into routes, shared UI, or the root app shell.

`*.model.ts` / folder-form `model.ts` files are screen-private and live inside `screens/` (§7.7.5.9); they are not a separate importable layer and are consumed only by the Screen, its orchestration hook, and its sibling sections. Cross-feature imports traverse `features/<domain>/index.ts` only (§7.7.2.1).

#### 7.7.2 Layer Contract

| Layer                       | May import                                                                                                 | Must not import                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/**`                | Expo Router APIs, route-param codecs, navigation helpers, route-safe feature screens                       | `createMobileApiClient`, feature `api.ts`, reusable business UI, transport internals |
| `src/features/*/screens/**` | Feature hooks, feature components, screen-local model helpers, shared templates, shared primitives         | Raw transport client (`mobileApiClient`), route files                                |
| `src/features/*/hooks/**`   | Feature `api.ts`, React Query, stores, shared utilities                                                    | Route files (`src/app/**`)                                                           |
| `src/features/*/api/**`     | Domain endpoint calls, response mapping, shared transport, generated SDK types                             | Route files, shared UI                                                               |
| `src/components/**`         | Shared UI only                                                                                             | Feature data fetching, `src/features/**`                                             |
| `src/design/**`             | Cross-cutting visual foundation                                                                            | `src/app/**`, `src/features/**`                                                      |
| `src/providers/**`          | Shared stores, shared libs, and app-wide feature hooks, APIs, or providers used for cross-cutting concerns | Route files, feature screen modules, route-specific orchestration                    |
| `src/store/**`              | Session, bootstrap/app-shell state, explicit client-only workflow state                                    | Network access, React Query ownership, duplicated server state                       |
| `src/lib/**`                | Shared infrastructure, transport helpers, generated SDK type adapters, platform service wrappers           | Feature modules, route files, store ownership                                        |
| `src/utils/**`              | Pure helpers, formatters, small platform wrappers, and type-safe non-React utilities                       | React hooks, store mutation, feature modules, transport access                       |
| `archive/mobile-future/**`  | N/A — archived deferred prototypes                                                                         | Imports into production surfaces                                                     |

##### §7.7.2.1 — Feature-to-feature imports go through the feature index only

`features/A/**` may import from `features/B/**` only via `features/B/index.ts` (the feature's published surface). Direct imports into `features/B/api.ts`, `features/B/screens/**`, `features/B/hooks/**`, or `features/B/draft/**` are forbidden. **Rationale:** features are bounded contexts; the index is the contract. **Enforcement:** checker rule 19.

##### §7.7.2.2 — `features/<domain>/hooks/**` may not import `features/<domain>/screens/**`

The dependency flow is one-way: screens consume hooks, never the reverse. Implicit in §7.7.1 but not previously gated. **Enforcement:** extension to the feature-layer checks.

##### §7.7.2.3 — Route files import the Screen component only

`src/app/**` route files may import a feature's `<Screen>Screen` default export (via the feature's published surface) and nothing else from `features/<domain>/screens/**`. Sections, models, and orchestration hooks are not route-reachable. **Enforcement:** extension to the existing route banned-imports check (rule 2).

##### §7.7.2.4 — No cross-screen imports within the same feature

`screens/ScreenA.*` may not import `screens/ScreenB.*`. Shared presentation goes to `features/<domain>/components/`; shared logic goes to `features/<domain>/hooks/` or a feature-level `model.ts`. **Enforcement:** checker rule 20.

#### 7.7.3 Runtime Ownership

- `src/app/_layout.tsx` owns app-wide provider composition, platform lifecycle bridges, and one-time bootstrap wiring.
- `src/providers/**` owns reusable cross-cutting context that is consumed by multiple routes or features.
- Providers may call feature APIs or hooks only when the concern is genuinely app-wide, such as notifications, auth bootstrap, or review gating.
- Feature-local side effects belong in feature hooks or feature-local providers, not in route files.
- React Query owns server state. Zustand owns session/bootstrap/app-shell state and explicit client-only workflow state only.
- Global stores must not mirror data that already has a stable query key and cache lifecycle in React Query.
- Store files must not call feature APIs, import the mobile transport client, or own query lifecycles.

#### 7.7.4 Route Adapter Contract

Non-layout route files in `src/app/**` must be thin adapters.

- Preferred target size: `<= 40` lines
- Soft warning: `> 60` lines
- Hard fail: `> 100` lines
- Allowed responsibilities:
  - `Stack.Screen` options
  - route param decoding or aliasing
  - rendering a feature screen
- Not allowed:
  - direct domain API calls
  - transport imports
  - upload or mutation flow implementation
  - parsing business payloads beyond route-param decoding
  - reusable business UI definitions

Route-to-route imports are discouraged and should trend to zero. The current structure checker reports them as warnings.

The following near-static state routes are tolerated in the `61-100` warning band when they remain mostly declarative:

- `(shared)/network-error.tsx`
- `(shared)/app-update.tsx`
- `(shared)/account/suspended.tsx`
- `(shared)/session-expired.tsx`
- `(customer)/bookings/[bookingId]/cancel.tsx`
- `(tasker)/jobs/[bookingId]/cancel.tsx`
- `(tasker)/verification/pending.tsx`
- `(tasker)/verification/rejected.tsx`

New routes in this class may be tolerated only when they carry no business-flow logic.

#### 7.7.5 Screen-Family Contract

A screen family is the bounded grammar of files that together realize one UI screen. Every rule in this section carries a stable ID and a machine-enforceable gate in `apps/mobile/scripts/structure-check.js`.

The corresponding `docs/design/screen-specs/SCR-*.yaml` entry owns the UX contract for the screen family. For new or
materially changed mobile screens, update the screen spec first and move its `traceability.status` to `validated` once
the PRD, journey, screen graph, and scenario references are checked. Use `pending_audit` only for an explicitly scoped
follow-up audit.

Two forms are permitted: flat (siblings in `features/<domain>/screens/`) and folder (a screen-local directory `features/<domain>/screens/<Screen>/`). Promotion from flat to folder is mandatory at a defined threshold (§7.7.5.2). Mixing the two forms for the same screen is forbidden.

**Flat form:**

```text
features/<domain>/screens/
  <Screen>Screen.tsx          # composition only
  use<Screen>Screen.ts        # orchestration/effects
  <Screen>.model.ts           # pure types + pure transforms
  <Screen>.<Section>.tsx      # presentational section, screen-private
```

**Folder form:**

```text
features/<domain>/screens/<Screen>/
  Screen.tsx
  use<Screen>Screen.ts
  model.ts
  <Section>.tsx
  index.ts        # re-exports Screen as default + route-param types only
```

##### §7.7.5.1 — Screen-family file membership is fixed

The only file roles allowed inside `screens/` (or a screen-local folder) are: composition, orchestration hook, model, section, and folder entry point. Loose files (`useFoo.ts` that is not an orchestration hook, `Utils.ts`, `constants.ts`, `types.ts`) are forbidden in `screens/`. Shared logic goes to `features/<domain>/hooks/`; shared UI goes to `features/<domain>/components/`; shared types/selectors go to a feature-level `model.ts` if and when one exists. **Enforcement:** checker rule 15.

##### §7.7.5.2 — Folder promotion is mandatory at threshold

A screen family must use folder form when any of the following is true:

- ≥ 4 section files for the same screen, OR
- total file count for the family (Screen + hook + model + sections) ≥ 6, OR
- combined line count for the family ≥ 600

**Enforcement:** checker rule 18 (screen-family aggregation). **Rationale:** flat siblings stop being readable past a handful of files per screen.

##### §7.7.5.3 — Sections are screen-private

A section file may be imported only by its sibling `<Screen>Screen.tsx` / `Screen.tsx` or by other sibling sections in the same screen family. Any cross-screen or cross-feature consumer requires promoting the section to `features/<domain>/components/` and dropping the `<Screen>.` prefix. **Enforcement:** checker rules 19 (cross-feature) and 20 (cross-screen within a feature).

##### §7.7.5.4 — No barrel at the `screens/` directory root

`features/<domain>/screens/index.ts` is forbidden. A `screens/<Screen>/index.ts` is permitted only inside a screen-local folder and may only re-export the Screen as default plus named route-param types. **Enforcement:** checker rule 21. **Rationale:** directory-root barrels break dead-code analysis and make imports opaque.

##### §7.7.5.5 — `*.parts.tsx` phase-out rule

Existing `*.parts.tsx` files are temporarily tolerated while the screen-family split is being completed. New `*.parts.tsx` files are not permitted and fail CI. The existing set moves from warning to failure as enforcement tightens. **Enforcement:** existing check 12 plus a diff-based new-file veto.

##### §7.7.5.6 — Screen names are PascalCase root nouns

The Screen root is shared by route file, `<Screen>Screen.tsx`, orchestration hook, model, and sections. Singular for detail screens (`CustomerTaskDetail`), plural for list screens (`CustomerTasks`). No abbreviations. Implicit via §7.7.5.1 allowlist.

##### §7.7.5.7 — Orchestration hooks carry the `Screen` suffix

`use<Screen>Screen.ts` is required in both flat and folder form. Without the suffix the checker cannot distinguish a screen-orchestration hook from a reusable domain hook in `features/<domain>/hooks/` (e.g., `useCustomerTaskDetail.ts`), and callers cannot tell at the import site which class of hook they are consuming. **Enforcement:** checker rule 13.

##### §7.7.5.8 — Section filenames are `<PascalScreen>.<PascalSection>.tsx`

Both segments must be PascalCase. Exactly one internal dot. Forbidden: lowercase first-letter segments (`BookingReschedule.datePicker.tsx`), multi-dot chains, kebab-case. **Enforcement:** checker rule 14. **Rationale:** eliminates the current regex-heuristic fragility.

##### §7.7.5.9 — `.model.ts` is pure

`<Screen>.model.ts` (flat) or `model.ts` (folder) may contain TypeScript types, pure parsing/formatting functions, and pure selectors over props. Forbidden imports: `react`, `react-native`, `@tanstack/react-query`, any `@/features/*/api`, `mobileApiClient`, any store module. No side effects, no React Hooks, no mutations. Impure logic belongs in the orchestration hook. **Enforcement:** checker rule 16.

##### §7.7.5.10 — Domain hooks do not carry the `Screen` suffix

Hooks in `features/<domain>/hooks/` never end in `Screen.ts`. The suffix is exclusive to orchestration hooks inside `screens/`. **Enforcement:** checker rule 13 (complementary half).

##### §7.7.5.11 — Decomposition trigger

Decomposition is required when a screen exceeds `220` lines or mixes three or more of: route param parsing, async side effects, domain mutations, local presentational subcomponents, formatting or parsing helpers. This trigger is advisory at the line-level but gateable via §7.7.6.1 (Screen warn > 220, fail > 280).

#### 7.7.6 Role-Aware File Budgets

Only warn and fail thresholds are normative. Aspirational "target" numbers are not written into the contract because rules without gates decay (§7.7.11.3).

##### §7.7.6.1 — Enforced line budgets

| Role                                                       | Warn  | Fail  |
| ---------------------------------------------------------- | ----- | ----- |
| Route (`src/app/**`, non-layout)                           | > 60  | > 100 |
| Screen (`<Screen>Screen.tsx`, folder `Screen.tsx`)         | > 220 | > 280 |
| Section (`<Screen>.<Section>.tsx`, folder `<Section>.tsx`) | > 260 | > 340 |
| Model (`<Screen>.model.ts`, folder `model.ts`)             | > 180 | > 240 |
| Orchestration hook (`use<Screen>Screen.ts`)                | > 180 | > 240 |
| Existing `*.parts.tsx` (transitional)                      | > 260 | > 340 |

**Enforcement:** existing checks 1 (routes) and 11 (screen family); classification updated for the §7.7.5.1 allowlist.

##### §7.7.6.2 — Screen-family section cap

A single screen family may not contain more than **8 section files**. Above 8 is a hard fail. Applies to both flat and folder forms. **Rationale:** a screen that needs more than 8 sections is usually two screens sharing a route. **Enforcement:** checker rule 18.

##### §7.7.6.3 — Deep relative imports banned

No `../../` or deeper in any `src/**` file. Use path aliases (`@/…`). **Enforcement:** checker rule 17.

#### 7.7.7 Data Access And SDK Contract

`@tasky/sdk` is the maintained reference for generated API schema types. Mobile code must consume generated SDK types instead of hand-writing fetch types.

Runtime networking remains split into:

- feature-local `api.ts` modules that own domain endpoint calls and response mapping
- `src/lib/mobileApiClient.ts`, which is transport-only infrastructure

The shared transport layer is limited to:

- base URL resolution
- auth header composition
- token refresh handling
- shared request primitives
- transport-level error mapping

Route files and shared UI must not import the transport client.

#### 7.7.8 Workflow Draft Contract

Multi-step customer task creation uses a typed draft boundary under `src/features/tasks/draft/`.

Navigation passes only `draftId` and route-safe step identifiers when needed. It must not pass serialized intake answers, uploaded photo arrays, or repeated copies of category, location, or scheduling payloads.

#### 7.7.9 Deferred Surface Policy

Deferred or prototype mobile surfaces must not live in the active production source tree under `src/`.

Acceptable locations:

1. `archive/mobile-future/`
2. outside `src/` with explicit no-import enforcement

Deferred code must be excluded from runtime entrypoints, excluded from Tailwind content scanning unless intentionally active, and blocked from import into production surfaces.

#### 7.7.10 Enforcement

`pnpm --filter @tasky/mobile structure:check` is the structural gate for this contract. Every rule below names the contract ID it enforces.

| #   | Check                                                     | Rule ID             | Severity                 |
| --- | --------------------------------------------------------- | ------------------- | ------------------------ |
| 1   | Route budget                                              | §7.7.4, §7.7.6.1    | warn > 60, fail > 100    |
| 2   | Route banned imports                                      | §7.7.2.3, §7.7.4    | fail                     |
| 3   | Route-to-route imports                                    | §7.7.4              | warn                     |
| 4   | Component layer imports `@/features/**`                   | §7.7.2              | fail                     |
| 5   | Design layer imports `@/app/**`, `@/features/**`          | §7.7.2              | fail                     |
| 6   | Future import violations                                  | §7.7.9              | fail                     |
| 7   | Provider layer boundaries                                 | §7.7.2              | fail                     |
| 8   | Store layer boundaries                                    | §7.7.2, §7.7.3      | fail                     |
| 9   | Lib layer boundaries                                      | §7.7.2              | fail                     |
| 10  | Utils layer boundaries                                    | §7.7.2              | fail                     |
| 11  | Screen-family role-aware budgets                          | §7.7.6.1            | warn/fail by role        |
| 12  | Existing `*.parts.tsx` files                              | §7.7.5.5            | warn (fail on new files) |
| 13  | Orchestration-hook naming (`Screen` suffix)               | §7.7.5.7, §7.7.5.10 | warn → fail (Phase 4)    |
| 14  | Section-file name pattern                                 | §7.7.5.8            | warn → fail (Phase 4)    |
| 15  | Screen-family file-role allowlist                         | §7.7.5.1            | warn → fail (Phase 4)    |
| 16  | Model purity (banned imports in `*.model.ts`)             | §7.7.5.9            | warn → fail (Phase 4)    |
| 17  | Deep relative-import ban                                  | §7.7.6.3            | warn → fail (Phase 4)    |
| 18  | Screen-family aggregation (folder threshold, section cap) | §7.7.5.2, §7.7.6.2  | warn → fail (Phase 4)    |
| 19  | Feature-to-feature boundary                               | §7.7.2.1, §7.7.5.3  | warn → fail (Phase 4)    |
| 20  | Cross-screen ban within a feature                         | §7.7.2.4, §7.7.5.3  | warn → fail (Phase 4)    |
| 21  | `screens/` barrel ban                                     | §7.7.5.4            | warn → fail (Phase 4)    |
| 22  | Test-path mirror                                          | §7.7.12.1           | warn                     |

Checks 13–22 begin at `warn` severity when the checker is extended, then move to `fail` as enforcement is tightened in the active workstream.

When the contract and tooling diverge, fix both in the same change. Do not leave unstated severities or contradictory thresholds in the repo.

#### 7.7.11 Governance

- This section is normative. Historical plans may explain why a rule exists, but they do not override this contract.
- Any change to a mobile boundary rule must update both this section and `apps/mobile/scripts/structure-check.js` in the same change.
- A contract change is incomplete if it changes wording without updating enforcement, or updates enforcement without updating this section.
- Runtime rules that cannot yet be machine-enforced must be written narrowly and accompanied by a verification strategy in tests or review notes. Do not hide aspirational guidance inside normative wording.

##### §7.7.11.1 — All rules have stable IDs

Every normative rule carries an ID of the form `§7.7.<section>.<number>`. Violation reports, commit messages, and PR reviews cite the ID, never a paragraph reference.

##### §7.7.11.2 — `apps/mobile/AGENTS.md` carries an AI-facing quick reference

A Structural Contract Quick Reference is maintained in `apps/mobile/AGENTS.md`, listing the rules most likely to be violated by an AI agent edit, each tagged with its rule ID. The quick reference is rebuilt whenever §7.7 changes. The full §7.7 remains the normative source; the quick reference is a navigation aid.

##### §7.7.11.3 — Target tier is not used

The contract exposes only warn and fail thresholds. Aspirational "target" numbers are not written into the contract, because rules without gates decay.

#### 7.7.12 Test Organization

##### §7.7.12.1 — Tests mirror source paths

A test at `apps/mobile/__tests__/<path>` corresponds to `apps/mobile/src/<path>`. Integration tests live under `apps/mobile/__tests__/integration/`. Fixtures live under `apps/mobile/__tests__/integration/fixtures.ts` or equivalent. **Enforcement:** checker rule 22.

##### §7.7.12.2 — Test file budget

Individual test files: warn > 400 lines, fail > 500 lines. **Enforcement:** extension to existing budget checks.

##### §7.7.12.3 — No production imports from `__tests__/`

Source files under `src/**` may not import from `__tests__/**`. **Enforcement:** new banned-import check applied globally to `src/**`.

---
