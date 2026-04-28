# OpenAPI Layout

Tasky authors the active API contract in split source files under `docs/openapi/**`.

## Source of truth

- `docs/openapi/openapi.yaml` is the root source document.
- `docs/openapi/paths/*.yaml` groups live Phase 1 path items and deliberately deferred path items by domain surface.
- `docs/openapi/components/schemas/*.yaml` groups live Phase 1 schemas and deliberately deferred schemas by domain
  surface.
- `docs/API.yaml` is the generated single-file compatibility artifact.

## Workflow

1. Edit the relevant split source file under `docs/openapi/**`.
2. Run `pnpm contract:openapi:bundle` to refresh `docs/API.yaml`.
3. Run `pnpm contract:sdk:generate` if consumer SDKs need regeneration.
4. Run `./gradlew --no-daemon :services:api:openApiValidate`.

## Contract boundary

- Live, ungated behavior in this contract describes the current Phase 1 launch baseline only.
- Future rollout intent belongs in `docs/ROLLOUT_PHASES.md`.
- Deferred path or schema surfaces may stay in `docs/openapi/**` only when they are intentionally preserved for
  implemented-and-gated or near-future contract discovery and carry the required `x-tasky-status` / phase metadata.
- Unmarked later-phase API drafts should not live in the active contract path. If future API design is worth preserving
  without metadata, archive it instead of keeping it mixed into active path fragments.
