# Repository Finish Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean stale repo surfaces, repair broken verification gates, replace low-signal tests with reliable ones, and
ratify Tasky as a production-ready maintenance repository.

**Architecture:** Execute six tranches in order. Tranche 1 removes misleading artifacts and fixes the authority chain.
Tranche 2 makes local and CI verification truthful. Only after those two tranches pass may backend, mobile, and web
test-hardening work proceed in parallel. The last tranche ratifies release readiness and durable docs.

**Tech Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL, React 18, React Native Expo, Maestro, Playwright, pnpm,
Gradle, GitHub Actions

---

## Tranche 1: Ratify Authority And Remove Stale Surfaces

**Status:** planned
**Priority:** critical
**Depends on:** none

## Description

Remove or archive files that mislead agents about what is current. This tranche is complete only when live paths contain
active docs and maintained tooling only.

## Entry Criteria

- Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API.yaml`
- Read `docs/quality/document-taxonomy.md`
- Read `docs/plans/2026-04-09-repo-finish-hardening-design.md`
- Confirm `git status --short` is clean before edits

## Done When

- live `docs/superpowers/` content is moved out of active paths or explicitly retired
- tracked generated output such as `test-results.json` is removed from git
- references to deleted workflows or scripts are removed from live docs
- only canonical Maestro flows remain in the active flow set
- old one-off plan and audit docs are either archived, marked derived, or removed from discovery-critical paths

### Task 1: Remove live archived-doc surfaces and stale generated output

**Files:**
- Delete or move: `docs/superpowers/plans/2026-04-05-screen-layout-system.md`
- Delete or move: `docs/superpowers/plans/2026-04-05-ui-consistency.md`
- Delete or move: `docs/superpowers/plans/2026-04-08-mobile-ui-centralization.md`
- Delete or move: `docs/superpowers/specs/2026-04-05-screen-layout-system-design.md`
- Delete or move: `docs/superpowers/specs/2026-04-05-ui-consistency-design.md`
- Delete or move: `docs/superpowers/specs/2026-04-08-mobile-ui-centralization-design.md`
- Delete: `test-results.json`
- Modify: `.gitignore`
- Modify: `docs/quality/document-taxonomy.md`
- Modify: `docs/quality/source-generated-archive-policy.md`

**Step 1: Verify the stale surfaces are still live**

Run:

```bash
find docs/superpowers -maxdepth 3 -type f | sort
git ls-files test-results.json
```

Expected: six `docs/superpowers` files and tracked `test-results.json`.

**Step 2: Move or remove the six `docs/superpowers` files**

Preferred result:

- active copies removed from `docs/superpowers/**`
- if retained for history, they live under `archive/greenfield-docs/docs/superpowers/**`

**Step 3: Remove `test-results.json` from version control and update ignore rules**

Result:

- `test-results.json` no longer tracked
- regenerated local result files are ignored

**Step 4: Update policy docs**

Result:

- `document-taxonomy.md` matches the real doc layout
- `source-generated-archive-policy.md` explicitly treats test result dumps as generated/local evidence, not source

**Step 5: Verify cleanup**

Run:

```bash
find docs/superpowers -maxdepth 3 -type f | sort
git ls-files test-results.json
```

Expected: no live `docs/superpowers` files and no tracked `test-results.json`.

### Task 2: Remove stale references and normalize active flow/tool surfaces

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/quality/realignment-report.md`
- Modify: `docs/quality/test-trust-audit.md`
- Modify: `docs/quality/flaky-or-ceremonial-checks.md`
- Delete or move: `apps/mobile/maestro/flows/auth-onboarding.yaml`
- Delete or move: `apps/mobile/maestro/flows/customer-task-creation.yaml`
- Delete or move: `apps/mobile/maestro/flows/profile-role-switch.yaml`
- Delete or move: `apps/mobile/maestro/flows/smoke-feed.yaml`
- Delete or move: `apps/mobile/maestro/flows/tab-navigation.yaml`
- Delete or move: `apps/mobile/maestro/flows/tasker-browse.yaml`

**Step 1: Find all stale references**

Run:

```bash
rg -n "docs/superpowers|scripts/task.sh|self-verify|test-results.json" README.md CLAUDE.md docs .github tooling apps services packages
python3 - <<'PY'
from pathlib import Path
for p in sorted(Path('apps/mobile/maestro/flows').glob('*.yaml')):
    if not (p.name.startswith('JRN-') or p.name.startswith('SCR-') or p.name == 'smoke.yaml'):
        print(p)
PY
```

Expected: stale references are listed and non-canonical Maestro flows are identified.

**Step 2: Repair live references**

Result:

- `docs/ARCHITECTURE.md` no longer tells agents to use `scripts/task.sh`
- README and contributor docs point only to current live docs and archive paths
- quality docs stop referencing deleted or superseded live doc surfaces as current

**Step 3: Remove or archive non-canonical Maestro flows**

Keep only:

- `JRN-*`
- `SCR-*`
- `_support/*`
- `smoke.yaml` if it is upgraded to a real smoke contract

**Step 4: Verify reference cleanup**

Run:

```bash
rg -n "docs/superpowers|scripts/task.sh|self-verify" README.md CLAUDE.md docs .github tooling apps services packages
```

Expected: only historical/archive references remain, or none.

## Verification

```bash
git status --short
rg -n "docs/superpowers|scripts/task.sh|self-verify|test-results.json" README.md CLAUDE.md docs .github tooling apps services packages
```

---

## Tranche 2: Repair Local And CI Verification Gates

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 1

## Description

Make every advertised verification command run the thing it claims to run. No silent fallbacks, no dead release files,
and no mismatch between docs, scripts, and workflows.

## Entry Criteria

- Tranche 1 merged or cleanly applied
- canonical docs and references updated

## Done When

- mobile E2E scripts fail if Maestro cannot run instead of falling back to Jest
- cleanup gate, verification matrix, and workflows describe the same commands
- release gate no longer references deleted self-verify infrastructure
- local commands map cleanly to CI jobs

### Task 3: Make mobile E2E scripts honest

**Files:**
- Modify: `apps/mobile/scripts/run-e2e.sh`
- Modify: `apps/mobile/scripts/run-e2e-smoke.sh`
- Modify: `apps/mobile/README.md`
- Modify: `package.json`

**Step 1: Inspect current behavior**

Run:

```bash
sed -n '1,120p' apps/mobile/scripts/run-e2e.sh
sed -n '1,120p' apps/mobile/scripts/run-e2e-smoke.sh
```

Expected: both scripts fall back to Jest when `TASKY_RUN_MAESTRO` is false.

**Step 2: Remove the silent fallback**

Result:

- `test:e2e` means Maestro only
- `test:e2e:smoke` means Maestro only
- any component-test fallback is renamed so it is not described as E2E

**Step 3: Update docs and workspace scripts**

Result:

- README and root command documentation describe the renamed fallback accurately

**Step 4: Verify**

Run:

```bash
pnpm --filter @tasky/mobile test:e2e:smoke
```

Expected: fails fast with a clear Maestro/runtime prerequisite if the environment is not ready.

### Task 4: Repair cleanup, nightly, and release workflow contracts

**Files:**
- Modify: `tooling/scripts/check-cleanup-gate.sh`
- Modify: `docs/quality/cleanup-gate.md`
- Modify: `docs/quality/verification-matrix.md`
- Modify: `.github/workflows/quality-gates.yml`
- Modify: `.github/workflows/nightly-regression.yml`
- Modify: `.github/workflows/release-gate.yml`

**Step 1: Verify broken release references**

Run:

```bash
test -f scripts/validate-self-verify.py && echo exists || echo missing
test -f docs/quality/self-verify.schema.json && echo exists || echo missing
test -f artifacts/self-verify.json && echo exists || echo missing
```

Expected: missing.

**Step 2: Rewrite the release gate to use maintained artifacts only**

Result:

- remove dead self-verify references, or replace them with a maintained evidence contract created in this repo
- release workflow validates only files that exist and are actively produced

**Step 3: Align cleanup and nightly gates**

Result:

- cleanup gate script matches its documentation
- nightly workflow runs the intended high-signal regression commands

**Step 4: Verify workflow syntax and local gate behavior**

Run:

```bash
bash -n tooling/scripts/check-cleanup-gate.sh
python3 tooling/scripts/validate-migrations.py
pnpm workspace:boundaries
```

Expected: no syntax or path errors.

## Verification

```bash
tooling/scripts/check-cleanup-gate.sh
pnpm workspace:boundaries
pnpm generated:verify
```

---

## Tranche 3: Rebuild Backend Test Trust

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 2

## Description

Close scenario-backed backend gaps, strengthen weak assertions, and ensure mutation and registry data represent the
real state of the codebase.

## Entry Criteria

- Tranche 2 passes
- `tests/scenarios/*.md` and `tests/registry.yaml` reread

## Done When

- all critical scenarios are either covered or explicitly waived with current rationale
- high-risk backend scenarios required by `gateRegression` are covered
- registry is synced after real test runs
- PIT findings are used to strengthen assertions, not ignored

### Task 5: Close the currently untested scenario set

**Files:**
- Modify: `services/api/src/test/java/mn/tasky/analytics/*`
- Modify: `services/api/src/test/java/mn/tasky/messaging/*`
- Modify: `services/api/src/test/java/mn/tasky/notification/*`
- Modify: `services/api/src/test/java/mn/tasky/booking/*`
- Modify: `tests/registry.yaml`

**Step 1: Record the current uncovered set**

Run:

```bash
python3 - <<'PY'
import yaml
from pathlib import Path
reg = yaml.safe_load(Path('tests/registry.yaml').read_text())
for scn_id, entry in sorted(reg['scenarios'].items()):
    if entry['status'] == 'untested':
        print(scn_id, entry['domain'], entry['risk'], entry['title'], entry.get('override_status'))
PY
```

Expected: analytics, messaging, notification, and one waived critical booking gap.

**Step 2: For each scenario, read the scenario spec before touching tests**

Result:

- no test is written without matching scenario authority
- if `SCN-BOOK-006` still reflects an unimplemented product requirement, either implement it or keep an explicit waiver
  with updated rationale and release implications

**Step 3: Implement or strengthen tests and sync registry**

Run after edits:

```bash
./gradlew --no-daemon :services:api:test
./services/api/scripts/sync-registry.sh
```

Expected: registry status updated from real executed tests.

### Task 6: Use PIT and gate outputs to strengthen assertions

**Files:**
- Modify: `services/api/src/test/java/mn/tasky/**`
- Modify: `services/api/build.gradle.kts` only if thresholds are intentionally raised
- Modify: `docs/quality/test-rehab-backlog.md`

**Step 1: Run regression-strength backend checks**

```bash
./gradlew --no-daemon :services:api:gateSmoke
./gradlew --no-daemon :services:api:pitestBookingAuth
```

Expected: reports generated under `services/api/build/reports/`.

**Step 2: Fix surviving mutants by improving assertions**

Rule:

- if a scenario exists, strengthen the test
- if no scenario exists, record the gap instead of inventing coverage

**Step 3: Re-run and sync**

```bash
./gradlew --no-daemon :services:api:gateRegression
./services/api/scripts/sync-registry.sh
```

Expected: gate regression passes with fresh registry data.

## Verification

```bash
./gradlew --no-daemon :services:api:gateSmoke
./gradlew --no-daemon :services:api:gateRegression
```

---

## Tranche 4: Align Mobile Behavior And Replace Low-Signal Tests

**Status:** planned
**Priority:** high
**Depends on:** Tranche 2

## Description

Fix known mobile journey drift, reduce TODO-driven partial implementations in primary flows, and replace existence-heavy
tests with behavior-first coverage.

## Entry Criteria

- Tranche 2 passes
- `docs/design/journey-catalog.yaml` and `docs/design/screen-specs/SCR-*.yaml` reread for the targeted flows

## Done When

- the mobile task-posting journey matches the authoritative order
- remaining high-risk flow bugs are fixed before Maestro expansion
- mobile test suites stop relying on broad `toBeTruthy()` coverage for critical behavior
- i18n and warning noise are reduced enough that failures are readable

### Task 7: Fix mobile behavior drift in primary journeys

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `apps/mobile/src/app/index.tsx` only if auth-routing regressions reappear
- Modify: `apps/mobile/__tests__/integration/auth-flow.test.tsx`
- Modify: `apps/mobile/__tests__/integration/customer-journey.test.tsx`

**Step 1: Verify current route order against the authority chain**

Run:

```bash
sed -n '1,220p' apps/mobile/src/app/(customer)/tasks/new/photos.tsx
sed -n '1,260p' apps/mobile/src/app/(customer)/tasks/new/review.tsx
sed -n '1,220p' apps/mobile/src/app/(customer)/tasks/new/location.tsx
sed -n '1,260p' apps/mobile/src/app/(customer)/tasks/new/schedule.tsx
```

Expected before fix: `photos -> location -> schedule -> review`.

**Step 2: Reorder to the authoritative journey**

Required chain:

`category -> intake -> photos -> review -> location -> schedule -> success`

**Step 3: Update focused integration tests**

Result:

- tests assert route transitions and submission behavior, not only screen presence

**Step 4: Verify**

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand auth-flow customer-journey
```

Expected: green targeted mobile tests.

### Task 8: Replace optics-heavy mobile tests in high-risk paths

**Files:**
- Modify: `apps/mobile/__tests__/App.test.tsx`
- Modify: `apps/mobile/__tests__/integration/tasker-journey.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/bookings/BookingConfirmScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/bookings/BookingDetailScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/shared/ReviewForm.test.tsx`
- Modify: `apps/mobile/__tests__/screens/auth/LoginScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/auth/OtpScreen.test.tsx`

**Step 1: Identify assertions that only prove presence**

Run:

```bash
rg -n "toBeTruthy\\(|getByTestId\\(|getByText\\(" apps/mobile/__tests__/App.test.tsx apps/mobile/__tests__/integration apps/mobile/__tests__/screens
```

**Step 2: Replace weak assertions in the critical-path tests above**

Target behaviors:

- route changes
- button disable/enable transitions
- submission side effects
- policy gating
- error and recovery states

**Step 3: Normalize test bootstrap noise**

Result:

- shared i18n setup is stable
- warning-heavy tests are either fixed or rewritten

**Step 4: Verify**

```bash
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile test
```

## Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile test
```

---

## Tranche 5: Build Real End-To-End Coverage For Mobile And Web

**Status:** planned
**Priority:** high
**Depends on:** Tranche 4 for mobile flows, Tranche 2 for gate wiring

## Description

Promote real user-journey verification. Mobile uses authoritative Maestro flows. Web expands Playwright beyond shell
smoke and stops relying only on mocked client integration tests for end-to-end claims.

## Entry Criteria

- Tranche 2 passes
- mobile primary journey drift fixed

## Done When

- Maestro happy-path and selected error flows exist for implemented journeys only
- web has at least role-based smoke flows with real routing and backend-aware assertions
- no test or README surface calls mocked unit suites "E2E"

### Task 9: Clean and expand Maestro from the authority chain

**Files:**
- Modify: `apps/mobile/maestro/flows/smoke.yaml`
- Modify: `apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml`
- Modify: `apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml`
- Modify: `apps/mobile/maestro/flows/JRN-CUST-04-manage-active-booking.yaml`
- Modify: `apps/mobile/maestro/flows/JRN-TASK-01-tasker-verification.yaml`
- Modify: `apps/mobile/maestro/flows/JRN-TASK-04-manage-active-booking-tasker.yaml`
- Modify: `apps/mobile/maestro/run-all.sh`
- Modify: `docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md`

**Step 1: Replace trivial smoke coverage**

Result:

- `smoke.yaml` asserts a real root screen contract, not only visible brand text

**Step 2: Correct flows against canonical journeys**

Use:

- `docs/design/journey-catalog.yaml`
- `docs/design/screen-specs/SCR-*.yaml`
- `docs/design/state-matrix.yaml`

**Step 3: Run authoritative Maestro subsets**

```bash
cd apps/mobile
maestro test maestro/flows/smoke.yaml
maestro test maestro/flows/JRN-SHARED-01-onboarding.yaml
maestro test maestro/flows/JRN-CUST-01-post-a-task.yaml
```

Expected: flows fail only for real app defects or environment prerequisites.

### Task 10: Expand web Playwright to real role-based journeys

**Files:**
- Modify: `apps/web/e2e/smoke.spec.ts`
- Create: `apps/web/e2e/customer-happy-path.spec.ts`
- Create: `apps/web/e2e/tasker-happy-path.spec.ts`
- Create: `apps/web/e2e/auth-guard.spec.ts`
- Modify: `apps/web/package.json`

**Step 1: Inspect the current web E2E surface**

Run:

```bash
find apps/web/e2e -maxdepth 1 -type f | sort
sed -n '1,200p' apps/web/e2e/smoke.spec.ts
```

Expected: single shell smoke only.

**Step 2: Add real browser journeys**

Minimum coverage:

- anonymous user shell and login guard
- customer route path with task list or booking path
- tasker route path with feed or jobs path

**Step 3: Verify**

```bash
pnpm --filter @tasky/web test:e2e:smoke
pnpm --filter @tasky/web test:e2e
```

## Verification

```bash
cd apps/mobile && maestro test maestro/flows/smoke.yaml
pnpm --filter @tasky/web test:e2e
```

---

## Tranche 6: Ratify Release Readiness And Durable Docs

**Status:** planned
**Priority:** critical
**Depends on:** Tranches 3, 4, and 5

## Description

Run the endgame checks, document what is trusted, and leave the repo in a state where another agent does not need to
reverse-engineer what is current.

## Entry Criteria

- Tranches 1 through 5 complete
- repo state matches the active authority chain

## Done When

- release-level commands pass
- changelog updated
- durable docs describe the current operating model
- stale completed one-off plan docs are archived or marked historical

### Task 11: Run release-level checks and fix resulting defects

**Files:**
- Modify as needed based on failing gates
- Modify: `CHANGELOG.md`

**Step 1: Run the canonical release-level verification**

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:gateRegression
pnpm -r typecheck
pnpm -r test
pnpm --filter @tasky/web test:e2e
```

If environment permits:

```bash
cd apps/mobile && maestro test maestro/flows/smoke.yaml
```

**Step 2: Run release workflow prerequisites**

```bash
bash -n docker/backup.sh
bash -n docker/restore.sh
bash tooling/scripts/performance-smoke.sh
```

Expected: commands succeed or fail for actionable reasons only.

### Task 12: Finalize docs and archive superseded live plans

**Files:**
- Modify: `docs/maintenance/OPERATING_MODEL.md`
- Modify: `docs/quality/verification-matrix.md`
- Modify: `docs/quality/test-rehab-backlog.md`
- Modify: `docs/quality/realignment-report.md`
- Move or archive as needed: superseded completed files under `docs/plans/`
- Modify: `CHANGELOG.md`

**Step 1: Update durable docs with final trusted state**

Result:

- current commands, gates, and authority docs are documented in one place

**Step 2: Archive superseded plan docs**

Rule:

- active hardening plan stays in `docs/plans/`
- completed or superseded one-off plans move out of the active discovery surface

**Step 3: Verify references**

```bash
rg -n "docs/superpowers|self-verify|scripts/task.sh" README.md CLAUDE.md docs .github tooling apps services packages
```

Expected: no active-path stale references remain.

## Verification

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:gateRegression
pnpm -r typecheck
pnpm -r test
```

---

## Execution Notes

- Do not modify `tests/scenarios/*.md`.
- Do not hand-write API types that belong in `@tasky/sdk`.
- Do not keep helper scripts or docs in live paths without an active consumer.
- Treat every dated audit under `docs/quality/` as derived evidence until refreshed.

## Suggested Execution Mode

Run Tranches 1 and 2 in this session. After they pass, split into parallel backend/mobile/web workers with disjoint
write sets for Tranches 3, 4, and 5. Finish with Tranche 6 in the coordinating session.
