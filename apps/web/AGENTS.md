# Tasky Web Agent Contract

Use this file when the change touches `apps/web/**`.

## Read Next

1. `apps/web/AGENTS.md` (this file)
2. `docs/architecture/web.md`
3. `docs/architecture/shared-frontend.md` — only when shared UI/tokens/parity/test naming matter
4. `docs/architecture/common.md` — only when cross-cutting runtime/dev workflow context matters
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only when API contracts change

Additional references:

- Visual rules: `docs/design/DESIGN_SYSTEM.md`
- Local commands and test entrypoints: `apps/web/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

## Boundaries

- UI primitives live in `src/components/ui/`.
- Use Radix UI + Tailwind only.
- Use `@tasky/sdk` as the generated API type source.
- Keep HTTP wrappers centralized in `apps/web/src/lib/apiClient.ts` and `apps/web/src/lib/adminApiClient.ts`; do not scatter ad hoc `fetch` calls through pages.
- Route structure belongs in `src/router/` and `src/pages/`.
- Shared layouts belong in `src/layout/`.
- Accessibility and focus behavior are part of the contract, not post-hoc polish.
- All user-visible copy must come from `react-i18next` locale keys. Do not add inline copy, literal `t(...)` fallbacks, hardcoded aria labels, placeholders, toast text, or empty/error state strings.
- Locale changes must update every supported locale and preserve identical interpolation placeholders.

## Testing Rules

- Before writing or changing web integration or E2E tests for launch behavior, check `tests/registry.yaml` and the relevant `tests/scenarios/<domain>.md`
- If a touched web behavioral test has a clean scenario match, name it `SCN-XXX-NNN: <exact title from scenario file>`
- Keep `TID-*` for web-only technical checks such as token binding, parity, accessibility, API-client boundaries, and shell smoke
- Split broad flow tests when needed rather than forcing one SCN onto multiple behaviors
- Tests that render UI must use the production i18n contract or a test i18n instance loaded from locale files. Do not mock `t` to return fallback arguments.
- If a test expects visible copy, add the locale key first and assert the rendered translated text or an accessible role/name.

## Verification

Default web validation:

```bash
pnpm verify:i18n
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web lint
```

Conditional browser-flow validation:

```bash
pnpm --filter @tasky/web test:e2e:smoke
```

Use the smoke run when the change affects route flows, auth, or browser-visible interactions that unit tests do not cover well.
