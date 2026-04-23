# Pipeline Diagrams

Mermaid flow diagrams for the autonomous feature-to-production pipeline. Use these to audit the current repo workflow and the remediated target design.

## Index

| Diagram                                      | Purpose                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [pipeline-current.md](pipeline-current.md)   | End-to-end current pipeline with gap annotations                                                              |
| [pipeline-proposed.md](pipeline-proposed.md) | Remediated target pipeline: two new skills, two existing-skill augmentations, and docs-lane design validation |
| [validation-layer.md](validation-layer.md)   | Validation hooks, actual workflow triggers, and the optimization target                                       |
| [test-pipeline.md](test-pipeline.md)         | Scenario curation to test-writing lifecycle and current weak spots                                            |
| [ci-gates.md](ci-gates.md)                   | Actual CI, build, staging, release, and manual regression workflow map                                        |

## Reading order for optimization work

1. `validation-layer.md` — current hooks, actual triggers, and where heuristics still exist
2. `pipeline-current.md` — workflow gaps that are still checklist-only today
3. `pipeline-proposed.md` — remediated target state aligned to current repo ownership
4. `test-pipeline.md` — why scenario fidelity remains report-only in v1
5. `ci-gates.md` — where deterministic docs and design checks fit in the existing lane model

## Key numbers

| Surface                             | Lines | Type  | Priority                                                                    |
| ----------------------------------- | ----: | ----- | --------------------------------------------------------------------------- |
| `validate-doc-claims.py`            |  1314 | H + D | High — narrow noisy extraction carefully, do not drop blocking coverage yet |
| `validate-schema-parity.py`         |   444 | D     | Keep as-is                                                                  |
| `validate-prd-scenario-links.py`    |   270 | D     | Keep as-is; augment PRD ripple at the skill layer                           |
| `validate-migrations.py`            |   214 | D     | Keep as-is                                                                  |
| `validate-doc-references.py`        |   160 | D     | Keep as-is                                                                  |
| `validate-design-contracts.py`      |   119 | D     | Keep as-is; extend docs validation with screen/journey/lifecycle checks     |
| `check-doc-governance.py`           |   159 | D     | Keep as-is                                                                  |
| `validate-workspace-boundaries.mjs` |    90 | D     | Keep as-is                                                                  |

H = heuristic / regex-based extraction. D = deterministic validation.
