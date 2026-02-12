# Self-Verification Script Contract

## Purpose
Define one deterministic interface for pre-commit and pre-push self-verification.  
All agents MUST use this contract to generate `artifacts/self-verify.json`.

## Canonical Paths
1. Script: `scripts/self-verify.sh`
2. Artifact output: `artifacts/self-verify.json` (default)
3. JSON schema: `docs/quality/self-verify.schema.json`
4. CI parity reference artifact: `artifacts/self-verify.json` committed in the PR branch
5. Validator script: `scripts/validate-self-verify.py`
6. Agent work log: `docs/agent/WORK_LOG.md`
7. Agent work logger: `scripts/agent-log.sh`

## CLI Contract
```bash
scripts/self-verify.sh \
  --ticket <TICKET-ID> \
  --risk <low|medium|high> \
  --req <REQ-IDS-CSV> \
  [--base <git-ref>] \
  [--out <path>]
```

### Argument Rules
1. `--ticket` required. Pattern: `^[A-Z][A-Z0-9_]*-[0-9]+$`
2. `--risk` required. Values: `low`, `medium`, `high`
3. `--req` required. CSV list of PRD requirement IDs (for example `REQ-AUTH-01,REQ-TASK-02`)
4. `--base` optional. Git ref used for changed-file diff. Default: `HEAD`
5. `--out` optional. Default: `artifacts/self-verify.json`
6. Bootstrap behavior: if repository has no `HEAD`, script must use empty-tree diff mode and set `git_context.head_sha` to `NO_HEAD`.

## Check ID Registry (Canonical)
1. `format_lint`
2. `commit_message_lint`
3. `secret_scan`
4. `changed_module_tests`
5. `openapi_validation`
6. `integration_tests_touched`
7. `coverage_gate_touched`
8. `full_test_suite`
9. `sast_dependency_scan`
10. `migration_safety`
11. `performance_smoke`

## Required Check Sets By Risk
1. Low:
   1. `format_lint`
   2. `commit_message_lint`
   3. `secret_scan`
   4. `changed_module_tests`
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
2. The script MUST execute every required check for the selected risk level.
3. Java build/test checks MUST run via `./gradlew --no-daemon` (never system `gradle`).
4. For each check, the script MUST record:
   1. Check ID
   2. Command string
   3. Start/end timestamp
   4. Duration in milliseconds
   5. Exit code
   6. Status (`PASS`, `FAIL`, `SKIP`)
   7. Evidence summary and artifact paths
5. Required checks MUST NOT be `SKIP`.
6. `overall_status` MUST be:
   1. `PASS` only when all required checks pass
   2. `FAIL` otherwise
7. Before exit, the script MUST validate output JSON against `docs/quality/self-verify.schema.json`.
8. After artifact validation, the script MUST append an entry to `docs/agent/WORK_LOG.md`.

## Deterministic Performance Rules
1. Run fast checks first: `format_lint`, `commit_message_lint`, `secret_scan`, `openapi_validation`.
2. Only run expensive checks if fast checks pass.
3. Run independent checks in parallel where safe.
4. Keep command set stable to ensure reproducible results across local and CI.

## Exit Code Contract
1. `0`: all required checks passed
2. `1`: one or more required checks failed
3. `2`: invalid usage or arguments
4. `3`: schema validation failure
5. `4`: environment/tooling failure (for example missing binaries, missing Gradle wrapper, or work-log append failure)

## CI Parity Contract
1. CI MUST call the same script with the same risk level and ticket context.
2. CI MUST regenerate and validate a self-verification artifact.
3. CI MUST compare required check IDs and status parity against the local artifact at `artifacts/self-verify.json` from the PR branch.
4. Any mismatch is a merge blocker.
