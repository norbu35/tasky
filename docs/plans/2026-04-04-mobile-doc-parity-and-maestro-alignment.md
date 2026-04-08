# Mobile Docs Parity and Maestro Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Realign the live `docs/design/` surfaces so mobile UI implementation and Maestro tests use a single trustworthy authority chain, then define complete journey + screen/state test coverage for the Expo mobile app.

**Architecture:** Treat `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/design/journey-catalog.yaml`, and `docs/design/screen-specs/SCR-*.yaml` as the authoritative stack. Repair derived docs (`screen-inventory.yaml`, `state-matrix.yaml`, Maestro handoff docs) so they mirror the authoritative docs instead of contradicting them. Then use journeys for flow tests and screen specs/state matrix for state coverage.

**Tech Stack:** YAML docs in `docs/design/`, Markdown plans/reports in `docs/`, Expo Router mobile app, Maestro E2E flows, TypeScript mobile workspace.

---

### Task 1: Record the doc authority contract in a parity report

**Files:**
- Create: `docs/quality/mobile-doc-authority-audit-2026-04-04.md`
- Reference: `docs/PRD.md`
- Reference: `docs/ARCHITECTURE.md`
- Reference: `docs/ARCHITECTURE_INDEX.md`
- Reference: `docs/design/journey-catalog.yaml`
- Reference: `docs/design/screen-specs/`
- Reference: `docs/design/screen-inventory.yaml`
- Reference: `docs/design/state-matrix.yaml`
- Reference: `docs/design/screen-graph.yaml`

**Step 1: Write the audit doc skeleton**

```md
# Mobile Doc Authority Audit (2026-04-04)

## Canonical sources
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/design/journey-catalog.yaml`
- `docs/design/screen-specs/SCR-*.yaml`

## Derived sources
- `docs/design/screen-inventory.yaml`
- `docs/design/state-matrix.yaml`
- `docs/design/screen-graph.yaml`
- `docs/design/prompts/**`
- `docs/plans/2026-04-05-maestro-setup-handoff.md`

## Drift found
- route drift
- state drift
- journey coverage gaps

