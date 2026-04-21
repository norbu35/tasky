# Tasky Design Tokens Package Agent Contract

Use this file when the change touches `packages/design-tokens/**`.

## Read Next

- `docs/architecture/shared-frontend.md`, then `docs/design/DESIGN_SYSTEM.md`

## Boundaries

- Token source-of-truth only: no app-local component logic.
- Outputs (CSS variables, NativeWind bindings) are derived; do not hand-edit generated output.
- Changes here affect both web and mobile consumers.

## Verification

```bash
pnpm --filter @tasky/design-tokens build
pnpm --filter @tasky/design-tokens test
pnpm --filter @tasky/design-tokens lint
```
