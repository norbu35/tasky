# SDLC Product Audit And Release Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Tasky from an AI-generated late-stage repo into a truthful, Phase-1-launch-ready product with
verified dormant capabilities, lean canonical docs, trustworthy test gates, and explicit staging-to-production
readiness criteria.

**Architecture:** Execute eight tranches in order. Tranches 1 through 4 establish documentation and capability truth.
Tranches 5 and 6 rebuild evidence and verification. Tranches 7 and 8 ratify operational readiness. Phase 1 remains the
launch commitment throughout unless a capability is explicitly promoted after matrix-based verification.

**Tech Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL/PostGIS, React 18, React Native Expo, TypeScript, OpenAPI,
pnpm, Gradle, Playwright, Maestro, GitHub Actions

---

## Execution Rules

- Work in a dedicated branch and worktree before executing any tranche.
- Treat the current worktree as potentially dirty; do not revert unrelated changes.
- No documentation claim may be upgraded without evidence from code and verification.
- No test may become release-blocking unless it proves observable behavior.
- Later-phase capabilities must be classified individually, not as one bulk "Phase 3" status.

## Tranche 1: Establish Documentation Authority And Inventory

**Status:** planned
**Priority:** critical
**Depends on:** none

## Description

Create the documentation control surface for the entire finishing program. Inventory active docs, classify their role,
and decide which surfaces stay canonical, derived-active, historical, or removable.

## Entry Criteria

- Read `docs/PRD.md`
- Read `docs/ARCHITECTURE.md`
- Read `docs/API.yaml`
- Read `docs/quality/document-taxonomy.md`
- Read `docs/plans/2026-04-09-sdlc-product-audit-and-release-readiness-design.md`
- Confirm `git status --short` and avoid touching unrelated modified files

## Done When

- every major doc surface under `docs/` is classified
- the authority chain is documented in one maintained place
- canonical docs are explicitly named
- delete/archive candidates are separated from active operational docs
- this tranche leaves a current inventory that later tranches can cite

### Task 1: Produce documentation inventory and classification

**Files:**
- Create: `docs/quality/document-inventory-2026-04.md`
- Modify: `docs/quality/document-taxonomy.md`
- Modify: `docs/quality/source-generated-archive-policy.md`

**Steps:**

1. Inventory live document surfaces:
   Run `find docs -maxdepth 4 | sort`
2. Classify each major surface:
   `canonical`, `derived-active`, `historical`, `generated-local`, `delete-candidate`
3. Update taxonomy and archive policy to match the actual layout
4. Mark duplicate or misleading surfaces for archive/delete in the inventory doc

### Task 2: Publish authority-chain rules for future work

**Files:**
- Modify: `docs/ARCHITECTURE_INDEX.md`
- Modify: `docs/maintenance/OPERATING_MODEL.md`
- Modify: `docs/quality/README.md`

**Steps:**

1. Add the authoritative read order for product, technical, design, and quality docs
2. Remove guidance that gives derived docs equal standing with canonical docs
3. Point future agents and maintainers to the new inventory and taxonomy docs

## Verification

```bash
find docs -maxdepth 4 | sort
rg -n "canonical|derived-active|historical|delete-candidate|authority chain" docs/quality docs/maintenance docs/ARCHITECTURE_INDEX.md
git diff -- docs/quality/document-taxonomy.md docs/quality/source-generated-archive-policy.md docs/quality/document-inventory-2026-04.md docs/maintenance/OPERATING_MODEL.md docs/quality/README.md docs/ARCHITECTURE_INDEX.md
```

---

## Tranche 2: Build Capability Truth Matrix

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 1

## Description

Audit every material launch and deferred capability across PRD, API, backend, web, mobile, admin, migrations, and
tests. The result is the program’s central truth artifact.

## Entry Criteria

- Tranche 1 completed
- authority-chain and doc classification are available

## Done When

- a capability matrix exists for launch and deferred features
- each capability is classified as `launch-live`, `implemented-gated`, `partial`, `contract-only`, `deferred`, or
  `archive`
- known activation gaps are documented
- unsupported PRD/API claims are identified before canonical rewrite begins

### Task 3: Create the capability matrix

