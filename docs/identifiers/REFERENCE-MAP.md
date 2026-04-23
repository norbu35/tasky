# Identifier Reference Map

**Purpose:** Cross-reference guide for mapping between REQ-P1, SCN, NFR, and operational systems  
**Generated:** 2026-04-23  
**Frequency:** Regenerated after scenario curation or PRD changes

---

## 1. Quick Lookup Tables

### REQ-P1 → SCN Coverage Matrix

| REQ-P1 Domain | Total REQ | Covered by SCN | Coverage % | Uncovered IDs | Priority            |
| ------------- | --------- | -------------- | ---------- | ------------- | ------------------- |
| AUTH          | 6         | 6              | 100%       | None          | ✓ Complete          |
| BOOK          | 28        | 26             | 93%        | 27, 28        | 🔴 High             |
| ADMIN         | 10        | 4              | 40%        | 3, 4, 6, 7, 8 | 🔴 Critical         |
| ASSIST        | 8         | 6              | 75%        | 2, 8          | 🟡 Medium           |
| TASK          | 15        | 15             | 100%       | None          | ✓ Complete          |
| MATCH         | 7         | 6              | 86%        | 4             | 🟡 Medium           |
| PRICE         | 8         | 7              | 88%        | 6             | 🟡 Medium           |
| SAFE          | 18        | 18             | 100%       | None          | ✓ Complete          |
| NOTIF         | 7         | 6              | 86%        | 3             | 🟡 Medium           |
| KPI           | 6         | 4              | 67%        | 2, 5, 6       | 🟡 Medium           |
| COVER         | 6         | 4              | 67%        | 1, 6          | 🟡 Medium           |
| CAT           | 5         | 3              | 60%        | 2, 3          | 🟡 Medium           |
| MSG           | 5         | 5              | 100%       | None          | ✓ Complete          |
| **TOTAL**     | **128**   | **110**        | **86%**    | **18**        | **🔴 Fix Critical** |

---

### SCN → REQ-P1 Domain Map

| SCN Domain   | Scenario Count | Primary REQ-P1 Domain | Secondary References | Test Types               |
| ------------ | -------------- | --------------------- | -------------------- | ------------------------ |
| ANALYTICS    | 5              | KPI                   | TASK, BOOK, ASSIST   | domain-unit              |
| ASSIST       | 8              | ASSIST                | MATCH, TASK          | domain-unit              |
| AUTH         | 15             | AUTH                  | —                    | domain-unit, integration |
| BOOK         | 27             | BOOK                  | TASK, MATCH, PRICE   | domain-unit, integration |
| CATEGORY     | 8              | CAT                   | TASK                 | domain-unit              |
| CONTRACT     | 4              | (special)             | MSG, NOTIF           | (HTTP status codes)      |
| DISPUTE      | 8              | (none directly)       | BOOK, SAFE           | domain-unit              |
| INTEGRATION  | 1              | (cross-system)        | AUTH, BOOK, TASK     | integration              |
| MESSAGING    | 5              | MSG                   | BOOK, NOTIF          | domain-unit              |
| NOTIFICATION | 7              | NOTIF                 | —                    | domain-unit              |
| REVIEW       | 6              | SAFE                  | BOOK, NOTIF          | domain-unit              |
| SECURITY     | 13             | SAFE, NFR-SEC         | AUTH                 | domain-unit, integration |
| SMOKE        | 5              | (regression)          | TASK, BOOK           | integration              |
| TASK         | 29             | TASK                  | MATCH, ASSIST        | domain-unit, integration |
| VERIFICATION | 5              | (SAFE adjacent)       | SAFE, AUTH           | domain-unit              |
| **TOTAL**    | **143**        | —                     | —                    | —                        |

---

## 2. Detailed Coverage Analysis

### High Priority Gaps (Implement First)

#### ADMIN Requirements (40% Coverage)

