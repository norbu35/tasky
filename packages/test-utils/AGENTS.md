# Tasky Test Utils Package Agent Contract

Use this file when the change touches `packages/test-utils/**`.

## Read Next

- `docs/architecture/shared-frontend.md`, then the nearest consumer app contract if the change is app-specific

## Boundaries

- Shared testing helpers only: no production app logic.
- Do not import from `apps/web`, `apps/mobile`, or `services/api` production source.
- Utilities here may be consumed by any test surface in the monorepo.

## Verification

```bash
pnpm --filter @tasky/test-utils typecheck
pnpm --filter @tasky/test-utils test
```