**Files:**
- Create: `docs/quality/capability-matrix.md`
- Modify: `docs/quality/realignment-report.md`

**Scope areas to classify:**
- Auth and onboarding
- Task posting and scope summary
- Matching, applications, and booking
- Messaging and notifications
- Reviews, disputes, and trust/safety
- Admin operations
- Escrow, wallet, and payouts
- Lead fees, credits, and promoted listings
- Referrals
- Subscription
- B2B Lite
- DAN verification

**Steps:**

1. Read source requirements in `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/API.yaml`
2. Inspect runtime code with `rg` across `services/api`, `apps/web`, and `apps/mobile`
3. Record per-capability evidence and classification
4. Record activation blockers and missing layers for each non-launch capability

### Task 4: Ratify the Phase 1 launch baseline

**Files:**
- Create: `docs/quality/launch-baseline-2026-04.md`
- Modify: `docs/quality/capability-matrix.md`

**Steps:**

1. Select the minimal launch commitment from the matrix
2. Identify which toggles must remain off for initial rollout
3. Document which dormant features are real activation candidates after launch
4. Document which later-phase items are not activation-ready despite current docs or UI presence

## Verification

```bash
rg -n "implemented-gated|partial|contract-only|launch-live|activation blocker" docs/quality/capability-matrix.md docs/quality/launch-baseline-2026-04.md
rg -n "escrow_enabled|lead_fee_enabled|subscription_enabled|ai_scope_summary_enabled|promoted_listings_enabled|b2b_enabled" services/api apps packages docs -g '!**/build/**'
```

---

## Tranche 3: Rewrite Canonical Product Documentation

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 2

## Description

Rewrite the PRD so it reflects product truth, not generation history. Phase 1 becomes the launch commitment; later
phases are retained only with verified status language.

## Entry Criteria

- capability matrix completed
- launch baseline ratified

## Done When

- `docs/PRD.md` is concise, launch-centered, and product-managed
- Phase 1 scope and KPIs are explicit
- later-phase features are described only in matrix-backed terms
- speculative or redundant requirement prose is removed

### Task 5: Restructure the PRD around launch truth

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/STRATEGY.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Separate `launch baseline` from `latent capabilities`
2. Remove unsupported “toggle-only” statements
3. Rewrite goals, personas, flows, and functional requirements around verified Phase 1 behavior
4. Keep future-phase sections only if they are clearly labeled with verified implementation status
5. Record the PRD realignment in `CHANGELOG.md`

### Task 6: Add a canonical status appendix for deferred capabilities

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/quality/capability-matrix.md`

**Steps:**

1. Add a short appendix or reference table summarizing dormant capabilities by status
2. Link the PRD to the capability matrix instead of embedding speculative detail

## Verification

```bash
rg -n "launch baseline|latent capabilities|implemented-gated|partial|contract-only" docs/PRD.md
git diff -- docs/PRD.md docs/STRATEGY.md CHANGELOG.md
```

---

## Tranche 4: Align Architecture/API Docs And Remove Derived Noise

**Status:** planned
**Priority:** high
**Depends on:** Tranche 3

## Description

Rewrite canonical technical docs to match verified runtime posture and then remove unnecessary derived documentation
that still pollutes discovery.

## Entry Criteria

- PRD rewrite completed
- capability matrix and launch baseline are current

## Done When

- architecture and API docs match verified implementation posture
- deferred endpoints are clearly classified or removed from canonical status
- misleading derived docs are archived or deleted
- the live `docs/` tree is materially smaller and easier to navigate

### Task 7: Rewrite architecture and API posture

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/API.yaml`
- Modify: `docs/ARCHITECTURE_INDEX.md`

**Steps:**

1. Align architectural claims with the capability matrix
2. Preserve explicit activation gaps where code is incomplete
3. Review deferred endpoints and decide which remain forward references versus which should leave the canonical API
4. Update the index so readers can find the current truth quickly

### Task 8: Remove unnecessary derived documentation

**Files:**
- Modify: `docs/quality/document-inventory-2026-04.md`
- Modify: `docs/quality/document-taxonomy.md`
- Delete or move: selected dated files under `docs/quality/`, `docs/design/prompts/`, `docs/debates/`, `docs/ideas/`
- Create or modify: `archive/greenfield-docs/README.md` if archive moves are needed

