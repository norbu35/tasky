# Repo Realignment Baseline

Captured at: `2026-04-02T07:31:57Z`

## Structure

- Baseline tree file: `docs/quality/repo-tree-baseline.txt`
- Tree entries captured (max depth 2): `189`

## Verification Surface

- Tracked files count: `1311`
- Root backend currently located at: `src/` with root `build.gradle.kts`
- Workspace layout currently includes: `apps/`, `packages/`, root backend module

## Legacy Systems

- Legacy task system is still live: `tasks/` + `scripts/task.sh`
- Contributor automation currently tracked in `.agent/`
- Local scratch output currently tracked in `.superpowers/`

## Snapshot: Working Tree

```text
?? docs/plans/2026-04-02-maintenance-mode-realignment-design.md
?? docs/plans/2026-04-02-maintenance-mode-realignment-implementation.md
?? docs/quality/
```

Note: Worktree is intentionally non-clean because approved plan documents were created immediately before baseline capture.

## Snapshot: Directory Sizes

```text
185M	apps
524K	packages
1.9M	src
3.0M	docs
100K	tests
153M	scripts
336K	.agent
148K	.superpowers
444K	artifacts
17M	build
```

## Known Risks At Baseline

- No trusted cleanup gate has been formalized yet.
- Build/output and local scratch assets are mixed with durable source assets.
- Multiple planning surfaces and legacy workflow artifacts remain live.
- Structural changes can break path-sensitive CI and scripts unless migrated in lockstep.
