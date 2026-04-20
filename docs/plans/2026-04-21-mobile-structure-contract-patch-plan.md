# Mobile Structure Contract — Patch and Enforcement Plan

Date: 2026-04-21
Scope: `docs/ARCHITECTURE.md` §7.7, `apps/mobile/scripts/structure-check.js`, `apps/mobile/src/features/**`
Status: proposed

## 1. Background

The current mobile structural contract (`docs/ARCHITECTURE.md` §7.7) defines a screen-family grammar and layer dependency flow. Enforcement is implemented in `apps/mobile/scripts/structure-check.js`. An audit of `features/tasks/screens/` (44 files across 10 screen families, `CustomerTaskDetail` alone accounting for 12) surfaced the following defects:

1. The flat-vs-folder decomposition rule is advisory ("when a family grows beyond a few adjacent files") and never enforced, so flat layouts scale unbounded.
2. The orchestration-hook naming convention is inconsistent (`useCustomerTaskDetailScreen` vs `useTaskIntake`) and can collide with domain hook names in `features/<domain>/hooks/`.
3. The `.model.ts` file role is under-specified ("parsing, formatting, derived state helpers"), allowing it to absorb impure logic without tripping any gate.
4. The section-file detection heuristic in the checker accepts any `.tsx` with a dot in the filename, which misclassifies mixed-case filenames such as `BookingReschedule.datePicker.tsx`.
5. The line-budget "target" tier in the doc has no enforcement mechanism, so it is treated as optional.
6. No contract rule addresses feature-to-feature imports, cross-screen imports within a feature, barrel files under `screens/`, or section visibility.
7. The screen family has no file-count cap — `CustomerTaskDetail` can grow indefinitely without tripping any check.

This plan closes those gaps. The codebase is maintained in part by AI agents, so unambiguous, machine-checkable rules are a primary requirement.

## 2. Scope

- Patch `docs/ARCHITECTURE.md` §7.7 in place. Existing sub-section numbers are preserved; new rules are added with stable IDs of the form `§7.7.<N>.<M>` for citation in commit messages and violation reports.
- Extend `apps/mobile/scripts/structure-check.js` with new checks 13–22 (Phase 2).
- Remediate current violations in small, behavior-neutral tranches (Phase 3).
- Promote `pnpm --filter @tasky/mobile structure:check` to a required CI gate and flip new rules from `warn` to `fail` as each tranche lands (Phase 4).

Out of scope: backend or web structural contracts, new runtime behavior, design-token changes.

## 3. Rule Spec (normative source — ARCHITECTURE.md §7.7)

Rules are organized into six groups (A–F). Each rule has a stable ID (`§7.7.5.N`, `§7.7.6.N`, etc.), a one-line statement, a rationale, an enforcement mechanism, and a migration note where relevant.

### Group A — Screen-family layout (`§7.7.5.*`)

#### §7.7.5.1 — Screen-family file membership is fixed

Within `features/<domain>/screens/` (flat form) or `features/<domain>/screens/<Screen>/` (folder form) the only allowed file roles are:

| Role               | Flat-form filename       | Folder-form filename                |
| ------------------ | ------------------------ | ----------------------------------- |
| Composition        | `<Screen>Screen.tsx`     | `Screen.tsx`                        |
| Orchestration hook | `use<Screen>Screen.ts`   | `use<Screen>Screen.ts`              |
| Model (pure)       | `<Screen>.model.ts`      | `model.ts`                          |
| Section            | `<Screen>.<Section>.tsx` | `<Section>.tsx`                     |
| Folder entry point | _(n/a)_                  | `index.ts` (re-exports Screen only) |

Loose files (`useFoo.ts` that does not match the orchestration-hook pattern, `Utils.ts`, `constants.ts`, `types.ts`, etc.) are forbidden in `screens/`. Place them in `features/<domain>/hooks/`, `features/<domain>/components/`, or a feature-level `model.ts`.

**Rationale:** a finite grammar makes file-placement decisions deterministic.
**Enforcement:** checker rule 15 (file-role allowlist under `screens/`).
**Migration:** survey; expected zero or near-zero violations today.

