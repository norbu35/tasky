# Maintenance-Mode Repo Realignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Realign Tasky into a maintenance-mode monorepo with trusted cleanup gates, archived legacy workflow machinery, explicit repo zones, and enforceable structural boundaries.

**Architecture:** Establish a trusted cleanup gate before any major move. Then archive the greenfield task-queue workflow, introduce explicit top-level zones (`services`, `apps`, `packages`, `tooling`, `research`, `archive`, `docs`, `artifacts`), move the backend into `services/api/`, and finish by enforcing boundaries in CI and rehabilitating weak tests. The plan assumes feature work stays frozen until final ratification.

**Tech Stack:** Java 21, Spring Boot 3, Gradle Kotlin DSL, JUnit 5, ArchUnit, pnpm workspaces, React 18, Expo, Vitest, Jest, GitHub Actions, shell and Python repo scripts

---

### Task 1: Capture The Frozen Baseline

**Files:**
- Create: `docs/quality/README.md`
- Create: `docs/quality/repo-realignment-baseline.md`
- Create: `docs/quality/repo-tree-baseline.txt`

**Step 1: Create the quality-docs home**

- Add `docs/quality/README.md` describing the purpose of baseline, verification, and audit documents.
- Add headings in `docs/quality/repo-realignment-baseline.md` for structure, verification, legacy systems, and known risks.

**Step 2: Capture the repo tree and top-level inventory**

Run: `find . -maxdepth 2 -mindepth 1 | sort > docs/quality/repo-tree-baseline.txt`
Expected: `docs/quality/repo-tree-baseline.txt` contains the current top-level and near-top-level structure.

**Step 3: Record frozen-state facts**

Run: `git status --short && git ls-files | wc -l && du -sh apps packages src docs tests scripts .agent .superpowers artifacts build 2>/dev/null`
Expected: clean worktree plus a size snapshot recorded in `docs/quality/repo-realignment-baseline.md`.

**Step 4: Commit the baseline snapshot**

```bash
git add docs/quality/README.md docs/quality/repo-realignment-baseline.md docs/quality/repo-tree-baseline.txt
git commit -m "docs(repo): capture realignment baseline"
```

### Task 2: Audit The Current Verification Surface

**Files:**
- Create: `docs/quality/verification-matrix.md`
- Create: `docs/quality/test-trust-audit.md`
- Create: `docs/quality/flaky-or-ceremonial-checks.md`

**Step 1: Inventory every current gate and test command**

- Populate `docs/quality/verification-matrix.md` with the exact commands from `build.gradle.kts`, root `package.json`, workspace `package.json` files, and `.github/workflows/*.yml`.
- For each command, record scope, owner, claimed protection, runtime cost, and whether it blocks CI.

**Step 2: Run the current gates under @verification-before-completion discipline**

Run: `./gradlew --no-daemon test openApiValidate gateSmoke && pnpm -r typecheck && pnpm -r test`
Expected: every command either passes cleanly or produces a failure that is recorded verbatim in `docs/quality/test-trust-audit.md`.

**Step 3: Re-run suspect commands to check determinism**

Run: `./gradlew --no-daemon gateSmoke && pnpm -r test`
Expected: flaky commands are identified and recorded in `docs/quality/flaky-or-ceremonial-checks.md`.

**Step 4: Inspect effectiveness instead of count**

- Review representative backend, web, and mobile tests.
- Record shallow, snapshot-only, navigation-only, or mock-invocation-only tests in `docs/quality/test-trust-audit.md`.
- Use @systematic-debugging for any gate that behaves inconsistently.

**Step 5: Commit the trust audit docs**

```bash
git add docs/quality/verification-matrix.md docs/quality/test-trust-audit.md docs/quality/flaky-or-ceremonial-checks.md
git commit -m "docs(quality): audit verification surface"
```

### Task 3: Define And Automate The Trusted Cleanup Gate

