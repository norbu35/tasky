# Implementation Spec: Agent-Skill-Augmented Governance

**Date:** 2026-04-23
**Status:** Ready for planning and implementation by a follow-on agent
**Source design:** `docs/plans/agent-skill-augmented-governance.md`

## Objective

Implement the remediated governance design without weakening existing blocking coverage. The result should improve autonomous workflow quality in four concrete places:

1. deterministic validation of design navigation, journey, and lifecycle docs
2. formal PRD ripple review inside the existing `intake-to-prd` workflow
3. proactive doc-claims auditing inside the existing `doc-claims-remediation` workflow
4. report-only scenario fidelity triage for likely weak tests

## Governing constraints

- Blocking CI and pre-push checks must remain deterministic.
- Documentation validation belongs in `repo:docs:check`, which is already called by `verify:cleanup`.
- Repo skills must stay harness-agnostic and live under `tooling/skills/**`.
- Do not create a second skill for work already owned by `intake-to-prd` or `doc-claims-remediation`.
- Do not edit `tests/scenarios/**` as part of this slice unless the user explicitly assigns scenario curation to the implementing agent.
- Do not weaken `pnpm repo:docs:claims` to claim-block-only coverage in this implementation slice.

## Deliverables

### D1. Design structural validation

Create a new command and wire it into the docs lane:

- new script entrypoint: `pnpm repo:design:check`
- new deterministic scripts under `tooling/skills/design-surface-drift/scripts/`
- `pnpm repo:docs:check` updated to call `pnpm repo:design:check`
- `tooling/skills/design-surface-drift/SKILL.md`

### D2. PRD ripple helper inside `intake-to-prd`

Add a bundled helper under the existing skill:

- `tooling/skills/intake-to-prd/scripts/extract_prd_diff_ids.py`
- new command alias: `pnpm repo:prd:diff-ids`
- `tooling/skills/intake-to-prd/SKILL.md` updated with helper usage and required ripple table output

### D3. Doc-claims audit helper inside `doc-claims-remediation`

Add a bundled helper under the existing skill:

- `tooling/skills/doc-claims-remediation/scripts/audit_unclaimed_refs.py`
- new command alias: `pnpm repo:docs:claims:audit`
- `tooling/skills/doc-claims-remediation/SKILL.md` updated to distinguish blocking repair vs. proactive audit
- optional narrowing of `validate-doc-claims.py` only if the implementing agent can prove no regression in repo coverage

### D4. Scenario fidelity triage

Add a report-only helper:

- `tooling/skills/scenario-fidelity/SKILL.md`
- `tooling/skills/scenario-fidelity/scripts/find_weak_coverage.py`
- new command alias: `pnpm verify:scenario:fidelity`
- optional nightly informational workflow step only after the command is locally useful and stable

### D5. Inventory and docs updates

Update the living skill and tooling inventories:

- `tooling/skills/AGENTS.md`
- `tooling/AGENTS.md`
- root `package.json`

Do not update root `AGENTS.md` until the commands and skills are actually present.

## Work packages

## WP1 — `repo:design:check`

### Files

Create:

- `tooling/skills/design-surface-drift/SKILL.md`
- `tooling/skills/design-surface-drift/scripts/check_screen_graph.py`
- `tooling/skills/design-surface-drift/scripts/check_journeys.py`
- `tooling/skills/design-surface-drift/scripts/check_lifecycles.py`

Edit:

- `package.json`
- `tooling/skills/AGENTS.md`
- `tooling/AGENTS.md`

### Required behavior

#### `check_screen_graph.py`

Input:

- `docs/design/screen-graph.yaml`

Fail on:

- missing top-level `nodes`
- duplicate node IDs
- node entries without `label`
- `edges` not being a list
- any edge `to:` target not present in `nodes`

Output:

- human-readable `file:node` failures on stderr/stdout
- exit 1 on structural failures, 0 otherwise

#### `check_journeys.py`

Inputs:

- `docs/design/journey-catalog.yaml`
- `docs/design/screen-graph.yaml`
- `docs/design/domain-lifecycles.yaml`

Fail on:

