# Tasky Web Agent Contract

Use this file when the change touches `apps/web/**`.

## Read Next

1. `docs/architecture/web.md`
2. `docs/architecture/shared-frontend.md`
3. `docs/architecture/common.md`
4. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only when API contracts change

References:

- Visual rules: `docs/design/DESIGN_SYSTEM.md`
- Local commands and test entrypoints: `apps/web/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

## Boundaries

- UI primitives live in `src/components/ui/` and use Radix UI + Tailwind only.
- Use `@tasky/sdk` as the generated API type source.
- Keep HTTP wrappers centralized in `apps/web/src/lib/apiClient.ts` and `apps/web/src/lib/adminApiClient.ts`; do not scatter ad hoc `fetch` calls through pages.
- Route structure belongs in `src/router/` and `src/pages/`. Shared layouts belong in `src/layout/`.
- Accessibility and focus behavior are part of the contract, not post-hoc polish.

## I18n

Follow the canonical i18n rules in root `AGENTS.md`. Web locale files: `apps/web/src/locales/{en,mn}/translation.json`. Do not create or use shared client locale files.

## Env

Web app env is app-local. Copy `apps/web/.env.example` to `apps/web/.env.local` for local development. Vite loads env files from `apps/web`, not the monorepo root. Keep browser-exposed values under `VITE_*`; do not read the root `.env` from web app code and do not put secrets in web env files.

## Web Testing Rules

- Before writing or changing web integration or E2E tests for launch behavior, check `tests/registry.yaml` and the relevant `tests/scenarios/<domain>.md`.
- If a touched web behavioral test has a clean scenario match, name it `SCN-XXX-NNN: <exact title from scenario file>`.
- If no scenario covers the behavior and you are not the designated scenario curator, stop and report the gap rather than inventing web-only launch behavior.
- Keep `TID-*` for web-only technical checks (token binding, parity, accessibility, API-client boundaries, shell smoke).
- Split broad flow tests when needed rather than forcing one SCN onto multiple behaviors.
- Stack: Vitest + RTL. For auth, payments, wallet, migrations, or `SecurityConfig` changes, write positive and negative tests and call them out in the PR.

## Verification

Default web validation:

```bash
pnpm verify:i18n
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web lint
```

Browser-flow validation (when the change affects route flows, auth, or browser-visible interactions unit tests do not cover well):

```bash
pnpm --filter @tasky/web test:e2e:install
pnpm --filter @tasky/web test:e2e:smoke
```

Use `pnpm --filter @tasky/web test:e2e` for full browser coverage, mobile viewport behavior, accessibility scan attachments, or route screenshots.
