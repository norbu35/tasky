# Remediated Design: Agent-Skill-Augmented Governance

**Date:** 2026-04-23
**Status:** Reviewed and remediated design for follow-on implementation

## Review findings

1. The current-state diagrams overstated automation.
   - `quality-gates.yml` runs on pushes to `staging` and `main` plus `workflow_dispatch`, not every PR.
   - `nightly-regression.yml` and `nightly-mobile.yml` are manual `workflow_dispatch` workflows right now.
   - `release-gate.yml` includes rollback, web/mobile smoke, security, and scenario regression jobs; it is not only migrations and performance.
2. The repo already validates part of the design surface.
   - `docs/design/component-contract.yaml` is already covered by `validate-design-contracts.py`.
   - The unchecked gap is the screen, journey, and lifecycle docs, not all of `docs/design/*.yaml`.
3. The original proposal duplicated canonical owners.
   - PRD ripple already belongs to `tooling/skills/intake-to-prd/SKILL.md`.
   - Doc-claim repair already belongs to `tooling/skills/doc-claims-remediation/SKILL.md`.
4. Removing `validate-doc-claims.py` prose coverage entirely is too risky for v1.
   - The current doc-claims lane already passes on this repo.
   - A claim-block-only gate would weaken passive drift detection until every live assertion is manually converted.
5. The proposed lifecycle/code parity checks were not grounded in the current source-of-truth surfaces.
   - `tooling/config/expected-schema.json` tracks table and column inventories, not enum or state vocabularies.
   - `docs/design/journey-catalog.yaml` currently stores lifecycle refs as mixed free text such as `USER-T02 or USER-T04`, so strict validation needs either tolerant parsing or schema normalization first.
6. New doc checks should plug into the canonical docs lane.
   - `repo:docs:check` already owns documentation validation and is called from `verify:cleanup`.
   - Adding design checks directly to `check-cleanup-gate.sh` would split the docs story across two places.

## Design principles

- Keep current-state docs truthful to checked-in automation.
- Extend existing skills before creating overlapping new ones.
- Keep blocking gates deterministic; heuristics can assist but should not block until their signal is proven.
- Keep documentation validation inside `repo:docs:check`.
- Normalize or tolerate current YAML shapes before adding strict semantic enforcement.

## Target state

| Concern                                             | Canonical owner after implementation                                    | Blocking vs. report-only                              | Why                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| PRD ripple after `docs/PRD.md` edits                | Existing `intake-to-prd` skill, augmented with a diff helper            | Skill-required output, not a new CI gate in v1        | Avoid duplicate skill ownership                                  |
| Doc-claims repair and proactive claim authoring     | Existing `doc-claims-remediation` skill, augmented with an audit helper | Blocking validator stays; audit helper is report-only | Preserve passive drift detection while improving author workflow |
| Design navigation, journey, and lifecycle structure | New deterministic `repo:design:check` wired into `repo:docs:check`      | Blocking                                              | These are doc-structure checks and belong in the docs lane       |
| Scenario fidelity triage                            | New `scenario-fidelity` skill plus helper script                        | Report-only in v1                                     | Current signals are heuristic and should not block yet           |

## Change A — Narrow `validate-doc-claims.py`; do not strip it in v1

**Decision:** keep the blocking validator, keep claim-block parsing, and reduce the highest-noise heuristic extraction instead of deleting prose validation outright.

### Keep

- claim-block parsing and all inventory builders
- blocking `pnpm repo:docs:claims` and `pnpm repo:docs:check`
- `tooling/skills/doc-claims-remediation/SKILL.md` as the canonical repair workflow
- `tooling/config/doc-references-allowlist.yaml`, but shrink it toward intentional and historical references only

### Change

- reduce the prose extraction surface to high-signal references only
- use claim blocks for exact or ambiguous assertions that should survive refactors
- retire per-file suppressions opportunistically as docs gain claim blocks or clearer prose
- add audit tooling that helps authors discover where a claim block would add value without turning that audit into a blocker

### Do not do in v1

