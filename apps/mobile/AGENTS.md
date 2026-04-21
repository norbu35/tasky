# Tasky Mobile Agent Contract

Use this file when the change touches `apps/mobile/**`.

## Read Next

- `docs/architecture/mobile.md`, then `docs/architecture/common.md`
- `docs/API.yaml` when the change touches API contracts or generated SDK usage
- `docs/design/DESIGN_SYSTEM.md` for token and UI system rules
- `apps/mobile/README.md` for local commands, test entrypoints, and Maestro notes

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
