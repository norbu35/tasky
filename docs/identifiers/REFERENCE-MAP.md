# Identifier Reference Map

Coverage tables for REQ-P1 and NFR → SCN traceability. For rules and enforcement, see `STANDARDS.md`.

## REQ-P1 → SCN Coverage Matrix

| REQ-P1 Domain | Total   | Covered | Uncovered IDs | Priority |
| ------------- | ------- | ------- | ------------- | -------- |
| AUTH          | 6       | 6       | —             | ✓        |
| TASK          | 15      | 15      | —             | ✓        |
| SAFE          | 18      | 18      | —             | ✓        |
| MSG           | 5       | 5       | —             | ✓        |
| BOOK          | 28      | 28      | —             | ✓        |
| PRICE         | 8       | 8       | —             | ✓        |
| MATCH         | 7       | 7       | —             | ✓        |
| NOTIF         | 7       | 7       | —             | ✓        |
| ASSIST        | 8       | 8       | —             | ✓        |
| KPI           | 6       | 6       | —             | ✓        |
| COVER         | 4       | 4       | —             | ✓        |
| CAT           | 5       | 5       | —             | ✓        |
| ADMIN         | 10      | 10      | —             | ✓        |
| **Total**     | **127** | **127** | **0**         |          |

## SCN Domain → REQ-P1 Domain Map

| SCN Domain   | Scenarios | Primary Requirement IDs      | Test Type                |
| ------------ | --------- | ---------------------------- | ------------------------ |
| ADMIN        | 5         | ADMIN                        | domain-unit              |
| ANALYTICS    | 6         | KPI                          | domain-unit              |
| ASSISTANCE   | 10        | ASSIST                       | domain-unit              |
| AUTH         | 12        | AUTH                         | domain-unit, integration |
| BOOK         | 30        | BOOK, MATCH, PRICE           | domain-unit, integration |
| CATEGORY     | 15        | CAT, ADMIN                   | domain-unit              |
| CONTRACT     | 4         | NFR-API-02                   | integration              |
| COVERAGE     | 1         | COVER                        | domain-unit              |
| DISPUTE      | 8         | BOOK, SAFE                   | domain-unit              |
| INTEGRATION  | 5         | AUTH, BOOK, TASK, NFR-API-02 | integration              |
| MESSAGING    | 5         | MSG                          | domain-unit              |
| NOTIFICATION | 8         | NOTIF                        | domain-unit              |
| REVIEW       | 7         | SAFE                         | domain-unit              |
| SECURITY     | 12        | SAFE, NFR-SEC                | domain-unit, integration |
| TASK         | 33        | TASK, MATCH, PRICE, SAFE     | domain-unit, integration |
| VERIFICATION | 5         | SAFE, ADMIN                  | domain-unit              |
| **Total**    | **166**   |                              |                          |

## NFR → Phase 1 Status

| NFR Domain | IDs   | Phase 1 Status | Related REQ-P1     |
| ---------- | ----- | -------------- | ------------------ |
| SEC        | 01–05 | Required       | AUTH, SAFE         |
| PERF       | 01–02 | Required       | TASK, BOOK, MATCH  |
| OBS        | 01–03 | Required       | ADMIN, KPI         |
| API        | 01–04 | Required       | (all)              |
| RELI       | 01–04 | Required       | BOOK, MATCH, MSG   |
| LEGAL      | 01–03 | Required       | SAFE, AUTH         |
| LOC        | 01–03 | Phase 2+       | TASK, NOTIF, PRICE |

## Registry State (2026-04-25)

| Status   | Count | Meaning                                    |
| -------- | ----- | ------------------------------------------ |
| covered  | 145   | Test implemented                           |
| untested | 21    | Scenario defined; test pending             |
| waived   | 0     | No active waivers in the live registry     |
| null     | 0     | No uncategorized rows in the live registry |