#### §7.7.5.2 — Folder promotion is mandatory at threshold

A screen family flips from flat to folder form when any of the following is true:

- ≥ 4 section files for the same screen, OR
- Total file count for the family (Screen + hook + model + sections) ≥ 6, OR
- Combined line count for the family ≥ 600

Folder form:

```text
features/<domain>/screens/<Screen>/
  Screen.tsx
  use<Screen>Screen.ts
  model.ts
  <Section>.tsx
  index.ts        # re-exports Screen as default
```

Mixing flat and folder form for the same screen is forbidden.

**Rationale:** flat siblings stop being readable past a handful of files per screen; folder form scales.
**Enforcement:** checker rule 18 (screen-family aggregation).
**Migration:** Tranche R1 (CustomerTaskDetail), Tranche R5 (other threshold-exceeders).

#### §7.7.5.3 — Sections are screen-private

A section file may be imported only by its sibling `<Screen>Screen.tsx`/`Screen.tsx` or by other sibling sections in the same screen family. Any cross-screen or cross-feature consumer requires promoting the section to `features/<domain>/components/` and dropping the `<Screen>.` prefix.

**Rationale:** sections are presentation specific to one screen instance; shared UI has a different home.
**Enforcement:** checker rule 20 (cross-screen import ban within a feature); rule 19 covers cross-feature case.
**Migration:** audit in Tranche R5.

#### §7.7.5.4 — No barrel files at the `screens/` directory root

`screens/index.ts` is forbidden. `screens/<Screen>/index.ts` is permitted only inside a screen-local folder, and may only `export { default } from './Screen'` plus named route-param types.

**Rationale:** barrels break dead-code analysis, slow type-checking, and make imports opaque.
**Enforcement:** checker rule 21 (screen barrel ban).
**Migration:** survey; no known violations today.

#### §7.7.5.5 — Legacy `*.parts.tsx` completion deadline

Existing `*.parts.tsx` files remain tolerated until the existing remediation plan (`2026-04-20-mobile-screen-section-naming-remediation-plan.md`) is complete. After completion, any new `*.parts.tsx` file is a hard fail. Existing files flip from warn to fail when the tranche closing each is merged.

**Rationale:** preserves the active migration without reverting its framing.
**Enforcement:** existing check 12 plus a git-diff-based new-file veto (part of CI).

### Group B — Naming (`§7.7.5.6`–`§7.7.5.10`)

#### §7.7.5.6 — Screen names are PascalCase root nouns

The Screen root is shared by route file, `<Screen>Screen.tsx`, orchestration hook, model, and sections. Singular for detail screens (`CustomerTaskDetail`), plural for list screens (`CustomerTasks`). No abbreviations.

**Enforcement:** implicit via §7.7.5.1 allowlist; no separate checker rule.

#### §7.7.5.7 — Orchestration hooks carry the `Screen` suffix

`use<Screen>Screen.ts` is required in both flat and folder form. Without the suffix, the checker cannot distinguish a screen-orchestration hook from a reusable domain hook (e.g., `useCustomerTaskDetail.ts` in `features/tasks/hooks/`).

**Rationale:** disambiguates two hook classes whose names would otherwise collide; makes checker classification deterministic.
**Enforcement:** checker rule 13 (orchestration-hook naming).
**Migration:** Tranche R2 (renames: `useTaskIntake` → `useTaskIntakeScreen`, plus `useTaskLocation`, `useTaskSchedule`, `useTaskReviewSubmit`, `useApplicantsSelection`, `useCustomerTasks`).

#### §7.7.5.8 — Section filenames are `<PascalScreen>.<PascalSection>.tsx`

Both segments must be PascalCase. Exactly one internal dot. Forbidden: lowercase first-letter segments, multi-dot chains, kebab-case.

**Rationale:** eliminates the checker's current regex fragility; produces a stable, scriptable pattern.
**Enforcement:** checker rule 14 (section-file naming regex).
**Migration:** Tranche R3 (audit + rename).

