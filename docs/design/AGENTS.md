# Tasky Design Agent Contract

Use this file when the change touches `docs/design/**`.

## Read Next

Follow the repo discovery path first. For design work, read in this order until the smallest sufficient surface is covered:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/STRATEGY.md`
4. `docs/ROLLOUT_PHASES.md`
5. relevant `docs/maintenance/*.md`; at minimum `docs/maintenance/DOCUMENTATION_GOVERNANCE.md`, and `docs/maintenance/FEATURE_ACTIVATION_POLICY.md` when a screen touches deferred or toggle-gated behavior
6. `docs/architecture/shared-frontend.md` when component parity, tokens, accessibility, or test naming matters
7. `docs/architecture/mobile.md` or `docs/architecture/web.md` when the design change drives implementation
8. `docs/openapi/AGENTS.md` and `docs/openapi/openapi.yaml` only when request or response contracts affect the screen
9. `docs/BRAND.md` when tone, naming, trust language, or visual identity matters
10. `docs/design/DESIGN_SYSTEM.md`

## Authority

Design docs are derived product and UX contracts. They do not redefine launch behavior.
The authority hierarchy for design work follows `docs/maintenance/DOCUMENTATION_GOVERNANCE.md`:

```text
docs/PRD.md -> docs/STRATEGY.md -> docs/ROLLOUT_PHASES.md -> relevant docs/maintenance/*.md -> docs/architecture/*.md -> docs/openapi/openapi.yaml and other active contracts -> docs/BRAND.md and docs/design/**
```

If an active design artifact conflicts with a higher document, correct the design artifact or stop and raise the conflict before screen implementation continues.

The traceability chain for active screen specs is narrower:

```text
docs/PRD.md -> REQ-P1/NFR ids -> docs/design/journey-catalog.yaml JRN ids -> docs/design/screen-graph.yaml SCR ids -> docs/design/screen-specs/SCR-*.yaml -> app implementation and tests
```

This traceability chain proves ID alignment, not full product authority. Major screen work must still check the governing hierarchy above for phase, policy, trust, and activation posture.

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
