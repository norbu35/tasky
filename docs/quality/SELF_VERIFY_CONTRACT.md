# Self-Verification Script Contract

## Purpose

Define one deterministic interface for pre-commit and pre-push self-verification.  
All agents MUST use this contract to generate `artifacts/self-verify.json`.

Operational wrapper:
`scripts/agent-flow.sh verify --ticket <TICKET-ID>` resolves `risk` and `req` from ticket spec and calls this CLI.

## Canonical Paths

1. Script: `scripts/self-verify.sh`
2. Artifact output: `artifacts/self-verify.json` (default)
3. JSON schema: `docs/quality/self-verify.schema.json`
4. Risk-check registry: `docs/quality/risk-checks.json`
5. CI parity reference artifact: `artifacts/self-verify.json` committed in the PR branch
6. Validator script: `scripts/validate-self-verify.py`
7. Agent work log: `docs/agent/WORK_LOG.md`
8. Agent work logger: `scripts/agent-log.sh`

## CLI Contract

```bash
scripts/self-verify.sh \
  --ticket <TICKET-ID> \
  --risk <low|medium|high> \
  --req <REQ-IDS-CSV> \
  [--ticket-spec <path>] \
  [--base <git-ref>] \
  [--out <path>]
```

### Argument Rules

1. `--ticket` required. Pattern: `^[A-Z][A-Z0-9_]*-[0-9]+$`
2. `--risk` required. Values: `low`, `medium`, `high`
3. `--req` required. CSV list of PRD requirement IDs (for example `REQ-AUTH-01,REQ-TASK-02`)
4. `--ticket-spec` optional. Default: `tickets/<TICKET-ID>.json`
5. `--base` optional. Git ref used for changed-file diff. Default: `HEAD`
6. `--out` optional. Default: `artifacts/self-verify.json`
7. Bootstrap behavior: if repository has no `HEAD`, script must use empty-tree diff mode and set `git_context.head_sha`
   to `NO_HEAD`.

## Check ID Registry (Canonical)

1. `format_lint`
2. `commit_message_lint`
3. `secret_scan`
4. `ticket_spec_validation`
5. `changed_module_tests`
6. `openapi_validation`
7. `integration_tests_touched`
8. `coverage_gate_touched`
9. `full_test_suite`
10. `sast_dependency_scan`
11. `migration_safety`
12. `performance_smoke`
13. `ac_coverage_gate`

## Required Check Sets By Risk

1. Low:
    1. `format_lint`
    2. `commit_message_lint`
    3. `secret_scan`
    4. `ticket_spec_validation`
    5. `changed_module_tests`
    6. `ac_coverage_gate`
2. Medium:
    1. All low checks
    2. `openapi_validation`
    3. `integration_tests_touched`
    4. `coverage_gate_touched`
3. High:
    1. All medium checks
    2. `full_test_suite`
    3. `sast_dependency_scan`
    4. `migration_safety`
    5. `performance_smoke`

## Execution Contract

1. The script MUST resolve changed files from Git and include them in the artifact.
2. The script MUST execute all required fast checks first: `format_lint`, `commit_message_lint`, `secret_scan`,
   `openapi_validation` (when required by risk).
3. If fast checks pass, the script MUST execute the remaining required checks for the selected risk level.
4. If any required fast check fails, the script MUST NOT run expensive checks. Instead, each remaining required check
   MUST be recorded as `FAIL` with:
    1. `exit_code: 1`
    2. A blocked reason in evidence/error fields
    3. The original command string preserved in `command`
5. Java build/test checks MUST run via `./gradlew --no-daemon` (never system `gradle`).
6. For each check, the script MUST record:
    1. Check ID
    2. Command string
    3. Start/end timestamp
    4. Duration in milliseconds
    5. Exit code
    6. Status (`PASS`, `FAIL`, `SKIP`)
    7. Evidence summary and artifact paths
7. Required checks MUST NOT be `SKIP`.
8. `overall_status` MUST be:
    1. `PASS` only when all required checks pass
    2. `FAIL` otherwise
9. Before exit, the script MUST validate output JSON against `docs/quality/self-verify.schema.json`.
10. After artifact validation, the script MUST append an entry to `docs/agent/WORK_LOG.md`.
11. Frontend integration:
1. `format_lint` MUST include workspace lint/typecheck when frontend or SDK paths are touched.
2. `changed_module_tests` MUST run web/mobile unit tests for touched frontend modules.
3. `integration_tests_touched` MUST run web/mobile E2E smoke tests for touched frontend modules.
4. `full_test_suite` MUST run full frontend unit + E2E suites when frontend-impacting files are touched.
12. Ticket and AC coverage integration:
1. `ticket_spec_validation` MUST validate `tickets/<TICKET-ID>.json` structure, branch naming (`agent/<ticket>-<slug>`),
   REQ/risk alignment, and `depends_on` alignment with `docs/BACKLOG.md`.
2. `ac_coverage_gate` MUST fail if any acceptance criterion lacks test evidence in executed logs.
3. The artifact MUST include `ticket_spec_path`, `acceptance_criteria`, `ac_test_mapping`, and `ac_coverage_summary`.
4. Test commands MUST emit test titles to stdout (for example `vitest --reporter verbose`) so `TID-*` evidence is
   discoverable in logs.
5. The run MUST clear stale AC/ticket-normalized artifacts before checks so only current-run evidence can shape
   `ac_coverage_summary`.

## Deterministic Performance Rules

1. Run fast checks first: `format_lint`, `commit_message_lint`, `secret_scan`, `ticket_spec_validation`,
   `openapi_validation`.
2. Only run expensive checks if fast checks pass.
3. If fast checks fail, fail closed by marking remaining required checks as blocked `FAIL`.
4. Run independent checks in parallel where safe at the CI workflow level.
5. Keep command set stable to ensure reproducible results across local and CI.

## Exit Code Contract

1. `0`: all required checks passed
2. `1`: one or more required checks failed
3. `2`: invalid usage or arguments
4. `3`: schema validation failure
5. `4`: environment/tooling failure (for example missing binaries, missing Gradle wrapper, or work-log append failure)

## CI Parity Contract

1. CI MUST call the same script with the same risk level and ticket context.
2. CI MUST regenerate and validate a self-verification artifact.
3. CI MUST compare required check IDs and status parity against the local artifact at `artifacts/self-verify.json` from
   the PR branch.
4. Any mismatch is a merge blocker.

## Work Log Interpretation Contract

1. `docs/agent/WORK_LOG.md` is append-only; it is not a standalone source of current ticket status.
2. Queue state decisions MUST use `tickets/STATUS.json` as the source of truth.
3. A `WORK_LOG` row MAY be used as completion evidence only when:
    1. `status` is `PASS`
    2. `ticket` exists in `tickets/STATUS.json`
    3. `branch` matches `agent/<ticket>-<slug>`
    4. `head_sha` is not `NO_HEAD`
4. Rows from bootstrap/exploratory contexts (for example non-canonical ticket IDs or `NO_HEAD`) MUST be ignored by
   reconciliation logic.
