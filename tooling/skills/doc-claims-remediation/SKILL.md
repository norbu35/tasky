---
name: doc-claims-remediation
description: Use when `tooling/scripts/governance/validate-doc-claims.py` fails, or when editing `docs/architecture/**`, `docs/maintenance/**`, or backend module `AGENTS.md` files that name code, schema, config, workflow, or API surfaces. This skill provides a deterministic repair workflow that works even in harnesses without native skill support.
---

# Doc Claims Remediation

Use this skill to repair doc-surface drift without weakening the validator.
Trigger it in two cases:

- Reactively, when `validate-doc-claims.py` fails.
- Proactively, when editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces.

Do not route generic prose cleanup here unless the doc names code, schema, env vars, config keys, endpoints, Flyway migrations, or workflows that the validator is expected to track.

## Quick Start

1. Run `pnpm repo:docs:claims:triage` for a grouped summary.
2. If needed, inspect raw failures with `pnpm repo:docs:claims --json`.
3. Fix the doc first.
4. Add a `claim` block when the assertion is load-bearing and too specific for heuristic extraction.
5. Touch `tooling/config/doc-references-allowlist.yaml` only for genuine false positives or intentional historical/external references.
6. Re-run `pnpm repo:docs:check` or `pnpm verify:cleanup`.

## Decision Order

- Fix the prose when the doc is stale.
- Add or tighten a `claim` block when the prose is correct but the validator needs structured help.
- Update source-of-truth artifacts if the doc is correct and the inventory is stale.
- Add allowlist entries only for:
  - external frameworks or JDK/Spring types
  - intentional historical names quoted for migration context
  - unavoidable per-file prose false positives

## Source of Truth by Surface

- Java symbols: `services/api/src/{main,test}/java`
- DB tables and columns: `tooling/config/expected-schema.json`
- env vars: `.env*.example`
- config keys: `application*.yml` plus `@Value` / `@ConditionalOnProperty` usage in backend code
- endpoints: `docs/openapi/openapi.yaml` and bundled `docs/API.yaml`
- Flyway: `services/api/src/main/resources/db/migration`
- workflows: `.github/workflows/*.yml`

## Claim Blocks

Use fenced `claim` blocks for exact checks such as methods, fields, required columns, endpoint method/path, or workflow triggers.

Supported claim types are documented in `docs/maintenance/DOCUMENTATION_GOVERNANCE.md`.

## Guard Rails

- Do not suppress a live mismatch just to make CI pass.
- If a doc describes deferred or historical behavior as active, remove or rewrite it instead of allowlisting it.
- Prefer short-lived allowlist entries with `reason` and `expires`.
- If a failure implies product or contract disagreement rather than name drift, escalate instead of auto-fixing.

## Bundled Helpers

- `scripts/triage_doc_claims.py`
  Runs the validator in JSON mode, groups failures by file and surface kind, and prints the recommended repair order.

- `scripts/audit_unclaimed_refs.py`
  Proactive authoring aid that scans the same files as the blocking validator and emits candidate references that look load-bearing but currently lack a nearby claim block. Output is JSON with `file`, `line`, `candidate`, and `kind_guess`. Always exits 0.

  ```bash
  pnpm repo:docs:claims:audit
  ```

## Proactive Audit Workflow

When editing architecture, maintenance, or backend module `AGENTS.md` docs:

1. Run `pnpm repo:docs:claims:audit` to find load-bearing references without claim blocks.
2. Fix stale prose first.
3. Add claim blocks where the assertion is load-bearing and exactness matters.
4. Touch the allowlist only for intentional external, historical, or otherwise unavoidable references.
5. Re-run `pnpm repo:docs:check` or `pnpm repo:docs:claims`.
