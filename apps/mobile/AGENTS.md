# Tasky Mobile Agent Contract

Use this file when the change touches `apps/mobile/**`.

## Read Next

1. `apps/mobile/AGENTS.md` (this file)
2. `docs/architecture/mobile.md`
3. `docs/architecture/shared-frontend.md` — only when shared UI/tokens/parity/test naming matter
4. `docs/architecture/common.md` — only when cross-cutting runtime/dev workflow context matters
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only when API contracts change

Additional references:

- Token and UI system rules: `docs/design/DESIGN_SYSTEM.md`
- Local commands, test entrypoints, and Maestro notes: `apps/mobile/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

## Boundaries

- Use NativeWind and the shared token graph by default.
- Do not import web UI primitives into mobile.
- Route shells own navigation chrome and safe-area policy.
- Consume generated SDK types from `@tasky/sdk`.
- Respect the structural contract in `docs/architecture/mobile.md`.
- Run the structure gate after any mobile architectural change.

## Quick Reference

- Route files import the Screen component only.
- No deep `../../` imports in `src/**`.
- `screens/` is not a dumping ground for helpers or barrels.
- Orchestration hooks under `screens/` use the `Screen` suffix; domain hooks outside `screens/` do not.

## Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile lint
```
