# Identifier System Documentation

**Scope:** Tasky Phase 1 Launch  
**Last Updated:** 2026-04-23  
**Status:** Audit Complete; Ready for Enforcement Implementation

---

## Overview

This directory contains the complete identifier system for Tasky, covering requirements (REQ-P1), scenarios (SCN), and non-functional requirements (NFR). The documents here establish standards, track inconsistencies, and provide implementation guidance.

### Files in This Directory

| File                         | Purpose                                                                   | Audience                        |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| **REFERENCE-MAP.md**         | Cross-reference lookups between REQ-P1, SCN, NFR, and operational systems | Developers, Testers, Curators   |
| **ENFORCEMENT-CHECKLIST.md** | Implementation guide for validation rules and pre-commit hooks            | DevOps, Release Lead, Tech Lead |
| **STANDARDS.md** (coming)    | Canonical format definitions and naming rules                             | All contributors                |

### Related Documents

- **Detailed Audit:** `../audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md` — Findings, issues, and analysis
- **Scenario Format:** `../../tests/scenarios/README.md` — How to write test scenarios
- **PRD Structure:** `../../docs/PRD.md` — Source of requirements (section 1.4)
- **Registry Schema:** `../../tests/registry.yaml` — Authoritative scenario index
- **Validation Script:** `../../tooling/scripts/governance/validate-prd-scenario-links.py` — Enforcer

---

## Quick Start

### For Adding a New Requirement

1. Write `REQ-P1-DOMAIN-NN` in `docs/PRD.md` (2-digit zero-padded)
2. Write corresponding `SCN-DOMAIN-NNN` in `tests/scenarios/<domain>.md` (3-digit zero-padded)
3. Run `services/api/scripts/sync-registry.sh`
4. Implement test with `@DisplayName("SCN-DOMAIN-NNN: ...")`

### For Adding a New Scenario

1. Create or edit `tests/scenarios/<domain>.md`
2. Use format:

   ```markdown
   ## SCN-DOMAIN-NNN

   **Risk:** Critical|High|Medium
   **PRD:** REQ-P1-DOMAIN-NN
   **Title:** Brief description
   Given ... / When ... / Then ...
   ```

3. Run `services/api/scripts/sync-registry.sh` (auto-generates registry)
4. Implement test with matching @DisplayName

### For Code Review

Check `ENFORCEMENT-CHECKLIST.md` for the code review template.

---

## Identifier Types

### REQ-P1: Phase 1 Functional Requirements

**Format:** `REQ-P1-DOMAIN-NN`  
**Example:** `REQ-P1-TASK-01`, `REQ-P1-BOOK-03`  
**Domains:** AUTH, BOOK, ADMIN, ASSIST, TASK, MATCH, PRICE, SAFE, NOTIF, KPI, COVER, CAT, MSG

**Rules:**

- Always 2-digit zero-padded (01-99 per domain)
- Defined in `docs/PRD.md` (sections 11-12)
- Source of truth for what must be built
- Must have corresponding SCN for Phase 1 launch

### SCN: Test Scenarios

**Format:** `SCN-DOMAIN-NNN`  
**Example:** `SCN-TASK-001`, `SCN-BOOK-015`  
**Domains:** Same 15 domains plus ANALYTICS, INTEGRATION, SECURITY, SMOKE, CONTRACT, DISPUTE, MESSAGING, NOTIFICATION, REVIEW, VERIFICATION

**Rules:**

- Always 3-digit zero-padded (001-999 per domain)
- Defined in `tests/scenarios/<domain>.md`
- One scenario = one behavioral specification
- Links to one or more REQ-P1 (or exception with approval)
- Risk tier: Critical, High, or Medium (not Low in Phase 1)

### NFR: Non-Functional Requirements

**Format:** `NFR-CATEGORY-NN`  
**Example:** `NFR-SEC-01`, `NFR-PERF-02`  
**Categories:** SEC (Security), PERF (Performance), OBS (Observability), LOC (Localization), LEGAL, API, RELI (Reliability)

**Rules:**

- Informational; not directly tested via SCN
- Defined in `docs/PRD.md` (section 12)
- Referenced by domains/areas for context
- Typically 1 per NFR-category

---

## Current State (2026-04-23)

| Metric                 | Count   | Status                         |
| ---------------------- | ------- | ------------------------------ |
| REQ-P1 Requirements    | 128     | ✓ Defined                      |
| SCN Scenarios          | 143     | ✓ Defined                      |
| NFR Requirements       | 25      | ✓ Defined                      |
| Covered Requirements   | 110/128 | 🟡 86%                         |
| Implemented Tests      | 123/143 | 🟡 86%                         |
| Registry Status Errors | 1       | 🔴 Critical (corrupted status) |
| Uncovered Requirements | 18      | 🟡 High priority               |
| Validation Script Gaps | 3       | 🟡 Medium priority             |

---

## Key Inconsistencies Found

### Critical

1. **Registry Status Corruption** — One entry has malformed status value (`waivedpendingtasker-suspensionfeature`)

### High Priority

2. **Validation Script Mismatch** — Regex patterns allow flexible digit counts instead of enforcing 2-digit/3-digit standards
3. **Uncovered Requirements** — 18 REQ-P1 requirements lack corresponding test scenarios (38 if including gaps)
4. **Risk Tier Policy Gap** — Validation allows "low" risk but Phase 1 uses only Critical/High/Medium

