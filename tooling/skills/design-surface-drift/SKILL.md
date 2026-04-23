---
name: design-surface-drift
description: Deterministic structural validation for design navigation, journey, and lifecycle docs. Use when editing docs/design/screen-graph.yaml, docs/design/journey-catalog.yaml, or docs/design/domain-lifecycles.yaml. Runs as part of pnpm repo:docs:check.
---

# Design Surface Drift

Use this skill to validate the structural integrity of design navigation and lifecycle documents.

## Quick Start

Run all three checks:

```bash
pnpm repo:design:check
```

Individual checks:

```bash
python3 tooling/skills/design-surface-drift/scripts/check_screen_graph.py
python3 tooling/skills/design-surface-drift/scripts/check_journeys.py
python3 tooling/skills/design-surface-drift/scripts/check_lifecycles.py
```

## What It Checks

### screen-graph.yaml

- `nodes` mapping exists
- no duplicate node IDs
- every node has a `label`
- every `edges` list has valid `to:` targets pointing to defined nodes
- deep link and tab bar roots resolve to defined nodes
- screen IDs follow SCR-[PREFIX]-NNN convention

### journey-catalog.yaml

- `journeys` list exists
- journey `entry` and `exit` screens resolve to screen-graph.yaml
- `happy_path` screens resolve
- `alternate_paths` screens resolve
- lifecycle references (e.g., `USER-T02 or USER-T04`) are extracted with tolerant regex and resolved against domain-lifecycles.yaml
- unparseable lifecycle strings produce warnings, not failures

### domain-lifecycles.yaml

- `entities` mapping exists
- no duplicate entity keys or transition IDs
- `initial` and `terminal` values are self-consistent with `states`
- transition `source`/`target` are null or defined in the same entity's `states`
- active transitions declare `phase`
- transition IDs follow [PREFIX]-TNN convention

## Identifier Conventions

These follow the repo identifier-consistency audit:

| Kind       | Pattern            | Example            |
| ---------- | ------------------ | ------------------ |
| Screen     | `SCR-[A-Z]+-\d{3}` | SCR-CUST-001       |
| Journey    | `JRN-[A-Z]+-\d{2}` | JRN-CUST-01        |
| Transition | `[A-Z]+-T\d{2}`    | TASK-T01, BOOK-T07 |

## Guard Rails

- Do not add semantic code-parity checks (event names, DB enums) to the blocking gate in v1.
- Keep the parsers tolerant of free-form lifecycle strings in journey-catalog.yaml.
- Warnings do not fail CI; only structural failures do.

## When to Use This Skill

- After editing any file in `docs/design/*.yaml`
- When `pnpm repo:docs:check` fails on a design check
- When adding new screens, journeys, or lifecycle transitions
