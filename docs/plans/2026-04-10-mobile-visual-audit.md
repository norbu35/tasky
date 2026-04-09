# Mobile Visual Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit active mobile screens through Maestro screenshots, identify systemic and local visual defects, fix them with design-system-consistent changes, and preserve reliable mobile automation.

**Architecture:** Maestro is used only to drive the app into deterministic capture states and produce screenshots. The audit logic lives in a screenshot ledger plus a strict review rubric. Fixes are applied top-down, starting from shared templates/shells/primitives and only then moving into screen-local code.

**Tech Stack:** Expo Router, React Native, Maestro, iOS simulator, NativeWind, `@tasky/design-tokens`, shared mobile templates/shells under `apps/mobile/src/components/`

---

## Execution Rules

- Use one booted iOS simulator model for the whole audit batch.
- Use one primary locale per batch; run overflow spot checks in the secondary locale only after the main pass.
- Do not start screen-local edits until the shared-layer defect list is reviewed.
- Keep deferred-gated screens out of the active batch unless they are explicitly scheduled.
- Re-run the affected Maestro flows after each batch of UI changes.
- Keep file ownership disjoint across subagents.

## Deliverables

- a screen ledger for active mobile surfaces
- canonical screenshot bundles for each batch
- a concise defect log with systemic vs local classification
- design-system-consistent fixes in shared and screen-specific code
- rerun Maestro evidence after each batch
- updated mobile audit documentation

### Task 1: Create the screen ledger and capture contract

**Files:**

- Create: `docs/quality/mobile-visual-audit-ledger-2026-04.md`
- Modify: `apps/mobile/README.md`

**Step 1: Create the ledger skeleton**

Add a markdown table with columns for:

- screen ID
- route
- entry flow
- capture point
- screen family
- template family
- launch status
- audit status
- notes

**Step 2: Populate only active screen families first**

Include:

- onboarding/auth
- customer posting and customer task lifecycle
- tasker browse/apply and tasker management
- shared profile/settings/legal

Exclude deferred and unreachable screens from the first populated batch.

**Step 3: Document the capture contract**

In `apps/mobile/README.md`, add a short section that defines:

- canonical simulator
- canonical locale
- canonical screenshot intent
- where screenshot bundles will be stored

**Step 4: Verify**

Run:

```bash
pnpm exec prettier --check apps/mobile/README.md docs/quality/mobile-visual-audit-ledger-2026-04.md
```

Expected: PASS

### Task 2: Add screenshot-capture support to the Maestro workflow

**Files:**

- Modify: `apps/mobile/scripts/run-e2e.sh`
- Modify: `apps/mobile/scripts/run-e2e-smoke.sh`
- Modify: `apps/mobile/maestro/run-all.sh`
- Create: `apps/mobile/scripts/capture-visual-audit.sh`
- Create: `apps/mobile/maestro/capture/README.md`

**Step 1: Add a dedicated capture script**

The script should:

- accept a flow list or batch name
- run Maestro flows one by one
- collect screenshots into a stable output directory
- fail fast on broken navigation

**Step 2: Keep test and capture modes separate**

Do not overload `test:e2e` with screenshot audit behavior. Capture should be an explicit operator flow.

**Step 3: Document screenshot output structure**

Document a directory convention such as:

```text
apps/mobile/maestro/capture/<batch>/<screen-or-flow>/
```

**Step 4: Verify**

Run:

```bash
bash -n apps/mobile/scripts/capture-visual-audit.sh apps/mobile/scripts/run-e2e.sh apps/mobile/scripts/run-e2e-smoke.sh apps/mobile/maestro/run-all.sh
```

Expected: PASS

### Task 3: Build the review rubric and defect log

**Files:**

- Create: `docs/quality/mobile-visual-rubric.md`
- Create: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Write the compact rubric**

Include the fixed categories:

