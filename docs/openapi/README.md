# OpenAPI Layout

Tasky authors the active API contract in split source files under `docs/openapi/**`.

## Source of truth

- `docs/openapi/openapi.yaml` is the root source document.
- `docs/openapi/paths/*.yaml` groups active path items by domain surface.
- `docs/openapi/components/schemas/*.yaml` groups active schemas by domain surface.
- `docs/API.yaml` is the generated single-file compatibility artifact.

## Workflow

1. Edit the relevant split source file under `docs/openapi/**`.
2. Run `pnpm openapi:bundle` to refresh `docs/API.yaml`.
3. Run `pnpm sdk:generate` if consumer SDKs need regeneration.
4. Run `./gradlew --no-daemon :services:api:openApiValidate`.

## Contract boundary

- The active contract describes the current Phase 1 launch baseline only.
- Future rollout intent belongs in `docs/ROLLOUT_PHASES.md`.
- Later-phase API drafts should not live in the active contract path.
- If future API design is worth preserving, archive it instead of keeping it mixed into active path fragments.
