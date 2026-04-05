# Maestro Error Report — <DATE>

**Run scope:** P0 / P1 / P2
**Run timestamp:** <TIMESTAMP>
**Logs directory:** `apps/mobile/maestro/results/<TIMESTAMP>/`

## Summary

| Flow ID | Status | Category |
|---------|--------|----------|
| JRN-XXX | FAIL | TESTID_MISSING |

## Category Legend

| Category | Meaning | Patching action |
|----------|---------|-----------------|
| `TESTID_MISSING` | Maestro could not find a `testID` — element exists but ID is wrong or missing | Add/fix testID in the screen component |
| `SCREEN_NOT_REACHED` | Navigation did not arrive at the expected screen | Fix navigation logic or screen routing |
| `ELEMENT_NOT_VISIBLE` | Screen arrived but expected element not rendered | Fix rendering condition or component state |
| `TIMEOUT` | Screen or element never appeared within timeout | May indicate loading failure, network error, or missing test data |
| `FLOW_ERROR` | YAML parsing error or unsupported Maestro command | Fix the flow YAML |
| `INFRA_DEPENDENCY` | Test requires external setup (file picker, airplane mode, test account) | Configure test environment |
| `KNOWN_LIMITATION` | Feature has TODOs in implementation — cannot be fully tested yet | No patch needed; re-test after TODO resolved |

## Failure Details

### <FLOW_ID> — <FLOW_NAME>

**Category:** <CATEGORY>
**Log file:** `apps/mobile/maestro/results/<TIMESTAMP>/<FLOW_ID>.log`

**Failing step:**
```yaml
- tapOn:
    id: "some-testid"
```

**Error message:**
```
[paste exact Maestro error line here]
```

**Root cause:** <one sentence — e.g. "testID 'some-testid' not present in component; screen uses 'other-id' instead">

**Patch instruction:**
File: `apps/mobile/src/app/path/to/screen.tsx`
Change: Add `testID="some-testid"` to the `<Pressable>` at line ~42

**Verification after patch:**
```bash
maestro test apps/mobile/maestro/flows/<FLOW_FILE>.yaml
```
Expected: PASS
