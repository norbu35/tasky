# Identifier Reference Map

Coverage tables for REQ-P1 → SCN traceability. For rules and enforcement, see `STANDARDS.md`.

## REQ-P1 → SCN Coverage Matrix

| REQ-P1 Domain | Total   | Covered       | Uncovered IDs      | Priority |
| ------------- | ------- | ------------- | ------------------ | -------- |
| AUTH          | 6       | 6             | —                  | ✓        |
| TASK          | 15      | 15            | —                  | ✓        |
| SAFE          | 18      | 18            | —                  | ✓        |
| MSG           | 5       | 5             | —                  | ✓        |
| BOOK          | 28      | 26            | 27, 28             | 🔴       |
| PRICE         | 8       | 7             | 06                 | 🟡       |
| MATCH         | 7       | 6             | 04                 | 🟡       |
| NOTIF         | 7       | 6             | 03                 | 🟡       |
| ASSIST        | 8       | 6             | 02, 08             | 🟡       |
| KPI           | 6       | 4             | 02, 05, 06         | 🟡       |
| COVER         | 6       | 4             | 01, 06             | 🟡       |
| CAT           | 5       | 3             | 02, 03             | 🟡       |
| ADMIN         | 10      | 4             | 03, 04, 06, 07, 08 | 🔴       |
| **Total**     | **128** | **110 (86%)** | **18**             |          |

## SCN Domain → REQ-P1 Domain Map

| SCN Domain    | Scenarios | Primary REQ-P1 | Test Type                |
| ------------- | --------- | -------------- | ------------------------ |
| AUTH          | 15        | AUTH           | domain-unit, integration |
| BOOK          | 27        | BOOK           | domain-unit, integration |
| TASK          | 29        | TASK           | domain-unit, integration |
| SECURITY      | 13        | SAFE, NFR-SEC  | domain-unit, integration |
| SAFE / Review | 6         | SAFE           | domain-unit              |
| CATEGORY      | 8         | CAT            | domain-unit              |
| DISPUTE       | 8         | (BOOK, SAFE)   | domain-unit              |
| NOTIFICATION  | 7         | NOTIF          | domain-unit              |
| ASSIST        | 8         | ASSIST         | domain-unit              |
| VERIFICATION  | 5         | SAFE           | domain-unit              |
| MESSAGING     | 5         | MSG            | domain-unit              |
| ANALYTICS     | 5         | KPI            | domain-unit              |
| SMOKE         | 5         | (regression)   | integration              |
| CONTRACT      | 4         | (MSG, NOTIF)   | domain-unit              |
| INTEGRATION   | 1         | (cross-domain) | integration              |
| **Total**     | **143**   |                |                          |

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

| Status   | Count | Meaning                                             |
| -------- | ----- | --------------------------------------------------- |
| covered  | 123   | Test implemented                                    |
| untested | 17    | Scenario defined; test pending                      |
| waived   | 1     | SCN-BOOK-006; tasker-suspension feature deferred    |
| null     | 139   | Not yet classified — assign covered/untested/waived |
