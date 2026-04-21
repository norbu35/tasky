# Tasky API Agent Contract

Use this file when the change touches `services/api/**`.

## Read Order

1. `AGENTS.md`
2. `docs/architecture/common.md`
3. `docs/API.yaml`
4. The nearest module `AGENTS.md` under `src/main/java/mn/tasky/**`
5. `services/api/src/README.md` for local layout hints when needed

## Boundaries

- Persistence is JDBI + explicit SQL. Do not introduce JPA.
- Contract-first still applies: update `docs/API.yaml` before implementation when the API changes.
- Security-sensitive code needs positive and negative tests.
- Follow scenario-first testing rules from root `AGENTS.md`.
- Keep feature behavior local to the owning module instead of leaking cross-module logic into common infrastructure.

## Verification

```bash
./gradlew --no-daemon :services:api:test
./gradlew --no-daemon :services:api:openApiValidate
./gradlew --no-daemon gateSmoke
```