**Files:**
- Create: `tooling/README.md`
- Create: `tooling/scripts/check-cleanup-gate.sh`
- Create: `docs/quality/cleanup-gate.md`
- Modify: `.github/workflows/quality-gates.yml`

**Step 1: Introduce the tooling zone**

- Create `tooling/README.md` describing what belongs under `tooling/` and what does not.
- Create `tooling/scripts/check-cleanup-gate.sh` as the canonical structural-cleanup verification script.

**Step 2: Encode the smallest trusted gate**

Run: `chmod +x tooling/scripts/check-cleanup-gate.sh`
Expected: the script is executable and runs only trusted commands identified in `docs/quality/test-trust-audit.md`.

**Step 3: Document the gate contract**

- Add `docs/quality/cleanup-gate.md` with exact commands, expected duration, and rules for demoting flaky checks.

**Step 4: Wire the cleanup gate into CI**

- Update `.github/workflows/quality-gates.yml` so the cleanup gate runs as a distinct job or step.
- Ensure the CI job name makes it obvious that it protects structural realignment work.

**Step 5: Verify the cleanup gate locally**

Run: `tooling/scripts/check-cleanup-gate.sh`
Expected: PASS using only trusted commands, or a documented failure that blocks further structural work.

**Step 6: Commit the cleanup gate**

```bash
git add tooling/README.md tooling/scripts/check-cleanup-gate.sh docs/quality/cleanup-gate.md .github/workflows/quality-gates.yml
git commit -m "chore(quality): add trusted cleanup gate"
```

### Task 4: Archive The Legacy Task-Queue Workflow

**Files:**
- Create: `archive/README.md`
- Create: `archive/legacy-task-system/README.md`
- Move: `tasks/` -> `archive/legacy-task-system/tasks/`
- Move: `scripts/task.sh` -> `archive/legacy-task-system/task.sh`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Create the archive contract**

- Add `archive/README.md` documenting that `archive/` contains read-only retired workflow machinery.
- Add `archive/legacy-task-system/README.md` explaining why `tasks/` and `scripts/task.sh` were retired.

**Step 2: Move the legacy backlog machinery**

Run: `git mv tasks archive/legacy-task-system/tasks && git mv scripts/task.sh archive/legacy-task-system/task.sh`
Expected: `tasks/` no longer exists at the repo root, and the task script is archived, not live.

**Step 3: Remove live references to the retired workflow**

Run: `rg -n "scripts/task\.sh|tasks/" AGENTS.md CLAUDE.md README.md docs .github`
Expected: only archive references remain after updating `AGENTS.md`, `CLAUDE.md`, and `README.md`.

**Step 4: Verify no cleanup script depends on the archived task system**

Run: `tooling/scripts/check-cleanup-gate.sh`
Expected: PASS without any dependency on `tasks/` or `scripts/task.sh`.

**Step 5: Commit the archive move**

```bash
git add archive/README.md archive/legacy-task-system/README.md AGENTS.md CLAUDE.md README.md
git commit -m "chore(repo): archive legacy task workflow"
```

### Task 5: Establish The Top-Level Monorepo Zones

**Files:**
- Create: `services/README.md`
- Create: `research/README.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/ARCHITECTURE_INDEX.md`

**Step 1: Document the target zones**

- Add `services/README.md` describing deployable backend services.
- Add `research/README.md` describing datasets, scrapers, and research-only material.

**Step 2: Update root entry docs**

- Update `README.md`, `AGENTS.md`, and `CLAUDE.md` so the canonical repo structure is `apps/`, `services/`, `packages/`, `tooling/`, `research/`, `archive/`, `docs/`, and `artifacts/`.

**Step 3: Update architecture navigation**

- Modify `docs/ARCHITECTURE_INDEX.md` so service, tooling, research, and archive zones are represented explicitly.

**Step 4: Verify the structure docs**

