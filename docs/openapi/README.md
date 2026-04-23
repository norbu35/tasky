# OpenAPI Layout

Tasky now authors OpenAPI in split source files under `docs/openapi/**`.

## Source Of Truth

- `docs/openapi/openapi.yaml` is the root source document.
- `docs/openapi/paths/*.yaml` groups path items by domain surface.
- `docs/openapi/components/schemas/*.yaml` groups schemas by domain surface.
- `docs/API.yaml` is the generated single-file compatibility artifact for consumers that still want one file.

## Workflow

1. Edit the relevant split source file under `docs/openapi/**`.
2. Run `pnpm openapi:bundle` to refresh `docs/API.yaml`.
3. Run `pnpm sdk:generate` to regenerate `@tasky/sdk`.
4. Run `./gradlew --no-daemon :services:api:openApiValidate`.

## Fragment Policy

- Prefer domain-level files such as `paths/tasks.yaml` or `components/schemas/monetization.yaml`.
- Keep reusable parameters, responses, and security schemes in `components/`.
- Add a new fragment only when an existing domain file becomes meaningfully harder to review.

## Rollout Contract Rule

- Active contract files may describe launch behavior and implemented-and-gated runtime surfaces.
- Future phase intent belongs in `docs/ROLLOUT_PHASES.md`.
- Do not add draft forward-reference paths to the active contract unless the runtime surface genuinely exists and the disabled behavior is part of the supported server posture.