- missing `journeys`
- journey `entry` or `exit` screen IDs missing from `screen-graph.yaml`
- `happy_path[].screen` missing from `screen-graph.yaml`
- `alternate_paths[].screens[]` missing from `screen-graph.yaml`
- parsed lifecycle IDs missing from `domain-lifecycles.yaml`

Warn on:

- lifecycle strings that contain free text but no parseable `X-TNN` token
- `next` values that are not screen IDs and cannot be structurally validated

Parsing rule:

- extract lifecycle IDs with a tolerant regex such as `\b[A-Z]+-T\d+\b`
- support mixed strings like `USER-T02 or USER-T04` and `BOOK-T08 (...) or BOOK-T09 (...)`

#### `check_lifecycles.py`

Input:

- `docs/design/domain-lifecycles.yaml`

Fail on:

- missing top-level `entities`
- duplicate entity keys
- duplicate transition IDs across the full file
- `initial` not present in `states`
- `terminal[]` values not present in `states`
- transition `source` or `target` values that are neither `null` nor present in the same entity's `states`
- missing `phase` on active transitions
- malformed transition entries without `id`, `trigger`, `source`, or `target`

Do not implement in WP1:

- schema enum parity
- runtime event-name parity
- validation against Java symbol names

### Integration

- add `repo:design:check` to `package.json`
- append `pnpm repo:design:check` inside `repo:docs:check`, next to `validate-design-contracts.py`
- do not add it separately to `check-cleanup-gate.sh`

### Verification

Run:

```bash
pnpm repo:design:check
pnpm repo:docs:check
pnpm verify:cleanup
```

## WP2 — PRD ripple helper under `intake-to-prd`

### Files

Create:

- `tooling/skills/intake-to-prd/scripts/extract_prd_diff_ids.py`

Edit:

- `tooling/skills/intake-to-prd/SKILL.md`
- `package.json`
- `tooling/skills/AGENTS.md` only if the skill entry needs updated wording
- `tooling/AGENTS.md`

### CLI contract

Support:

- `--staged`
- `--base <git-ref>`
- `--head <git-ref>`
- default behavior that falls back to a sensible local diff such as `HEAD~1..HEAD`

Output JSON:

```json
{
  "added": ["REQ-P1-FOO-01"],
  "modified": ["REQ-P1-BAR-02"],
  "removed": []
}
```

### Skill update

Add a required step after PRD edits:

1. run `pnpm repo:prd:diff-ids ...`
2. for each changed ID, review maintenance, architecture, scenarios, openapi, and design as applicable
3. produce a per-ID ripple table with `aligned`, `update required`, or `out of scope for this PR`

### Verification

Run:

```bash
pnpm repo:prd:diff-ids --staged
pnpm repo:prd:diff-ids --base origin/staging --head HEAD
```

The command must exit 0 even when no IDs changed.

## WP3 — Doc-claims audit helper under `doc-claims-remediation`

### Files

Create:

- `tooling/skills/doc-claims-remediation/scripts/audit_unclaimed_refs.py`

Edit:

- `tooling/skills/doc-claims-remediation/SKILL.md`
- `package.json`
- `tooling/AGENTS.md`
- `tooling/skills/AGENTS.md` only if the skill entry wording changes

Optional edit, only if safely proven:

- `tooling/scripts/governance/validate-doc-claims.py`

### Helper behavior

- scan the same files as `validate-doc-claims.py`
- emit candidate references that look load-bearing and currently lack a nearby claim block
- provide `file`, `line`, `candidate`, and `kind_guess`
- exit 0 on success

### Scope guard

This helper must not replace the blocking validator. It is an authoring aid.

### Optional narrowing of `validate-doc-claims.py`

If the implementing agent chooses to narrow heuristic extraction in the same slice, require all of the following:

- no drop in `pnpm repo:docs:claims` pass behavior on the repo
- `pnpm repo:docs:claims:triage` still passes
- no deletion of the allowlist file in this slice
- no silent reduction to claim-block-only coverage

If those proofs are not easy to produce, defer the narrowing and ship the audit helper alone.

### Verification

Run:

```bash
pnpm repo:docs:claims
pnpm repo:docs:claims:triage
pnpm repo:docs:claims:audit
```

## WP4 — Scenario fidelity triage

### Files

Create:

- `tooling/skills/scenario-fidelity/SKILL.md`
- `tooling/skills/scenario-fidelity/scripts/find_weak_coverage.py`