#### §7.7.5.9 — `.model.ts` is pure

`<Screen>.model.ts` (flat) or `model.ts` (folder) may contain TypeScript types, pure parsing/formatting functions, pure selectors over props. Forbidden imports: `react`, `react-native`, `@tanstack/react-query`, any `@/features/*/api`, `mobileApiClient`, any store module. No side effects, no React Hooks, no mutations.

**Rationale:** prevents `.model.ts` from absorbing impure logic that belongs in hooks.
**Enforcement:** checker rule 16 (model-file purity — banned-import list).
**Migration:** Tranche R6 (audit + refactor offenders into hooks).

#### §7.7.5.10 — Domain hooks do not carry the `Screen` suffix

Hooks in `features/<domain>/hooks/` never end in `Screen.ts`. The suffix is exclusive to orchestration hooks under `screens/`.

**Enforcement:** checker rule 13 (complementary half: screens/-hook-suffix rule).

### Group C — File role and budget (`§7.7.6.*`)

#### §7.7.6.1 — Enforced line budgets

Only two tiers are normative: warn and fail. The previous "target" column is removed from the contract because it lacks an enforcement mechanism.

| Role                                                       | Warn  | Fail  |
| ---------------------------------------------------------- | ----- | ----- |
| Route (`src/app/**`, non-layout)                           | > 60  | > 100 |
| Screen (`<Screen>Screen.tsx`, `Screen.tsx`)                | > 220 | > 280 |
| Section (`<Screen>.<Section>.tsx`, folder `<Section>.tsx`) | > 260 | > 340 |
| Model (`<Screen>.model.ts`, folder `model.ts`)             | > 180 | > 240 |
| Orchestration hook (`use<Screen>Screen.ts`)                | > 180 | > 240 |

**Enforcement:** existing checks 1 (routes) and 11 (screen family), with classification updated for §7.7.5.1 allowlist.

#### §7.7.6.2 — Screen-family section cap

A single screen family may not contain more than **8 section files**. Above 8 is a hard fail. This applies in both flat and folder form.

**Rationale:** a screen that needs >8 sections is usually two screens sharing a route.
**Enforcement:** checker rule 18 (screen-family aggregation).

#### §7.7.6.3 — Deep relative imports banned

No `../../` or deeper in any `src/**` file. Use path aliases (`@/…`).

**Rationale:** relative chains break on refactor; aliases are already the established convention.
**Enforcement:** checker rule 17 (deep-relative-import ban).
**Migration:** Tranche R7 (sweep).

### Group D — Cross-module boundary (`§7.7.2` addendum)

#### §7.7.2.1 — Feature-to-feature imports go through the feature index only

`features/A/**` may import from `features/B/**` only via `features/B/index.ts` (the feature's public surface). Direct imports into `features/B/api.ts`, `features/B/screens/**`, `features/B/hooks/**`, or `features/B/draft/**` are forbidden.

**Rationale:** features are bounded contexts; the index is the published contract.
**Enforcement:** checker rule 19 (feature-to-feature boundary).

#### §7.7.2.2 — `features/<domain>/hooks/**` may not import `features/<domain>/screens/**`

The dependency flow is one-way: screens consume hooks, never the reverse. This is implicit in §7.7.1 but not currently enforced.

**Enforcement:** new check, folded into the existing feature-layer rules.

#### §7.7.2.3 — Route files import the Screen component only

`src/app/**` route files may import a feature's `<Screen>Screen` default export (via the feature's published surface) and nothing else from `features/<domain>/screens/**`. Sections, models, and orchestration hooks are not route-reachable.

**Enforcement:** extension to existing route banned-imports check (rule 2).

#### §7.7.2.4 — No cross-screen imports within the same feature

`screens/ScreenA.*` may not import `screens/ScreenB.*`. Shared presentation goes to `features/<domain>/components/`; shared logic goes to `features/<domain>/hooks/` or a feature-level `model.ts`.

**Enforcement:** checker rule 20 (cross-screen ban within a feature).

