# Validation Layer

All validation hooks and scripts, showing where they run today, what they check, and where the remediated design should extend the stack.

```mermaid
flowchart TD
    subgraph COMMIT["Pre-commit  .husky/pre-commit"]
        PC1["D  gitleaks --pre-commit\n(staged files)"]
        PC2["H  REQ-P1 co-staging\ntext diff scan: staged app/service REQ-P1 refs require docs/PRD.md"]
        PC3["D  lint-staged\nformatting + type imports"]
    end

    subgraph PUSH["Pre-push  .husky/pre-push"]
        direction TB

        subgraph CLEANUP["verify:cleanup  -> check-cleanup-gate.sh"]
            CL1["D  :services:api:openApiValidate"]
            CL2["D+H  repo:docs:check\n7 checks today"]
            CL3["D  turbo typecheck"]
            CL4["D  repo:workspace:boundaries"]
            CL5["D  mobile structure:check"]
            CL6["D  validate-migrations.py"]
            CL7["D  validate-schema-parity.py"]
            CL8["D  check-trivyignore-expiry.sh"]
            CL9["D  check-gitleaks-secret-scan.sh"]
        end

        subgraph DOCS_CHECK["repo:docs:check  (called by cleanup)"]
            DC1["D  check-doc-governance.py"]
            DC2["D  validate-doc-references.py"]
            DC3["D  validate-prd-scenario-links.py"]
            DC4["H + D  validate-doc-claims.py\nblocking claim blocks plus heuristic extraction"]
            DC5["D  validate-design-contracts.py\ncomponent-contract coverage"]
            DC6["D  validate-openapi-phase.mjs"]
            DC7["D  bundle-openapi.mjs --check"]
        end

        subgraph OPS["verify:ops"]
            OP1["D  repo:tooling:check"]
            OP2["D  check-ops-config.mjs"]
        end

        subgraph BACKEND["verify:backend"]
            BE1["D  :services:api:check"]
            BE2["D  :services:api:jacocoTestCoverageVerification"]
            BE3["D  :services:api:openApiValidate"]
        end

        subgraph SCENSMOKE["verify:scenario:smoke"]
            SS1["D  validate-prd-scenario-links.py"]
            SS2["D  sync-registry.sh"]
            SS3["D  check-gates.sh smoke"]
        end

        subgraph FRONTEND["verify:frontend / verify:frontend:affected"]
            FE1["D  turbo lint + typecheck + test"]
        end

        subgraph DRIFT["verify:drift"]
            DR1["D  validate-sdk-contract-drift.sh"]
            DR2["D  :services:api:architectureTest"]
        end
    end

    subgraph CI["quality-gates.yml  pushes to staging/main + workflow_dispatch"]
        CI1[structural-gate]
        CI2[backend-quality]
        CI3[frontend-quality]
        CI4[e2e-web]
        CI5[e2e-android]
        CI6[contracts]
        CI7[security]
    end

    subgraph MANUAL_REG["nightly-regression.yml  manual while paused"]
        NR1[Frontend regression]
        NR2[Backend regression gate]
        NR3[OWASP dependency check]
        NR4[gitleaks + Trivy]
        NR5[Web E2E regression]
    end

    subgraph MANUAL_MOB["nightly-mobile.yml  manual while paused"]
        NM1[Infra bootstrap]
        NM2[Backend boot]
        NM3[Android build]
        NM4[Maestro regression]
    end

    subgraph RELEASE["release-gate.yml"]
        RG1[Migration safety]
        RG2[Rollback readiness]
        RG3[Performance smoke]
        RG4[Web E2E smoke]
        RG5[Mobile E2E smoke]
        RG6[Security scan]
        RG7[Scenario regression]
    end

    COMMIT --> PUSH
    PUSH --> CI
    CI --> RELEASE

    style DC4 fill:#ffe0e0,stroke:#dc3545
    style PC2 fill:#fff3cd,stroke:#ffc107
```

## Current heuristic vs. deterministic summary

| Script / hook                    | Type today | Notes                                                          |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `validate-doc-claims.py`         | H + D      | Blocking validator with claim blocks plus heuristic extraction |
| `validate-prd-scenario-links.py` | D          | ID lookup and risk-tier coverage warnings                      |
| `validate-schema-parity.py`      | D          | SQL parse plus JSON inventory diff                             |
| `validate-migrations.py`         | D          | Naming and immutability checks                                 |
| `validate-doc-references.py`     | D          | Path and pnpm script existence                                 |
| `validate-design-contracts.py`   | D          | `component-contract.yaml` only                                 |
| Pre-commit REQ-P1 gate           | H          | Staged diff scan; co-staging safeguard                         |

## Remediated optimization target

1. Add `repo:design:check` under `repo:docs:check` for `screen-graph.yaml`, `journey-catalog.yaml`, and `domain-lifecycles.yaml`.
2. Keep `validate-doc-claims.py` blocking, but narrow its noisiest extraction paths only if coverage is preserved.
3. Add `repo:docs:claims:audit` as a report-only helper under `doc-claims-remediation`.
4. Add `repo:prd:diff-ids` under `intake-to-prd` so PRD ripple becomes formalized without creating a new skill.
5. Add `verify:scenario:fidelity` as report-only triage rather than a blocking lane.

## Docs lane target after implementation

```mermaid
flowchart LR
    DC[repo:docs:check] --> G[check-doc-governance.py]
    DC --> R[validate-doc-references.py]
    DC --> P[validate-prd-scenario-links.py]
    DC --> C[validate-doc-claims.py]
    DC --> V[validate-design-contracts.py]
    DC --> N[repo:design:check]
    DC --> O[validate-openapi-phase + bundle check]

    style C fill:#ffe0e0,stroke:#dc3545
    style N fill:#e8f5e9,stroke:#28a745
```
