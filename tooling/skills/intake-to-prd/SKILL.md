---
name: intake-to-prd
description: Deterministic Tasky intake-to-PRD workflow. Use when an agent receives a product request, bug, launch-scope change, new requirement, or behavior change and must decide whether to update docs/PRD.md plus derived maintenance, architecture, contract, design, copy, and test surfaces before implementation.
---

# Intake To PRD

Use this skill before implementing product behavior changes or adding new requirement IDs.

## Inputs

Start from the active issue, approved execution brief, or user request. If none exists, create a short brief in the active work surface using this template:

```md
# Execution Brief: <short title>

## Problem

<user-visible problem, launch risk, or operational constraint>

## Affected PRD Sections

<specific PRD sections and requirement IDs, or "new PRD delta needed">

## Derivative Ripple

<maintenance, architecture, OpenAPI, design, copy, scenario, SDK, and code surfaces that must move together>

## Success Signal

<observable behavior, scenario coverage, contract output, or gate evidence>
```

## Workflow

1. Read `docs/PRD.md`, `docs/STRATEGY.md`, and the relevant maintenance policy before proposing the delta.
2. Decide whether the request changes product behavior, launch scope, KPI semantics, trust promises, booking/review policy, public copy, or API contract behavior.
3. If it does, update `docs/PRD.md` first. Use canonical `REQ-P1-*` IDs for active launch requirements. Keep future capabilities in deferred sections only.
4. After editing `docs/PRD.md`, run the narrowest matching `repo:prd:diff-ids` mode to identify changed requirement IDs:
   - use `pnpm repo:prd:diff-ids --staged` when the PRD delta is already staged
   - use `pnpm repo:prd:diff-ids --base <ref> --head <ref>` when reviewing an unstaged or branch-level diff
   - use bare `pnpm repo:prd:diff-ids` only as a local fallback
5. For each changed or added ID, review the derivative surfaces:
   - `tests/scenarios/*.md`
   - `docs/maintenance/*.md`
   - `docs/architecture/*.md`
   - `docs/openapi/**` when contract behavior is implicated
   - `docs/design/**` when user flow or lifecycle behavior changed
   - launch-facing copy or status matrices if the behavior is publicly claimed
6. Produce a per-ID ripple table with one of: `aligned`, `update required`, `out of scope for this PR`.
7. Update affected maintenance policy, architecture, OpenAPI, design/copy, scenarios, SDK, and implementation in that order when those surfaces are in scope.
8. When scenario files change, run `services/api/scripts/sync-registry.sh`.
9. Run the smallest matching verification lane and record the command output in the final handoff.

## Bundled Helper

- `scripts/extract_prd_diff_ids.py`
  Extracts changed `REQ-P1-*` and `NFR-*` IDs from a git diff of `docs/PRD.md`. Supports `--staged` and branch-diff modes (`--base <ref> --head <ref>`). Prefer `--staged` only when the PRD edit is actually staged. Outputs JSON with `{added, modified, removed}` sets. Always exits 0.

  Do not let an empty staged diff suppress the ripple review when the PRD delta exists but has not been staged yet.

  ```bash
  pnpm repo:prd:diff-ids --staged
  pnpm repo:prd:diff-ids --base origin/staging --head HEAD
  ```

## Required Output Checklist

Before implementation starts, confirm these are true:

- Product intent changed in `docs/PRD.md`, or the request was explicitly implementation-only.
- Maintenance policy changed when activation, readiness, trust posture, or operations changed.
- Architecture/contract/design/copy changed when the behavior is externally visible.
- Scenario coverage was added or updated for launch behavior, or the gap was reported instead of inventing test coverage.
- Deferred behavior remains marked as deferred and does not enter active derivatives.
- The success signal maps to a concrete gate such as `pnpm repo:docs:check`, `pnpm verify:scenario:smoke`, `./gradlew --no-daemon :services:api:gateRegression`, or the relevant frontend/backend lane.
