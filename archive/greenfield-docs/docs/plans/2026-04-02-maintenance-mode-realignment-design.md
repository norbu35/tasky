# Maintenance-Mode Repo Realignment Design
**Date:** 2026-04-02
**Status:** Approved

## Goal

Shift Tasky from a greenfield agent-execution repo into a maintenance-mode monorepo that keeps contributor automation in-repo, archives the legacy task-queue operating model, and makes structural boundaries enforceable.

## Approved Constraints

- Feature delivery is frozen until the structural cleanup and realignment are complete.
- Contributor and agent support material stays in the repository as a first-class subsystem.
- The repo-native task queue (`tasks/` + `scripts/task.sh`) is legacy machinery and must be archived.
- The program should optimize for aggressive structural cleanup, not minimal short-term delivery risk.
- Structural work must begin with a test-trust audit so large moves happen behind a trusted cleanup gate.

## Current-State Findings

The current repo already resembles a monorepo, but the boundaries are inconsistent.

### Runtime code

- Backend runtime code is still rooted at the repository top level via `src/`, `build.gradle.kts`, and `settings.gradle.kts`.
- Frontend deployables are already zoned under `apps/web/` and `apps/mobile/`.
- Shared TypeScript code already lives under `packages/` (`core`, `sdk`, `design-tokens`).

### Contributor infrastructure and legacy process

- Contributor automation is tracked in `.agent/`, root `AGENTS.md`, and root `CLAUDE.md`.
- Local scratch output is also tracked in `.superpowers/`, which is not acceptable as durable repository state.
- The greenfield workflow still exists as live repo machinery in `tasks/` and `scripts/task.sh`.
- The repository contains multiple planning surfaces: `docs/plans/`, `docs/superpowers/plans/`, `docs/superpowers/specs/`, and `tasks/`.

### Research, generated, and artifact mixing

- Research datasets live under `scripts/data/`, mixed with operational scripts.
- Shared engineering configuration still lives at root under `config/` instead of an explicit tooling zone.
- Root `scripts/` mixes repo automation, backend test utilities, runtime helpers, and research scrapers.
- `packages/design-tokens/dist/` is tracked beside source, so generated policy is ambiguous.
- Root `bin/` contains tracked build output and resource copies, which should not remain as live source.
- Verification evidence is partly intentional (`artifacts/`) and partly mixed into the repo in ad hoc ways.
- Mobile native lockfiles and generated native folders are tracked under `apps/mobile/ios/` and should remain only if policy explicitly requires them.

### Verification surface

- Backend quality gates exist in Gradle and CI, but their trustworthiness has not yet been audited.
- `tests/registry.yaml` shows uneven mutation signal, including zero-signal areas.
- The repo has 19 backend test files, 39 web test files, and 105 mobile test files; count alone does not prove protection.
- CI currently mixes meaningful checks and potentially ceremonial ones, so a trusted structural-cleanup gate must be defined before major moves.

## Target Monorepo Shape

The target repository should have explicit zones with distinct lifecycles.

### Runtime zones

- `apps/` for deployable clients
- `services/` for backend deployables; current Spring Boot app moves to `services/api/`
- `packages/` for shared code and generated client surfaces

### Contributor infrastructure zone

- `tooling/` for agent instructions, validation scripts, repo automation, and shared engineering config
- Root `AGENTS.md` remains as a compatibility entry point, but deep contributor assets should live in one intentional location

### Knowledge and history zones

- `docs/` for live architecture, product, and maintenance documentation
- `research/` for market datasets, scraper outputs, and analysis inputs
- `archive/` for retired workflow machinery and superseded operational material
- `artifacts/` for intentionally retained machine-produced evidence only

## Decisions

### 1. Freeze-first operating model

This is a repo program, not an incremental feature stream. The cleanup sequence can optimize for structural correctness because no concurrent feature work must be supported.

### 2. Test trust precedes structural surgery

No major directory moves, deletions, or boundary changes should land until the repo has a documented trusted cleanup gate.

### 3. Agent material is retained but curated

Contributor infrastructure is treated as live tooling, not residue. The cleanup will keep it in-repo, reduce duplication, and separate durable instructions from local scratch.

### 4. Legacy backlog machinery is archived

The repo-native task queue was useful for greenfield generation, but it is not the long-term maintenance operating model. It should move to `archive/` with clear read-only status.

### 5. Root directory becomes orchestration-only

After realignment, the root should contain only top-level orchestration files, compatibility entry docs, and cross-repo package manager/build entrypoints. Service code should no longer live directly under the root.

### 6. Every artifact class gets an explicit policy

Each tracked class must be labeled as one of:
- source of truth
- generated and intentionally tracked
- generated and ignored
- durable evidence
- research input
- local scratch
- archived legacy

Anything without a policy is structural debt.

### 7. Boundaries must be machine-enforced

The final repo must not rely on convention alone. Backend package rules, workspace dependency rules, generated contract drift checks, and trusted CI tiers need executable enforcement.

## Phase Model

### Phase 0: Freeze baseline
Capture the exact starting state of structure, docs, and verification.

### Phase 1: Test trust audit
Run and classify every meaningful verification command, then define a trusted cleanup gate.

### Phase 2: Archive legacy workflow machinery
Retire the live task-queue operating model and reduce overlapping planning entry points.

### Phase 3: Structural realignment
Move the backend into `services/api/`, create explicit repo zones, and clean the root.

### Phase 4: Artifact and generation policy cleanup
Separate source, generated output, evidence, scratch, and research inputs.

### Phase 5: Boundary enforcement
Add executable checks for backend architecture, workspace dependencies, and API/SDK drift.

### Phase 6: Test rehabilitation
Rewrite, quarantine, or delete low-value tests discovered during the audit.

### Phase 7: Maintenance-mode documentation
Replace the greenfield execution mindset with a single clear maintenance operating model.

### Phase 8: Final ratification
Run trusted cleanup and full regression gates, then publish a final realignment report.

## Deliverables

At the end of the program, the repo should have:

- a trusted structural-cleanup verification gate
- an explicit monorepo layout with `services/`, `apps/`, `packages/`, `tooling/`, `research/`, `archive/`, and `docs/`
- archived legacy workflow machinery instead of live `tasks/`
- contributor infrastructure curated into one intentional subsystem
- documented and enforced policies for generated artifacts, research data, and verification evidence
- machine-enforced architectural boundaries
- a simplified maintenance workflow for future extension work

## Risks And Guardrails

### Risk: moving the backend breaks root-level assumptions
Guardrail: introduce the new `services/api/` Gradle structure behind the trusted cleanup gate and update CI/runtime paths in the same tranche.

### Risk: test volume hides shallow protection
Guardrail: the audit classifies tests by effectiveness, not by count.

### Risk: agent infrastructure becomes duplicated or half-moved
Guardrail: define one canonical contributor-tooling home and make all root docs point there.

### Risk: generated outputs and research data keep polluting operational zones
Guardrail: add explicit artifact policy docs plus ignore rules before final ratification.

## Success Criteria

The realignment is complete when all of the following are true:

- feature work remains frozen until the cleanup program reaches final ratification
- structural cleanup is protected by a trusted documented gate
- no live workflow depends on `tasks/` or `scripts/task.sh`
- the backend no longer lives directly under the repository root
- contributor tooling, research data, archive material, and runtime code occupy explicit zones
- architecture and contract boundaries are enforced automatically in CI
- the repo is documented for maintenance and extension rather than greenfield autonomous generation