Run: `sed -n '1,240p' README.md && sed -n '1,240p' docs/ARCHITECTURE_INDEX.md`
Expected: the top-level repo layout is described consistently in both files.

**Step 5: Commit the zone scaffolding**

```bash
git add services/README.md research/README.md README.md AGENTS.md CLAUDE.md docs/ARCHITECTURE_INDEX.md
git commit -m "docs(repo): define monorepo zones"
```

### Task 6: Move The Backend Into `services/api`

**Files:**
- Create: `services/api/build.gradle.kts`
- Move: `src/` -> `services/api/src/`
- Move: `build.gradle.kts` -> `services/api/build.gradle.kts`
- Modify: `settings.gradle.kts`
- Modify: `gradlew`
- Modify: `gradlew.bat`
- Modify: `.github/workflows/quality-gates.yml`

**Step 1: Convert the repo to a multi-project Gradle layout**

- Update `settings.gradle.kts` to name the root and include `services:api`.
- Replace the root `build.gradle.kts` with an aggregator-only build if needed.

**Step 2: Move the backend source tree and service build file**

Run: `mkdir -p services/api && git mv src services/api/src && git mv build.gradle.kts services/api/build.gradle.kts`
Expected: backend code no longer lives directly under the repo root.

**Step 3: Fix Gradle paths and source references**

Run: `./gradlew --no-daemon :services:api:test :services:api:openApiValidate`
Expected: PASS from the new service path, with generated OpenAPI sources still resolving.

**Step 4: Update CI to use the service-qualified tasks**

- Change `.github/workflows/quality-gates.yml` to call `:services:api:test` and `:services:api:openApiValidate` where appropriate.

**Step 5: Re-run the cleanup gate**

Run: `tooling/scripts/check-cleanup-gate.sh`
Expected: PASS with backend verification now targeting `services/api`.

**Step 6: Commit the backend move**

```bash
git add settings.gradle.kts services/api/build.gradle.kts services/api/src .github/workflows/quality-gates.yml
git commit -m "refactor(repo): move backend into services api"
```

### Task 7: Rewire Service-Adjacent Infra And Runtime Paths

