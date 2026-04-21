# Tasky Web Agent Contract

Use this file when the change touches `apps/web/**`.

## Read Order

1. `AGENTS.md`
2. `docs/architecture/web.md`
3. `docs/architecture/common.md`
4. `docs/API.yaml` if the change touches API contracts or generated SDK usage
5. `docs/design/DESIGN_SYSTEM.md` for visual rules
6. `apps/web/README.md` for local commands and test entrypoints

## Boundaries

- UI primitives live in `src/components/ui/`.
- Use Radix UI + Tailwind only.
- Prefer `@tasky/sdk` over handwritten fetch contracts.
- Route structure belongs in `src/router/` and `src/pages/`.
- Shared layouts belong in `src/layout/`.
- Accessibility and focus behavior are part of the contract, not post-hoc polish.

## Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web test:e2e:smoke
pnpm --filter @tasky/web lint
```
