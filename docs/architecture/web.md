# Tasky Architecture — Web App

Status: derived architecture contract for `apps/web`.

Read this after:

1. `AGENTS.md`
2. `docs/PRD.md` and `docs/STRATEGY.md`
3. `apps/web/AGENTS.md`
4. `docs/architecture/web.md` (this file)
5. `docs/architecture/shared-frontend.md` — only when shared UI/tokens/parity/test naming matter
6. `docs/architecture/common.md` — only when cross-cutting runtime/dev workflow context matters

## Scope

This document is intentionally small. Web-specific rules live here. Shared system rules stay in `common.md`. Cross-platform frontend contracts (tokens, parity, test naming) stay in `shared-frontend.md`. Backend API contracts stay in `api.md`.

## Platform Contract

- Framework: React + Vite + Tailwind CSS.
- UI primitives live in `apps/web/src/components/ui/`.
- Use Radix UI + Tailwind components only. Do not introduce Material UI, Chakra, Ant Design, or another competing UI system.
- Styling flows through `@tasky/design-tokens`.
- Accessibility is not optional: touched flows need visible focus states and minimum AA contrast.
- Consume generated types from `@tasky/sdk`; do not hand-write fetch contracts when an API schema already exists.

## Local Ownership

### File Ownership

```text
apps/web/
  src/
    components/
      ui/          # shared web primitives
      feature/     # domain compositions built from ui/
      landing/     # marketing-only sections
      task-creation/
    layout/        # app shell and layout boundaries
    lib/           # transport/client utilities
    locales/       # i18n resources
    pages/         # route-level page components
    router/        # route tree and guards
    test/          # local test setup helpers
  tests/           # integration and accessibility tests
  e2e/             # Playwright end-to-end coverage
```

### Route And Composition Rules

- Route definitions stay in `src/router/`.
- Route-level page components stay in `src/pages/`.
- Cross-route shared UI belongs in `src/components/` or `src/layout/`, not inside page files.
- Feature composition should prefer existing primitives before adding new wrappers.
- Shared logic belongs in `src/lib/`, hooks, or context boundaries, not inside page render bodies.

## Testing Contract

- Unit/component tests: Vitest + React Testing Library.
- E2E tests: Playwright.
- Accessibility checks for touched flows belong in the web test surface, not as ad hoc manual notes.
- Every touched API flow must remain aligned with `docs/openapi/**`, the bundled `docs/API.yaml`, and generated SDK output.

## Verification Commands

```bash
pnpm --filter @tasky/web dev
pnpm --filter @tasky/web build
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web test:e2e:smoke
pnpm --filter @tasky/web lint
pnpm --filter @tasky/web typecheck
```

## Out Of Scope

These do not belong here:

- shared system architecture
- backend schema and API policy
- mobile structural rules
- historical plans or remediation tranches

Keep those in `docs/architecture/common.md`, `docs/openapi/**`, the bundled `docs/API.yaml`, `docs/architecture/mobile.md`, or archive paths as appropriate.
