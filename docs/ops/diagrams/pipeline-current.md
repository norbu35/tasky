# Current Autonomous Feature Pipeline

End-to-end flow from requirement intake to a PR-ready change. Stages with `⚠️` are still checklist-only or lack structural validation today.

```mermaid
flowchart TD
    REQ([Request / Bug / Execution Brief])
    REQ --> SKILL1

    subgraph SKILL1["intake-to-prd skill  tooling/skills/intake-to-prd"]
        S1A[Read PRD + STRATEGY\n+ nearest maintenance policy] --> S1B{Behavior\nchanges?}
    end

    S1B -->|Implementation only| IMPL
    S1B -->|Yes| PRD_EDIT

    subgraph PRD_EDIT["PRD Update"]
        PE[Edit docs/PRD.md\nAdd / modify REQ-P1-* or NFR-*]
    end

    PRD_EDIT --> RIPPLE

    subgraph RIPPLE["Doc Propagation  ⚠️ no ripple-completeness check"]
        R1[docs/maintenance/]
        R2[docs/architecture/]
        R3[docs/openapi/** -> bundle -> docs/API.yaml]
        R4["docs/design/screen-graph.yaml\ndocs/design/journey-catalog.yaml\ndocs/design/domain-lifecycles.yaml\n⚠️ no structural validator"]
        R3 --> SDK_GEN["pnpm contract:sdk:generate  @tasky/sdk"]
    end

    RIPPLE --> SCENARIOS

    subgraph SCENARIOS["Scenario Curation  (curator only)"]
        SC1["Edit tests/scenarios/domain.md\nSCN-ID · Risk · PRD-ref · Given/When/Then"] --> SC2[sync-registry.sh]
        SC2 --> SC3[(tests/registry.yaml)]
    end

    SCENARIOS --> TESTS

    subgraph TESTS["Test Writing"]
        T1[Read scenario block from registry] --> T2[@DisplayName SCN-XXX-NNN: title\nNo @SpringBootTest / @Autowired\nMock only external boundaries]
        T2 --> T3["gradlew :services:api:test\n-> surefire XML"]
        T3 --> T4[sync-registry: status covered]
        T4 --> T5["gateFull -> PIT -> kill rate\n⚠️ per-domain, not per-scenario"]
    end

    TESTS --> IMPL

    subgraph IMPL["Code Implementation"]
        I1["Read services/api/AGENTS.md\n+ api.md + module AGENTS.md"] --> I2["Implement in module\nHexagonal / CQRS / Outbox patterns"]
        I2 --> I3["ArchUnit tests enforce\nboundary and port contracts"]
    end

    IMPL --> VERIFY

    subgraph VERIFY["Verification"]
        V1[verify:cleanup] --> V2[verify:backend]
        V2 --> V3[verify:scenario:smoke]
        V3 --> V4[verify:drift]
    end

    VERIFY --> DOCLOOP

    subgraph DOCLOOP["Doc Claims Loop"]
        DC1{validate-doc-claims\npasses?} -->|No| DC2["doc-claims-remediation skill\nfix prose or add claim block"]
        DC2 --> DC1
        DC1 -->|Yes| DONE
    end

    DONE(["PR ready ✓"])

    style R4 fill:#fff3cd,stroke:#ffc107
    style T5 fill:#fff3cd,stroke:#ffc107
    style RIPPLE fill:#fff8f0,stroke:#ffc107
```

## Stage owners

| Stage                  | Owner                | Skill / script                                         |
| ---------------------- | -------------------- | ------------------------------------------------------ |
| Intake -> PRD decision | Agent                | `tooling/skills/intake-to-prd/SKILL.md`                |
| Doc propagation        | Agent                | Manual checklist only; no formal PRD ripple helper yet |
| Scenario curation      | Designated curator   | `tests/scenarios/*.md` + `sync-registry.sh`            |
| Test writing           | Implementation agent | Scenario registry + architecture docs                  |
| Code                   | Implementation agent | `services/api/AGENTS.md` + module `AGENTS.md`          |
| Verification           | Agent / CI           | `pnpm verify:*` lanes                                  |
| Doc claims repair      | Agent                | `tooling/skills/doc-claims-remediation/SKILL.md`       |

## Known gaps

- No formal helper verifies that changed PRD IDs propagated across maintenance, architecture, OpenAPI, design, and scenarios.
- `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, and `docs/design/domain-lifecycles.yaml` have no structural validator today.
- `docs/design/component-contract.yaml` is already validated, so the design gap is partial rather than total.
- Scenario coverage is checked by ID presence only; it does not prove that test assertions cover the `Then` and `And` outcomes.
- Mutation kill rate is per-domain, so weak assertions can hide inside a domain with otherwise good mutation numbers.
