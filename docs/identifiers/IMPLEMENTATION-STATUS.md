# Identifier Enforcement Implementation Status

**Date:** 2026-04-24  
**Status:** Phase 1 Complete; Phase 2 In Progress

---

## Completed Tasks (✅)

### 1. Critical Registry Fix

- ✅ **Fixed:** Corrupted `override_status` in `tests/registry.yaml` (SCN-BOOK-006)
  - **Was:** `override_status: waived pending tasker-suspension feature`
  - **Now:** `override_status: waived` + moved text to notes field
  - **Verification:** `grep -n "waived pending" tests/registry.yaml` (now returns empty)

### 2. Validation Script Updates

#### `tooling/scripts/governance/validate-prd-scenario-links.py`

- ✅ **Updated Line 27:** `CANONICAL_PRD_ID_RE` now enforces 2-digit format (`\d{2}`)
- ✅ **Updated Line 28:** `REQ_P1_RE` now enforces 2-digit format (`\d{2}`)
- ✅ **Updated Line 30:** `SCENARIO_HEADER_RE` now enforces 3-digit format (`\d{3}`)
- ✅ **Updated Line 31:** `RISK_RE` now enforces capitalization (`Critical|High|Medium`)
- ✅ **Updated Line 37:** `VALID_RISKS` removed "low" (Phase 1 policy)
- ✅ **Added comment:** Explanation of Phase 1 constraint

**Changes Made:**

```python
# Before
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d+\b")
SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d+)\s*$", re.MULTILINE)
VALID_RISKS = {"critical", "high", "medium", "low"}

# After
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d{2}\b")  # Enforce 2-digit zero-padded
SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d{3})\s*$", re.MULTILINE)  # Enforce 3-digit
VALID_RISKS = {"critical", "high", "medium"}  # Phase 1: no "low" risk tier
```

#### `services/api/scripts/sync-registry.sh`

- ✅ **Updated Line 49:** `VALID_RISKS` now excludes "low"
- ✅ **Updated Line 59:** Header regex enforces 3-digit SCN (`\d{3}`)
- ✅ **Updated Line 66:** Full parse regex enforces 3-digit SCN and capitalized risk
- ✅ **Added comment:** Explanation of enforcement

**Changes Made:**

```bash
# Before
VALID_RISKS = {"critical", "high", "medium", "low"}
header_match = re.match(r'## (SCN-[A-Z]+\d*-\d+)', block)
r'## (SCN-[A-Z]+\d*-\d+)\n+\*\*Risk:\*\* (\w+)\n...'

# After
VALID_RISKS = {"critical", "high", "medium"}  # Phase 1: no "low" risk tier
header_match = re.match(r'## (SCN-[A-Z]+\d*-\d{3})', block)  # Enforce 3-digit
r'## (SCN-[A-Z]+\d*-\d{3})\n+\*\*Risk:\*\* (Critical|High|Medium)\n...'
```

### 3. Pre-Commit Hooks

#### `.husky/pre-commit`

- ✅ **Added:** SCN format validation (3-digit zero-padded)
- ✅ **Added:** Risk tier validation (capitalized: Critical|High|Medium)
- ✅ **Added:** PRD field validation (2-digit REQ-P1 references)
- ✅ **Added:** REQ-P1 document validation (2-digit format)

**Hooks Added:**

```bash
# Scenario files validation
- SCN identifiers must be 3-digit (SCN-DOMAIN-NNN)
- Risk values must be capitalized (Critical, High, Medium)
- PRD references must be 2-digit (REQ-P1-DOMAIN-NN)

# PRD document validation
- REQ-P1 identifiers must be 2-digit zero-padded
```

---

## In Progress (🟡)

### Phase 2: Registry Cleanup (Target: 2026-04-30)

**Task:** Classify 139 null-status scenarios in registry

**Approach:**

```bash
# Count null statuses
grep "status: null" tests/registry.yaml | wc -l

# Manual review and classification:
# 1. Run tests to identify which scenarios are implemented
# 2. Set status: covered for implemented scenarios
# 3. Set status: untested for planned but unimplemented
# 4. Set status: waived for intentionally deferred
```

**Estimated Effort:** 2-3 hours (manual review)

---

## Pending (🔲)

### Phase 3: Scenario Coverage Gaps (Target: 2026-05-07)

**38 Uncovered Requirements** need scenarios created:

#### Critical Priority (4 scenarios)

```
REQ-P1-ADMIN-03  → SCN-ADMIN-003: Verification queue SLA tracking
REQ-P1-ADMIN-04  → SCN-ADMIN-004: Verification decision audit trail
REQ-P1-COVER-01  → SCN-COVER-001: Geographic boundary validation (Ulaanbaatar)
REQ-P1-COVER-06  → SCN-COVER-006: Coverage metrics and reporting
```

#### High Priority (6 scenarios)

```
REQ-P1-ADMIN-06  → SCN-ADMIN-006: Concierge dispatch tooling
REQ-P1-ADMIN-07  → SCN-ADMIN-007: Early-stage reliability tools
REQ-P1-ADMIN-08  → SCN-ADMIN-008: Assisted distribution module
REQ-P1-CAT-02    → SCN-CATEGORY-009: Category-specific templates
REQ-P1-CAT-03    → SCN-CATEGORY-010: Template version management
REQ-P1-BOOK-27   → SCN-BOOK-028: Silent customer auto-complete timeout
```

#### Medium Priority (8 scenarios)

```
REQ-P1-BOOK-28, REQ-P1-ASSIST-02, REQ-P1-ASSIST-08,
REQ-P1-MATCH-04, REQ-P1-NOTIF-03, REQ-P1-PRICE-06,
REQ-P1-KPI-02, REQ-P1-KPI-05, REQ-P1-KPI-06
```

