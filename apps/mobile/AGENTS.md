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
- Screen UX contracts: `docs/design/screen-specs/SCR-*.yaml`
- Journey and navigation contracts: `docs/design/journey-catalog.yaml` and `docs/design/screen-graph.yaml`
- Local commands, test entrypoints, and Maestro notes: `apps/mobile/README.md`
- Bundled API contract (compatibility only): `docs/API.yaml`

## Boundaries

- Use NativeWind and the shared token graph by default.
- Do not import web UI primitives into mobile.
- Route shells own navigation chrome and safe-area policy.
- Consume generated SDK types from `@tasky/sdk`.
- Respect the structural contract in `docs/architecture/mobile.md`.
- Run the structure gate after any mobile architectural change.
- Mobile locale files are app-owned and live under `apps/mobile/src/locales/{en,mn}/translation.json`; do not use or create shared client locale files.
- All user-visible copy must come from `react-i18next` locale keys in the mobile locale files. Do not add inline copy, literal `t(...)` fallbacks, hardcoded accessibility labels, placeholders, alert/snackbar text, or empty/error state strings.
- Locale changes must update every supported locale and preserve identical interpolation placeholders.

## Screen Workflow

For new, redesigned, or behavior-changing mobile screens:

1. Find the relevant `SCR-*` screen spec and read its `traceability` block.
2. Read the referenced `REQ-P1-*` / `NFR-*` requirements, `JRN-*` journey steps, screen graph node, and existing `SCN-*` tests before editing implementation.
3. If the spec is `pending_audit`, stop and validate the traceability refs before changing the implementation.
4. Implement through the mobile screen-family contract: thin route adapter, screen composition, `use<Screen>Screen` orchestration, pure model, semantic sections, shared primitives/templates, and token-backed styling.
5. Keep all visible copy i18n-backed in the mobile locale files.

## Quick Reference

- Route files import the Screen component only.
- No deep `../../` imports in `src/**`.
- `screens/` is not a dumping ground for helpers or barrels.
- Orchestration hooks under `screens/` use the `Screen` suffix; domain hooks outside `screens/` do not.

## Testing Rules

- Tests that render UI must use the production i18n contract or a test i18n instance loaded from locale files. Do not mock `t` to return fallback arguments.
- If a test expects visible copy, add the locale key first and assert the rendered translated text or an accessibility role/name.

## Verification

Default mobile validation:

```bash
pnpm verify:i18n
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/mobile lint
```

Conditional structural validation:

```bash
pnpm --filter @tasky/mobile structure:check
```

Run the structure gate after navigation, route-shell, import-boundary, or other mobile architectural changes.

Screen-spec validation:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Run this when a mobile change updates `docs/design/screen-specs/SCR-*.yaml` or discovers a spec still marked
`pending_audit`.
