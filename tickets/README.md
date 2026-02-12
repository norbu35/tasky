# Ticket Specs

Every implementation ticket must have a machine-readable spec at:

`tickets/<TICKET-ID>.json`

These specs are mandatory for `scripts/self-verify.sh` and are validated by:

- `scripts/validate-ticket-spec.py`
- `scripts/validate-ac-coverage.py`

## Rules
1. One ticket spec per branch/task.
2. Ticket ID must match branch prefix: `agent/<ticket>-<slug>`.
3. Every acceptance criterion must include one or more `test_ids`.
4. `test_ids` must appear in automated test output logs.
5. For high-risk tickets, security/abuse criteria must include negative tests.

## Minimal Example
```json
{
  "schema_version": "1.0.0",
  "ticket": "TASK-123",
  "risk_level": "medium",
  "req_ids": ["REQ-TASK-01", "NFR-API-01"],
  "acceptance_criteria": [
    {
      "id": "AC-TASK-123-01",
      "type": "functional",
      "statement": "Task creation succeeds with valid fixed-budget payload.",
      "test_ids": ["TID-TASK-123-API-CREATE-SUCCESS"]
    }
  ]
}
```
