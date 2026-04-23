# Identifier Reference Map

Coverage tables for REQ-P1 and NFR → SCN traceability. For rules and enforcement, see `STANDARDS.md`.

## REQ-P1 → SCN Coverage Matrix

| REQ-P1 Domain | Total   | Covered      | Uncovered IDs                  | Priority |
| ------------- | ------- | ------------ | ------------------------------ | -------- |
| AUTH          | 6       | 6            | —                              | ✓        |
| TASK          | 15      | 10           | 08, 11, 12, 13, 14             | 🟡       |
| SAFE          | 18      | 14           | 03, 04, 13, 17                 | 🔴       |
| MSG           | 5       | 5            | —                              | ✓        |
| BOOK          | 28      | 25           | 17, 27, 28                     | 🔴       |
| PRICE         | 8       | 6            | 06, 08                         | 🟡       |
| MATCH         | 7       | 6            | 04                             | 🟡       |
| NOTIF         | 7       | 5            | 03, 06                         | 🟡       |
| ASSIST        | 8       | 0            | 01, 02, 03, 04, 05, 06, 07, 08 | 🔴       |
| KPI           | 6       | 2            | 02, 03, 05, 06                 | 🔴       |
| COVER         | 4       | 2            | 01, 06                         | 🔴       |
| CAT           | 5       | 3            | 02, 03                         | 🟡       |
| ADMIN         | 10      | 4            | 03, 04, 06, 07, 08, 10         | 🔴       |
| **Total**     | **127** | **88 (69%)** | **39**                         |          |

## SCN Domain → REQ-P1 Domain Map

| SCN Domain   | Scenarios | Primary Requirement IDs      | Test Type                |
| ------------ | --------- | ---------------------------- | ------------------------ |
| AUTH         | 12        | AUTH                         | domain-unit, integration |
| BOOK         | 27        | BOOK                         | domain-unit, integration |
| TASK         | 29        | TASK                         | domain-unit, integration |
| SECURITY     | 11        | SAFE, NFR-SEC                | domain-unit, integration |
| REVIEW       | 6         | SAFE                         | domain-unit              |
| CATEGORY     | 8         | CAT                          | domain-unit              |
| DISPUTE      | 8         | BOOK, SAFE                   | domain-unit              |
| NOTIFICATION | 7         | NOTIF                        | domain-unit              |
| ASSISTANCE   | 8         | ASSIST                       | domain-unit              |
| VERIFICATION | 5         | SAFE                         | domain-unit              |
| MESSAGING    | 5         | MSG                          | domain-unit              |
| ANALYTICS    | 5         | KPI                          | domain-unit              |
| CONTRACT     | 4         | NFR-API-02                   | integration              |
| INTEGRATION  | 5         | AUTH, BOOK, TASK, NFR-API-02 | integration              |
| **Total**    | **140**   |                              |                          |

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

## Registry State (2026-04-24)

| Status   | Count | Meaning                                    |
| -------- | ----- | ------------------------------------------ |
| covered  | 123   | Test implemented                           |
| untested | 17    | Scenario defined; test pending             |
| waived   | 0     | No active waivers in the live registry     |
| null     | 0     | No uncategorized rows in the live registry |
