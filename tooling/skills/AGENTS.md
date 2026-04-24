---
description: Index file for the tooling package
---

# Tasky Repo Skills

Use this file when the task touches `tooling/skills/**`.

## Purpose

Repo skills are harness-agnostic agent workflows stored in the repository.

- Treat each `SKILL.md` as canonical workflow guidance.
- If the harness supports native skill loading, load the relevant `SKILL.md`.
- If the harness does not support skills, read the `SKILL.md` directly and use any bundled scripts.
- Keep harness-specific bootstrap or UI metadata in adapter files, not in the skill body.

## Current Skills

- `tooling/skills/doc-claims-remediation/SKILL.md`
  Use reactively when `validate-doc-claims.py` fails, or proactively when editing architecture / maintenance docs or backend module `AGENTS.md` files that name live code, schema, config, workflow, or contract surfaces. Includes a proactive audit helper (`pnpm repo:docs:claims:audit`) for discovering load-bearing references that lack claim blocks.
- `tooling/skills/intake-to-prd/SKILL.md`
  Use when a request, bug, or execution brief may change product behavior and needs deterministic PRD-first routing. Includes a PRD diff helper (`pnpm repo:prd:diff-ids`) that extracts changed requirement IDs from the narrowest matching git diff for the current workflow state.
- `tooling/skills/design-surface-drift/SKILL.md`
  Use when editing `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml`, or when `pnpm repo:design:check` / `pnpm repo:docs:check` fails on one of those structural validators. Do not route unrelated design-doc work here by default.
- `tooling/skills/scenario-fidelity/SKILL.md`
  Report-only triage for likely weak tests behind covered scenarios. Use `pnpm verify:scenario:fidelity` after writing or strengthening scenario-linked tests, or before proposing non-blocking nightly wiring. Not a blocking gate in v1.

## Rules

- Prefer deterministic helpers bundled with the skill over re-deriving the same workflow each time.
- Keep skill bodies concise; move detail into bundled scripts or references only when needed.
- Do not make a repo skill depend on a specific vendor's skill runtime.
