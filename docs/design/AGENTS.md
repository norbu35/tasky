# Tasky Design Agent Contract

Use this file when the change touches `docs/design/**`.

## Read Next

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/STRATEGY.md`
4. `docs/ROLLOUT_PHASES.md`
5. `docs/design/DESIGN_SYSTEM.md`
6. `docs/architecture/shared-frontend.md` when component parity, tokens, accessibility, or test naming matters
7. `docs/architecture/mobile.md` or `docs/architecture/web.md` when the design change drives implementation

## Authority

Design docs are derived product and UX contracts. They do not redefine launch behavior.

The working chain is:

```text
docs/PRD.md -> REQ-P1/NFR ids -> docs/design/journey-catalog.yaml JRN ids -> docs/design/screen-graph.yaml SCR ids -> docs/design/screen-specs/SCR-*.yaml -> app implementation and tests
```

`tests/registry.yaml` supplies optional `SCN-*` coverage references when a scenario-backed test already exists.

## Screen Spec Traceability

Every active screen spec must contain:

```yaml
traceability:
  status: pending_audit | validated
  screen_graph_node: SCR-...
  prd_refs: []
  journey_refs: []
  scenario_refs: []
```

- `screen_graph_node` must equal the spec's `screen_id` and resolve in `screen-graph.yaml`.
- `prd_refs` must use live `REQ-P1-*` or `NFR-*` IDs from `docs/PRD.md`.
- `journey_refs` must use `JRN-*`, `JRN-*:step-N`, alternate-path IDs, or `paths[].id` refs from `journey-catalog.yaml`.
- `scenario_refs` must use `SCN-*` IDs from `tests/registry.yaml` when a scenario-backed test exists.
- Active specs should normally be `validated`. Do not add `pending_audit` specs unless the task explicitly scopes a follow-up audit.
- New or materially changed screen specs should be `validated` before implementation work starts.

## Working Rules

- Update screen specs before changing mobile or web screen behavior.
- Do not import or generate runtime code from `docs/design/**`; promote reusable runtime intent into `@tasky/design-tokens`, shared primitives, templates, and app code.
- Keep `phase: "0-1"` screen specs aligned with the active Phase 1 launch baseline.
- If a screen describes future behavior, move it out of the active design path or mark the feature as dormant through the governing docs first.
- Use i18n keys in app code; screen-spec copy is design source material, not a runtime fallback.

## Verification

Run the narrow traceability check after screen-spec edits:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
```

Run the docs lane before handing off design-contract changes:

```bash
pnpm repo:docs:check
```
