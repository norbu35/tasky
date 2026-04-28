# Identifier Consistency Audit Report

**Date:** 2026-04-23  
**Scope:** Tasks, Tests, Requirements, and Scenarios across documentation and operational systems

---

## Executive Summary

This audit identifies **18 categories of inconsistencies** in identifier usage across the project's requirement (REQ-P1), scenario (SCN), and non-functional (NFR) systems. While no critical blockers exist, several normalization opportunities are identified that should be enforced going forward.

### Key Findings

| Category                  | Issue                                                            | Severity | Count                                                     |
| ------------------------- | ---------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| **Numeric Formatting**    | Mixed 2-digit (01) and single-digit (1) numbering in grep output | Low      | 10 prefix types affected                                  |
| **Status Values**         | Malformed registry status value                                  | Critical | 1 entry: `waivedpendingtasker-suspensionfeature`          |
| **Risk Tiers**            | No "Low" risk scenarios defined (only Critical/High/Medium)      | Medium   | Policy gap                                                |
| **Template Strings**      | Unresolved template identifiers in docs                          | Low      | 6 files contain `SCN-DOMAIN-NNN`, `SCN-XXX-NNN`, `SCN-ID` |
| **Non-Standard Syntax**   | Range identifiers used for test grouping                         | Medium   | 23 entries (e.g., `SCN-TASK-020-021`)                     |
| **Coverage Gaps**         | REQ-P1 requirements without scenario coverage                    | Medium   | 38 uncovered requirements                                 |
| **NFR in Scenarios**      | Non-functional requirements referenced in scenario files         | Low      | 6 references (should be REQ-P1 only)                      |
| **Numbering Consistency** | 2-digit zero-padding inconsistent in grep output                 | Low      | Cosmetic                                                  |

---

## Detailed Findings

### 1. Numeric Formatting Inconsistency

**Issue:** When extracted via grep, numeric identifiers show mixed single-digit and 2-digit formats. The actual PRD uses 2-digit zero-padding (REQ-P1-AUTH-01), but grep output shows both formats.

**Example:**

```
Expected: REQ-P1-AUTH-01, REQ-P1-AUTH-02, ... REQ-P1-AUTH-06
Actual grep output: REQ-P1-AUTH-1, REQ-P1-AUTH-2, ... REQ-P1-AUTH-6
```

**Affected Prefixes:**

- REQ-P1-AUTH (6 requirements)
- REQ-P1-ASSIST (8 requirements)
- REQ-P1-MATCH (7 requirements)
- REQ-P1-PRICE (8 requirements)
- REQ-P1-NOTIF (7 requirements)
- REQ-P1-KPI (6 requirements)
- REQ-P1-COVER (4 actual, expected 6)
- REQ-P1-CAT (5 requirements)
- REQ-P1-MSG (5 requirements)

**Impact:** Low (cosmetic). The actual document content uses 2-digit padding consistently.

**Recommendation:** Verify all grep patterns enforce 2-digit zero-padding in validation scripts.

---

### 2. Critical Registry Status Corruption

**Issue:** One scenario status value is malformed/concatenated.

**Finding:**

```yaml
Status value found: 'waivedpendingtasker-suspensionfeature'
Expected values: covered | untested | waived | pending
```

**Location:** `tests/registry.yaml`

**Impact:** Critical for registry integrity. This entry should be split or corrected.

**Action Required:** Immediately correct in registry.yaml. Likely should be:

- `status: waived`
- `notes: pending tasker-suspension feature` (move to notes field)

---

### 3. Risk Tier Coverage Gap

**Issue:** Only 3 risk tiers are used; "Low" tier is never instantiated in scenarios.

**Current Usage:**

- Critical: YES (in auth, booking, security scenarios)
- High: YES (in 10+ domain scenarios)
- Medium: YES (in assistance, verification, security)
- Low: **NOT USED**

**Question:** Is "Low" an intentional gap, or should "Low" scenarios be added?

**Recommendation:** Either:

1. Formalizing that Phase 1 launch scenarios have minimum "Medium" risk, or
2. Adding "Low" risk scenarios for edge cases (e.g., non-critical helper flows)

**Policy:** Add to scenario curation rules: "Minimum risk tier is Medium unless explicitly approved."

---

### 4. Unresolved Template Identifiers in Documentation

