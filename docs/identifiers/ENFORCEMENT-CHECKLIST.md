# Identifier Enforcement Checklist

**Effective Date:** 2026-04-24  
**Last Updated:** 2026-04-23  
**Status:** Ready for Implementation

---

## Quick Reference: What to Enforce

### ✅ Correct Patterns

```
REQ-P1-AUTH-01     ✓ 2-digit zero-padded
SCN-AUTH-001       ✓ 3-digit zero-padded
SCN-AUTH-001-003   ✓ Range (for grouping only, informational)
Risk: Critical     ✓ Capitalized
Risk: High         ✓ Capitalized
Risk: Medium       ✓ Capitalized
status: covered    ✓ Lowercase in registry
status: untested   ✓ Lowercase in registry
status: waived     ✓ Lowercase in registry
```

### ❌ Incorrect Patterns (Reject)

```
REQ-P1-AUTH-1      ✗ Single-digit (must be 2-digit)
SCN-AUTH-1         ✗ Single-digit (must be 3-digit)
Risk: low          ✗ Not capitalized (and not used in Phase 1)
status: Covered    ✗ Not lowercase
status: waivedpendingtasker-suspensionfeature  ✗ CORRUPTED
REQ-P1-            ✗ Empty suffix
SCN-DOMAIN-NNN     ✗ Unresolved template (only in docs, not registry)
```

---

## Enforcement Points

### 1. Pre-Commit Hook: Scenario Files

**File:** `.husky/pre-commit`  
**Trigger:** `git add tests/scenarios/*.md`

**Validation:**

```bash
# a) All scenarios have SCN-DOMAIN-NNN format
grep -E '## SCN-[A-Z]+-[0-9]{3}' tests/scenarios/*.md || exit 1

# b) All scenarios have "**Risk:** (Critical|High|Medium)"
grep -E "^\*\*Risk:\*\* (Critical|High|Medium)$" tests/scenarios/*.md || exit 1

# c) All scenarios have "**PRD:** REQ-P1-*"
grep -E "^\*\*PRD:\*\*.*REQ-P1-" tests/scenarios/*.md || exit 1

# d) PRD IDs referenced are 2-digit format
grep -oE "REQ-P1-[A-Z]+-[0-9]{2}" tests/scenarios/*.md || exit 1
```

### 2. Pre-Commit Hook: PRD Document

**File:** `.husky/pre-commit`  
**Trigger:** `git add docs/PRD.md`

**Validation:**

```bash
# a) All REQ-P1 entries are 2-digit format
grep -oE "REQ-P1-[A-Z]+-[0-9]{2}" docs/PRD.md | wc -l > /tmp/req_count.txt

# b) REQ-P1 and scenarios co-staged
if git diff --cached docs/PRD.md | grep -E '^\+.*REQ-P1-'; then
  if ! git diff --cached tests/scenarios/*.md; then
    echo "PRD changed but scenarios not staged; add scenarios for new REQ-P1"
    exit 1
  fi
fi
```

### 3. CI/CD Job: Validate Scenario Registry

**Job:** `ci-scenario-validation`  
**Trigger:** PR with changes to `tests/scenarios/` or `tests/registry.yaml`

**Steps:**

1. Run `services/api/scripts/sync-registry.sh`
2. Verify `tests/registry.yaml` generated without errors
3. Validate registry against schema:
   - All `SCN-*` entries exist
   - All `status` values are valid (covered|untested|waived|pending)
   - All `prd_ref` values are valid REQ-P1 or NFR IDs
   - No malformed entries

**Fail Conditions:**

```yaml
- status not in [covered, untested, waived, pending]
- prd_ref references non-existent REQ-P1 or NFR
- mutation_kill_rate not in [null, 0-100]
- domain not in [analytics, assistance, auth, booking, category, contract, dispute, integration, messaging, notification, review, security, task, verification]
- test_type not in [domain-unit, integration, medium-unit]
```

### 4. Code Review Gate: Coverage Analysis

**When:** Review PRs that add/modify scenarios or requirements

**Checklist:**