```
REQ-P1-ADMIN-01 ✓ SCN-? (covered)
REQ-P1-ADMIN-02 ✓ SCN-? (covered)
REQ-P1-ADMIN-03 ✗ NO SCENARIO (Verification queue SLA)
REQ-P1-ADMIN-04 ✗ NO SCENARIO (Verification decision audit trail)
REQ-P1-ADMIN-05 ✓ SCN-? (covered)
REQ-P1-ADMIN-06 ✗ NO SCENARIO (Concierge dispatch tools)
REQ-P1-ADMIN-07 ✗ NO SCENARIO (Early-stage reliability tools)
REQ-P1-ADMIN-08 ✗ NO SCENARIO (Assisted distribution module)
REQ-P1-ADMIN-09 ✓ SCN-? (covered)
REQ-P1-ADMIN-10 ✓ SCN-? (covered)

ACTION: Create 4 new scenarios covering queue management and concierge tools
```

#### COVERAGE Requirements (67% Coverage)

```
REQ-P1-COVER-01 ✗ NO SCENARIO (Ulaanbaatar geographic boundary)
REQ-P1-COVER-02 ✓ SCN-? (covered)
REQ-P1-COVER-05 ✓ SCN-? (covered)
REQ-P1-COVER-06 ✗ NO SCENARIO (Coverage reporting and metrics)

ACTION: Add 2 scenarios for geography validation and coverage metrics
```

#### CATEGORY Requirements (60% Coverage)

```
REQ-P1-CAT-01 ✓ SCN-? (covered)
REQ-P1-CAT-02 ✗ NO SCENARIO (Category-specific templates)
REQ-P1-CAT-03 ✗ NO SCENARIO (Template version management)
REQ-P1-CAT-04 ✓ SCN-? (covered)
REQ-P1-CAT-05 ✓ SCN-? (covered)

ACTION: Add 2 scenarios for template management
```

---

### Medium Priority Gaps

#### ASSIST Requirements (75% Coverage)

```
Missing: REQ-P1-ASSIST-02 (System-assisted outcome classification)
Missing: REQ-P1-ASSIST-08 (Manual rescue without customer intervention)
```

#### BOOK Requirements (93% Coverage)

```
Missing: REQ-P1-BOOK-27 (Silent customer auto-complete timeout)
Missing: REQ-P1-BOOK-28 (Booking state recovery on crash)
```

#### MATCH Requirements (86% Coverage)

```
Missing: REQ-P1-MATCH-04 (Application withdrawal by tasker)
```

#### NOTIF Requirements (86% Coverage)

```
Missing: REQ-P1-NOTIF-03 (Tasker notification on verification decision)
```

#### PRICE Requirements (88% Coverage)

```
Missing: REQ-P1-PRICE-06 (Pricing audit trail)
```

#### KPI Requirements (67% Coverage)

```
Missing: REQ-P1-KPI-02 (Self-serve completion metric)
Missing: REQ-P1-KPI-05 (Assisted intervention tracking)
Missing: REQ-P1-KPI-06 (Customer satisfaction tracking)
```

---

## 3. NFR → REQ-P1 Alignment

**Non-Functional Requirements (not directly testable via SCN)**

| NFR ID       | Category      | Phase 1 Status | Related REQ-P1 | Notes                    |
| ------------ | ------------- | -------------- | -------------- | ------------------------ |
| NFR-PERF-01  | Performance   | Required       | TASK, BOOK     | < 2s booking flow        |
| NFR-PERF-02  | Performance   | Required       | MATCH, ASSIST  | < 3s matching response   |
| NFR-SEC-01   | Security      | Required       | AUTH, SAFE     | Token handling           |
| NFR-SEC-02   | Security      | Required       | MSG, NOTIF     | Data leak prevention     |
| NFR-SEC-03   | Security      | Required       | PRICE          | Payment PCI compliance   |
| NFR-SEC-04   | Security      | Required       | AUTH           | OWASP top 10             |
| NFR-SEC-05   | Security      | Required       | SAFE           | SQL injection prevention |
| NFR-OBS-01   | Observability | Required       | ADMIN          | Event logging            |
| NFR-OBS-02   | Observability | Required       | KPI            | Metric collection        |
| NFR-OBS-03   | Observability | Required       | BOOK           | Trace correlation        |
| NFR-LOC-01   | Localization  | Phase 2        | TASK, MSG      | Mongol/English support   |
| NFR-LOC-02   | Localization  | Phase 2        | NOTIF          | Regional formatting      |
| NFR-LOC-03   | Localization  | Phase 2        | PRICE          | Currency handling        |
| NFR-LEGAL-01 | Legal         | Phase 1        | SAFE, NOTIF    | GDPR compliance          |
| NFR-LEGAL-02 | Legal         | Phase 1        | AUTH, BOOK     | Consent tracking         |
| NFR-LEGAL-03 | Legal         | Phase 1        | PRICE          | Payment terms            |
| NFR-API-01   | API Design    | Required       | (all)          | OpenAPI 3.1              |
| NFR-API-02   | API Design    | Required       | (all)          | Versioning strategy      |
| NFR-API-03   | API Design    | Required       | (all)          | Error response format    |
| NFR-API-04   | API Design    | Required       | (all)          | Rate limiting            |
| NFR-RELI-01  | Reliability   | Required       | BOOK, ASSIST   | Retry logic              |
| NFR-RELI-02  | Reliability   | Required       | MATCH          | Timeout handling         |
| NFR-RELI-03  | Reliability   | Required       | PRICE          | Idempotency              |
| NFR-RELI-04  | Reliability   | Required       | MSG            | Message delivery         |