### Group E — Test organization (`§7.7.12`)

#### §7.7.12.1 — Tests mirror source paths

A test at `apps/mobile/__tests__/<path>` corresponds to `apps/mobile/src/<path>`. Integration tests live under `apps/mobile/__tests__/integration/`. Fixtures live under `apps/mobile/__tests__/integration/fixtures.ts` or equivalent.

**Enforcement:** checker rule 22 (test-path mirror).

#### §7.7.12.2 — Test file budget

Individual test files: warn > 400 lines, fail > 500 lines.

**Enforcement:** extension to existing budget checks.

#### §7.7.12.3 — No production imports from `__tests__/`

Source files under `src/**` may not import from `__tests__/**`.

**Enforcement:** new banned-import check applied globally to `src/**`.

### Group F — Governance (`§7.7.11` addendum)

#### §7.7.11.1 — All rules have stable IDs

Every normative rule carries an ID of the form `§7.7.<section>.<number>`. Violation reports, commit messages, and PR reviews cite the ID, never a paragraph reference.

#### §7.7.11.2 — `CLAUDE.md` carries an AI-facing quick reference

A derived Structural Contract Quick Reference is maintained in `CLAUDE.md`, listing the 10–15 rules most likely to be violated by an AI agent edit, each tagged with its rule ID. The quick reference is rebuilt whenever §7.7 changes. The full §7.7 remains normative; the quick reference is a navigation aid.

#### §7.7.11.3 — Target tier is not used

The contract exposes only warn and fail thresholds. Aspirational "target" numbers are not written into the contract, because rules without gates drift.

## 4. Enforcement Plan

### Phase 1 — Contract freeze (1 PR, docs only)

1. Patch `docs/ARCHITECTURE.md` in place. Sections touched:
   - §7.7.1 — dependency-flow clarification (`.model.ts` is screen-private; cross-feature imports traverse `features/<domain>/index.ts`).
   - §7.7.2 — append Group D rules §7.7.2.1–§7.7.2.4 (feature-to-feature via index, `hooks/` → `screens/` ban, route → Screen only, cross-screen ban).
   - §7.7.5 — replace body with §7.7.5.1–§7.7.5.11 (screen-family layout, folder thresholds, section privacy, barrel ban, parts deadline, naming rules).
   - §7.7.6 — replace body with §7.7.6.1–§7.7.6.3; remove the "Target" column from the budget table.
   - §7.7.10 — replace with the 22-check enforcement table cross-referencing rule IDs.
   - §7.7.11 — extend with §7.7.11.1–§7.7.11.3 (stable IDs, `CLAUDE.md` quick reference, no target tier).
   - §7.7.12 — new sub-section for test organization (§7.7.12.1–§7.7.12.3).
2. Add stable rule IDs throughout.
3. No checker changes in this PR.
4. No `CLAUDE.md` edit in this PR (belongs to Phase 4b).

**Gate:** merge review only; no CI change.

### Phase 2 — Checker extension (1 PR, code only)

Extend `apps/mobile/scripts/structure-check.js` with checks 13–22. All land at `warn` severity initially.

| Check | Rule                | Description                                                                                                    | Difficulty |
| ----- | ------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| 13    | §7.7.5.7, §7.7.5.10 | Orchestration-hook naming (`use*.ts` under `screens/` must end `Screen.ts`; `use*.ts` under `hooks/` must not) | trivial    |
| 14    | §7.7.5.8            | Section-file name pattern `^[A-Z][A-Za-z0-9]*\.[A-Z][A-Za-z0-9]*\.tsx$`                                        | trivial    |
| 15    | §7.7.5.1            | File-role allowlist under `screens/`                                                                           | easy       |
| 16    | §7.7.5.9            | Model purity (banned-import list for `*.model.ts` / `model.ts`)                                                | easy       |
| 17    | §7.7.6.3            | Deep-relative-import ban (`../../` or deeper)                                                                  | easy       |
| 18    | §7.7.5.2, §7.7.6.2  | Screen-family aggregation: folder promotion thresholds + section cap                                           | moderate   |
| 19    | §7.7.2.1            | Feature-to-feature must go through `features/B/index.ts`                                                       | moderate   |
| 20    | §7.7.5.3, §7.7.2.4  | Cross-screen import ban within a feature                                                                       | moderate   |
| 21    | §7.7.5.4            | `screens/index.ts` ban; permitted only inside `screens/<Screen>/`                                              | trivial    |
| 22    | §7.7.12.1           | Test-path mirror; warn on test files lacking a source counterpart                                              | easy       |