**Steps:**

1. Archive or delete docs previously marked as historical or delete-candidate
2. Keep only derived docs with current operational consumers
3. Update taxonomy and inventory after the cleanup

## Verification

```bash
find docs -maxdepth 4 | sort
rg -n "x-tasky-status: deferred|x-tasky-target-phase|activation gap|Phase 1" docs/API.yaml docs/ARCHITECTURE.md
git diff -- docs/ARCHITECTURE.md docs/API.yaml docs/ARCHITECTURE_INDEX.md docs/quality/document-taxonomy.md docs/quality/document-inventory-2026-04.md
```

---

## Tranche 5: Audit Test Trust Against Product Risk

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 4

## Description

Classify current tests by signal quality and map them to launch-critical product behavior. The objective is to prove
which checks can actually block release.

## Entry Criteria

- canonical docs are truthful enough to use as coverage authority
- stale docs no longer distort test expectations

## Done When

- launch-critical requirements map to explicit verification evidence or gaps
- low-signal suites are identified
- release-blocking candidates are named
- backend scenario discipline is checked against the scenario registry

### Task 9: Produce requirement-to-verification map

**Files:**
- Create: `docs/quality/requirement-verification-matrix.md`
- Modify: `docs/quality/test-trust-audit.md`
- Modify: `docs/quality/test-rehab-backlog.md`

**Steps:**

1. Select the launch-critical PRD requirements and unhappy paths
2. Map each to backend tests, web tests, mobile tests, Maestro, Playwright, or missing evidence
3. Mark tests that assert only existence, snapshots, or mocks without observable outcomes
4. Identify which suites are blockers, advisory, or ceremonial

### Task 10: Check scenario-test integrity

**Files:**
- Modify: `docs/quality/test-trust-audit.md`
- Modify: `docs/quality/verification-matrix.md`

**Steps:**

1. Review `tests/registry.yaml` and `tests/scenarios/*.md`
2. Check whether launch-critical backend behavior has matching scenario-backed tests
3. Record gaps where the scenario framework exists but does not provide meaningful enforcement

## Verification

```bash
rg -n "blocker|advisory|ceremonial|missing evidence" docs/quality/requirement-verification-matrix.md docs/quality/test-trust-audit.md
./gradlew --no-daemon gateSmoke
pnpm -r test
```

---

## Tranche 6: Rebuild Verification And Release Gates

**Status:** planned
**Priority:** critical
**Depends on:** Tranche 5

## Description

Replace weak verification with release-grade checks. Fix mislabeled E2E flows, strengthen behavior coverage, and align
local and CI gate definitions.

## Entry Criteria

- test-trust audit completed
- blocker gaps are prioritized

## Done When

- backend, web, and mobile blocking checks are behavior-based
- mobile “E2E” means real Maestro execution only
- web has meaningful Playwright flows for launch-critical paths
- CI workflows match documented commands and maintained artifacts

### Task 11: Strengthen backend and contract verification

**Files:**
- Modify: backend test files under `services/api/src/test/java/mn/tasky/**`
- Modify: `tests/registry.yaml`
- Modify: `docs/quality/verification-matrix.md`

**Steps:**

1. Add or strengthen assertions for launch-critical scenario-backed behaviors
2. Run `./services/api/scripts/sync-registry.sh` after scenario test changes
3. Promote `gateSmoke` and `gateRegression` only where evidence quality supports it

### Task 12: Rebuild real client-side behavior coverage

**Files:**
- Modify: `apps/mobile/scripts/run-e2e.sh`
- Modify: `apps/mobile/scripts/run-e2e-smoke.sh`
- Modify: `apps/mobile/maestro/**`
- Modify: `apps/web/tests/**`
- Modify: `apps/web/playwright/**`
- Modify: `.github/workflows/quality-gates.yml`
- Modify: `.github/workflows/nightly-regression.yml`
- Modify: `.github/workflows/release-gate.yml`

**Steps:**

