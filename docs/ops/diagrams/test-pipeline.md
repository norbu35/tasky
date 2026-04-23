# Test Pipeline

Scenario-centric test lifecycle from curation to mutation coverage.

```mermaid
flowchart TD
    subgraph CURATOR["Scenario Curation  (single curator per brief)"]
        C1["Read PRD.md + STRATEGY.md\n+ ROLLOUT_PHASES.md\n+ active openapi/** + active design/**"] --> C2["Reconcile against\ntests/registry.yaml baseline"]
        C2 --> C3["Edit tests/scenarios/domain.md\n\nFormat:\n## SCN-DOMAIN-NNN\n**Risk:** critical|high|medium|low\n**PRD:** REQ-P1-*\n**Title:** ...\nGiven / When / Then / And"]
        C3 --> C4["sync-registry.sh\n→ upserts registry.yaml\n→ fails on duplicate SCN IDs\n→ fails on unknown SCN refs in test source"]
        C4 --> REG[(tests/registry.yaml\nstatus: untested)]
    end

    subgraph IMPL["Test Implementation  (implementation agent)"]
        TA1["Read scenario block from\ntests/scenarios/domain.md"] --> TA2["Check tests/registry.yaml:\nscenario must exist\nbefore writing test"]
        TA2 --> TA3["Write domain-unit test\n\n@DisplayName must be\nSCN-XXX-NNN: exact title\n\nNo @SpringBootTest, @Autowired, @MockBean\nMock only: FacebookGraphClient\nFirebasePushProvider · S3StorageService"]
        TA3 --> TA4["gradlew :services:api:test\n→ build/test-results/test/TEST-*.xml"]
    end

    subgraph SYNC1["Registry Sync — Status"]
        SY1["sync-registry.sh step 2\nScan surefire XML for SCN-* in\npassing testcase.name fields"] --> SY2["@Disabled → skipped → not covered\nFailing → failure present → not covered\nPassing with SCN-ID → covered"]
        SY2 --> SY3[("registry.yaml\nstatus: covered")]
    end

    subgraph PIT["Mutation Testing  (gateFull / nightly)"]
        P1["gradlew gateFull\n→ PIT mutation suite"] --> P2["build/reports/pitest/mutations.xml"]
        P2 --> P3["sync-registry.sh step 3\nKill rate per domain\nmn.tasky.domain.*"]
        P3 --> P4[("registry.yaml\nmutation_kill_rate: N\n⚠️ per-domain only")]
    end

    subgraph GATES["Scenario Gates"]
        G1["gateSmoke\nFast local confidence"]
        G2["gateRegression\nNightly / extended"]
        G3["gateFull\nFull suite + PIT"]
        G1 --> G2 --> G3
    end

    subgraph COVERAGE_CHECK["Coverage Validation"]
        CV1["validate-prd-scenario-links.py\nEvery scenario PRD ref resolves\nto live REQ-P1-* in docs/PRD.md"]
        CV2["Coverage warning:\nREQ-P1-* with no high/critical\nscenario → warning only"]
        CV1 --> CV2
    end

    TA4 --> SYNC1
    SYNC1 --> PIT
    REG --> TA1
    PIT --> GATES
    REG --> COVERAGE_CHECK

    style P4 fill:#fff3cd,stroke:#ffc107
```

## Scenario ID format

```
SCN-{DOMAIN}-{NNN}
     ↑          ↑
     e.g.       zero-padded 3-digit
     AUTH       sequential per domain
     BOOK
     MSG
     ...
```

Domains map to files: `tests/scenarios/auth.md`, `tests/scenarios/booking.md`, etc.

## Test constraints table

| Rule                                                                        | Rationale                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `@DisplayName` must be `"SCN-XXX-NNN: <exact title>"`                       | sync-registry.sh parses it to link test → scenario               |
| No `@SpringBootTest` in domain-unit tests                                   | Spring context load is slow; unit tests target domain logic only |
| Mock only `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService` | Only external system boundaries; internal services must be real  |
| Never `@DirtiesContext`                                                     | Prevents context cache pollution across suite                    |
| If no scenario covers behavior — stop and report the gap                    | Agents must not invent scenario coverage                         |
| Curator is single-owner per execution brief                                 | Prevents concurrent scenario drift                               |

## Registry status lifecycle

```mermaid
stateDiagram-v2
    [*] --> untested : sync-registry.sh\n(scenario added)
    untested --> covered : surefire XML contains\npassing SCN-ID test
    covered --> untested : test removed or disabled
    untested --> untested : override_status set\n(manual override preserved\nacross sync runs)
    covered --> covered : PIT updates\nmutation_kill_rate
```

## Known weaknesses

| Weakness                                          | Location                         | Impact                                                                     |
| ------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Mutation kill rate is per-domain                  | `sync-registry.sh` step 3        | Weak assertions in one module hide behind high kill rate across the domain |
| Coverage check is ID-presence only                | `validate-prd-scenario-links.py` | A trivially-passing test counts as full coverage                           |
| Then/And line count vs. assertion count unchecked | No script today                  | Test can reference SCN-ID without exercising the scenario outcomes         |