**Gate:** checker runs at `warn` — no new CI failures; existing failures preserved.

### Phase 3 — Remediation (N small PRs, behavior-neutral)

Each tranche is one PR, no behavior change, review-checklist: structure-check output diff must show the targeted violation class go to zero.

| Tranche | Rule                         | Scope                                                                                                                                                                                                                                                                                                                                                                                         | Expected volume                                |
| ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| R1      | §7.7.5.2                     | Folder promotion for `CustomerTaskDetail` → `features/tasks/screens/CustomerTaskDetail/`                                                                                                                                                                                                                                                                                                      | 12 files moved, imports updated, tests updated |
| R2      | §7.7.5.7                     | Orchestration-hook rename sweep: `useTaskIntake` → `useTaskIntakeScreen`, `useTaskLocation` → `useTaskLocationScreen`, `useTaskSchedule` → `useTaskScheduleScreen`, `useTaskReviewSubmit` → `useTaskReviewSubmitScreen`, `useApplicantsSelection` → `useApplicantsSelectionScreen`, `useCustomerTasks` → `useCustomerTasksScreen`; parallel renames in bookings, chat, disputes, help, review | ~15 renames                                    |
| R3      | §7.7.5.8                     | Section-file casing audit + rename (e.g., `BookingReschedule.datePicker.tsx` → `BookingReschedule.DatePicker.tsx`, `BookingReschedule.submitAction.tsx` → `BookingReschedule.SubmitAction.tsx`)                                                                                                                                                                                               | small                                          |
| R4      | §7.7.5.5                     | Complete the existing `*.parts.tsx` → semantic sections migration (continues the in-flight plan)                                                                                                                                                                                                                                                                                              | tracked in existing plan                       |
| R5      | §7.7.5.2, §7.7.5.3, §7.7.6.2 | Folder promotion for remaining threshold-exceeders (likely: `CustomerTasks/`, `TaskLocation/`, `BookingReschedule/`); cross-screen import audit                                                                                                                                                                                                                                               | per-screen                                     |
| R6      | §7.7.5.9                     | `.model.ts` purity audit: any that imports `react`/`react-native`/`@tanstack/react-query` → refactor into hooks                                                                                                                                                                                                                                                                               | audit first, then fixes                        |
| R7      | §7.7.6.3                     | Deep relative-import sweep                                                                                                                                                                                                                                                                                                                                                                    | likely small                                   |
| R8      | §7.7.5.1                     | `screens/` file-role allowlist sweep (remove stray utility files)                                                                                                                                                                                                                                                                                                                             | audit first                                    |

Tranches are independent and may merge in any order once Phase 2 is complete.

### Phase 4 — CI gating and agent guardrails

Wires `structure:check` into the existing quality gates. Ships as two PRs: 4a (plumbing) and 4b (agent-facing docs).

#### Phase 4a — Wire `structure:check` into CI and pre-push

**Current state (verified 2026-04-21):**

- `.github/workflows/quality-gates.yml` contains a `structural-gate` job that already runs `pnpm workspace:boundaries`, SDK drift, and migration safety on every PR. It does **not** run `structure:check`.
- `.husky/pre-push` runs `pnpm workspace:boundaries` in its "structural checks" block. It does **not** run `structure:check`.
- No other workflow invokes the mobile structure checker.
- Mobile package exposes the script as `pnpm --filter @tasky/mobile structure:check` (resolves to `node apps/mobile/scripts/structure-check.js`).

**Patch 1 — `.github/workflows/quality-gates.yml` (add one step to `structural-gate`):**