- do not make claim blocks the only blocking mechanism
- do not delete the allowlist file outright
- do not fork doc-claims repair into a second skill with overlapping responsibility

### Acceptance

- `pnpm repo:docs:claims` still catches stale live references after the change
- `pnpm repo:docs:claims:triage` remains green on the repo after the narrowing work
- allowlist entries are limited to intentional external, historical, or otherwise unavoidable cases

## Change B — Extend `doc-claims-remediation` with an audit helper

**Location:** keep the existing skill at `tooling/skills/doc-claims-remediation/` and add a bundled helper such as `scripts/audit_unclaimed_refs.py`.

**Purpose:** proactive author assistance, not a replacement for the blocking validator.

### Helper behavior

- scan the same files as `validate-doc-claims.py`
- emit candidate references that are likely load-bearing and currently rely on prose extraction alone
- output machine-readable JSON so an agent can review candidates in order
- never fail CI; exit 0 unless the helper itself crashes

### Skill workflow update

1. Run `pnpm repo:docs:claims:triage` if the blocking validator failed.
2. Run `pnpm repo:docs:claims:audit` when editing architecture, maintenance, or backend module `AGENTS.md` docs and you want proactive claim-block suggestions.
3. Fix stale prose first.
4. Add claim blocks where the assertion is load-bearing and exactness matters.
5. Touch the allowlist only for intentional external, historical, or otherwise unavoidable references.
6. Re-run `pnpm repo:docs:check` or `pnpm repo:docs:claims`.

### Why this replaces the earlier `doc-claims-semantic` proposal

The repo already has a canonical doc-claims repair skill. Extending it keeps the workflow discoverable and avoids two skills owning the same failure mode.

## Change C — Extend `intake-to-prd` with a PRD ripple helper

**Location:** keep the existing skill at `tooling/skills/intake-to-prd/` and add a bundled helper such as `scripts/extract_prd_diff_ids.py`.

**Purpose:** formalize the PRD ripple review that the skill already owns.

### Helper behavior

- accept `--staged` and branch-diff modes such as `--base <ref>` and `--head <ref>`
- extract changed `REQ-P1-*` and `NFR-*` IDs from a PRD diff
- output JSON with `{added, modified, removed}`
- return success with empty sets when no requirement IDs changed

### Skill workflow update

For each changed or added ID, require a review of:

- `tests/scenarios/*.md`
- `docs/maintenance/*.md`
- `docs/architecture/*.md`
- `docs/openapi/**` when contract behavior is implicated
- `docs/design/**` when user flow or lifecycle behavior changed
- launch-facing copy or status matrices if the behavior is publicly claimed

### Required output

The skill should produce a short per-ID ripple table with one of:

- `aligned`
- `update required`
- `out of scope for this PR`

### Why this replaces the earlier `prd-ripple-check` proposal

`intake-to-prd` is already the governing skill for PRD-first routing. A second skill would duplicate responsibility and make the discovery path worse.

## Change D — Add design structural validation for navigation and lifecycle docs

**New command:** `pnpm repo:design:check`

**Canonical integration point:** append it to `pnpm repo:docs:check`, next to `validate-design-contracts.py`.

Do not wire it directly into `check-cleanup-gate.sh`; `verify:cleanup` already reaches docs validation through `repo:docs:check`.

### Scope

This fills the gap on these active design docs:

- `docs/design/screen-graph.yaml`
- `docs/design/journey-catalog.yaml`
- `docs/design/domain-lifecycles.yaml`

It does not replace the existing `validate-design-contracts.py` coverage on `docs/design/component-contract.yaml`.

### Deterministic checks

#### `check_screen_graph.py`

- every node key is unique
- every edge `to:` target resolves to a defined node
- required fields such as `label` and `edges` have the expected shape

#### `check_journeys.py`

- every `entry` and `exit` screen resolves to `screen-graph.yaml`
- every `happy_path[].screen` resolves
- every `alternate_paths[].screens[]` resolves
- lifecycle references are extracted from the current free-form strings and resolved against transition IDs in `domain-lifecycles.yaml`
- unparseable lifecycle strings warn with precise file locations so the catalog can be normalized later

