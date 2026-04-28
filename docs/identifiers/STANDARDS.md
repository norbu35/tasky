# Identifier Standards

Canonical rules for REQ-P1, SCN, NFR, and related frontend/design identifiers. Enforcement is active via pre-commit hooks and validation scripts.

## Formats

| Type   | Pattern            | Example          | Source                        | Numbering                               |
| ------ | ------------------ | ---------------- | ----------------------------- | --------------------------------------- |
| REQ-P1 | `REQ-P1-DOMAIN-NN` | `REQ-P1-AUTH-01` | `docs/PRD.md` (§11–12)        | 2-digit zero-padded                     |
| SCN    | `SCN-DOMAIN-NNN`   | `SCN-TASK-001`   | `tests/scenarios/<domain>.md` | 3-digit zero-padded                     |
| NFR    | `NFR-CATEGORY-NN`  | `NFR-SEC-01`     | `docs/PRD.md` (§12)           | 2-digit zero-padded; informational only |

**REQ-P1 domains:** AUTH, BOOK, ADMIN, ASSIST, TASK, MATCH, PRICE, SAFE, NOTIF, KPI, COVER, CAT, MSG  
**SCN domains:** ADMIN, ANALYTICS, ASSISTANCE, AUTH, BOOK, CATEGORY, CONTRACT, COVERAGE, DISPUTE, INTEGRATION, MESSAGING, NOTIFICATION, REVIEW, SECURITY, TASK, VERIFICATION
**NFR categories:** SEC, PERF, OBS, LOC, LEGAL, API, RELI

## Rules (Enforced by Pre-Commit + Scripts)

- REQ-P1 and NFR numbers are **2-digit** zero-padded: `REQ-P1-AUTH-01`, not `REQ-P1-AUTH-1`
- SCN numbers are **3-digit** zero-padded: `SCN-TASK-001`, not `SCN-TASK-1`
- Risk tier is **capitalized**: `Critical`, `High`, `Medium` - no `Low` in Phase 1
- Registry `status` values (lowercase): `covered` | `untested` | `waived` | `pending`
- Registry `override_status` must be a single keyword; use `notes` field for prose
- `@DisplayName` in Java tests must be exactly `"SCN-DOMAIN-NNN: <title from scenario>"`
- Each scenario must cite one or more live canonical requirement IDs from `docs/PRD.md`; use `REQ-P1` for launch behavior and `NFR` when the scenario is about a non-functional requirement

## Scenario Format

```markdown
## SCN-DOMAIN-NNN

**Risk:** Critical|High|Medium
**PRD:** REQ-P1-DOMAIN-NN or NFR-DOMAIN-NN
**Title:** Brief imperative statement

Given ...
When ...
Then ...
And ...
```

## Enforcement Points

| Enforcement         | File                                                        | What It Checks                                                                                  |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Pre-commit hook     | `.husky/pre-commit`                                         | SCN 3-digit, Risk capitalization, REQ-P1 2-digit on scenario/PRD commits                        |
| Scenario validation | `tooling/scripts/governance/validate-prd-scenario-links.py` | All scenario PRD refs resolve to live REQ-P1 or NFR IDs; warns on uncovered launch requirements |
| Registry sync       | `services/api/scripts/sync-registry.sh`                     | Parses `tests/scenarios/*.md` → generates `tests/registry.yaml`; rejects malformed entries      |

## Commands

```bash
# Validate PRD→scenario traceability
python3 tooling/scripts/governance/validate-prd-scenario-links.py

# Regenerate registry after scenario changes (must run before commit)
./services/api/scripts/sync-registry.sh
```

## Coverage State (2026-04-25)

This table tracks launch REQ-P1 coverage only. NFR and frontend/design identifiers are documented separately.

| Domain    | REQ count | Covered | Uncovered IDs |
| --------- | --------- | ------- | ------------- |
| AUTH      | 6         | 6       | —             |
| TASK      | 15        | 15      | —             |
| SAFE      | 18        | 18      | —             |
| MSG       | 5         | 5       | —             |
| BOOK      | 28        | 28      | —             |
| PRICE     | 8         | 8       | —             |
| MATCH     | 7         | 7       | —             |
| NOTIF     | 7         | 7       | —             |
| ASSIST    | 8         | 8       | —             |
| KPI       | 6         | 6       | —             |
| COVER     | 4         | 4       | —             |
| CAT       | 5         | 5       | —             |
| ADMIN     | 10        | 10      | —             |
| **Total** | **127**   | **127** | **0 gaps**    |

Coverage warnings are reported by `python3 tooling/scripts/governance/validate-prd-scenario-links.py`.

## Exception Process

To waive or defer a scenario:

1. Mark in PRD: `tasky:req-deferred REQ-P1-DOMAIN-NN` on the requirement line
2. Set `override_status: waived` in registry entry
3. Add deferral reason to the `notes` field

## Range Notation

`SCN-DOMAIN-001-009` is acceptable in reports and notes for grouping; not a canonical ID. The registry uses only individual `SCN-DOMAIN-NNN` keys.

## Frontend and Design Identifiers

| Kind                  | Pattern                       | Example                                                               |
| --------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Screen                | `SCR-[A-Z0-9]+-\d{3}`         | `SCR-P2-001`, `SCR-CUST-019`                                          |
| Journey               | `JRN-[A-Z]+-\d{2}`            | `JRN-CUST-01`, `JRN-INFRA-01`                                         |
| Scenario-backed test  | `SCN-DOMAIN-NNN`              | `SCN-AUTH-004: Valid Facebook OAuth token creates a CUSTOMER session` |
| Frontend technical ID | `TID-[A-Z]+-\d{3}-[A-Z0-9-]+` | `TID-TASK-070-WEB-TOKEN-BINDING`                                      |

Use `SCN-*` for frontend behavioral tests when an existing scenario is the source of truth for the behavior. Reserve `TID-*` for frontend-only technical checks that do not map to a single curated scenario.

## Related

- Scenario format and curation rules: `tests/scenarios/README.md`
- Coverage lookup tables: `docs/identifiers/REFERENCE-MAP.md`
- Full consistency audit: `docs/audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`
