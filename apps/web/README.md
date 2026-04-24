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
pnpm --filter @tasky/web test:e2e:install
pnpm --filter @tasky/web test:e2e:smoke
pnpm --filter @tasky/web test:e2e
pnpm --filter @tasky/web test:e2e:ui
pnpm --filter @tasky/web test:e2e:headed
pnpm --filter @tasky/web test:e2e:report
```

## Testing

- Unit/component: Vitest + React Testing Library
- E2E: Playwright under `apps/web/e2e`
- Run `pnpm --filter @tasky/web test:e2e:install` once on a new workstation to install Chromium. CI uses `test:e2e:install:ci` so browser downloads stay outside the test command.
- Use `test:e2e:smoke` for the merge/release smoke lane. It builds with `VITE_DEV_AUTH_ENABLED=true` and runs Chromium-only `@smoke` specs.
- Use `test:e2e` for the full browser suite. It includes desktop and mobile Chromium projects, accessibility scan attachments, and route screenshots for inspection.
- Use `test:e2e:ui` or `test:e2e:headed` when an agent or developer needs visual debugging. Reports and traces are written to `playwright-report/` and `test-results/`.
- For new or touched launch-behavior integration/E2E tests, reuse `SCN-*` names from `tests/scenarios/*.md` when there is a direct scenario match
- Keep `TID-*` for web-only technical checks such as tokens, parity, accessibility, and API-client boundaries
- Accessibility checks for touched flows belong in the test surface, not in ad hoc notes

## Agent Browser Inspection

The repo-level `.mcp.json` includes a Playwright MCP server pinned through `pnpm dlx @playwright/mcp@0.0.70`. Start the web app with `pnpm --filter @tasky/web dev` or run a Playwright script, then use the `playwright` MCP server for autonomous browser snapshots, locator inspection, screenshots, console diagnostics, and follow-up test generation.
