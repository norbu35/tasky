# Self-Verification Contract

Canonical contract for local self-verification, artifact output, and work-log append behavior.

## Canonical Entrypoints

- `scripts/self-verify.sh` runs the required local check set for a ticket and writes a machine-readable artifact.
- `scripts/agent-log.sh` appends a single execution row to `docs/agent/WORK_LOG.md`.
- `scripts/validate-self-verify.py` validates the artifact shape against the policy and schema files in this directory.

## CLI Contract

Required arguments:

- `--ticket <TICKET-ID>`
- `--risk <low|medium|high>`
- `--req <REQ-IDS-CSV>`

Optional arguments:

- `--ticket-spec <path>`
- `--base <git-ref>`
- `--only <check-id>`
- `--out <path>`

Default output path: `artifacts/self-verify.json`

## Exit Codes

- `0`: all required checks passed
- `1`: one or more required checks failed
- `2`: invalid usage or arguments
- `3`: artifact schema validation failed
- `4`: environment or tooling failure

## Check Registry

The canonical registry lives in `docs/quality/risk-checks.json`.

Required checks by risk:

- `low`: `format_lint`, `commit_message_lint`, `secret_scan`, `ticket_spec_validation`, `changed_module_tests`, `ac_coverage_gate`
- `medium`: all low-risk checks plus `openapi_validation`, `integration_tests_touched`, `coverage_gate_touched`
- `high`: all medium-risk checks plus `full_test_suite`, `sast_dependency_scan`, `migration_safety`, `performance_smoke`

Fast-fail checks are defined separately in the same registry and run before expensive checks.

## Artifact Contract

Canonical schema file: `docs/quality/self-verify.schema.json`

Artifact requirements:

- `schema_version` is `1.0.0`
- one artifact represents one ticket verification run
- `required_check_ids` must exactly match the risk policy
- every required check must resolve to `PASS` or `FAIL`
- `overall_status` is `PASS` only when every required check passed
- acceptance criteria and AC coverage summary must be included
- git context and agent metadata are mandatory

Top-level fields:

- `schema_version`
- `generated_at`
- `ticket`
- `risk_level`
- `ticket_spec_path`
- `req_ids`
- `files_changed`
- `required_check_ids`
- `checks`
- `acceptance_criteria`
- `ac_test_mapping`
- `ac_coverage_summary`
- `overall_status`
- `known_risks`
- `assumptions`
- `self_critique`
- `ci_parity`
- `git_context`
- `agent`

## Ticket Spec Contract

Canonical schema file: `docs/quality/ticket.spec.schema.json`

Every ticket spec MUST include:

- `schema_version`
- `ticket`
- `risk_level`
- `req_ids`
- `depends_on`
- `acceptance_criteria`

Each acceptance criterion MUST include:

- `id`
- `type`
- `statement`
- `test_ids`
- `negative_test_ids` when normalized by validation

## Work Log Contract

Canonical ledger: `docs/agent/WORK_LOG.md`

Appender behavior:

- append-only markdown table
- one row per `scripts/agent-log.sh` invocation
- rows are derived from the self-verify artifact, not handwritten
- log columns are `Timestamp (UTC)`, `Context`, `Agent`, `Ticket`, `Branch`, `Head SHA`, `Risk`, `Status`, `Checks (pass/total)`, `REQ IDs`, `Artifact`

## CI Parity Rule

Local and CI required check sets must match the same risk-derived registry. CI may re-run checks independently, but it must not silently use a weaker or broader required set than the local artifact claims.