1. Remove fake-E2E fallbacks in mobile scripts
2. Upgrade Maestro to cover launch-critical customer/tasker journeys
3. Add or repair Playwright for at least one customer, one tasker, and one admin critical path
4. Align CI jobs with documented trusted commands

## Verification

```bash
./gradlew --no-daemon gateSmoke
./gradlew --no-daemon gateRegression
pnpm -r typecheck
pnpm -r test
pnpm --filter @tasky/web test:e2e
pnpm --filter @tasky/mobile test:e2e:smoke
```

---

## Tranche 7: Ratify Staging Readiness

**Status:** planned
**Priority:** high
**Depends on:** Tranche 6

## Description

Make staging a reliable dress rehearsal for launch. This includes seeded data, secrets posture, toggle defaults,
environment checks, smoke flows, and operator documentation.

## Entry Criteria

- trusted verification gates available
- launch baseline stable

## Done When

- staging runbook exists and is executable
- launch toggle posture is defined
- seed data and test accounts support manual and automated validation
- at least one staging rehearsal has evidence attached

### Task 13: Define staging operating kit

**Files:**
- Create: `docs/maintenance/STAGING_RUNBOOK.md`
- Create: `docs/maintenance/STAGING_TOGGLE_POSTURE.md`
- Create: `docs/maintenance/STAGING_SEED_DATA.md`
- Modify: deployment or environment docs under `tooling/` or repo root as needed

**Steps:**

1. Document required env vars, secrets, providers, and third-party dependencies
2. Define Phase 1 default toggle states
3. Define staging users, seeded categories, seeded bookings, and admin accounts
4. Record the smoke flows and expected outcomes

### Task 14: Rehearse release into staging

**Files:**
- Create: `docs/quality/staging-rehearsal-2026-04.md`
- Modify: `CHANGELOG.md`

**Steps:**

1. Run canonical deploy and smoke commands in staging
2. Capture failures, fixes, and evidence
3. Update the runbook and changelog based on the rehearsal

## Verification

```bash
./gradlew --no-daemon test openApiValidate gateSmoke
pnpm -r typecheck
pnpm -r test
```

Staging-specific smoke commands should be added to `docs/maintenance/STAGING_RUNBOOK.md` and executed from that
document.

---

## Tranche 8: Ratify Production Readiness And Activation Governance

**Status:** planned
**Priority:** high
**Depends on:** Tranche 7

## Description

Convert staging confidence into production launch control. Define monitoring, incident response, rollout, rollback, and
the governance needed to enable dormant capabilities safely after launch.

## Entry Criteria

- staging rehearsal complete
- launch baseline and toggles are fixed

## Done When

- production readiness checklist exists
- launch KPI and alert ownership are defined
- rollback and incident rules are explicit
- dormant-capability activation has a governance model and evidence threshold

### Task 15: Publish production readiness and rollout policy

**Files:**
- Create: `docs/maintenance/PRODUCTION_READINESS.md`
- Create: `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`
- Modify: `docs/METRICS.md`
- Modify: `docs/LAUNCH_ROADMAP.md`

**Steps:**

1. Define go/no-go checklist for production
2. Define launch KPIs, alert thresholds, and owners
3. Define rollback triggers and operator responsibilities
4. Define evidence requirements for enabling `implemented-gated` capabilities after launch

### Task 16: Close the program with one final readiness report

**Files:**
- Create: `docs/quality/final-launch-readiness-report-2026-04.md`

**Steps:**

1. Summarize documentation truth, capability truth, verification trust, and operational readiness
2. List remaining known risks and launch deferrals
3. Provide explicit recommendation: `not ready`, `ready for staging`, or `ready for production`

## Verification

```bash
rg -n "go/no-go|rollback|activation|owner|threshold" docs/maintenance/PRODUCTION_READINESS.md docs/maintenance/FEATURE_ACTIVATION_POLICY.md docs/METRICS.md docs/LAUNCH_ROADMAP.md
```

## Program Exit Verification

Run the full maintained gate set before closing the program:

```bash
tooling/scripts/check-cleanup-gate.sh
./gradlew --no-daemon test
./gradlew --no-daemon openApiValidate
./gradlew --no-daemon gateSmoke
./gradlew --no-daemon gateRegression
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm sdk:generate
pnpm generated:verify
```