**Files:**
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.web.yml`
- Modify: `scripts/check-gates.sh`
- Modify: `scripts/performance-smoke.sh`
- Modify: `.github/workflows/nightly-regression.yml`
- Modify: `.github/workflows/release-gate.yml`

**Step 1: Point container builds at `services/api`**

- Update `Dockerfile` and compose files so the service build context and jar/classpath expectations match `services/api`.

**Step 2: Fix path-sensitive verification scripts**

- Update `scripts/check-gates.sh` and `scripts/performance-smoke.sh` to call the service-qualified Gradle tasks.

**Step 3: Update CI workflows that still assume a root-level backend**

Run: `rg -n "build\.gradle\.kts|src/main|src/test|openApiValidate|gateSmoke|gradlew" .github/workflows scripts`
Expected: every path-sensitive reference is updated for the new `services/api` location.

**Step 4: Verify infra-aware checks**

Run: `./gradlew --no-daemon :services:api:test && bash scripts/performance-smoke.sh`
Expected: backend tests pass and the performance smoke script uses the new layout.

**Step 5: Commit the infra rewiring**

```bash
git add Dockerfile docker-compose.yml docker-compose.web.yml scripts/check-gates.sh scripts/performance-smoke.sh .github/workflows/nightly-regression.yml .github/workflows/release-gate.yml
git commit -m "chore(infra): rewire runtime paths for services api"
```

### Task 8: Consolidate Contributor Tooling And Remove Local Scratch State

**Files:**
- Create: `tooling/agent/README.md`
- Move: `config/` -> `tooling/config/`
- Move: `.agent/` -> `tooling/agent/`
- Move: `scripts/check-gates.sh` -> `tooling/scripts/check-gates.sh`
- Move: `scripts/performance-smoke.sh` -> `tooling/scripts/performance-smoke.sh`
- Move: `scripts/validate-migrations.py` -> `tooling/scripts/validate-migrations.py`
- Move: `scripts/validate-sdk-contract-drift.sh` -> `tooling/scripts/validate-sdk-contract-drift.sh`
- Move: `scripts/add-i18n-keys.js` -> `tooling/scripts/add-i18n-keys.js`
- Move: `scripts/generate-prompts.js` -> `tooling/scripts/generate-prompts.js`
- Move: `scripts/sync-registry.sh` -> `services/api/scripts/sync-registry.sh`
- Move: `scripts/docker-run-cron.sh` -> `services/api/scripts/docker-run-cron.sh`
- Move: `scripts/Dockerfile` -> `services/api/scripts/Dockerfile`
- Delete: `.superpowers/`
- Modify: `.gitignore`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `.github/workflows/quality-gates.yml`
- Modify: `.github/workflows/nightly-regression.yml`
- Modify: `.github/workflows/release-gate.yml`
- Modify: `services/api/build.gradle.kts`

**Step 1: Move curated contributor infrastructure into `tooling/agent`**

Run: `git mv .agent tooling/agent`
Expected: contributor instructions, skills, and workflows now live under `tooling/agent/`.

**Step 2: Move shared engineering config and split scripts by ownership**

- Move shared engineering config to `tooling/config/`.
- Move repo-validation and repo-automation scripts to `tooling/scripts/`.
- Move backend-specific operational scripts to `services/api/scripts/`.
- Keep research scrapers out of this task; they move in the research-data task.

**Step 3: Remove tracked local scratch state**

Run: `git rm -r .superpowers`
Expected: `.superpowers/` is removed from version control and remains ignored in `.gitignore`.

**Step 4: Add contributor-tooling documentation**

- Create `tooling/agent/README.md` describing the curated agent/tooling surface.
- Update `AGENTS.md`, `CLAUDE.md`, and `README.md` so they point to `tooling/agent/`, `tooling/config/`, and `tooling/scripts/` as the canonical contributor-tooling homes.

**Step 5: Update path-sensitive CI and Gradle references**

- Update workflow files so they call the moved scripts from `tooling/scripts/` or `services/api/scripts/`.
- Update `services/api/build.gradle.kts` if any static-analysis config paths still point at root `config/`.

**Step 6: Verify no docs still point at `.agent/`, tracked `.superpowers/`, or retired root config paths**

Run: `rg -n "\.agent/|\.superpowers/|config/|scripts/(check-gates|performance-smoke|validate-migrations|validate-sdk-contract-drift|add-i18n-keys|generate-prompts|sync-registry|docker-run-cron)" .`
Expected: only intentional new paths or historical archive references remain.

**Step 7: Commit the tooling consolidation**

```bash
git add tooling/agent/README.md tooling/config tooling/scripts services/api/scripts .gitignore AGENTS.md CLAUDE.md README.md .github/workflows/quality-gates.yml .github/workflows/nightly-regression.yml .github/workflows/release-gate.yml services/api/build.gradle.kts
git commit -m "refactor(tooling): consolidate contributor infrastructure"
```

### Task 9: Separate Research Data From Operational Scripts

**Files:**
- Create: `research/market-data/README.md`
- Move: `data/unegui/.gitkeep` -> `research/market-data/unegui/.gitkeep`
- Move: `scripts/data/` -> `research/market-data/`
- Move: `unegui-scraper/` -> `research/unegui-scraper/`
- Modify: `scripts/scrape-unegui.py`
- Modify: `scripts/scrape-unegui-cron.sh`
- Modify: `docs/research/research_summary.md`
- Modify: `.gitignore`

**Step 1: Create the research-data contract**

- Add `research/market-data/README.md` explaining raw-source datasets, provenance, and retention rules.

**Step 2: Move datasets and scraper code out of the operational scripts zone**

Run: `mkdir -p research/market-data/unegui && git mv data/unegui/.gitkeep research/market-data/unegui/.gitkeep && git mv scripts/data research/market-data && git mv unegui-scraper research/unegui-scraper`
Expected: raw research inputs no longer live under `scripts/` or root `data/`.

**Step 3: Fix scraper paths and docs**

- Update `scripts/scrape-unegui.py` and `scripts/scrape-unegui-cron.sh` so they read from and write to `research/market-data/`.
- Update `docs/research/research_summary.md` to reference the new locations.

**Step 4: Verify the scraper path changes**

Run: `python3 scripts/scrape-unegui.py --help && bash -n scripts/scrape-unegui-cron.sh`
Expected: both scripts remain runnable after the path update.

**Step 5: Commit the research separation**

```bash
git add research/market-data/README.md scripts/scrape-unegui.py scripts/scrape-unegui-cron.sh docs/research/research_summary.md .gitignore
git commit -m "refactor(research): separate market data from scripts"
```

### Task 10: Define Generated, Artifact, And Evidence Policy

**Files:**
- Create: `docs/quality/source-generated-archive-policy.md`
- Delete: `bin/`
- Modify: `.gitignore`
- Modify: `packages/design-tokens/package.json`
- Modify: `packages/sdk/package.json`
- Modify: `package.json`
- Modify: `.github/workflows/quality-gates.yml`

**Step 1: Document artifact-class policy**

- Add `docs/quality/source-generated-archive-policy.md` classifying source, generated code, durable evidence, research inputs, local scratch, and archive material.
- Explicitly decide whether `packages/design-tokens/dist/` remains tracked.

**Step 2: Make the generated policy executable**

- Update workspace package scripts so generated surfaces are reproducible from source.
- If `packages/design-tokens/dist/` is not intentionally tracked, remove it and rely on `build` output plus ignore rules.
- Remove tracked `bin/` output if it is confirmed to be reproducible build output rather than source.

**Step 3: Verify reproducibility**

Run: `pnpm sdk:generate && pnpm --filter @tasky/design-tokens build && pnpm -r typecheck`
Expected: generated surfaces can be recreated without hand edits.

**Step 4: Add CI enforcement for generated drift**

- Update `.github/workflows/quality-gates.yml` to run SDK drift and generated-asset verification where appropriate.

**Step 5: Commit the artifact policy**

```bash
git add docs/quality/source-generated-archive-policy.md .gitignore packages/design-tokens/package.json packages/sdk/package.json package.json .github/workflows/quality-gates.yml
git commit -m "chore(repo): define generated artifact policy"
```

### Task 11: Enforce Monorepo Boundaries In Code And CI

**Files:**
- Create: `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`
- Create: `tooling/scripts/validate-workspace-boundaries.mjs`
- Modify: `services/api/build.gradle.kts`
- Modify: `package.json`
- Modify: `.github/workflows/quality-gates.yml`

**Step 1: Add backend architecture tests**

- Create `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java` with ArchUnit rules for domain boundaries, common-package access, and prohibited cross-domain dependencies.

**Step 2: Add workspace boundary checks**

- Create `tooling/scripts/validate-workspace-boundaries.mjs` to prevent forbidden dependency edges between `apps/`, `packages/`, `services/`, and `tooling/`.
- Add a root `package.json` script for the boundary check.

**Step 3: Wire boundary checks into Gradle and CI**

- Update `services/api/build.gradle.kts` to run the new architecture test as part of backend verification.
- Update `.github/workflows/quality-gates.yml` so boundary checks run in the cleanup gate or frontend/backend jobs.

**Step 4: Verify the new rules locally**

Run: `./gradlew --no-daemon :services:api:test --tests '*ArchitectureTest' && node tooling/scripts/validate-workspace-boundaries.mjs`
Expected: PASS with no forbidden dependency edges.

**Step 5: Commit the boundary enforcement**

```bash
git add services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java tooling/scripts/validate-workspace-boundaries.mjs services/api/build.gradle.kts package.json .github/workflows/quality-gates.yml
git commit -m "test(architecture): enforce monorepo boundaries"
```

### Task 12: Build The Test Rehabilitation Backlog And Fix The Worst Gaps

**Files:**
- Create: `docs/quality/test-rehab-backlog.md`
- Modify: `docs/quality/test-trust-audit.md`
- Modify: `docs/quality/verification-matrix.md`
- Modify: `tests/registry.yaml`

**Step 1: Convert the audit into an ordered rehab backlog**

- Create `docs/quality/test-rehab-backlog.md` with the highest-risk shallow or flaky areas first.
- Group items by backend, web, mobile, CI, and scenario integrity.

**Step 2: Fix the first blocking gaps under @test-driven-development**

- Start with any check that currently blocks the trusted cleanup gate from being meaningful.
- Update `tests/registry.yaml` if scenario coverage bookkeeping changes during backend test repairs.

**Step 3: Re-run the trusted cleanup gate and the broad regression commands**

Run: `tooling/scripts/check-cleanup-gate.sh && ./gradlew --no-daemon :services:api:test :services:api:openApiValidate && pnpm -r test`
Expected: the trusted cleanup gate passes cleanly, and broader regressions are either green or produce explicitly logged follow-up items.

**Step 4: Commit the rehab tranche**

```bash
git add docs/quality/test-rehab-backlog.md docs/quality/test-trust-audit.md docs/quality/verification-matrix.md tests/registry.yaml
git commit -m "test(repo): rehabilitate cleanup-critical checks"
```

### Task 13: Rewrite The Maintenance Operating Model And Ratify The Realignment

**Files:**
- Create: `archive/greenfield-docs/README.md`
- Create: `docs/maintenance/OPERATING_MODEL.md`
- Create: `docs/quality/document-taxonomy.md`
- Create: `docs/quality/realignment-report.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

