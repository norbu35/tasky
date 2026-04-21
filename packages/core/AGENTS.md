# Tasky Core Package Agent Contract

Use this file when the change touches `packages/core/**`.

## Read Next

- `docs/architecture/shared-frontend.md`, then `docs/architecture/common.md`
- `packages/sdk/AGENTS.md` if SDK-exposed schema types are changed or consumed differently

## Boundaries

- Platform-agnostic only: no app-specific UI, no web-only or mobile-only imports.
- Do not import from `apps/web`, `apps/mobile`, or `services/api`.
- Types and utilities here may be consumed by any app or package.

## Verification

```bash
pnpm --filter @tasky/core typecheck
pnpm --filter @tasky/core test
pnpm --filter @tasky/core lint
```