---

## 4. SCN Risk Tier Distribution

### Risk Distribution by Domain

```
ANALYTICS:
  Critical: 0    High: 5    Medium: 0    Total: 5

ASSIST:
  Critical: 0    High: 7    Medium: 1    Total: 8

AUTH:
  Critical: 4    High: 9    Medium: 2    Total: 15

BOOK:
  Critical: 7    High: 15   Medium: 5    Total: 27

CATEGORY:
  Critical: 0    High: 7    Medium: 1    Total: 8

CONTRACT:
  Critical: 0    High: 3    Medium: 1    Total: 4

DISPUTE:
  Critical: 0    High: 8    Medium: 0    Total: 8

INTEGRATION:
  Critical: 0    High: 1    Medium: 0    Total: 1

MESSAGING:
  Critical: 0    High: 4    Medium: 1    Total: 5

NOTIFICATION:
  Critical: 0    High: 6    Medium: 1    Total: 7

REVIEW:
  Critical: 0    High: 5    Medium: 1    Total: 6

SECURITY:
  Critical: 7    High: 6    Medium: 0    Total: 13

SMOKE (Regression):
  Critical: 1    High: 4    Medium: 0    Total: 5

TASK:
  Critical: 4    High: 20   Medium: 5    Total: 29

VERIFICATION:
  Critical: 0    High: 4    Medium: 1    Total: 5

TOTAL:
  Critical: 23   High: 104   Medium: 18   Total: 145
```

**Observation:** Critical tier concentrated in AUTH, BOOK, SECURITY, SMOKE, and TASK. No Low-risk scenarios in Phase 1.

---

## 5. Test Type Distribution

| Test Type       | Count | Domains                           | Purpose                                                             |
| --------------- | ----- | --------------------------------- | ------------------------------------------------------------------- |
| **domain-unit** | ~110  | All                               | Single-domain behavioral specifications; mock external dependencies |
| **integration** | ~20   | AUTH, BOOK, TASK, SECURITY, SMOKE | Cross-domain flows; real/test double services                       |
| **medium-unit** | ~10   | (misc)                            | Mid-layer composition; some real components, some mocks             |

---

## 6. Registry Status Summary

| Status       | Count | Meaning                                | Action                       |
| ------------ | ----- | -------------------------------------- | ---------------------------- |
| **covered**  | 123   | Scenario implemented; test exists      | None (verify mutation score) |
| **untested** | 17    | Scenario defined; test not implemented | Implement                    |
| **waived**   | 0     | Scenario intentionally deferred        | (none currently)             |
| **pending**  | 0     | Scenario queued for curation           | (none currently)             |
| **null**     | 139   | Status not assigned                    | Classify (urgent)            |

**Action:** Classify 139 null-status scenarios as covered/untested within 1 week.

---

## 7. Cross-Reference Examples

### Example 1: REQ-P1-TASK-01 (Post a Task)