- [ ] If adding REQ-P1-_, is there a corresponding SCN-_?
- [ ] If adding SCN-_, does it reference a live REQ-P1-_ (or documented exception)?
- [ ] Risk tier is one of: Critical, High, Medium (not Low)?
- [ ] Scenario numbering is 3-digit zero-padded (e.g., 001, not 1)?
- [ ] PRD field references are exactly `REQ-P1-DOMAIN-NN` (2 digits)?
- [ ] No empty identifiers (e.g., `REQ-P1-` alone)?
- [ ] Title is meaningful (not template text)?

---

## Spreadsheet for Tracking Enforcement

Create an issue in Linear/Jira with the following:

| Identifier            | Category         | Status      | Owner    | ETA        | Notes                      |
| --------------------- | ---------------- | ----------- | -------- | ---------- | -------------------------- |
| REQ-P1-ADMIN-03       | Missing Scenario | Backlog     | @curator | 2026-05-15 | High priority              |
| REQ-P1-ADMIN-04       | Missing Scenario | Backlog     | @curator | 2026-05-15 | High priority              |
| REQ-P1-COVER-01       | Missing Scenario | Backlog     | @curator | 2026-05-15 | Coverage critical          |
| REQ-P1-COVER-06       | Missing Scenario | Backlog     | @curator | 2026-05-15 | Coverage critical          |
| (registry corruption) | Status Fix       | In Progress | @admin   | 2026-04-24 | CRITICAL                   |
| (139 null statuses)   | Registry Cleanup | Backlog     | @admin   | 2026-05-01 | Assign to covered/untested |

---

## Tooling Scripts Updates Required

### 1. Fix Validation Script Regex

**File:** `tooling/scripts/governance/validate-prd-scenario-links.py`

**Current (Line 28):**

```python
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d+\b")
```

**Should be (enforce 2-digit):**

```python
REQ_P1_RE = re.compile(r"\bREQ-P1-[A-Z]+-\d{2}\b")
```

**Current (Line 30):**

```python
SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d+)\s*$", re.MULTILINE)
```

**Should be (enforce 3-digit):**

```python
SCENARIO_HEADER_RE = re.compile(r"^## (SCN-[A-Z]+\d*-\d{3})\s*$", re.MULTILINE)
```

### 2. Fix Risk Tier Validation

**File:** `tooling/scripts/governance/validate-prd-scenario-links.py`

**Current (Line 37):**

```python
VALID_RISKS = {"critical", "high", "medium", "low"}
```

**Should be (remove "low" for Phase 1):**

```python
VALID_RISKS = {"critical", "high", "medium"}  # "low" reserved for Phase 2+
```

### 3. Update Sync Registry Script

**File:** `services/api/scripts/sync-registry.sh`

**Update regex patterns to enforce 3-digit SCN:**

```bash
# Current pattern (line ~75):
header_match = re.match(r'## (SCN-[A-Z]+\d*-\d+)', block)

# Should be:
header_match = re.match(r'## (SCN-[A-Z]+\d*-\d{3})', block)

# And for validation:
scn_anywhere = re.compile(r'\b(SCN-[A-Z]+\d*-\d{3})\b')
```

---

## Detection Rules (Regex Patterns)

Use these in linters, pre-commit hooks, and CI/CD:

### REQ-P1 Identifiers

```bash
# Valid: REQ-P1-DOMAIN-NN (2-digit)
valid_req="REQ-P1-[A-Z]{4,}-[0-9]{2}"

# Invalid patterns to catch:
invalid_single_digit="REQ-P1-[A-Z]{4,}-[0-9]{1}$"
invalid_triple_digit="REQ-P1-[A-Z]{4,}-[0-9]{3,}"
invalid_empty="REQ-P1-$"

# Domains (whitelist for stricter validation):
valid_domain="(AUTH|BOOK|ADMIN|ASSIST|TASK|MATCH|PRICE|SAFE|NOTIF|KPI|COVER|CAT|MSG)"
strict_req="REQ-P1-(${valid_domain})-[0-9]{2}"
```

### SCN Identifiers