- spacing
- typography
- CTA hierarchy
- token compliance
- alignment
- state quality
- safe-area/keyboard behavior
- localization fit
- sibling consistency

**Step 2: Create the defect log template**

Each logged issue should include:

- screenshot reference
- affected screen(s)
- systemic vs local
- severity
- proposed fix layer

**Step 3: Verify**

Run:

```bash
pnpm exec prettier --check docs/quality/mobile-visual-rubric.md docs/quality/mobile-visual-defects-2026-04.md
```

Expected: PASS

### Task 4: Capture and classify shared-layer defects

**Files:**

- Use: `apps/mobile/maestro/flows/`
- Update: `docs/quality/mobile-visual-audit-ledger-2026-04.md`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Capture only the first active batch**

Use flows that expose:

- one onboarding/auth screen family
- one customer wizard family
- one tasker feed/detail family
- one shared settings/profile family

**Step 2: Review screenshots only for shared-layer issues first**

Look for problems in:

- form wizard layout
- detail templates
- list templates
- sticky action bar
- headers
- cards
- buttons/inputs/chips

**Step 3: Mark each screen as**

- `pass`
- `systemic-fix`
- `screen-fix`
- `defer`

**Step 4: Verify**

Confirm the defect log names the owning layer for each issue and does not jump straight into screen-local fixes where a shared fix is more appropriate.

### Task 5: Fix templates, shells, and primitives

**Files:**

- Modify: `apps/mobile/src/components/templates/*`
- Modify: `apps/mobile/src/components/shells/*`
- Modify: `apps/mobile/src/components/ui/*`
- Modify: `apps/mobile/src/design/*` only if a true token-mapping defect exists

**Step 1: Write failing or protective tests where practical**

Prefer:

- existing template/component tests
- lightweight snapshot/behavior checks for layout-state regressions

Do not add brittle cosmetics-only tests.

**Step 2: Implement the shared fixes**

Typical examples:

- spacing rhythm
- inconsistent CTA sizing
- weak header hierarchy
- card padding inconsistency
- keyboard/action bar collisions
- elevation or radius misuse

**Step 3: Verify**

Run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

Expected: PASS

**Step 4: Re-capture the affected first-batch screens**

Ensure the same screens visually improved without new regressions.

### Task 6: Fix customer-family screen-local defects

**Files:**

- Modify: `apps/mobile/src/app/(customer)/**/*`
- Modify: `apps/mobile/src/features/tasks/**/*`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Select only customer screens still marked `screen-fix`**

**Step 2: Apply only local composition changes**

Examples:

- rebalance hero/header blocks
- improve empty-state composition
- reduce clutter in stacked cards
- fix uneven section spacing

**Step 3: Verify**

Run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false <targeted customer tests>
```

Expected: PASS

**Step 4: Re-capture customer batch**

### Task 7: Fix tasker and shared screen-local defects

**Files:**

- Modify: `apps/mobile/src/app/(tasker)/**/*`
- Modify: `apps/mobile/src/app/(shared)/**/*`
- Modify: `apps/mobile/src/app/profile/**/*`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Select only tasker/shared screens still marked `screen-fix`**

**Step 2: Apply local composition and hierarchy fixes**

**Step 3: Verify**

Run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile exec jest --runInBand --watchman=false <targeted tasker/shared tests>
```

Expected: PASS

**Step 4: Re-capture tasker/shared batch**

### Task 8: Run localization and keyboard stress checks

**Files:**

- Use: `apps/mobile/maestro/flows/`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`
- Update: `docs/quality/mobile-visual-audit-ledger-2026-04.md`

**Step 1: Spot-check secondary locale overflow**

Choose the most text-dense screens and capture them in the secondary locale.

**Step 2: Spot-check keyboard-open states**

Focus on:

- form wizard steps
- settings/profile forms
- any screen with sticky action bars

**Step 3: Log only material defects**

Do not reopen fully acceptable screens for minor cosmetic differences.

### Task 9: Final recapture and Maestro verification

**Files:**

- Use: `apps/mobile/scripts/capture-visual-audit.sh`
- Use: `apps/mobile/scripts/run-e2e-smoke.sh`
- Update: `docs/quality/mobile-visual-audit-ledger-2026-04.md`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`
- Update: `docs/quality/verification-matrix.md`

