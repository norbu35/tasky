# Install Antigravity Superpowers Profile

This package is a standalone Antigravity profile. It does not modify the original Superpowers source workflows.

## Prerequisites

- Antigravity environment installed
- Shell access
- This repository available locally

## Install

From your project root:

```bash
npx antigravity-superpowers init
```

Or manually:

```bash
mkdir -p .agent
cp -R /path/to/antigravity-superpowers-cli/templates/tooling/agent/* tooling/agent/
```

If your project already has `tooling/agent/skills`, merge carefully and keep the versions you want.

## What Gets Installed

- `tooling/agent/AGENTS.md`
- `tooling/agent/task.md` (template only)
- `tooling/agent/skills/*`
- `tooling/agent/workflows/*`
- `tooling/agent/agents/*`
- `tooling/agent/tests/*`

Runtime tracking file:

- `docs/plans/task.md` in the target project root (created at runtime by skill flow, list-only table)

## Verify Profile

From your target project root:

```bash
bash tooling/agent/tests/run-tests.sh
```

Expected result: all checks pass with zero failures.

## Usage Notes

- This profile uses strict single-flow task execution.
- Generic coding subagents are intentionally not used.
- Browser automation can use `browser_subagent` when needed.
- Skill references are local to `tooling/agent/skills`.

## Update

Re-run the CLI init with `--force` to update, then rerun validation:

```bash
bash tooling/agent/tests/run-tests.sh
```