```bash
# Valid: SCN-DOMAIN-NNN (3-digit, or range for reporting)
valid_scn="SCN-[A-Z]{3,}-[0-9]{3}$"
valid_scn_range="SCN-[A-Z]{3,}-[0-9]{3}-[0-9]{3}$"

# Invalid patterns to catch:
invalid_scn_single="SCN-[A-Z]{3,}-[0-9]{1,2}$"
invalid_scn_template="SCN-(DOMAIN|XXX|ID)-NNN"

# Domains (whitelist):
valid_domain_scn="(ANALYTICS|ASSIST|AUTH|BOOK|CATEGORY|CONTRACT|DISPUTE|MSG|NOTIF|REVIEW|SEC|SMOKE|TASK|VERIF)"
strict_scn="SCN-(${valid_domain_scn})-[0-9]{3}$"
```

### Risk Tiers

```bash
# Valid values (capitalized):
valid_risk="^(Critical|High|Medium)$"

# Invalid:
invalid_risk_lowercase="(critical|high|medium|low)"
invalid_risk_caps="(CRITICAL|HIGH|MEDIUM|LOW)"
invalid_risk_lowercaps="(Critical|High|Medium|Low)"  # Low not allowed in Phase 1
```

### Registry Status

```bash
# Valid values (lowercase):
valid_status="^(covered|untested|waived|pending)$"

# Invalid:
invalid_status_caps="(Covered|Untested|Waived|Pending)"
invalid_status_concat=".*[a-z]+[a-z]+.*"  # Catch concatenated values
```

---

## Implementation Roadmap

### Phase 1: Immediate (This Week)

- [ ] Fix registry corruption: `waivedpendingtasker-suspensionfeature`
- [ ] Add these validation patterns to `.husky/pre-commit`
- [ ] Document in team Slack/wiki

### Phase 2: Near Term (Next 2 Weeks)

- [ ] Implement CI/CD jobs for scenario validation
- [ ] Classify 139 null-status entries in registry
- [ ] Create Linear/Jira board for 38 uncovered scenarios
- [ ] Add code review checklist to PR template

### Phase 3: Medium Term (Next Sprint)

- [ ] Scenario curator fills coverage gaps (prioritize 10 high-impact)
- [ ] Remove template strings from production docs
- [ ] Add enforcement rules to build pipeline

### Phase 4: Ongoing

- [ ] Monitor PRs for compliance
- [ ] Update enforcement rules as new patterns emerge
- [ ] Quarterly audit of identifier health

---

## FAQ for Implementers

**Q: What about "Low" risk scenarios?**  
A: Phase 1 launch uses only Critical, High, Medium. If Low-risk scenarios are needed, require PRD/strategy review first.

**Q: Can we use other numbering schemes (like REQ-P1-TASK-100+)?**  
A: Currently not. Stay with 2-digit format. If expansion needed (>99), add new requirement category (e.g., REQ-P1-EXTRA-01).

**Q: What if a scenario doesn't map to a single REQ-P1?**  
A: Use comma-separated list in PRD field: `**PRD:** REQ-P1-BOOK-01, REQ-P1-BOOK-02`. But prefer single-mapping; multi-mapping indicates scope creep.

**Q: Are NFR identifiers allowed in scenarios?**  
A: Audit existing 6 references. Decision pending. For now, use REQ-P1 only; NFR is informational metadata.

**Q: What's the range syntax (SCN-TASK-020-021) used for?**  
A: Test rehab reporting and batch execution; not canonical. Canonical IDs are individual SCN-DOMAIN-NNN.

---

## Template for Code Review Comment

```markdown
## Identifier Compliance Check

- [ ] New REQ-P1-\* entries use 2-digit format (REQ-P1-DOMAIN-01, not DOMAIN-1)
- [ ] New SCN-\* entries use 3-digit format (SCN-DOMAIN-001, not 001)
- [ ] Risk tiers are one of: Critical, High, Medium (not Low, not lowercase)
- [ ] Scenario PRD field references valid REQ-P1 IDs
- [ ] Registry status is valid (covered, untested, waived, pending)
- [ ] No empty identifiers or template text (SCN-DOMAIN-NNN should not appear)

If any check fails, request changes before merge.
```

---

## Supporting Documentation

- **Detailed Audit:** `docs/audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`
- **Scenario Format:** `tests/scenarios/README.md`
- **PRD Structure:** `docs/PRD.md` (section 1, alignment criteria)
- **Registry Schema:** `tests/registry.yaml` (header comments)

---

_Last Reviewed:_ 2026-04-23  
_Next Review:_ 2026-05-23
