# Identifier Quick Reference Card

**Last Updated:** 2026-04-24  
**Enforcement Status:** ✅ Active (Pre-Commit + Script Validation)

---

## ✅ Do This

### Creating a New Requirement

```markdown
# In docs/PRD.md

### 11.X Title

- **REQ-P1-DOMAIN-01** → Description here
- **REQ-P1-DOMAIN-02** → Next requirement
```

**Rules:**

- Always 2-digit zero-padded: `REQ-P1-DOMAIN-01` (not `REQ-P1-DOMAIN-1`)
- Co-stage corresponding scenario in `tests/scenarios/<domain>.md`

### Creating a New Scenario

```markdown
# In tests/scenarios/<domain>.md

## SCN-DOMAIN-001

**Risk:** Critical
**PRD:** REQ-P1-DOMAIN-01
**Title:** Clear description of behavior

Given [precondition]
When [action]
Then [observable outcome]
And [additional assertion]
```

**Rules:**

- Always 3-digit zero-padded: `SCN-DOMAIN-001` (not `SCN-DOMAIN-1`)
- Risk must be capitalized: `Critical`, `High`, or `Medium` (not `low`)
- PRD reference must be 2-digit: `REQ-P1-DOMAIN-01`
- Run `services/api/scripts/sync-registry.sh` after editing

### Implementing a Test

```java
// In services/api/src/test/java/.../YourScenarioTests.java

@Test
@DisplayName("SCN-DOMAIN-001: Clear description of behavior")
void testTheScenario() {
    // Implement Given/When/Then from scenario
}
```

**Rule:** @DisplayName must match exactly: `"SCN-DOMAIN-NNN: Title from scenario"`

---

## ❌ Don't Do This