```yaml
      - name: Validate workspace boundaries
        run: pnpm workspace:boundaries

+     - name: Validate mobile structural contract
+       run: pnpm --filter @tasky/mobile structure:check

      - name: Validate migration safety
        run: python3 tooling/scripts/validate-migrations.py
```

Placed inside the existing `structural-gate` job; no new job, no new setup steps (the job already installs pnpm and dependencies). The step runs on every PR via the existing `on: pull_request` trigger. Running cost: single-digit seconds (pure Node fs walk, no build).

**Patch 2 — `.husky/pre-push` (add one line in the structural-checks block):**

```bash
# === Structural checks (~15s) ===

pnpm -r typecheck || exit 1

pnpm workspace:boundaries || exit 1

+pnpm --filter @tasky/mobile structure:check || exit 1

python3 tooling/scripts/validate-migrations.py || exit 1
```

Placed directly after `workspace:boundaries` so both structural gates live together. The hook's existing "docs-only fast path" continues to skip it on docs-only pushes.

**Patch 3 — Branch protection (manual GitHub Settings step, not in-repo):**

After Patch 1 merges, the `structural-gate` job already runs on `main`-targeted PRs. If `structural-gate` is not already in the required-check list for `main`, add it under **Settings → Branches → Branch protection rule for `main` → Require status checks to pass before merging → `structural-gate`**. The check name is `structural-gate` (not a new name — the existing job now simply contains the new step). If the rule is already in place, no action.

**Patch 4 — Severity flipping (checker-only, no CI edit):**

When a remediation tranche closes, the corresponding rule flips from `warn` to `fail` by changing a single literal in `apps/mobile/scripts/structure-check.js`:

```diff
- report('warn', 'orchestration-hook-naming', …);
+ report('fail', 'orchestration-hook-naming', …);
```

No workflow edit is required per flip. The CI job already fails when `structure:check` exits non-zero, and the script exits non-zero on any `fail`-severity report. Each flip is a one-line change, cited by rule ID (e.g. `§7.7.5.7`) in the commit message.

#### Phase 4b — Agent-facing docs and PR template

1. Add the Structural Contract Quick Reference to `CLAUDE.md` (per §7.7.11.2), scoped to the rules most likely to be violated by an AI agent edit. Each entry tagged with its rule ID. Rebuild whenever §7.7 changes.
2. Add a PR template checkbox: _"If this change touches `apps/mobile/src/**` structural boundaries (§7.7), I ran `pnpm --filter @tasky/mobile structure:check` locally and updated both the contract and the checker if a rule changed."_

## 5. Residual Risks

1. **Rename collisions (R2).** Orchestration-hook renames touch many imports. Each rename is mechanical; use symbol-level refactoring tools and run `pnpm -r typecheck` + `pnpm --filter @tasky/mobile test` per rename.
2. **Folder promotion imports (R1, R5).** Moving 12 files to a subfolder updates every importer. Relative paths inside the family shrink; alias paths (`@/features/tasks/screens/CustomerTaskDetail`) should stay stable if the re-export in `index.ts` preserves the default.
3. **`.model.ts` purity (R6).** Some models may already call utilities that transitively touch React. The audit must distinguish "imports that touch React" from "the module is itself impure." Banned-import list should be the precise signal.
4. **Checker false positives (§7.7.5.3 / rule 20).** The cross-screen import ban is intentional but some legitimate cross-screen navigation imports may need to become feature-index-surfaced. Surface these as part of R5.
5. **Parallel feature boundary work.** Rule 19 (feature-to-feature via index) may reveal cross-feature imports (e.g., `features/bookings` importing from `features/tasks`) that are not wrong but need an explicit index entry. Keep this rule at `warn` until a boundary audit is complete.

## 6. Non-goals

- No runtime behavior changes anywhere in this plan.
- No design-token or UI changes.
- No changes to backend, web, or SDK generation.
- No rewrites of the existing `2026-04-20-mobile-screen-section-naming-remediation-plan.md`. That plan continues to completion as R4.