**Step 1: Replace the greenfield workflow docs**

- Create `docs/maintenance/OPERATING_MODEL.md` describing how backlog, plans, contributor tooling, verification, archive material, and new cleanup work are handled in maintenance mode.
- Create `docs/quality/document-taxonomy.md` classifying `docs/plans/`, `docs/superpowers/plans/`, and `docs/superpowers/specs/` as live, archived, or historical-reference-only.
- Create `archive/greenfield-docs/README.md` describing the purpose of archived planning artifacts.
- Remove or rewrite any remaining root-doc language that assumes an active task queue or autonomous greenfield execution.

**Step 2: Archive superseded planning surfaces**

- Move superseded `docs/superpowers/plans/` and `docs/superpowers/specs/` material into `archive/greenfield-docs/` based on the taxonomy.
- Leave only active design and maintenance documents in live `docs/`.

**Step 3: Write the final realignment report**

- Create `docs/quality/realignment-report.md` summarizing what moved, what was archived, what enforcement was added, what remains deferred, and which commands now define the trusted cleanup gate.

**Step 4: Run final ratification checks under @verification-before-completion**

Run: `tooling/scripts/check-cleanup-gate.sh && ./gradlew --no-daemon :services:api:test :services:api:openApiValidate && pnpm -r typecheck && pnpm -r test`
Expected: PASS, or an explicit deferred-issues list in `docs/quality/realignment-report.md`.

**Step 5: Update the changelog**

- Add one maintenance-mode realignment summary line to `CHANGELOG.md`.

**Step 6: Commit the maintenance operating model**

```bash
git add archive/greenfield-docs/README.md docs/maintenance/OPERATING_MODEL.md docs/quality/document-taxonomy.md docs/quality/realignment-report.md README.md AGENTS.md CLAUDE.md CHANGELOG.md
git commit -m "docs(repo): finalize maintenance mode realignment"
```