### Medium Priority

5. **Status Registry Inconsistency** — 139 scenarios with null status; need classification
6. **NFR Usage** — 6 NFR references in scenarios (should be REQ-P1 only)

See full audit: `../audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`

---

## Implementation Timeline

### Phase 1: This Week (2026-04-24)

- [ ] Fix registry status corruption
- [ ] Review and approve enforcement standards
- [ ] Brief team on identifier standards

### Phase 2: Next 2 Weeks (2026-04-30)

- [ ] Update validation scripts (regex enforcement)
- [ ] Classify 139 null-status scenarios
- [ ] Create Linear/Jira tickets for coverage gaps

### Phase 3: Next Sprint (2026-05-07)

- [ ] Scenario curator fills critical coverage gaps
- [ ] Add pre-commit hooks for enforcement
- [ ] Integrate into CI/CD pipeline

### Phase 4: Ongoing

- [ ] Monitor PRs for compliance
- [ ] Quarterly audits of identifier health
- [ ] Expand to Phase 2 requirements

---

## Validation & Enforcement

### Automated Checks

**Pre-Commit Hooks:**

- `git add tests/scenarios/*.md` — Validate SCN format, Risk, PRD ref
- `git add docs/PRD.md` — Validate REQ-P1 format, co-stage scenarios if changed

**CI/CD Jobs:**

- `ci-scenario-validation` — Run sync-registry, verify no errors
- `ci-prd-scenario-links` — Check all scenario PRD refs are live
- `ci-coverage-report` — Warn on uncovered REQ-P1 requirements

### Manual Gates

**Code Review:**

- See ENFORCEMENT-CHECKLIST.md for review checklist
- Scenario curator approval required for scenario changes
- Tech lead approval required for coverage gap exceptions

---

## FAQ

**Q: What's the difference between REQ-P1 and SCN?**  
A: REQ-P1 is _what_ must be built (requirement). SCN is _how_ to test it (behavior specification). Many-to-many: one REQ can have multiple SCN; one SCN can cover multiple REQ (rare).

**Q: Can I use single-digit REQ-P1 IDs like REQ-P1-AUTH-1?**  
A: No. Standards require 2-digit zero-padded format (REQ-P1-AUTH-01). Validation scripts will be updated to enforce this.

**Q: What if a requirement doesn't fit the 2-digit space (>99)?**  
A: Request a new domain category (e.g., REQ-P1-EXTRA-01). Avoid reusing domains or abbreviating.

**Q: Can scenarios reference multiple REQ-P1 IDs?**  
A: Yes, comma-separated: `**PRD:** REQ-P1-BOOK-01, REQ-P1-BOOK-02`. But prefer single-mapping; multi-mapping often indicates scope creep.

**Q: What about "Low" risk scenarios?**  
A: Not used in Phase 1 launch. Reserved for Phase 2+. If adding low-risk scenario, requires PRD/strategy review.

**Q: How often is the registry updated?**  
A: After every scenario change. Run `services/api/scripts/sync-registry.sh` before commit. It's idempotent and regenerates from source.

**Q: What's the deferred marker for?**  
A: To track Phase 1 requirements that are intentionally deferred to Phase 2+. Marker: `tasky:req-deferred REQ-P1-XXX-NN` in PRD (in line with requirement).

---

## Tools & Scripts

| Tool                | Location                                                    | Command                                   | Purpose                            |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| **Sync Registry**   | `services/api/scripts/sync-registry.sh`                     | `./services/api/scripts/sync-registry.sh` | Parse scenarios, generate registry |
| **Validate Links**  | `tooling/scripts/governance/validate-prd-scenario-links.py` | `python3 validate-prd-scenario-links.py`  | Verify PRD scenario references     |
| **Coverage Report** | TBD                                                         | (coming)                                  | Find uncovered REQ-P1              |
| **Identifier Lint** | `.husky/pre-commit`                                         | `git commit`                              | Validate format on commit          |

---

## Maintenance

### Weekly Tasks

- Monitor PRs for identifier compliance
- Escalate any validation errors

### Monthly Tasks

- Audit registry status counts
- Review coverage gap backlog

### Quarterly Tasks

- Full identifier health audit
- Update this documentation

### Maintainers

- **Scenario Curator:** @(assigned by team)
- **Release Lead:** Enforces enforcement gates
- **DevOps:** Maintains validation scripts

---

## References

- **Scenarios:** `../../tests/scenarios/README.md`
- **PRD:** `../../docs/PRD.md` (sections 1, 11, 12)
- **Architecture:** `../../docs/architecture/AGENTS.md`
- **Operations:** `../../docs/ops/diagrams/test-pipeline.md`

---

## Document History

| Date       | Author       | Change                                  |
| ---------- | ------------ | --------------------------------------- |
| 2026-04-23 | Audit Tool   | Initial audit; found 18 inconsistencies |
| 2026-04-23 | Audit Tool   | Added tooling script analysis           |
| (TBD)      | Release Lead | Enforcement implementation              |

---

_For questions, contact the scenario curator or release lead._
