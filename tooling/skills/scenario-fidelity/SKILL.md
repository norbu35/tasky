---
name: scenario-fidelity
description: Report-only triage for likely weak tests behind covered scenarios. Not a blocking gate. Use for manual review and nightly informational runs.
---

# Scenario Fidelity Triage

Use this skill to find covered scenarios where the test implementation may be weaker than the scenario risk warrants.

## Quick Start

```bash
pnpm verify:scenario:fidelity
```

## What It Checks

The helper uses a combination of heuristic signals to identify candidates:

| Signal                    | Meaning                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `low_domain_mutation`     | Mutation kill rate < 50% for a critical/high risk scenario                     |
| `missing_domain_mutation` | No mutation data for a critical/high risk scenario                             |
| `stale_mutation_data`     | Mutation rate present but no timestamp                                         |
| `assertion_scarcity`      | Assertion count < half of Then+And lines in the scenario                       |
| `zero_assertions`         | No assertions found in the matched test method despite behavioral expectations |

## Data Sources

- `tests/registry.yaml` — scenario status, risk, mutation data
- `tests/scenarios/*.md` — Then/And line counts
- `services/api/src/test/java/**` — assertion counting in matched test methods

## CI Posture

- **Manual and local use only** in v1
- Exit 0 always (report-only)
- Optional nightly informational step only after the command is proven useful
- Do not add to `verify:scenario:smoke`, `verify:cleanup`, or pre-push

## Guard Rails

- Do not use this as a blocking gate in v1
- The assertion counter is heuristic; false positives are expected
- Tune on real output before wiring into nightly CI
