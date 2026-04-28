# Tasky OpenAPI Contract Guide

Use this file when the change touches `docs/openapi/**` or restructures request/response contracts.

## Read Next

- `AGENTS.md`
- `docs/architecture/api.md`, then `docs/architecture/common.md`
- `docs/openapi/README.md`
- `docs/openapi/openapi.yaml`

## Rules

- `docs/openapi/**` is the canonical OpenAPI source. Edit it directly.
- `docs/API.yaml` is a generated compatibility artifact. Do not hand-edit it.
- Keep live contract behavior limited to Phase 1 endpoints and deliberately deferred endpoints. Do not keep unmarked
  404-only forward references in the active spec.
- Any implemented-but-deferred or spec-only deferred path must carry `x-tasky-status: deferred`,
  `x-tasky-phase`, and `x-tasky-target-phase`. Deferred schemas must carry `x-tasky-status: deferred` and
  `x-tasky-phase`.
- Keep fragments domain-level. Extend the nearest existing file before creating a new fragment.
- When the contract changes: update `docs/openapi/**`, run `pnpm contract:openapi:bundle`, regenerate the SDK, then validate the backend contract.

## Verification

```bash
pnpm contract:openapi:bundle
pnpm contract:sdk:generate
./gradlew --no-daemon :services:api:openApiValidate
```
