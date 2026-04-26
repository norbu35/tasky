# Documentation Governance

This document defines the live documentation structure for the repository. It is enforced by `tooling/scripts/governance/check-doc-governance.py`.

## Document classes

| Class      | Purpose                                                           | Typical surfaces                                                                                           |
| ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Governing  | Product, strategy, rollout, and operating policy                  | `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, selected `docs/maintenance/*.md` |
| Derived    | Active implementation design and UX detail for the current phase  | `docs/architecture/*.md`, `docs/BRAND.md`, active `docs/design/**`, active `docs/openapi/**`               |
| Generated  | Bundled or machine-produced output from another maintained source | `docs/API.yaml`, `docs/maintenance/generated/OPS_INVENTORY.md`                                             |
| Router     | Entry points that send readers to the smallest relevant document  | `apps/*/AGENTS.md`, `services/api/AGENTS.md`, `docs/openapi/AGENTS.md`                                     |
| Ephemeral  | Human sketches that may aid discussion but do not define gates    | `docs/ops/diagrams/**`                                                                                     |
| Historical | Archived material kept for reference only                         | `archive/**`, `docs/audits/**`                                                                             |

## Precedence

When active documents conflict, read them in this order:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md`
4. relevant `docs/maintenance/*.md`
5. `docs/architecture/*.md`
6. `docs/openapi/openapi.yaml`
7. `docs/BRAND.md` and active `docs/design/**`

Lower-order documents must be corrected when they drift.

## Rules

1. `AGENTS.md` is the repo-level entry point for working instructions.
2. Product behavior belongs in `docs/PRD.md`.
3. Market posture belongs in `docs/STRATEGY.md`.
4. Future rollout intent belongs in `docs/ROLLOUT_PHASES.md`.
5. Active architecture, design, and API docs must describe the current phase only.
6. Future technical detail must not stay in the active derivative path once that phase is deferred again.
7. If future material is worth keeping, move it to `archive/**` instead of leaving it mixed into active docs.
8. Active documents must not rely on `archive/**` for authority.
9. `docs/openapi/**` is the maintained active API contract source; `docs/API.yaml` is the bundled output and must be refreshed in the same change.
10. Do not use an ADR system in the live docs path until the team deliberately adopts one.
11. `docs/ops/diagrams/**` are ephemeral sketches. Do not use them as validation inputs or source-of-truth surfaces.
12. `docs/maintenance/generated/OPS_INVENTORY.md` is generated from `tooling/config/ops-registry.yaml`; refresh it with `pnpm repo:ops:sync --fix`.

## Machine-Checked Claims

Architecture docs, maintenance docs, and backend module `AGENTS.md` files are also checked by
`tooling/scripts/governance/validate-doc-claims.py`.

The validator cross-checks named repo surfaces against live inventories, including:

- PRD requirement IDs from `docs/PRD.md`
- Java classes and FQNs under `services/api/src/{main,test}/java`
- DB tables and columns from `tooling/config/expected-schema.json`
- env vars from root `.env*.example` files and app-level `apps/*/.env*.example` files
- config keys from `application*.yml` plus code-backed property declarations
- OpenAPI operationIds and method/path pairs from the bundled API contract
- Flyway migration versions/files
- GitHub workflow filenames

Use claim blocks when a load-bearing assertion is too specific for convention-based extraction:

````md
```claim symbol-exists
class: mn.tasky.common.outbox.DomainEventOutboxService
method: publish
```

```claim db-table
table: domain_outbox_events
required_columns: [id, event_type, payload, status, attempts, created_at]
```

```claim prd-req
id: REQ-P1-BOOK-01
```
````

Supported claim types:

- `prd-req`
- `symbol-exists`
- `db-table`
- `env-var`
- `endpoint`
- `config-key`
- `flyway`
- `workflow`

Scenario files are additionally checked by `tooling/scripts/governance/validate-prd-scenario-links.py`.
Every `tests/scenarios/*.md` `**PRD:**` reference must resolve to a live PRD ID, and the check warns when a
non-deferred `REQ-P1-*` requirement has no high-or-critical scenario coverage.

OpenAPI rollout scope is checked by `tooling/scripts/contracts/validate-openapi-phase.mjs`.
Any deferred path or schema in `docs/openapi/**` must declare `x-tasky-status: deferred` and `x-tasky-phase`, and
active architecture/scenario docs must not reference non-Phase-1 OpenAPI surfaces.

Design component drift is checked by `tooling/scripts/governance/validate-design-contracts.py`.
Implemented component entries in `docs/design/component-contract.yaml` must point at an exported component; future
component entries and prop mismatches are reported as warnings until their implementation path is active.

Screen-spec traceability is checked by `tooling/scripts/governance/validate-screen-spec-traceability.py`.
Every active `docs/design/screen-specs/SCR-*.yaml` file must include a `traceability` block tying the screen spec to:

- a `screen_graph_node` that matches the spec's `screen_id` and resolves in `docs/design/screen-graph.yaml`
- live `REQ-P1-*` / `NFR-*` IDs from `docs/PRD.md`
- `JRN-*`, `JRN-*:step-N`, alternate-path IDs, or journey `paths[].id` refs from `docs/design/journey-catalog.yaml`
- existing `SCN-*` IDs from `tests/registry.yaml` when scenario-backed coverage exists

`traceability.status: pending_audit` is allowed only for explicitly scoped follow-up audits. New or materially changed
screen specs should use `validated`, which requires at least one PRD ref and one journey ref.

Design navigation and lifecycle structure is checked by `pnpm repo:design:check`, which runs three validators:

- `tooling/skills/design-surface-drift/scripts/check_screen_graph.py` — node uniqueness, edge resolution, deep link and tab bar root validation
- `tooling/skills/design-surface-drift/scripts/check_journeys.py` — cross-validates screens against screen-graph, lifecycle refs against domain-lifecycles
- `tooling/skills/design-surface-drift/scripts/check_lifecycles.py` — entity/transition uniqueness, state self-consistency, phase enforcement

These run as part of `pnpm repo:docs:check` and are blocking. Use `tooling/skills/design-surface-drift/SKILL.md` when editing `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml`, or when one of those validators fails.

False positives and intentional historical references belong in
`tooling/config/doc-references-allowlist.yaml`.

Agent-facing remediation workflows live in repo-owned skills:

- `tooling/skills/doc-claims-remediation/SKILL.md` — for validator failures and proactive audit.
  Use `pnpm repo:docs:claims:triage` for grouped failure summary when the validator fails, and `pnpm repo:docs:claims:audit` for proactive discovery while editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces.
- `tooling/skills/intake-to-prd/SKILL.md` — for PRD-first routing and ripple review.
  Use the narrowest matching `pnpm repo:prd:diff-ids` mode for the current workflow state (`--staged` only when the PRD delta is actually staged).
- `tooling/skills/design-surface-drift/SKILL.md` — for structural validation of `screen-graph.yaml`, `journey-catalog.yaml`, and `domain-lifecycles.yaml`.
- `tooling/skills/scenario-fidelity/SKILL.md` — for report-only weak-test triage after writing or strengthening scenario-linked tests; any nightly use must stay non-blocking.

Allowlist rules:

- Prefer fixing the doc or adding a claim block before suppressing a reference.
- Use `intentional` entries only for deliberate historical or external references.
- Every intentional suppression should include a reason.
- Add `expires` for temporary suppressions so they are re-justified later.
- Expired entries warn for 30 days, then fail the check.

## Review checklist

- Does this change introduce a second document that tries to own the same topic?
- Does it keep governing docs above derived docs in the discovery path?
- Does any architecture, design, or API doc describe a future phase as if it were live?
- If content became future-only or historical, was it moved out of the active reading path?
- If OpenAPI changed, were both `docs/openapi/**` and `docs/API.yaml` updated together?
- If a doc names a code/config/schema surface, does it resolve under `validate-doc-claims.py` without a stale suppress entry?
- If `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml` changed, does `pnpm repo:design:check` still pass?
- If `docs/design/screen-specs/SCR-*.yaml` changed, does `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` pass, and does every materially touched spec remain `validated`?
- If `docs/PRD.md` changed, were affected scenarios, architecture, maintenance, design, and contract surfaces reviewed (use `pnpm repo:prd:diff-ids`)?