**Issue:** Six documentation files contain placeholder/template identifiers instead of concrete values.

**Files with template strings:**

- `/home/norbu/Workspace/Projects/tasky/AGENTS.md`
- `/home/norbu/Workspace/Projects/tasky/docs/ops/diagrams/pipeline-current.md`
- `/home/norbu/Workspace/Projects/tasky/docs/ops/diagrams/pipeline-proposed.md`
- `/home/norbu/Workspace/Projects/tasky/docs/ops/diagrams/test-pipeline.md`
- `/home/norbu/Workspace/Projects/tasky/docs/plans/agent-skill-augmented-governance.md`
- `/home/norbu/Workspace/Projects/tasky/tests/scenarios/README.md` (intentional; format documentation)

**Template Strings Found:**

- `SCN-DOMAIN-NNN` (in test-pipeline.md, pipeline-\*.md, README.md)
- `SCN-XXX-NNN` (in AGENTS.md, agent-skill-augmented-governance.md)
- `SCN-ID` (in AGENTS.md)
- `REQ-P1-*` (placeholder; acceptable)

**Impact:** Low (mostly in pipeline diagrams and agent governance docs, which are informational).

**Recommendation:** For production-facing validation, exclude these 6 files from identifier validation (mark as "diagram/template content").

---

### 5. Non-Standard SCN Syntax: Range Identifiers

**Issue:** 23 scenario identifiers use range notation (`SCN-DOMAIN-NNN-MMM`) for grouping related scenarios.

**Range Identifiers Found (23 total):**

```
SCN-ANALYTICS-001-003    (covers 3 scenarios: 001, 002, 003)
SCN-ANALYTICS-004-005    (covers 2 scenarios: 004, 005)
SCN-ASSIST-001-003       (covers 3 scenarios)
SCN-ASSIST-001-008       (covers 8 scenarios)
SCN-ASSIST-004-008       (covers 5 scenarios)
SCN-BOOK-001-004         (covers 4 scenarios)
SCN-BOOK-010-016         (covers 7 scenarios)
SCN-BOOK-017-019         (covers 3 scenarios)
SCN-BOOK-022-024         (covers 3 scenarios)
SCN-BOOK-026-027         (covers 2 scenarios)
SCN-CATEGORY-001-005     (covers 5 scenarios)
SCN-CATEGORY-003-005     (covers 3 scenarios)
SCN-CATEGORY-006-008     (covers 3 scenarios)
SCN-CATEGORY-006-009     (covers 4 scenarios)
SCN-DISPUTE-001-008      (covers 8 scenarios)
SCN-MSG-001-003          (covers 3 scenarios)
SCN-NOTIF-001-005        (covers 5 scenarios)
SCN-NOTIF-006-007        (covers 2 scenarios)
SCN-REVIEW-001-006       (covers 6 scenarios)
SCN-TASK-020-021         (covers 2 scenarios)
SCN-TASK-022-025         (covers 4 scenarios)
SCN-TASK-026-029         (covers 4 scenarios)
SCN-VERIF-001-005        (covers 5 scenarios)
```

**Source:** `docs/tests/test-rehab-final-report.md` (test rehab grouping document)

**Semantics:** Used to group scenarios by test rehab execution; not canonical identifiers.

**Impact:** Low. These are _derived_ groupings from the rehab process, not primary identifiers. The canonical registry uses individual SCN-DOMAIN-NNN IDs.

**Recommendation:** Document that range notation is acceptable for grouping/reporting but not for primary scenario identification.

---

### 6. Coverage Gap: Requirements Without Test Scenarios

**Issue:** 38 requirements in PRD have no corresponding test scenario in the scenario files.

**Uncovered Requirements (top 20):**

```
REQ-P1-      (empty/malformed; ignore)
REQ-P1-ADMIN-03
REQ-P1-ADMIN-04
REQ-P1-ADMIN-06
REQ-P1-ADMIN-07
REQ-P1-ADMIN-08
REQ-P1-ASSIST-02
REQ-P1-ASSIST-08
REQ-P1-BOOK-27
REQ-P1-BOOK-28
REQ-P1-CAT-02
REQ-P1-CAT-03
REQ-P1-COVER-01
REQ-P1-COVER-06
REQ-P1-KPI-02
REQ-P1-KPI-05
REQ-P1-KPI-06
REQ-P1-MATCH-04
REQ-P1-NOTIF-03
REQ-P1-PRICE-06
```

