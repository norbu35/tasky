# Tasky API Agent Contract

Use this file when the change touches `services/api/**`.

## Read Next

1. `services/api/AGENTS.md` (this file)
2. `docs/architecture/api.md` (especially §1.1 Foundational Design Patterns)
3. Nearest module `AGENTS.md` under `src/main/java/mn/tasky/**`
4. `docs/architecture/common.md` — only for cross-cutting runtime/NFR/dev workflow topics
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only for contract changes

Bundled API contract (compatibility only): `docs/API.yaml`

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
- Contract-first still applies: update `docs/openapi/**` before implementation when the API changes, then regenerate `docs/API.yaml`.
- Security-sensitive code needs positive and negative tests.
- Follow scenario-first testing rules from root `AGENTS.md`.
- Keep feature behavior local to the owning module instead of leaking cross-module logic into common infrastructure.

## Verification

```bash
./gradlew --no-daemon :services:api:test
./gradlew --no-daemon :services:api:openApiValidate
./gradlew --no-daemon gateSmoke
```
