# AI Greenfield Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove provably dead code, duplicate implementations, and low-signal greenfield residue while preserving documented deferred feature shells.

**Architecture:** Use Serena-first repo discovery and evidence-driven cleanup across the monorepo. Detect candidates with package-local unused-code analysis, duplicate-code detection, and backend static analysis; then make small behavior-preserving edits with targeted verification after each batch.

**Tech Stack:** Java 21, Spring Boot 3, JDBI, React 18, React Native Expo, TypeScript, pnpm workspace, PMD, SpotBugs, eslint, Jest, Vitest

---

### Task 1: Baseline Analysis And Candidate List

**Files:**
- Create: `docs/plans/2026-04-11-ai-greenfield-cleanup-design.md`
- Create: `docs/plans/2026-04-11-ai-greenfield-cleanup.md`
- Inspect: `apps/web/package.json`
- Inspect: `apps/mobile/package.json`
- Inspect: `packages/core/package.json`
- Inspect: `packages/design-tokens/package.json`
- Inspect: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`

**Step 1: Run package-local unused-code analysis**

Run:

```bash
cd /Users/norov/workspace/projects/tasky/apps/web && npx --yes knip
cd /Users/norov/workspace/projects/tasky/packages/core && npx --yes knip
cd /Users/norov/workspace/projects/tasky/packages/design-tokens && npx --yes knip
```

Expected: Concrete unused exports/files or a clean report for each package.

**Step 2: Run duplicate-code scan**

Run:

```bash
cd /Users/norov/workspace/projects/tasky
npx --yes jscpd --min-lines 8 --min-tokens 80 --reporters console apps packages services
```

Expected: A short list of duplicate clusters worth validating manually.

**Step 3: Run backend static analysis for safe cleanup targets**

Run:

```bash
cd /Users/norov/workspace/projects/tasky
./gradlew :services:api:pmdMain :services:api:spotbugsMain -q
```

Expected: A focused list of findings. At minimum, confirm the `DistrictGeocodingProvider` locale issue.

**Step 4: Freeze a small, concrete edit set**

Select only candidates that are:

- unused by imports and direct references
- duplicated with a clear canonical replacement
- behavior-preserving static-analysis fixes

**Step 5: Commit planning docs if working in a commit-oriented flow**

```bash
git add docs/plans/2026-04-11-ai-greenfield-cleanup-design.md docs/plans/2026-04-11-ai-greenfield-cleanup.md
git commit -m "docs(plans): add ai greenfield cleanup tranche"
```

### Task 2: Remove TypeScript Dead Surface

**Files:**
- Modify: exact files reported by Task 1 package-local analysis
- Test: affected package test files only if behavior-facing wrappers are removed

**Step 1: Confirm no consumers remain**

Run:

```bash
rg -n "<symbol-or-file-name>" /Users/norov/workspace/projects/tasky/apps /Users/norov/workspace/projects/tasky/packages
```

Expected: No remaining product consumers outside the candidate file itself, or only references that will be updated in the same patch.

**Step 2: Delete or consolidate the minimal dead surface**

Use `apply_patch` to:

- remove unused exports/files
- collapse duplicate wrappers to one canonical implementation
- update imports for moved consumers

**Step 3: Verify touched TS packages**

Run:

```bash
pnpm --filter <pkg> typecheck
pnpm --filter <pkg> test
pnpm --filter <pkg> lint
```

Expected: All touched-package checks pass.

**Step 4: Commit**

```bash
git add <touched-files>
git commit -m "refactor(frontend): remove dead and duplicate workspace code"
```

### Task 3: Clean Backend Dead/Sloppy Code

**Files:**
- Modify: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`
- Modify: any additional backend files with safe static-analysis-backed cleanup
- Test: existing backend tests covering touched classes

**Step 1: Make the minimal safe fixes**

Use `apply_patch` to:

- replace locale-sensitive case conversion with `Locale.ROOT`
- remove redundant code only when reference and behavior checks stay unchanged

**Step 2: Run focused backend verification**

Run:

```bash
cd /Users/norov/workspace/projects/tasky
./gradlew :services:api:test --tests '*DistrictGeocodingProvider*' || true
./gradlew :services:api:pmdMain :services:api:spotbugsMain -q
```

Expected: The targeted PMD issue is gone. Any remaining SpotBugs findings are either unrelated existing issues or separately actionable.

**Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java
git commit -m "refactor(api): remove static-analysis cleanup debt"
```

### Task 4: Final Verification And Changelog

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Re-run targeted checks for all touched areas**

Run:

```bash
cd /Users/norov/workspace/projects/tasky
pnpm --filter <pkg> typecheck
pnpm --filter <pkg> test
./gradlew :services:api:test
```

Expected: Touched areas are green.

**Step 2: Update changelog**

Add one line summarizing the cleanup.

**Step 3: Inspect final diff**

Run:

```bash
git diff --stat
git status --short
```

Expected: Only intentional cleanup changes remain staged or unstaged.

**Step 4: Commit**

```bash
git add CHANGELOG.md <touched-files>
git commit -m "chore(repo): clean dead code and greenfield residue"
```
