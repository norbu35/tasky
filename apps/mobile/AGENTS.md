# Tasky Mobile Agent Contract

Use this file when the change touches `apps/mobile/**`.

## Read Next

1. `docs/architecture/mobile.md`
2. `docs/architecture/shared-frontend.md`
3. `docs/architecture/common.md`
4. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` — only when API contracts change

References:

- Token and UI system rules: `docs/design/DESIGN_SYSTEM.md`
- Screen UX contracts: `docs/design/screen-specs/SCR-*.yaml`
- Journey and navigation contracts: `docs/design/journey-catalog.yaml`, `docs/design/screen-graph.yaml`
- Local commands, test entrypoints, and Maestro notes: `apps/mobile/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

## Boundaries

- Use NativeWind and the shared token graph by default.
- Do not import web UI primitives into mobile.
- Route shells own navigation chrome and safe-area policy.
- Consume generated SDK types from `@tasky/sdk`.
- Respect the structural contract in `docs/architecture/mobile.md` §7.7. Run the structure gate after any architectural change.

## Quick Reference

- Route files import the Screen component only.
- No deep `../../` imports in `src/**`.
- `screens/` is not a dumping ground for helpers or barrels.
- Orchestration hooks under `screens/` use the `Screen` suffix; domain hooks outside `screens/` do not.

## I18n

Follow the canonical i18n rules in root `AGENTS.md`. Mobile locale files: `apps/mobile/src/locales/{en,mn}/translation.json`. Do not create or use shared client locale files.

## Env

Mobile app env is app-local. Copy `apps/mobile/.env.example` to `apps/mobile/.env` for Expo and native builds. Use `EXPO_PUBLIC_*` only for values that may be bundled into the client, and keep native SDK keys such as Google Maps in the mobile env file. Do not read the root `.env` from mobile app or native config code for app-owned client/native settings.

## Screen Workflow

For new, redesigned, or behavior-changing mobile screens:

1. Find the relevant `SCR-*` screen spec and read its `traceability` block.
2. Read the referenced `REQ-P1-*` / `NFR-*`, `JRN-*` steps, screen graph node, and existing `SCN-*` tests before editing implementation.
3. If the spec is `pending_audit`, validate the traceability refs before changing the implementation.
4. Implement through the mobile screen-family contract: thin route adapter, screen composition, `use<Screen>Screen` orchestration, pure model, semantic sections, shared primitives/templates, token-backed styling.

## Mobile Testing Rules

- Before writing or changing mobile integration tests for launch behavior, check `tests/registry.yaml` and the relevant `tests/scenarios/<domain>.md`.
- If a touched mobile behavioral test has a clean scenario match, name it `SCN-XXX-NNN: <exact title from scenario file>`.
- If no scenario covers the behavior and you are not the designated scenario curator, stop and report the gap.
- Keep `TID-*` for mobile-only technical checks (token binding, parity, accessibility, structural smoke).
- Stack: Jest + RNTL. For auth, payments, wallet, migrations, or `SecurityConfig` changes, write positive and negative tests and call them out in the PR.

## Verification

Default mobile validation:

```bash
pnpm verify:i18n
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/mobile lint
```

Structure gate (after navigation, route-shell, import-boundary, or other architectural changes):

```bash
pnpm --filter @tasky/mobile structure:check
```

Screen-spec validation (when a mobile change updates `docs/design/screen-specs/SCR-*.yaml` or discovers a spec still marked `pending_audit`):

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```