#### `check_lifecycles.py`

- entity keys are unique
- `states`, `initial`, and `terminal` are self-consistent
- every transition `id` is unique
- every transition `source` and `target` is either null or a defined state in the same entity
- active transitions declare a `phase`

### Do not do in v1

- do not fail CI on fuzzy "trigger matches code event name" checks
- do not claim DB enum parity from `expected-schema.json`
- do not require a schema rewrite of `journey-catalog.yaml` before shipping the first validator pass

### Optional semantic layer

A new `design-surface-drift` skill may run after the deterministic checks. It can review code or scenario alignment and produce findings, but that semantic pass should be report-only in v1.

## Change E — Add `scenario-fidelity` as heuristic triage, not a gate

**Location:** `tooling/skills/scenario-fidelity/` plus a helper script such as `scripts/find_weak_coverage.py`.

**Purpose:** find likely weak tests behind `status: covered`, without claiming perfect proof of behavioral coverage.

### Candidate signals

Use a combination of:

- scenario is `covered`
- domain mutation data is low, stale, or missing for the scenario risk tier
- assertion count in the matched test method is suspiciously low relative to `Then` and `And` lines
- test body is mostly interaction verification with little state or output assertion coverage

### Output

Emit report-only JSON with the scenario ID, matched test method, signal(s), and why the scenario is a candidate.

### CI posture

- manual and local use first
- optional nightly informational step after the report is proven useful
- no blocking CI integration in v1

## AGENTS and inventory updates after implementation

- `tooling/skills/AGENTS.md`
  - add `design-surface-drift`
  - add `scenario-fidelity`
  - expand the existing entries for `doc-claims-remediation` and `intake-to-prd` to mention their new helpers
- `tooling/AGENTS.md`
  - add `repo:design:check`
  - add `repo:docs:claims:audit`
  - add `repo:prd:diff-ids`
  - add `verify:scenario:fidelity`
- root `AGENTS.md`
  - after implementation, mention the new helper expectations only once the scripts and skills actually exist

## Non-goals

- No new blocking heuristic gate in CI.
- No deletion of the allowlist in v1.
- No new standalone skill for work already owned by `intake-to-prd` or `doc-claims-remediation`.
- No direct event-name or enum-name parity enforcement between design docs and runtime code in blocking CI.

## Phased implementation order

| Phase | Work                                                                                            | Notes                                      |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1     | Add `repo:design:check` and integrate it into `repo:docs:check`                                 | Highest-value deterministic gap            |
| 2     | Extend `intake-to-prd` with PRD diff helper and ripple table output                             | Reuses existing owner                      |
| 3     | Extend `doc-claims-remediation` with audit helper and narrow `validate-doc-claims.py` carefully | Keep the blocking validator intact         |
| 4     | Add `scenario-fidelity` as report-only triage                                                   | Manual and nightly informational only      |
| 5     | Re-evaluate further `validate-doc-claims.py` simplification after usage data                    | Optional follow-up, not part of v1 success |

## Full acceptance criteria

- `pnpm repo:design:check` exists, validates the three navigation and lifecycle design docs, and is called from `pnpm repo:docs:check`.
- `pnpm repo:docs:claims` remains a blocking validator and still passes on the repo.
- `pnpm repo:docs:claims:audit` exists, exits 0, and emits JSON candidates.
- `pnpm repo:prd:diff-ids` exists, supports staged and branch diff modes, and emits `{added, modified, removed}` JSON.
- `tooling/skills/intake-to-prd/SKILL.md` and `tooling/skills/doc-claims-remediation/SKILL.md` document the new helper steps.
- `tooling/skills/AGENTS.md` and `tooling/AGENTS.md` reflect the new commands and skill inventory.
- `pnpm verify:scenario:fidelity` exists as a report-only command; it is not part of blocking pre-push or merge CI in v1.

## Related diagrams

See `docs/ops/diagrams/` for the corrected current-state and proposed-state diagrams that align with this remediated design.
