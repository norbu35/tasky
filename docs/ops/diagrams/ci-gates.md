# CI Gate Architecture

Actual checked-in workflow topology, plus the lane placement relevant to the remediated governance design.

```mermaid
flowchart TD
    PUSH([Push to staging/main\nor workflow_dispatch]) --> QG

    subgraph QG["quality-gates.yml"]
        direction TB

        subgraph SG["structural-gate"]
            SG1[pnpm verify:cleanup]
            SG2[pnpm verify:ops]
        end

        subgraph BQ["backend-quality"]
            BQ1["pnpm verify:backend\ngradlew check + jacoco + openApiValidate"]
            BQ2["pnpm verify:scenario:smoke\nprd-scenario-links + sync-registry + smoke gate"]
        end

        subgraph FQ["frontend-quality"]
            FQ1["pnpm verify:frontend:affected\nturbo lint + typecheck + test"]
        end

        subgraph E2EWEB["e2e-web"]
            EW1[Playwright smoke]
        end

        subgraph E2EMOB["e2e-android"]
            EM1[Maestro smoke]
        end

        subgraph CT["contracts"]
            CT1[pnpm verify:drift]
        end

        subgraph SEC["security"]
            SE1[gitleaks secret scan]
            SE2[Trivy filesystem scan]
            SE3[Trivy container scan]
            SE4[Semgrep SAST]
            SE5[OpenSSF Scorecard\ncontinue-on-error]
        end
    end

    QG -->|push to main| BUILD

    subgraph BUILD["build-and-push.yml"]
        BU1[Build and push API image]
        BU2[Build and push web image]
        BU3[Trivy scan pushed images]
    end

    BUILD -->|workflow_run on success\nor manual dispatch| STAGING

    subgraph STAGING["deploy-staging.yml"]
        ST1[Validate migrations]
        ST2[Deploy to private staging VPS]
        ST3[Run staging smoke checks]
    end

    STAGING -->|manual dispatch| RELEASE

    subgraph RELEASE["release-gate.yml"]
        RG1[Migration safety]
        RG2[Rollback readiness]
        RG3[Performance smoke]
        RG4[Web E2E smoke]
        RG5[Mobile E2E smoke]
        RG6[Security scan]
        RG7[Scenario regression gate]
        RG8[Release readiness summary]
    end

    RELEASE -->|manual approval via environment| PROD

    subgraph PROD["deploy-production.yml"]
        PR1[Reuse release gate]
        PR2[Verify target image exists]
        PR3[SSH deploy to production]
        PR4[Post-deploy smoke]
    end

    subgraph MANUAL_REG["nightly-regression.yml  manual while paused"]
        NR1[Full frontend regression]
        NR2[Backend regression gate]
        NR3[OWASP dependency check]
        NR4[gitleaks + Trivy]
        NR5[Web E2E regression]
    end

    subgraph MANUAL_MOB["nightly-mobile.yml  manual while paused"]
        NM1[Start infra]
        NM2[Build backend]
        NM3[Build Android release app]
        NM4[Run Maestro regression]
    end

    style QG fill:#f8f9fa,stroke:#6c757d
    style BUILD fill:#e8f5e9,stroke:#28a745
    style STAGING fill:#fff3cd,stroke:#ffc107
    style RELEASE fill:#ffe0e0,stroke:#dc3545
    style PROD fill:#ffe0e0,stroke:#dc3545
```

## verify:cleanup composition

```mermaid
flowchart LR
    CG[check-cleanup-gate.sh] --> OV[:services:api:openApiValidate]
    CG --> DC[repo:docs:check]
    CG --> TC[turbo typecheck]
    CG --> WB[repo:workspace:boundaries]
    CG --> MS[@tasky/mobile structure:check]
    CG --> VM[validate-migrations.py]
    CG --> VS[validate-schema-parity.py]
    CG --> TE[check-trivyignore-expiry.sh]
    CG --> GS[check-gitleaks-secret-scan.sh]
```

## Gate-to-command cross-reference

| Gate              | Command                                              | Scope                                            |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Cleanup           | `pnpm verify:cleanup`                                | Structural, docs, schema, migration              |
| Ops               | `pnpm verify:ops`                                    | Tooling surface and workflow wiring              |
| Docs              | `pnpm repo:docs:check`                               | Governance, design navigation/journeys, OpenAPI  |
| Backend           | `pnpm verify:backend`                                | Compile, test, coverage, OpenAPI                 |
| Frontend          | `pnpm verify:frontend`                               | Full lint, typecheck, test                       |
| Frontend affected | `pnpm verify:frontend:affected`                      | Merge-branch fast path                           |
| Scenario smoke    | `pnpm verify:scenario:smoke`                         | PRD-to-scenario links, registry sync, smoke gate |
| Drift             | `pnpm verify:drift`                                  | SDK drift and ArchUnit                           |
| Regression        | `./gradlew --no-daemon :services:api:gateRegression` | Extended backend scenario gate                   |
| Full              | `./gradlew --no-daemon gateFull`                     | Full suite plus PIT                              |

## Design implication for this proposal

`repo:design:check` is part of `repo:docs:check`, not `check-cleanup-gate.sh`. That keeps design-doc validation inside the same docs lane as governance, references, doc-claims, design-contracts, journey checks, and OpenAPI phase checks.
