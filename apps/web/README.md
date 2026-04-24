# Tasky Web

React web client for Tasky.

## Read Order

1. `AGENTS.md`
2. `apps/web/AGENTS.md`
3. `docs/architecture/web.md`
4. `docs/architecture/common.md`
5. `docs/API.yaml` when contracts change

## Local Layout

```text
apps/web/
  src/
    components/
      feature/
        landing/
        task-creation/
    layout/
    lib/
    locales/
    pages/
    router/
    test/
  tests/
  e2e/
```

`src/lib/apiClient.ts` and `src/lib/adminApiClient.ts` are the canonical web HTTP boundaries. `@tasky/sdk` remains the generated API type source.

## Commands

```bash
pnpm --filter @tasky/web dev
pnpm --filter @tasky/web build
pnpm --filter @tasky/web preview
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web lint
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web test:e2e:smoke
```

## Testing

- Unit/component: Vitest + React Testing Library
- E2E: Playwright
- For new or touched launch-behavior integration/E2E tests, reuse `SCN-*` names from `tests/scenarios/*.md` when there is a direct scenario match
- Keep `TID-*` for web-only technical checks such as tokens, parity, accessibility, and API-client boundaries
- Accessibility checks for touched flows belong in the test surface, not in ad hoc notes