## Enforcement rule
When derived docs conflict with canonical docs, canonical docs win.
```

**Step 2: Fill the report with the actual drift counts**

Add the measured facts:
- `screen-inventory.yaml`: 64 route mismatches vs screen specs
- `screen-inventory.yaml`: 57 state mismatches vs screen specs
- `state-matrix.yaml`: 3 mismatches vs screen specs
- `journey-catalog.yaml`: 22 screens not covered by a `JRN-*`

**Step 3: Add the working precedence order**

```md
1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/design/journey-catalog.yaml`
4. `docs/design/screen-specs/SCR-*.yaml`
5. `docs/design/state-matrix.yaml`
6. `docs/design/screen-graph.yaml`
7. `docs/design/screen-inventory.yaml`
8. `docs/design/prompts/**`
9. `docs/plans/**`
```

**Step 4: Review for scope discipline**

Check that the report:
- does not read from `archive/`
- does not claim runtime/source facts without evidence
- clearly distinguishes “authoritative” from “derived”

**Step 5: Commit**

```bash
git add docs/quality/mobile-doc-authority-audit-2026-04-04.md
git commit -m "docs(design): record mobile doc authority audit"
```

---

### Task 2: Repair `screen-inventory.yaml` so it matches screen specs

**Files:**
- Modify: `docs/design/screen-inventory.yaml`
- Reference: `docs/design/screen-specs/SCR-*.yaml`
- Reference: `docs/design/prompts/README.md`

**Step 1: Write a small verification script locally before editing**

Create a scratch command, not a committed file:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
base=Path('docs/design')
inv={s['id']:s for s in yaml.safe_load((base/'screen-inventory.yaml').read_text())['screens']}
for p in sorted((base/'screen-specs').glob('SCR-*.yaml')):
    spec=yaml.safe_load(p.read_text())
    sid=spec['screen_id']
    if str(inv[sid].get('route')) != str(spec.get('route')):
        print('ROUTE', sid, inv[sid].get('route'), '!=', spec.get('route'))
    inv_states=inv[sid].get('states', [])
    spec_states=[s['id'] for s in spec.get('states', [])]
    if inv_states != spec_states:
        print('STATE', sid, inv_states, '!=', spec_states)
PY
```

Expected: mismatches printed before the edit.

**Step 2: Update each screen entry to copy route from the screen spec**

For each `SCR-*` entry in `docs/design/screen-inventory.yaml`:
- set `route` equal to the matching `screen-specs/SCR-*.yaml` `route`
- preserve `null` only for true modal/non-route surfaces explicitly modeled that way in the spec

**Step 3: Update each screen entry to copy states from the screen spec**

For each `SCR-*` entry:
- replace generic state aliases with the exact spec states
- keep the same order as the screen spec file

Examples to normalize:
- `loading` -> `loading_initial` where the spec uses `loading_initial`
- `error` -> `error_network` where the spec uses `error_network`
- `open` -> `open_no_applicants` / `open_has_applicants` where the spec distinguishes them
- remove inventory-only simplifications that collapse distinct spec states

**Step 4: Add a short note at the top of the file**

Add or update a comment/header stating:

```yaml
# Summary screen list and generation-order input.
# Route and state values must mirror docs/design/screen-specs/SCR-*.yaml.
# When inventory and screen specs disagree, screen specs are authoritative.
```

**Step 5: Re-run the verification command**

Run the same Python command from Step 1.
Expected: no output.

**Step 6: Commit**

```bash
git add docs/design/screen-inventory.yaml
git commit -m "docs(design): align screen inventory to screen specs"
```

---

### Task 3: Repair the 3 `state-matrix.yaml` mismatches

**Files:**
- Modify: `docs/design/state-matrix.yaml`
- Reference: `docs/design/screen-specs/SCR-SHARED-001.yaml`
- Reference: `docs/design/screen-specs/SCR-CUST-006.yaml`
- Reference: `docs/design/screen-specs/SCR-CUST-007.yaml`

**Step 1: Confirm current mismatches**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
base=Path('docs/design')
matrix=yaml.safe_load((base/'state-matrix.yaml').read_text())['matrix']
for sid in ['SCR-SHARED-001','SCR-CUST-006','SCR-CUST-007']:
    spec=yaml.safe_load((base/'screen-specs'/f'{sid}.yaml').read_text())
    spec_states=[s['id'] for s in spec['states']]
    matrix_states=[k for k in matrix[sid].keys() if k != 'note']
    print(sid, 'spec=', spec_states, 'matrix=', matrix_states)
PY
```

**Step 2: Fix `SCR-SHARED-001`**

Remove matrix-only states that are not in the spec:
- remove `error_network`
- remove `offline`

Keep only:
- `default`
- `loading`

**Step 3: Fix `SCR-CUST-006`**

Match the matrix to the spec exactly:
- keep `default`
- keep `date_picking`
- keep `budget_entry`
- keep `validation_budget_low`
- keep `validation_schedule_past`
- remove `submitting`
- remove `submit_error`

**Step 4: Fix `SCR-CUST-007`**

Match the matrix to the spec exactly:
- keep `review`
- keep `editing_summary`
- add `submitting`
- add `submit_error`

**Step 5: Re-run mismatch check**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
base=Path('docs/design')
matrix=yaml.safe_load((base/'state-matrix.yaml').read_text())['matrix']
diffs=[]
for sid in ['SCR-SHARED-001','SCR-CUST-006','SCR-CUST-007']:
    spec=yaml.safe_load((base/'screen-specs'/f'{sid}.yaml').read_text())
    spec_states=set(s['id'] for s in spec['states'])
    matrix_states=set(k for k in matrix[sid].keys() if k != 'note')
    if spec_states != matrix_states:
        diffs.append((sid, spec_states, matrix_states))
print(diffs)
PY
```

Expected: `[]`

**Step 6: Commit**

```bash
git add docs/design/state-matrix.yaml
git commit -m "docs(design): align state matrix with screen specs"
```

---

### Task 4: Rebuild the prompt pack if inventory changes affect generated prompt metadata

**Files:**
- Modify if regenerated: `docs/design/prompts/screens/SCR-*.yaml`
- Modify if regenerated: `docs/design/prompts/prompt-manifest.yaml`
- Reference: `docs/design/prompts/README.md`
- Reference: `tooling/scripts/generate-prompts.js`

**Step 1: Determine whether prompt regeneration is required**

Use the prompt README rule:
- prompt files are generated from `screen-specs/` + `journey-catalog.yaml` + `screen-inventory.yaml`

Because inventory is an input, regeneration is required if route metadata or manifest ordering is expected to remain reproducible.

**Step 2: Run the generation command**

Run:

```bash
node tooling/scripts/generate-prompts.js
```

**Step 3: Inspect the diff**

Confirm only expected prompt metadata changes occurred.
Reject the change if it rewrites prompt semantics unexpectedly.

**Step 4: If no files changed, record that explicitly in the next report**

If there is no diff, note “prompt outputs already matched screen specs despite stale inventory.”

**Step 5: Commit if needed**

```bash
git add docs/design/prompts
git commit -m "docs(design): regenerate prompt artifacts after inventory repair"
```

---

### Task 5: Make the Maestro handoff doc match the repaired authority model

**Files:**
- Modify: `docs/plans/2026-04-05-maestro-setup-handoff.md`
- Reference: `docs/design/journey-catalog.yaml`
- Reference: `docs/design/screen-specs/`
- Reference: `docs/design/state-matrix.yaml`

**Step 1: Replace inventory-as-truth language**

Change any language implying `screen-inventory.yaml` is the route authority.
Use this rule instead:

```md
Route and state authority for Maestro come from `docs/design/screen-specs/SCR-*.yaml`.
`docs/design/journey-catalog.yaml` defines flow coverage.
`docs/design/state-matrix.yaml` defines required state coverage.
`docs/design/screen-inventory.yaml` is a synchronized summary only.
```

**Step 2: Add the two-layer test model**

Insert a new section:

```md
## Maestro Coverage Model
1. Journey flows: one Maestro flow per `JRN-*` happy path, plus selected high-risk alternate paths.
2. Screen/state coverage: additional Maestro smoke/state flows for screens or required states not covered by journeys.
```

**Step 3: Add explicit route lookup guidance**

```md
When a route is needed for implementation or debugging, look it up in the matching `screen-specs/SCR-*.yaml` file first.
```

**Step 4: Add an uncovered-screen warning**

List the uncovered families:
- Notification Center
- Legal/help/privacy/stats
- B2B
- Phase 2 monetization
- Phase 3 wallet/escrow/subscription/instant match

**Step 5: Commit**

```bash
git add docs/plans/2026-04-05-maestro-setup-handoff.md
git commit -m "docs(maestro): align handoff with screen spec authority"
```

---

### Task 6: Define the complete Maestro coverage backlog from journeys + uncovered screens

**Files:**
- Create: `docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md`
- Reference: `docs/design/journey-catalog.yaml`
- Reference: `docs/design/screen-inventory.yaml`
- Reference: `docs/design/state-matrix.yaml`
- Reference: `docs/design/screen-specs/`

**Step 1: Create the backlog skeleton**

```md
# Mobile Maestro Coverage Backlog (2026-04-04)

## Layer A: Journey flows
## Layer B: Screen/state coverage
## Uncovered screens
## Priority order
```

**Step 2: Add one line per journey flow**

For each `JRN-*` in `docs/design/journey-catalog.yaml`, add:
- journey ID
- actor
- entry screen
- exit screen
- whether happy path flow exists yet
- whether alternate path tests exist yet

**Step 3: Add uncovered screen list**

Use the 22 currently uncovered screens and group them by domain.
Example sections:
- shared/admin utility screens
- infrastructure/legal/help
- tasker stats/privacy
- B2B surfaces
- monetization Phase 2
- wallet/escrow/subscription Phase 3

**Step 4: Add screen/state test obligations**

For each uncovered screen, list required states from `state-matrix.yaml`.
Format:

```md
### SCR-INFRA-004 — Terms of Service
- required states: loading, loaded, error_network
- journey-backed: no
- needs: screen smoke + loading/error state coverage
```

**Step 5: Define a P0/P1/P2 execution order**

P0:
- onboarding/login
- customer task posting
- tasker browse/apply
- booking confirmation/detail
- verification funnel

P1:
- messaging
- disputes
- no-show/reschedule/cancel unhappy paths
- legal/help/profile/settings

P2:
- B2B
- credits/wallet/subscription/escrow
- advanced growth surfaces

**Step 6: Commit**

```bash
git add docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md
git commit -m "docs(quality): add mobile maestro coverage backlog"
```

---

### Task 7: Create a Maestro authoring convention doc tied to `SCR-*` and `JRN-*`

**Files:**
- Create: `docs/quality/mobile-maestro-authoring-rules.md`
- Reference: `docs/ARCHITECTURE.md`
- Reference: `docs/design/journey-catalog.yaml`
- Reference: `docs/design/screen-specs/`
- Reference: `apps/mobile/maestro/flows/` (read only if source inspection is required; if needed, run repomix-explorer first)

**Step 1: Write the rule header**

```md
# Mobile Maestro Authoring Rules

## Authority
- Flow authority: `docs/design/journey-catalog.yaml`
- Screen authority: `docs/design/screen-specs/SCR-*.yaml`
- State authority: `docs/design/state-matrix.yaml`
```

**Step 2: Add selector rules**

```md
- Prefer `SCR-*` `testID`s for root screen assertions.
- Prefer stable control IDs over visible text when possible.
- Do not make localization-sensitive assertions when an ID exists.
```

**Step 3: Add file naming rules**

```md
- Journey files: `apps/mobile/maestro/flows/JRN-<ID>-<slug>.yaml`
- Screen smoke/state files: `apps/mobile/maestro/flows/SCR-<ID>-<state-or-purpose>.yaml`
```

**Step 4: Add minimal scenario template**

```yaml
appId: <mobile app id>
---
- launchApp
- assertVisible:
    id: "SCR-SHARED-002"
```

**Step 5: Add per-flow metadata requirements**

Each Maestro file should state in a comment:
- source journey or screen ID
- states covered
- feature flags or role preconditions
- whether it is smoke, happy path, alternate path, or state coverage

**Step 6: Commit**

```bash
git add docs/quality/mobile-maestro-authoring-rules.md
git commit -m "docs(quality): define mobile maestro authoring rules"
```

---

### Task 8: Verify docs parity after repairs

**Files:**
- Verify: `docs/design/screen-inventory.yaml`
- Verify: `docs/design/state-matrix.yaml`
- Verify: `docs/design/screen-specs/`
- Verify: `docs/design/prompts/screens/`

**Step 1: Run route/state parity checks**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
base=Path('docs/design')
inv={s['id']:s for s in yaml.safe_load((base/'screen-inventory.yaml').read_text())['screens']}
matrix=yaml.safe_load((base/'state-matrix.yaml').read_text())['matrix']
route_diffs=[]
inv_state_diffs=[]
matrix_diffs=[]
for p in sorted((base/'screen-specs').glob('SCR-*.yaml')):
    spec=yaml.safe_load(p.read_text())
    sid=spec['screen_id']
    spec_route=str(spec.get('route'))
    inv_route=str(inv[sid].get('route'))
    if spec_route != inv_route:
        route_diffs.append(sid)
    spec_states=[s['id'] for s in spec.get('states', [])]
    inv_states=inv[sid].get('states', [])
    if spec_states != inv_states:
        inv_state_diffs.append(sid)
    matrix_states=sorted(k for k in matrix[sid].keys() if k != 'note')
    if sorted(spec_states) != matrix_states:
        matrix_diffs.append(sid)
print('route_diffs', route_diffs)
print('inventory_state_diffs', inv_state_diffs)
print('matrix_diffs', matrix_diffs)
PY
```

Expected:
- `route_diffs []`
- `inventory_state_diffs []`
- `matrix_diffs []`

**Step 2: Re-check screen coverage counts**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml, re
base=Path('docs/design')
inv=yaml.safe_load((base/'screen-inventory.yaml').read_text())['screens']
print('inventory', len(inv))
print('screen_specs', len(list((base/'screen-specs').glob('SCR-*.yaml'))))
print('prompt_screens', len(list((base/'prompts/screens').glob('SCR-*.yaml'))))
covered=set(re.findall(r'SCR-[A-Z]+-[0-9]{3}', (base/'journey-catalog.yaml').read_text()))
print('journey_covered', len(covered))
print('journey_uncovered', len([s['id'] for s in inv if s['id'] not in covered]))
PY
```

Expected:
- `inventory 91`
- `screen_specs 91`
- `prompt_screens 91`
- `journey_uncovered` remains a known backlog item unless journey docs are expanded in a separate tranche

**Step 3: If any prompt files changed, verify generation is reproducible**

Run the generator a second time:

```bash
node tooling/scripts/generate-prompts.js
```

Expected: no additional diff after the first regeneration.

**Step 4: Commit final verification evidence**

If the repo tracks evidence reports, update the audit/backlog docs with command results.
Otherwise include the exact outputs in the PR description.

---

### Task 9: Optional follow-on tranche definition for implementation work

**Files:**
- Create: `docs/plans/2026-04-04-mobile-maestro-implementation-tranches.md`
- Reference: `docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md`

**Step 1: Split implementation into vertical slices**

Define tranches such as:
- Tranche 1: Auth + onboarding Maestro happy paths
- Tranche 2: Customer posting flow + required states
- Tranche 3: Tasker browse + verification + apply
- Tranche 4: Booking unhappy paths
- Tranche 5: Shared utility screens
- Tranche 6: Monetization and B2B

**Step 2: Add entry/exit criteria for each tranche**

Example:

```md
## Done When
- Journey happy path flow exists and passes locally
- Root `SCR-*` assertions are used
- Required loading/error/empty states for P0 screens are covered
- Route mapping matches `screen-specs/`
```

**Step 3: Commit**

```bash
git add docs/plans/2026-04-04-mobile-maestro-implementation-tranches.md
git commit -m "docs(plans): define maestro implementation tranches"
```

---

## Verification Commands

Run these after doc edits:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
base=Path('docs/design')
inv={s['id']:s for s in yaml.safe_load((base/'screen-inventory.yaml').read_text())['screens']}
matrix=yaml.safe_load((base/'state-matrix.yaml').read_text())['matrix']
route_diffs=[]
inv_state_diffs=[]
matrix_diffs=[]
for p in sorted((base/'screen-specs').glob('SCR-*.yaml')):
    spec=yaml.safe_load(p.read_text())
    sid=spec['screen_id']
    if str(spec.get('route')) != str(inv[sid].get('route')):
        route_diffs.append(sid)
    spec_states=[s['id'] for s in spec.get('states', [])]
    if spec_states != inv[sid].get('states', []):
        inv_state_diffs.append(sid)
    matrix_states=sorted(k for k in matrix[sid].keys() if k != 'note')
    if sorted(spec_states) != matrix_states:
        matrix_diffs.append(sid)
print('route_diffs', route_diffs)
print('inventory_state_diffs', inv_state_diffs)
print('matrix_diffs', matrix_diffs)
PY

node tooling/scripts/generate-prompts.js
```

If source inspection becomes necessary for Maestro flow implementation, run `repomix-explorer` before reading mobile source files.
