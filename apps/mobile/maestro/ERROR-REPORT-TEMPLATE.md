# Maestro Error Report — <DATE>

**Run scope:** P0 / P1 / P2
**Run timestamp:** <TIMESTAMP>
**Logs directory:** `apps/mobile/maestro/results/<TIMESTAMP>/`

---

## PATCHING AGENT INSTRUCTIONS — READ FIRST

These tests are derived specifications. The authority chain is:

```
PRD.md → docs/design/journey-catalog.yaml → docs/design/screen-specs/SCR-*.yaml → maestro/flows/
```

**You are authorized to modify ONLY:**
- `apps/mobile/src/` — app source code

**You are NOT authorized to modify:**
- `apps/mobile/maestro/flows/` — these are specifications, not implementation
- `docs/design/` — canonical design authority

**The only valid reasons to modify a flow file are:**
1. The flow has a Maestro YAML syntax error (category `FLOW_ERROR`)
2. A `testID` was intentionally renamed in the app AND `docs/design/screen-specs/SCR-*.yaml` was updated first

For every other failure: fix the app. If the app behavior contradicts the test and you believe the test is wrong, assign category `SPEC_CONFLICT` and escalate — do not modify the test.

**Post-patch self-check:** Run `git diff --name-only HEAD | grep "maestro/flows/"` — if any flow file appears, your patch is wrong unless the failure was `FLOW_ERROR`.

---

## Summary

| Flow ID | Status | Category |
|---------|--------|----------|
| JRN-XXX | FAIL | TESTID_MISSING |

## Category Legend

| Category | Meaning | Patching action |
|----------|---------|-----------------|
| `TESTID_MISSING` | Maestro could not find a `testID` — element exists but ID is wrong or missing | Add/fix testID in the screen component at the path listed |
| `SCREEN_NOT_REACHED` | Navigation did not arrive at the expected screen | Fix navigation logic or routing in the app |
| `ELEMENT_NOT_VISIBLE` | Screen arrived but expected element not rendered | Fix rendering condition or component state in the app |
| `TIMEOUT` | Screen or element never appeared within timeout | Fix loading logic, check API call, or verify test data exists |
| `FLOW_ERROR` | Maestro YAML syntax error or unsupported command | Fix the flow YAML only — this is the one case where a flow file may be edited |
| `INFRA_DEPENDENCY` | Test requires external setup (reinstall, airplane mode, test account configuration) | Configure the test environment — do not modify the flow |
| `KNOWN_LIMITATION` | Screen has TODO markers — feature incomplete | No patch; re-test after TODO resolved |
| `SPEC_CONFLICT` | Test correctly represents the spec but app behavior seems intentionally different | Do NOT patch. Escalate: attach the relevant SCR-*.yaml spec section and describe the conflict |

---

## Failure Details

### <FLOW_ID> — <FLOW_NAME>

**Category:** <CATEGORY>

**Change type:** [ ] App fix (`apps/mobile/src/`)  [ ] Flow YAML fix (only if `FLOW_ERROR`)  [ ] Escalate (`SPEC_CONFLICT`)

**Log file:** `apps/mobile/maestro/results/<TIMESTAMP>/<FLOW_ID>.log`

**Spec reference:** `docs/design/screen-specs/<SCR-ID>.yaml` — states: `<RELEVANT_STATE>`

**Failing step:**
```yaml
- tapOn:
    id: "some-testid"
```

**Error message:**
```
[paste exact Maestro error line here]
```

**Root cause:** <one sentence — e.g. "testID 'task-detail-cancel-button' not present; component uses 'cancel-btn' instead">

**Patch instruction:**
File: `apps/mobile/src/app/path/to/screen.tsx`
Change: `<exact diff or description — must point to app source, never to a flow file>`

**Verification after patch:**
```bash
maestro test apps/mobile/maestro/flows/<FLOW_FILE>.yaml
```
Expected: PASS
