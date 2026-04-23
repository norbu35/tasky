# Identifier Standards

Canonical rules for REQ-P1, SCN, and NFR identifiers. Enforcement is active via pre-commit hooks and validation scripts.

## Formats

| Type   | Pattern            | Example          | Source                        | Numbering                               |
| ------ | ------------------ | ---------------- | ----------------------------- | --------------------------------------- |
| REQ-P1 | `REQ-P1-DOMAIN-NN` | `REQ-P1-AUTH-01` | `docs/PRD.md` (§11–12)        | 2-digit zero-padded                     |
| SCN    | `SCN-DOMAIN-NNN`   | `SCN-TASK-001`   | `tests/scenarios/<domain>.md` | 3-digit zero-padded                     |
| NFR    | `NFR-CATEGORY-NN`  | `NFR-SEC-01`     | `docs/PRD.md` (§12)           | 2-digit zero-padded; informational only |

**REQ-P1 domains:** AUTH, BOOK, ADMIN, ASSIST, TASK, MATCH, PRICE, SAFE, NOTIF, KPI, COVER, CAT, MSG  
**SCN domains:** AUTH, BOOK, TASK, ASSIST, MATCH, CATEGORY, ANALYTICS, SECURITY, DISPUTE, NOTIFICATION, MESSAGING, REVIEW, VERIFICATION, CONTRACT, SMOKE, INTEGRATION  
**NFR categories:** SEC, PERF, OBS, LOC, LEGAL, API, RELI

## Rules (Enforced by Pre-Commit + Scripts)

- REQ-P1 and NFR numbers are **2-digit** zero-padded: `REQ-P1-AUTH-01`, not `REQ-P1-AUTH-1`
- SCN numbers are **3-digit** zero-padded: `SCN-TASK-001`, not `SCN-TASK-1`
- Risk tier is **capitalized**: `Critical`, `High`, `Medium` — no `Low` in Phase 1
- Registry `status` values (lowercase): `covered` | `untested` | `waived` | `pending`
- Registry `override_status` must be a single keyword; use `notes` field for prose
- `@DisplayName` in Java tests must be exactly `"SCN-DOMAIN-NNN: <title from scenario>"`
- Each scenario must cite a live REQ-P1 ID; use `tasky:req-deferred REQ-P1-DOMAIN-NN` in PRD to mark deferred

## Scenario Format

```markdown
## SCN-DOMAIN-NNN

**Risk:** Critical|High|Medium
**PRD:** REQ-P1-DOMAIN-NN
**Title:** Brief imperative statement

Given ...
When ...
Then ...
And ...
```

## Enforcement Points

| Enforcement         | File                                                        | What It Checks                                                                             |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Pre-commit hook     | `.husky/pre-commit`                                         | SCN 3-digit, Risk capitalization, REQ-P1 2-digit on scenario/PRD commits                   |
| Scenario validation | `tooling/scripts/governance/validate-prd-scenario-links.py` | All scenario PRD refs resolve to live REQ-P1 IDs; warns on uncovered launch requirements   |
| Registry sync       | `services/api/scripts/sync-registry.sh`                     | Parses `tests/scenarios/*.md` → generates `tests/registry.yaml`; rejects malformed entries |

## Commands

```bash
# Validate PRD→scenario traceability
python3 tooling/scripts/governance/validate-prd-scenario-links.py

# Regenerate registry after scenario changes (must run before commit)
./services/api/scripts/sync-registry.sh
```

## Coverage State (2026-04-24)

| Domain    | REQ count | Covered       | Uncovered IDs      |
| --------- | --------- | ------------- | ------------------ |
| AUTH      | 6         | 6             | —                  |
| TASK      | 15        | 15            | —                  |
| SAFE      | 18        | 18            | —                  |
| MSG       | 5         | 5             | —                  |
| BOOK      | 28        | 26            | 27, 28             |
| PRICE     | 8         | 7             | 06                 |
| MATCH     | 7         | 6             | 04                 |
| NOTIF     | 7         | 6             | 03                 |
| ASSIST    | 8         | 6             | 02, 08             |
| KPI       | 6         | 4             | 02, 05, 06         |
| COVER     | 6         | 4             | 01, 06             |
| CAT       | 5         | 3             | 02, 03             |
| ADMIN     | 10        | 4             | 03, 04, 06, 07, 08 |
| **Total** | **128**   | **110 (86%)** | **18 gaps**        |

Additional: `REQ-P1-SAFE-04/13/17`, `REQ-P1-TASK-11/12/13/14`, `REQ-P1-PRICE-08`, `REQ-P1-ADMIN-10` lack high/critical coverage (coverage warnings, not failures).

## Exception Process

To waive or defer a scenario:

1. Mark in PRD: `tasky:req-deferred REQ-P1-DOMAIN-NN` on the requirement line
2. Set `override_status: waived` in registry entry
3. Add deferral reason to the `notes` field

## Range Notation

`SCN-DOMAIN-001-009` is acceptable in reports and notes for grouping; not a canonical ID. The registry uses only individual `SCN-DOMAIN-NNN` keys.

## Related

- Scenario format and curation rules: `tests/scenarios/README.md`
- Coverage lookup tables: `docs/identifiers/REFERENCE-MAP.md`
- Full consistency audit: `docs/audits/IDENTIFIER-CONSISTENCY-AUDIT-2026-04-23.md`