```
REQ-P1-TASK-01: Customer can post a task in one of the 5 categories
  ↓
Covered by scenario(s):
  - SCN-TASK-001: Customer posts task with all required fields
  - SCN-TASK-002: Customer posts task with optional fields
  - SCN-CATEGORY-001: Task matches correct category schema

Related NFR:
  - NFR-PERF-01 (< 2s response time)
  - NFR-API-01 (OpenAPI spec)

Test Status:
  - Status: covered
  - Test Type: domain-unit (TaskService)
  - Mutation Kill Rate: 75%

Risk Tier:
  - SCN-TASK-001: High
  - SCN-TASK-002: High
  - SCN-CATEGORY-001: High
```

### Example 2: REQ-P1-ADMIN-03 (Verification Queue SLA)

```
REQ-P1-ADMIN-03: Admin verification queue has SLA tracking
  ↓
Covered by scenario(s):
  ✗ NO SCENARIO DEFINED

Related Requirements:
  - REQ-P1-SAFE-01 (Verification process)
  - REQ-P1-ADMIN-01 (Admin operations)

Related NFR:
  - NFR-OBS-01 (Event logging)
  - NFR-RELI-01 (Retry logic)

Action Required:
  Create SCN-ADMIN-003: Verification SLA tracking and alerting
  Risk: Critical
  Test Type: integration (AdminAPI + VerificationService)
```

---

## 8. Lookup by Scenario ID

Use this section to find REQ-P1 mappings for any SCN:

### SCN-TASK-\* Domain

```
SCN-TASK-001  → REQ-P1-TASK-01
SCN-TASK-002  → REQ-P1-TASK-02
SCN-TASK-003  → REQ-P1-TASK-03
SCN-TASK-004  → REQ-P1-TASK-04
SCN-TASK-005  → REQ-P1-TASK-05
SCN-TASK-006  → REQ-P1-TASK-06
SCN-TASK-007  → REQ-P1-TASK-07
SCN-TASK-008  → REQ-P1-TASK-08
SCN-TASK-009  → REQ-P1-TASK-09
SCN-TASK-010  → REQ-P1-TASK-10
... (see tests/registry.yaml for complete mapping)
```

### SCN-BOOK-\* Domain

```
SCN-BOOK-001  → REQ-P1-BOOK-01
SCN-BOOK-002  → REQ-P1-BOOK-02
... (see tests/registry.yaml for complete mapping)
```

**Full List:** See `tests/registry.yaml` for authoritative mapping (auto-generated by sync-registry.sh)

---

## 9. Identifier Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   docs/PRD.md (Source of Truth)                  │
│                                                                   │
│  Section 11: Functional Requirements                             │
│  ├─ 11.2 Auth (REQ-P1-AUTH-01..06)                             │
│  ├─ 11.3 Roles (REQ-P1-SAFE-01..18)                            │
│  ├─ 11.5 Task Posting (REQ-P1-TASK-01..15)                     │
│  ├─ 11.8 Matching (REQ-P1-MATCH-01..07)                        │
│  └─ ...                                                          │
│                                                                   │
│  Section 12: Non-Functional Requirements                         │
│  ├─ Performance (NFR-PERF-01..02)                              │
│  ├─ Security (NFR-SEC-01..05)                                  │
│  ├─ Observability (NFR-OBS-01..03)                             │
│  └─ ...                                                          │
└──────────────┬──────────────────────────────────────────────────┘
               │ References
               ↓
┌─────────────────────────────────────────────────────────────────┐
│            tests/scenarios/<domain>.md (Behavioral Specs)        │
│                                                                   │
│  ## SCN-AUTH-001                                                 │
│  **Risk:** Critical                                              │
│  **PRD:** REQ-P1-AUTH-01                                        │
│  **Title:** Dev auth enabled in production throws               │
│  Given/When/Then...                                             │
│                                                                   │
│  ## SCN-AUTH-002                                                 │
│  **Risk:** Critical                                              │
│  **PRD:** REQ-P1-AUTH-06                                        │
│  ...                                                             │
└──────────────┬──────────────────────────────────────────────────┘
               │ Parsed by sync-registry.sh
               ↓