**Categorization by Area:**
| Area | Missing Scenarios | Total | Coverage % |
|------|-------------------|-------|-----------|
| ADMIN | 6/10 | 40% | 60% |
| ASSIST | 2/8 | 6/8 | 75% |
| BOOK | 2/28 | 26/28 | 93% |
| COVER | 2/6 | 4/6 | 67% |
| CAT | 2/5 | 3/5 | 60% |
| Others | Mostly covered | 80+/90+ | 80%+ |

**Severity:** Medium. Admin, Category, and Coverage scenarios have gaps.

**Action Items:**

1. Determine if missing REQ-P1 items are deferred or require new scenarios
2. Add scenarios for critical gaps (especially ADMIN-_, CAT-_, COVER-\*)
3. Update registry after scenario curation

---

### 7. Non-Functional Requirements (NFR) Referenced in Scenarios

**Issue:** 6 references to NFR-_ in scenario files; scenarios should only reference REQ-P1-_.

**Finding:** 6 NFR references in `tests/scenarios/*.md` files

**Context:** NFR-\* requirements are in `docs/PRD.md` as non-functional concerns (performance, security, localization, legal, observability, reliability, API design).

**Examples:**

- NFR-PERF-01, NFR-PERF-02
- NFR-SEC-01 through NFR-SEC-05
- NFR-OBS-01 through NFR-OBS-03
- NFR-LEGAL-01 through NFR-LEGAL-03
- etc.

**Impact:** Low. NFR references in scenarios may be informational, but the canonical PRD field should always be REQ-P1-\*.

**Recommendation:** Audit which scenarios reference NFR and either:

1. Replace NFR references with corresponding REQ-P1 IDs, or
2. Update registry parsing to allow both REQ-P1 and NFR references if intentional

---

### 8. Scenario Status Registry Issues

**Current Registry Status Distribution:**

```
139 scenarios with null status        (not yet classified)
123 scenarios with "covered" status   (implemented)
17 scenarios with "untested" status   (planned but not implemented)
1 scenario with malformed status      (CRITICAL: "waivedpendingtasker-suspensionfeature")
```

**Interpretation:**

- 139 null entries suggest bulk import or sync without status assignment
- 123 covered entries indicate ~87% of registry has test implementation
- 1 malformed entry is data corruption (see Section 2)

**Recommendation:**

1. Audit null status entries; assign to covered/untested/waived appropriately
2. Fix malformed status immediately

---

### 9. Scenario Numbering Consistency

**Pattern Observed:**

- Most domains: Sequential 001-NNN (e.g., SCN-TASK-001 through SCN-TASK-029)
- Some domains with gaps: SCN-AUTH expected 001-015 but has 12 (missing 003, 010, 011)
- SCN-SEC expected 001-013 but has 11 (missing 002, 010)
- SCN-CONTRACT uses non-sequential: 400, 401, 403, 404 (error codes? different scheme)

**Impact:** Low. Gaps may be intentional (deferred scenarios). SCN-CONTRACT's numbering is anomalous.

**Recommendation:** Document numbering rules:

1. Default: Sequential 3-digit zero-padded (001-999)
2. Reserved schemes: SCN-CONTRACT-40X for HTTP status code scenarios?
3. Deferred IDs: Leave gap if scenario is planned but not implemented

---

### 10. Operational Cross-Reference Validation

**Where Identifiers Are Used:**

| System          | References       | Details                             |
| --------------- | ---------------- | ----------------------------------- |
| PRD Document    | 128 REQ-P1-\*    | Source of truth                     |
| Scenario Files  | 120 SCN-\*       | Behavioral specifications           |
| Test Registry   | 140 entries      | Canonical index (includes variants) |
| Java Tests      | 22 files         | @DisplayName("SCN-XXX-NNN: ...")    |
| CI/CD Pipelines | 0                | Not yet integrated                  |
| Build Scripts   | sync-registry.sh | Parses and validates identifiers    |

**Validation Points:**

1. `sync-registry.sh` parses `tests/scenarios/*.md` and generates `tests/registry.yaml`
2. Pre-commit hooks validate PRD co-staging when REQ-P1-\* changes
3. Python script `validate-prd-scenario-links.py` (270 lines) checks scenario PRD refs

