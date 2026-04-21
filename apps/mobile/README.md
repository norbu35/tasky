# Tasky Mobile

Expo / React Native client for Tasky.

## Read Order

1. `AGENTS.md`
2. `apps/mobile/AGENTS.md`
3. `docs/architecture/mobile.md`
4. `docs/architecture/common.md`
5. `docs/API.yaml` when contracts change

## Local Layout

```text
apps/mobile/
  src/
    app/
    components/
    design/
    features/
    hooks/
    lib/
    locales/
    providers/
    store/
    utils/
  __tests__/
  maestro/
  scripts/
```

## Commands

```bash
pnpm --filter @tasky/mobile start
pnpm --filter @tasky/mobile ios
pnpm --filter @tasky/mobile android
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/mobile structure:check
```

## Testing

- Unit/component: Jest + React Native Testing Library
- Device E2E: Maestro
- `test:e2e:smoke` covers only deterministic launch-live smoke flows

## Visual Audit Capture

```bash
./scripts/capture-visual-audit.sh [batch]
```

Run from `apps/mobile/`. Valid batches: `smoke`, `auth`, `customer`, `tasker`, `shared`, `all`.