**Step 1: Re-capture all changed batches**

**Step 2: Run smoke Maestro**

Run:

```bash
pnpm --filter @tasky/mobile test:e2e:smoke
```

Expected: PASS

**Step 3: Run broader suite if the environment is available**

Run:

```bash
pnpm --filter @tasky/mobile test:e2e
```

Expected: PASS or explicitly documented environment/runtime blocker

**Step 4: Update verification docs**

Record:

- what was captured
- which batches passed
- what still needs fixture-backed or deferred review

### Task 10: Finalize documentation and changelog

**Files:**

- Modify: `CHANGELOG.md`
- Update: `docs/quality/mobile-visual-audit-ledger-2026-04.md`
- Update: `docs/quality/mobile-visual-defects-2026-04.md`

**Step 1: Close resolved defect rows**

Mark issues as resolved, deferred, or not worth fixing now.

**Step 2: Add one changelog line**

Summarize the completed mobile visual audit and design-system hardening.

**Step 3: Final verification**

Run:

```bash
pnpm exec prettier --check CHANGELOG.md docs/quality/mobile-visual-audit-ledger-2026-04.md docs/quality/mobile-visual-defects-2026-04.md docs/quality/mobile-visual-rubric.md apps/mobile/README.md
git diff --check
```

Expected: PASS

## Subagent Ownership Split

### Agent A: Audit operator

Owns:

- `docs/quality/mobile-visual-audit-ledger-2026-04.md`
- `apps/mobile/scripts/capture-visual-audit.sh`
- `apps/mobile/maestro/capture/README.md`

Responsibilities:

- define capture batches
- run capture flows
- keep screenshot references stable

### Agent B: Design-system reviewer

Owns:

- `docs/quality/mobile-visual-rubric.md`
- `docs/quality/mobile-visual-defects-2026-04.md`

Responsibilities:

- classify defects
- mark systemic vs local
- assign owning layer

### Agent C: Shared UI implementer

Owns:

- `apps/mobile/src/components/templates/**/*`
- `apps/mobile/src/components/shells/**/*`
- `apps/mobile/src/components/ui/**/*`
- `apps/mobile/src/design/**/*` only if required

Responsibilities:

- fix shared visual defects
- preserve automation selectors

### Agent D: Customer screens implementer

Owns:

- `apps/mobile/src/app/(customer)/**/*`
- `apps/mobile/src/features/tasks/**/*`

Responsibilities:

- fix only customer-family local defects after shared fixes land

### Agent E: Tasker/shared screens implementer

Owns:

- `apps/mobile/src/app/(tasker)/**/*`
- `apps/mobile/src/app/(shared)/**/*`
- `apps/mobile/src/app/profile/**/*`

Responsibilities:

- fix only tasker/shared local defects after shared fixes land

### Agent F: Verification/doc owner

Owns:

- `docs/quality/verification-matrix.md`
- final ledger/defect-log updates
- Maestro rerun evidence

Responsibilities:

- rerun smoke/full Maestro
- document residual blockers

## Execution Order

1. Agent A + Agent B in parallel
2. Agent C after the first defect classification is stable
3. Agent D + Agent E in parallel after shared fixes land
4. Agent F after each batch and at the end

## Stop Conditions

Stop the audit batch if:

- Maestro no longer reaches the capture point reliably
- shared template churn starts invalidating many screenshots at once without convergence
- fixes begin redesigning the app rather than tightening it to the existing design language

In those cases, resolve the shared instability before continuing the screenshot program.