**Observation:** Validation is mostly one-directional (scenarios → registry). PRD changes are co-staged but not deeply validated.

---

### 11. Coverage Analysis by Test Type

**Test Types in Registry:**

```
domain-unit:     Most common (unit tests for single domain)
integration:     Cross-domain scenarios (e.g., SCN-ANALYTICS-*, end-to-end flows)
medium-unit:     Mid-layer integration (not as common)
```

**Mutation Kill Rate Status:**

- 139 entries with `null` mutation_kill_rate (no mutations run)
- 80+ entries with measured kill rates
- Lowest: 0% kill rate (marked for P2 rehab; see SCN-ANALYTICS-001, 002, 003)

---

## Normalization Recommendations for Enforcement

### Tier 1: Critical (Fix Immediately)

1. **Fix Registry Status Corruption**
   - Correct `waivedpendingtasker-suspensionfeature` in registry.yaml
   - Audit for other concatenated values

### Tier 2: High Priority (Enforce in Next Pass)

2. **Clarify Risk Tier Policy**
   - Document minimum risk tier (Critical/High/Medium/Low)
   - Add Low-risk scenarios if intentional; otherwise formalize "no Low" rule

3. **Standardize Scenario Numbering**
   - Enforce sequential 3-digit format (001-999) for new scenarios
   - Document exceptions (e.g., SCN-CONTRACT 40X scheme)

4. **Coverage Gap Remediation**
   - Assign scenarios to 38 uncovered REQ-P1 requirements
   - Prioritize ADMIN, CAT, COVER areas

### Tier 3: Medium Priority (Enforce in Validation)

5. **NFR vs. REQ-P1 Clarity**
   - Audit the 6 NFR references in scenarios
   - Document whether NFR references are allowed
   - Update registry parser if needed

6. **Status Registry Cleanup**
   - Audit 139 null status entries
   - Assign to covered/untested/waived
   - Document criteria for each status value

7. **Numeric Format Consistency**
   - Enforce 2-digit zero-padding in all validators (regex: `REQ-P1-[A-Z]+-[0-9]{2}`)
   - Add linting rule to catch single-digit formats

### Tier 4: Low Priority (Nice-to-Have)

8. **Template String Removal**
   - Remove unresolved `SCN-DOMAIN-NNN`, `SCN-XXX-NNN` from production docs
   - Retain only in format documentation

9. **Range Identifier Policy**
   - Document that `SCN-DOMAIN-001-009` is acceptable for reporting/grouping
   - Clarify that individual `SCN-DOMAIN-NNN` is canonical

10. **CI/CD Integration**
    - Integrate REQ-P1 and SCN validation into pipeline
    - Add pre-commit hooks for scenario files

---

## 12. Tooling & Validation Script Audit

### Pattern Mismatch in validate-prd-scenario-links.py

**Issue:** Validation scripts allow flexible digit counts but standards require fixed-width formats.

**Current Regex Patterns:**

```python
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d+\b")
# ↑ Allows 1+ digits (matches REQ-P1-AUTH-1, REQ-P1-AUTH-01, REQ-P1-AUTH-001)

SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d+)\s*$", re.MULTILINE)
# ↑ Allows 1+ digits (matches SCN-TASK-1, SCN-TASK-001, SCN-TASK-0001)
```

**Expected Pattern (Standard):**

```python
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d{2}\b")
# Should enforce: REQ-P1-AUTH-01 (exactly 2 digits)

SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d{3})\s*$", re.MULTILINE)
# Should enforce: SCN-TASK-001 (exactly 3 digits)
```

**Impact:** Scripts don't prevent single-digit identifiers from being committed.

**Action Required:** Update regex in:

- `/home/norbu/Workspace/Projects/tasky/tooling/scripts/governance/validate-prd-scenario-links.py` (lines 28, 30)
- `/home/norbu/Workspace/Projects/tasky/services/api/scripts/sync-registry.sh`

---

### Risk Tier Validation Gap

**Issue:** Validation script allows "low" risk but Phase 1 scenarios never use it.

**Finding in validate-prd-scenario-links.py:**

```python
VALID_RISKS = {"critical", "high", "medium", "low"}
```

**Reality in Scenarios:**