Edit:

- `package.json`
- `tooling/skills/AGENTS.md`
- `tooling/AGENTS.md`
- optionally `.github/workflows/nightly-regression.yml`

### Data sources

- `tests/registry.yaml`
- `tests/scenarios/*.md`
- `services/api/src/test/java/**`
- optional PIT freshness and domain kill-rate signals already present in `registry.yaml`

### Candidate selection

Do not key only on `mutation_kill_rate == 0` or `null`.

Use a broader report-only heuristic such as:

- scenario `status == covered`
- test method for the scenario exists
- one or more of:
  - domain mutation data is low for the scenario risk tier
  - domain mutation data is missing or stale
  - assertion count is low relative to `Then`/`And` count
  - test body mostly performs interaction verification

### Output

JSON objects like:

```json
{
  "scenario_id": "SCN-BOOK-001",
  "domain": "booking",
  "test_file": "services/api/src/test/java/.../BookingScenarioTests.java",
  "test_method": "customerCancelsEarly_noIncident",
  "signals": ["assertion_scarcity", "low_domain_mutation"],
  "then_count": 3,
  "assertion_count": 1
}
```

### CI posture

- keep the command report-only
- if added to `nightly-regression.yml`, the step must not fail the workflow
- do not add it to `verify:scenario:smoke`, `verify:cleanup`, or pre-push in this slice

### Verification

Run:

```bash
pnpm verify:scenario:fidelity
```

If wired into nightly, verify that the step is informational only.

## WP5 — Inventory updates

### `package.json`

Add scripts for:

- `repo:design:check`
- `repo:prd:diff-ids`
- `repo:docs:claims:audit`
- `verify:scenario:fidelity`

### `tooling/skills/AGENTS.md`

Update the inventory so it reflects:

- `design-surface-drift` as a new skill
- `scenario-fidelity` as a new skill
- `doc-claims-remediation` now includes triage plus audit
- `intake-to-prd` now includes the PRD diff helper

### `tooling/AGENTS.md`

Update:

- lane inventory
- tooling inventory table
- verification table

Keep new commands in the existing canonical lanes rather than inventing a new lane.

## Recommended implementation order

1. WP1 `repo:design:check`
2. WP2 PRD ripple helper
3. WP3 doc-claims audit helper
4. WP5 inventory updates for the shipped commands
5. WP4 scenario fidelity triage
6. optional doc-claims heuristic narrowing only if safely proven

## File ownership guidance for the follow-on agent

- `tooling/skills/design-surface-drift/**` owns new design-doc validation logic
- `tooling/skills/intake-to-prd/**` owns PRD ripple helper logic
- `tooling/skills/doc-claims-remediation/**` owns doc-claims audit logic
- `tooling/skills/scenario-fidelity/**` owns weak-coverage triage logic
- `package.json`, `tooling/skills/AGENTS.md`, and `tooling/AGENTS.md` are shared integration surfaces and should be edited carefully after the leaf assets exist

## Risks and mitigations

| Risk                                                                    | Impact                           | Mitigation                                                                                  |
| ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `journey-catalog.yaml` free-form lifecycle strings are hard to validate | False failures or missed refs    | Parse tolerant ID tokens in v1; normalize schema later                                      |
| `validate-doc-claims.py` narrowing accidentally drops real coverage     | Doc drift escapes CI             | Make audit helper shippable independently; keep blocker intact unless equivalence is proven |
| scenario fidelity produces noisy reports                                | Agent trust drops                | Keep it report-only and tune on real output before wiring into nightly                      |
| design checks added outside `repo:docs:check` create split ownership    | Repo docs lane becomes confusing | Wire through `repo:docs:check` only                                                         |

## Completion checklist for the follow-on agent

- [ ] `repo:design:check` exists and is called from `repo:docs:check`
- [ ] `repo:prd:diff-ids` exists and `intake-to-prd` documents it
- [ ] `repo:docs:claims:audit` exists and `doc-claims-remediation` documents it
- [ ] `verify:scenario:fidelity` exists and stays report-only
- [ ] `tooling/skills/AGENTS.md` and `tooling/AGENTS.md` are updated
- [ ] smallest relevant verification commands were run and recorded
