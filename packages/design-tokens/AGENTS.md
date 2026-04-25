# Tasky Design Tokens Package Agent Contract

Use this file when the change touches `packages/design-tokens/**`.

## Read Next

- `docs/architecture/shared-frontend.md`, then `docs/design/DESIGN_SYSTEM.md`

## Boundaries

- Runtime token implementation only: no app-local component logic and no pure design documentation.
- Canonical design documentation lives under `docs/design/**`; this package should derive runtime code from that surface.
- Keep source organized by role:
  - `src/core/**` for primitive, semantic, and motion token definitions.
  - `packages/design-tokens/src/core/additions.ts` for promoted system-level additions such as interaction states,
    overlays, icon sizes, elevation, typography variants, density, animation presets, opacity colors, and content rules.
  - `src/platform/**` for web and native outputs.
  - `src/compat/**` for legacy aggregate exports.
  - `packages/design-tokens/src/styles/tokens.css` for runtime CSS consumed through the package CSS export.
- Do not add handoff CSS, UI-kit previews, or documentation-only artifacts to this package.
- Keep the root package export and both platform outputs aligned when adding a token category.
- Changes here affect both web and mobile consumers.

## Verification

```bash
pnpm --filter @tasky/design-tokens build
pnpm --filter @tasky/design-tokens test
pnpm --filter @tasky/design-tokens lint
```
