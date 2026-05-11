# Tasky API Agent Contract

Use this file when the change touches `services/api/**`.

## Authority Order

If this file or `api.md` prose conflicts with tests, migrations, or runtime code:

1. **ArchUnit tests** win over prose.
2. **Flyway migrations** win over table descriptions.
3. **Runtime code** wins over stale documentation.

File a doc-fix issue when you find a conflict.

## Read Next

1. `services/api/AGENTS.md` (this file)
2. `docs/architecture/api.md` (especially §1.1 Foundational Design Patterns)
3. Nearest module `AGENTS.md` under `src/main/java/mn/tasky/**`
4. `docs/architecture/common.md` — only for cross-cutting runtime/NFR/dev workflow topics
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only for contract changes

Bundled API contract (compatibility only): `docs/API.yaml`.

## Foundational Design Patterns (Mandatory)

Every new module, controller, or service **must** follow the patterns documented in `docs/architecture/api.md` §1.1.
They are enforced by ArchUnit tests in `services/api/src/test/java/mn/tasky/architecture/`.

Quick reference:

| Pattern                          | Where to read   | Key rule                                                                                           |
| -------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| Audience-Composition / Hexagonal | `api.md` §1.1.1 | Controllers → runtime composition → publicapi ports. Never DAOs.                                   |
| CQRS Command/Query Ports         | `api.md` §1.1.2 | `publicapi.<Module>CommandPort` / `QueryPort` interfaces; handlers in `application.command/query`. |
| Outbox + Event-Driven Workflow   | `api.md` §1.1.3 | Domain events via `DomainEventOutboxService`; handlers extend `AbstractEventHandler`.              |
| Provider / Strategy              | `api.md` §1.1.4 | External systems behind provider interfaces; `@ConditionalOnProperty` activation.                  |
| Projection                       | `api.md` §1.1.5 | Admin read models in `projection.admin`; consumed only by runtime composition.                     |
| Kernel (shared plane)            | `api.md` §1.1.6 | `mn.tasky.kernel` must never depend on feature modules.                                            |
| Two-Phase Idempotency            | `api.md` §1.1.7 | Request-level `IdempotencyService` + event-level `WorkflowIdempotencyGuard`.                       |
| Context Propagation              | `api.md` §1.1.8 | `RequestContext` → `WorkflowContext` → `JobContext`; all via `ContextPropagator` + `LogField`.     |
| Domain Module Layering           | `api.md` §1.1.9 | `api → application → dao`; `publicapi` must not depend on `api/dao/scheduling`.                    |

## Boundaries

- Persistence is JDBI + explicit SQL. Do not introduce JPA.
- Keep feature behavior local to the owning module instead of leaking cross-module logic into common infrastructure.
- Security-sensitive code needs positive and negative tests.
- Schema parity: if a Flyway migration adds, drops, or renames a column or table, run `python3 tooling/scripts/governance/validate-schema-parity.py --update-expected` and commit the updated `tooling/config/expected-schema.json`.

### Structural Conventions

- Domain services live directly in `application/`. Do not introduce sub-packages unless the module already has them and the sub-package follows a recognized pattern (`command/`, `query/`).
- Add methods to existing `*CommandPort` / `*QueryPort` interfaces. Create a new port interface only if the module has no port for that concern.
- Before adding a module-specific boundary test, check whether the broader tests (e.g., `PublicPortBoundaryTest`) already enforce the same rule. Module-specific tests must assert something the cross-cutting test does not.

## Backend Testing Rules

Before writing any backend test: check `tests/registry.yaml` for an existing scenario and read `tests/scenarios/<domain>.md`. If no scenario covers the behavior, stop and report the gap unless you are the designated scenario curator for the current execution brief.

- Identifier format rules (SCN 3-digit, REQ-P1 2-digit, capitalized Risk): `docs/identifiers/STANDARDS.md`.
- Coverage gaps and domain-to-domain map: `docs/identifiers/REFERENCE-MAP.md`.
- `@DisplayName` must be `"SCN-XXX-NNN: <exact title from scenario file>"`.
- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`.
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`.
- Scenario curation is single-owner work. Only the designated curator for the current execution brief may edit `tests/scenarios/**`; other agents treat it as read-only.
- Curation must reconcile the active baseline from `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, active `docs/openapi/**`, and active `docs/design/**` before test-writing slices begin.
- Obsolete tests tied to removed or future-phase behavior may be deleted once the active scenario set no longer covers that behavior.
- After scenario curation or writing tests: run `./services/api/scripts/sync-registry.sh` and commit the updated `tests/registry.yaml`.
- Never use `@DirtiesContext`.
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap.

| Gate       | Command                    | Use for                                 |
| ---------- | -------------------------- | --------------------------------------- |
| Smoke      | `./gradlew gateSmoke`      | fast local critical-scenario confidence |
| Regression | `./gradlew gateRegression` | nightly / extended validation           |
| Full       | `./gradlew gateFull`       | full suite / mutation testing           |

## Verification

Default backend validation:

```bash
./gradlew --no-daemon :services:api:test
./gradlew --no-daemon :services:api:openApiValidate
./gradlew --no-daemon gateSmoke
```

Conditional drift and schema checks (only when migrations or schema-owned tables/columns are touched):

```bash
python3 tooling/scripts/governance/validate-schema-parity.py
```