```
Critical: 23 scenarios
High: 104 scenarios
Medium: 18 scenarios
Low: 0 scenarios (not used in Phase 1)
```

**Discrepancy:** Validator accepts "low" but policy doesn't use it.

**Action Required:** Either:

1. Enforce in validator: `VALID_RISKS = {"critical", "high", "medium"}`, OR
2. Document that "low" is reserved for Phase 2+

---

### Deferred Requirement Tracking

**Finding:** Validation script has marker support for deferred requirements:

```python
DEFERRED_MARKER_RE = re.compile(r"tasky:req-deferred\s+((?:REQ-P1|NFR)-[A-Z]+-\d+)")
```

**Purpose:** Track Phase 1 requirements that are intentionally deferred to Phase 2+.

**Status:** Mechanism exists but is rarely used (1 override_status entry found).

**Recommendation:** Audit PRD to see if deferred marker should be applied to 38 uncovered requirements.

---

## Enforcement Strategy for Next Pass

### Pre-Implementation Checklist

- [ ] Establish identifier standards document (`docs/identifiers/STANDARDS.md`)
- [ ] Configure git hooks to validate REQ-P1 and SCN formats
- [ ] Update `sync-registry.sh` to enforce standards
- [ ] Document scenario curator role and approval gates

### Validation Rules (to implement in CI)

```bash
# 1. REQ-P1 Format
regex_req="REQ-P1-[A-Z]+-[0-9]{2}"

# 2. SCN Format (standard)
regex_scn="SCN-[A-Z]+(-[0-9]{3})($|[^0-9])"

# 3. SCN Format (range, informational only)
regex_scn_range="SCN-[A-Z]+-[0-9]{3}-[0-9]{3}"

# 4. Risk Tiers (canonical)
valid_risks=("Critical" "High" "Medium")

# 5. Status Values (registry)
valid_statuses=("covered" "untested" "waived" "pending")
```

### Recommended Changes to Key Files

1. **`tests/scenarios/README.md`** — Add to Rules section:
   - "Risk tiers: Critical, High, Medium (Low not currently used)"
   - "Numbering: Sequential 3-digit zero-padded (SCN-DOMAIN-001 to 999)"

2. **`docs/ops/diagrams/*.md`** — Replace template strings:
   - `SCN-DOMAIN-NNN` → `SCN-TASK-001` (concrete example)
   - `SCN-XXX-NNN` → (remove or explain as meta-notation)

3. **`services/api/scripts/sync-registry.sh`** — Add validation:
   - Regex enforcement for REQ-P1 and SCN
   - Reject 4-digit ranges (e.g., `001-004` → `001-004`)
   - Fail on malformed status values

4. **`.github/workflows/*.yml`** — Add new job:
   - Run `validate-prd-scenario-links.py` as mandatory check
   - Add pre-commit hook validation

---

## Summary Table: Inconsistencies by Type

| Finding                    | Locations                       | Severity | Action                                      |
| -------------------------- | ------------------------------- | -------- | ------------------------------------------- |
| Registry status corruption | `tests/registry.yaml` line ~N   | Critical | Fix immediately                             |
| Uncovered REQ-P1 (38)      | PRD vs. scenarios/\*.md         | Medium   | Add scenarios (prioritize 10 critical gaps) |
| Risk tier "Low" unused     | All scenario files              | Medium   | Clarify policy                              |
| Template strings           | 6 docs files                    | Low      | Remove or mark as examples                  |
| NFR in scenarios           | 6 scenario references           | Low      | Audit intent; standardize                   |
| Range identifiers          | 23 entries in rehab report      | Low      | Document as valid for grouping              |
| Numeric formatting         | Grep output (cosmetic)          | Low      | Update validators                           |
| Null status entries        | 139 scenarios                   | Medium   | Classify and assign                         |
| Non-sequential SCN         | SCN-AUTH, SCN-SEC, SCN-CONTRACT | Low      | Document exceptions                         |

---

## Next Steps

1. **This Week:** Fix critical registry corruption (Section 2)
2. **Next Sprint:** Implement Tier 2 high-priority recommendations
3. **Ongoing:** Enforce rules in CI/CD and code review process

---

_Report Generated by: Automated Identifier Audit_  
_Verification Required: Human review of coverage gaps and policy decisions_
