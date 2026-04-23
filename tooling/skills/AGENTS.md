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
  Use when `validate-doc-claims.py` fails or when editing architecture / maintenance docs or backend module `AGENTS.md` files that name code, schema, config, or contract surfaces.

## Rules

- Prefer deterministic helpers bundled with the skill over re-deriving the same workflow each time.
- Keep skill bodies concise; move detail into bundled scripts or references only when needed.
- Do not make a repo skill depend on a specific vendor's skill runtime.
