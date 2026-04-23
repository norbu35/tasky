# Tasky SDK Package Agent Contract

Use this file when the change touches `packages/sdk/**`.

## Read Next

- `docs/openapi/AGENTS.md`, then `docs/architecture/api.md`

## Boundaries

- Generated surface: do not hand-edit generated output unless package structure requires it.
- Source of truth is `docs/openapi/openapi.yaml` (canonical), not `docs/API.yaml` (compatibility bundle).
- When the API changes: update `docs/openapi/**` first, regenerate `docs/API.yaml`, then regenerate here.

## Verification

Default SDK validation:

```bash
pnpm --filter @tasky/sdk typecheck
```

Conditional contract-regeneration validation:

```bash
pnpm openapi:bundle
pnpm --filter @tasky/sdk generate
pnpm --filter @tasky/sdk drift:check
```

Run the regeneration path when `docs/openapi/**` or bundled contract output changed, or when package structure work could affect generated SDK output.
