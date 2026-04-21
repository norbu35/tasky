# Tasky Web Agent Contract

Use this file when the change touches `apps/web/**`.

## Read Next

1. `apps/web/AGENTS.md` (this file)
2. `docs/architecture/web.md`
3. `docs/architecture/shared-frontend.md` — only when shared UI/tokens/parity/test naming matter
4. `docs/architecture/common.md` — only when cross-cutting runtime/dev workflow context matters
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only when API contracts change

Additional references:

- Visual rules: `docs/design/DESIGN_SYSTEM.md`
- Local commands and test entrypoints: `apps/web/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

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
