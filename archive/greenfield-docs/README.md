# Greenfield Archive

This directory preserves planning and execution artifacts from the earlier greenfield-agent phase.

## Purpose

- Keep historical design/planning context without treating it as active implementation guidance.
- Prevent legacy plan/spec paths from competing with live maintenance docs under `docs/`.
- Preserve traceability for audits and archaeology.

## Contents

- `docs/superpowers/plans/` — superseded execution plans from greenfield refresh work.
- `docs/superpowers/specs/` — superseded design specs tied to those plans.
- `docs/design/prompts/` — archived generated prompt outputs and manifest snapshots.
- `docs/debates/` — archived tradeoff-analysis notes from the greenfield phase.
- `docs/ideas/` — archived idea scratchpads and exploration notes.
- `docs/quality/` — archived dated audit snapshots that no longer belong in the live control surface.
- `../legacy-task-system/` — archived task queue and task runner workflow.

## Usage Rules

- Treat archive files as historical reference only.
- Do not add new active requirements to archive paths.
- For current work, use:
  - `docs/maintenance/OPERATING_MODEL.md`
  - `docs/plans/`
  - `docs/ARCHITECTURE.md`
  - `docs/API.yaml`