| ❌ Wrong             | ✅ Right              | Why                                |
| -------------------- | --------------------- | ---------------------------------- |
| `REQ-P1-AUTH-1`      | `REQ-P1-AUTH-01`      | Must be 2-digit zero-padded        |
| `SCN-TASK-1`         | `SCN-TASK-001`        | Must be 3-digit zero-padded        |
| `Risk: high`         | `Risk: High`          | Must be capitalized                |
| `Risk: low`          | `Risk: Medium`        | "low" not used in Phase 1          |
| `PRD: REQ-P1-AUTH-1` | `PRD: REQ-P1-AUTH-01` | Must be 2-digit                    |
| `REQ-P1-` (empty)    | (don't use)           | Always include domain and number   |
| `SCN-DOMAIN-NNN`     | `SCN-DOMAIN-001`      | NNN is template; use actual number |

---

## 🔍 Format Validation Rules

### Pre-Commit Checks (Automatic)

When you `git commit` with staged scenario or PRD changes:

```bash
✓ SCN identifiers must be 3-digit zero-padded
✓ Risk tiers must be capitalized (Critical|High|Medium)
✓ REQ-P1 references must be 2-digit zero-padded
✓ No empty identifiers (REQ-P1-, SCN-DOMAIN-)
```

**If validation fails:**

```bash
ERROR: SCN identifiers must be 3-digit zero-padded (SCN-DOMAIN-NNN, not NNN)
# Fix the format, then commit again
```

### Script Checks (Run Manually)

```bash
# Validate PRD and scenarios
python3 tooling/scripts/governance/validate-prd-scenario-links.py

# Sync registry after scenario changes
./services/api/scripts/sync-registry.sh

# Both check identifier formats automatically
```

---

## 📋 Identifier Types at a Glance

### REQ-P1: What Must Be Built

```
Format:     REQ-P1-DOMAIN-NN
Example:    REQ-P1-TASK-01, REQ-P1-BOOK-05
Domains:    AUTH, BOOK, ADMIN, ASSIST, TASK, MATCH, PRICE, SAFE, NOTIF, KPI, COVER, CAT, MSG
Location:   docs/PRD.md (sections 11-12)
Numbering:  2-digit zero-padded (01-99 per domain)
```

### SCN: How to Test It

```
Format:     SCN-DOMAIN-NNN
Example:    SCN-TASK-001, SCN-BOOK-015
Domains:    AUTH, BOOK, TASK, ASSIST, MATCH, etc. (15 total)
Location:   tests/scenarios/<domain>.md
Numbering:  3-digit zero-padded (001-999 per domain)
Risk:       Critical | High | Medium (capitalized; no Low in Phase 1)
```

### NFR: Non-Functional Requirements

```
Format:     NFR-CATEGORY-NN
Example:    NFR-SEC-01, NFR-PERF-02
Categories: SEC, PERF, OBS, LOC, LEGAL, API, RELI
Location:   docs/PRD.md (section 12)
Note:       Informational; not directly tested via SCN
```

---

## 🚀 Common Workflows

### Add a New Requirement + Test

```bash
# 1. Edit docs/PRD.md, add REQ-P1-DOMAIN-NN
vim docs/PRD.md

# 2. Edit tests/scenarios/<domain>.md, add SCN-DOMAIN-NNN
vim tests/scenarios/<domain>.md

# 3. Stage both
git add docs/PRD.md tests/scenarios/<domain>.md

# 4. Commit (pre-commit hook validates format)
git commit -m "feat: add REQ-P1-DOMAIN-NN for [feature]"

# 5. Implement test (optional; can be done separately)
vim services/api/src/test/java/.../YourTests.java

# 6. Sync registry after test implementation
./services/api/scripts/sync-registry.sh
git add tests/registry.yaml
git commit -m "chore(registry): sync after SCN-DOMAIN-NNN implementation"
```

### Review Coverage

```bash
# Show requirements without scenarios
python3 tooling/scripts/governance/validate-prd-scenario-links.py

# Output example:
# warning: REQ-P1 requirements without high-or-critical scenario coverage:
#   REQ-P1-ADMIN-03, REQ-P1-ADMIN-04, ... (list of gaps)
```

### Update Scenario Format

```bash
# If you modify a scenario:
vim tests/scenarios/<domain>.md
./services/api/scripts/sync-registry.sh
git add tests/scenarios/<domain>.md tests/registry.yaml
git commit -m "chore(scenarios): update SCN-DOMAIN-NNN description"
```

---

## 🆘 Troubleshooting

### "Pre-commit hook failed: SCN identifiers must be 3-digit"

**Solution:** Change `SCN-TASK-1` to `SCN-TASK-001`

```bash
# Fix the file, then re-stage
vim tests/scenarios/task.md
git add tests/scenarios/task.md
git commit -m "fix: correct SCN numbering"
```

### "Risk tier must be capitalized"

**Solution:** Change `Risk: high` to `Risk: High`

```bash
# Capitalize the risk tier
vim tests/scenarios/<domain>.md  # Change "high" to "High"
git add tests/scenarios/<domain>.md
git commit -m "fix: capitalize Risk tier"
```

### "REQ-P1 must be 2-digit zero-padded"

**Solution:** Change `REQ-P1-AUTH-1` to `REQ-P1-AUTH-01`

```bash
# Add leading zero
# Then re-stage and commit
```

### Validation script says "FAIL"

**Solution:** Run with verbose output

```bash
python3 tooling/scripts/governance/validate-prd-scenario-links.py
# Output will show which scenarios/requirements don't match expected format
```

---

## 🎯 Identifier Policies

### Phase 1 Launch Constraints

- ✅ Only 3 risk tiers used: Critical, High, Medium
- ❌ "Low" risk is reserved for Phase 2+
- ✅ All REQ-P1 should have corresponding SCN (86% coverage target)
- ✅ All SCN must reference a live REQ-P1

### Numbering Space

| Type   | Format | Range   | Notes                                         |
| ------ | ------ | ------- | --------------------------------------------- |
| REQ-P1 | NN     | 01-99   | Per domain; request new domain if >99 needed  |
| SCN    | NNN    | 001-999 | Per domain; allows expansion to 999 scenarios |
| NFR    | NN     | 01-99   | Per category; informational                   |

### Exception Process

**To use a scenario without REQ-P1 or waive a requirement:**

1. Document in PRD with marker: `tasky:req-deferred REQ-P1-DOMAIN-NN`
2. Set scenario `override_status: waived` in registry
3. Add note explaining deferral
4. Get approval from Release Lead

---

## 📞 Questions?

- **"What's the difference between REQ-P1 and SCN?"**  
  REQ-P1 is the **requirement** (what to build). SCN is the **test scenario** (how to verify it).

- **"Can I use lowercase risk tiers?"**  
  No. Enforcement rejects anything not `Critical`, `High`, or `Medium`.

- **"What if I need requirement #100 in a domain?"**  
  Create a new domain category (e.g., `REQ-P1-EXTRA-01`). Don't force 3-digit format.

- **"Can scenarios reference multiple REQ-P1?"**  
  Yes, comma-separated: `**PRD:** REQ-P1-BOOK-01, REQ-P1-BOOK-02`. But prefer single-mapping.

- **"Who reviews my scenarios?"**  
  Scenario Curator (assigned by Release Lead). See code review checklist in `ENFORCEMENT-CHECKLIST.md`.

---

## 🔗 References

| Document                                               | Purpose                         |
| ------------------------------------------------------ | ------------------------------- |
| `README.md`                                            | Full overview and standards     |
| `ENFORCEMENT-CHECKLIST.md`                             | Validation rules & code review  |
| `REFERENCE-MAP.md`                                     | Cross-reference lookups         |
| `IMPLEMENTATION-STATUS.md`                             | Progress tracking & next phases |
| `../audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md` | Full audit report               |

---

**Enforcement Status:** ✅ Active  
**Last Updated:** 2026-04-24  
**Next Review:** 2026-05-24