**Estimated Effort:** 5-8 hours (scenario authoring + test implementation)

---

### Phase 4: CI/CD Integration (Target: 2026-05-15)

**Pending:** Add GitHub Actions jobs:

1. `ci-scenario-validation` — Run sync-registry, validate no errors
2. `ci-prd-scenario-links` — Verify all PRD refs are live
3. `ci-coverage-report` — Warn on uncovered REQ-P1

---

## Test & Validation

### Quick Test of Pre-Commit Hooks

```bash
# Test: Try to commit an invalid SCN (single-digit)
cd /home/norbu/Workspace/Projects/tasky
cat > /tmp/test_hook.md << 'EOF'
## SCN-TASK-1
**Risk:** Critical
**PRD:** REQ-P1-TASK-01
**Title:** Test
EOF

# This should fail with error about 3-digit requirement
git add /tmp/test_hook.md && git commit -m "test" 2>&1 | grep -i "3-digit" || echo "HOOK FAILED: error message not found"
```

### Test Validation Scripts

```bash
# Test: Run validation on current scenarios
python3 /home/norbu/Workspace/Projects/tasky/tooling/scripts/governance/validate-prd-scenario-links.py

# Expected: No errors (all current scenarios are already 3-digit)
```

### Test Registry Sync

```bash
# Test: Run sync script
cd /home/norbu/Workspace/Projects/tasky
./services/api/scripts/sync-registry.sh

# Expected: Registry regenerated without errors
# Verify: No new "4-digit" entries in tests/registry.yaml
```

---

## Files Modified

| File                                                        | Changes                                                | Status  |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------- |
| `tests/registry.yaml`                                       | Fixed corrupted status (SCN-BOOK-006)                  | ✅ Done |
| `tooling/scripts/governance/validate-prd-scenario-links.py` | Enforced 2-digit REQ-P1, 3-digit SCN, capitalized Risk | ✅ Done |
| `services/api/scripts/sync-registry.sh`                     | Enforced 3-digit SCN, capitalized Risk, removed "low"  | ✅ Done |
| `.husky/pre-commit`                                         | Added identifier format validation                     | ✅ Done |
| `docs/identifiers/README.md`                                | Created standards documentation                        | ✅ Done |
| `docs/identifiers/ENFORCEMENT-CHECKLIST.md`                 | Created implementation guide                           | ✅ Done |
| `docs/identifiers/REFERENCE-MAP.md`                         | Created cross-reference map                            | ✅ Done |
| `docs/audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`    | Created audit report                                   | ✅ Done |

---

## Enforcement Rules Now Active

### Pre-Commit (Immediate)

- ✅ SCN must be 3-digit: `SCN-DOMAIN-NNN`
- ✅ Risk must be capitalized: `Critical|High|Medium`
- ✅ REQ-P1 in scenarios must be 2-digit: `REQ-P1-DOMAIN-NN`
- ✅ REQ-P1 in PRD must be 2-digit: `REQ-P1-DOMAIN-NN`

### Script Validation (On Sync & Validation Run)

- ✅ REQ-P1 must be 2-digit zero-padded
- ✅ SCN must be 3-digit zero-padded
- ✅ Risk must be one of: Critical, High, Medium (no Low in Phase 1)

### Policy Rules (Document)

- ✅ One scenario per REQ-P1 (many-to-many mapping requires approval)
- ✅ Range notation (SCN-DOMAIN-001-009) allowed for reporting only, not canonical
- ✅ NFR references in scenarios require audit (currently 6 found)

---

## Next Steps

### For Scenario Curators

1. **Review Coverage Gaps:** See "Pending (Phase 3)" section above
2. **Create High-Priority Scenarios:** Focus on ADMIN, COVER, CAT domains
3. **Test:** Run `services/api/scripts/sync-registry.sh` after each scenario addition
4. **Validate:** Commit using `git add` and let pre-commit hooks validate format

### For Release Lead

1. **Schedule Registry Cleanup:** Assign 139 null-status classification (2-3 hours)
2. **Track Scenario Authoring:** Monitor completion of 38 coverage gaps
3. **Plan CI/CD Jobs:** Prepare GitHub Actions specs for coverage reporting
4. **Communicate:** Brief team on new enforcement rules

### For DevOps

1. **Test Pre-Commit Hooks:** Verify on sandbox commits (see "Test & Validation" above)
2. **Monitor Compliance:** Watch for hook failures; escalate if systematic
3. **Prepare CI/CD:** Design `ci-scenario-validation`, `ci-prd-scenario-links`, `ci-coverage-report` jobs

---

## Rollback Instructions

If enforcement rules need to be temporarily disabled:

```bash
# Disable pre-commit hook validation (temporary)
SKIP_IDENTIFIERS=1 git commit ...

# Re-enable validation
unset SKIP_IDENTIFIERS

# Or manually bypass specific check
chmod -x .husky/pre-commit  # (not recommended; use SKIP flag instead)
```

---

## Verification Checklist

- [ ] Registry corruption fixed (SCN-BOOK-006)
- [ ] Validation script regex updated (3 files)
- [ ] Pre-commit hooks implemented and tested
- [ ] Team briefed on new enforcement rules
- [ ] Quick test passed (hook validation, sync script)
- [ ] Scenario curator assigned to Phase 3 work
- [ ] Registry cleanup scheduled (Phase 2)
- [ ] CI/CD jobs designed (Phase 4)

---

## Document Links

- **Full Audit:** `../audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`
- **Enforcement Guide:** `ENFORCEMENT-CHECKLIST.md`
- **Quick Reference:** `README.md`
- **Cross-Reference Map:** `REFERENCE-MAP.md`

---

_Last Updated: 2026-04-24_  
_Next Phase: Registry Cleanup (2026-04-30)_
