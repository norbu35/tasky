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
- Keep fragments domain-level. Extend the nearest existing file before creating a new fragment.
- When the contract changes: update `docs/openapi/**`, run `pnpm openapi:bundle`, regenerate the SDK, then validate the backend contract.

## Verification

```bash
pnpm openapi:bundle
pnpm sdk:generate
./gradlew --no-daemon :services:api:openApiValidate
```