┌─────────────────────────────────────────────────────────────────┐
│              tests/registry.yaml (Canonical Index)              │
│                                                                   │
│  scenarios:                                                      │
│    SCN-AUTH-001:                                                │
│      prd_ref: REQ-P1-AUTH-01                                   │
│      risk: critical                                             │
│      status: covered                                            │
│      test_type: domain-unit                                     │
│      mutation_kill_rate: 95                                     │
│                                                                   │
│    SCN-AUTH-002:                                                │
│      prd_ref: REQ-P1-AUTH-06                                   │
│      ...                                                         │
└──────────────┬──────────────────────────────────────────────────┘
               │ Referenced by @DisplayName in Java tests
               ↓
┌─────────────────────────────────────────────────────────────────┐
│         services/api/src/test/java (Test Implementation)        │
│                                                                   │
│  public class AuthScenarioTests {                               │
│    @Test                                                         │
│    @DisplayName("SCN-AUTH-001: Dev auth...")                   │
│    void devAuthEnabledThrows() { ... }                         │
│                                                                   │
│    @Test                                                         │
│    @DisplayName("SCN-AUTH-002: Phase 0-1 OTP...")              │
│    void otpDisabledReturns403() { ... }                        │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Identifier Lifecycle

```
1. Requirement Definition
   Write REQ-P1-DOMAIN-NN in docs/PRD.md
   Include rationale, acceptance criteria, related NFR

2. Scenario Curation
   Create SCN-DOMAIN-NNN in tests/scenarios/<domain>.md
   Link PRD reference, specify risk tier, write Given/When/Then

3. Registry Sync
   Run: services/api/scripts/sync-registry.sh
   Updates: tests/registry.yaml (auto-generated)
   Validates: All SCN and PRD refs exist and are valid

4. Test Implementation
   Implement @DisplayName("SCN-DOMAIN-NNN: ...")
   Add @Test method in services/api/src/test/java

5. Mutation Testing
   Mutation engine runs against test
   Measures kill rate (% of mutations caught)
   Updates registry.yaml with kill_rate

6. Coverage Monitoring
   CI/CD checks: All REQ-P1 have SCN coverage
   CI/CD checks: All SCN reference live REQ-P1
   Reports: Coverage gaps and low-kill tests
```

---

## 11. Quick Fixes Reference

| Issue                     | File                | Pattern                                 | Fix                                   |
| ------------------------- | ------------------- | --------------------------------------- | ------------------------------------- |
| Single-digit REQ-P1       | docs/PRD.md         | `REQ-P1-AUTH-1`                         | Change to `REQ-P1-AUTH-01`            |
| Single-digit SCN          | tests/scenarios/    | `SCN-TASK-1`                            | Change to `SCN-TASK-001`              |
| Lowercase risk            | tests/scenarios/    | `Risk: high`                            | Change to `Risk: High`                |
| Malformed registry status | tests/registry.yaml | `waivedpendingtasker-suspensionfeature` | Fix to `waived` + move text to notes  |
| Missing PRD ref           | tests/scenarios/    | No `**PRD:** REQ-P1-*`                  | Add PRD reference                     |
| Empty identifier          | (any)               | `REQ-P1-$` or `SCN-DOMAIN-$`            | Fill in missing suffix or delete line |

---

## 12. Tools & Scripts

| Tool            | Location                                | Purpose                            | Command                                   |
| --------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------- |
| Sync Registry   | `services/api/scripts/sync-registry.sh` | Parse scenarios, generate registry | `./services/api/scripts/sync-registry.sh` |
| Validate Links  | `(TBD)`                                 | Verify PRD scenario references     | `python3 validate-prd-scenario-links.py`  |
| Coverage Report | `(TBD)`                                 | Find uncovered REQ-P1              | `python3 coverage-report.py`              |
| Identifier Lint | `.husky/pre-commit`                     | Enforce format in commit           | Runs on `git commit`                      |

---

## References

- **Full Audit:** `docs/audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`
- **Enforcement:** `docs/identifiers/ENFORCEMENT-CHECKLIST.md`
- **Scenario Format:** `tests/scenarios/README.md`
- **Registry Schema:** `tests/registry.yaml` (header)
- **PRD:** `docs/PRD.md` (section 1.4 Alignment Criteria)

---

_Last Generated: 2026-04-23_  
_Next Update: After scenario curation or PRD changes_  
_Maintain by: Scenario Curator + Release Lead_
