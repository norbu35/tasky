# Mobile Maestro Authoring Rules

## Authority

- Flow authority: `docs/design/journey-catalog.yaml`
- Screen route/state authority: `docs/design/screen-specs/SCR-*.yaml`
- Required state checklist: `docs/design/state-matrix.yaml`
- Synchronized summary only: `docs/design/screen-inventory.yaml`

When these files disagree, use the authority order above.
Do not infer routes or states from old handoff notes or prompt artifacts.

## Selector rules

- Prefer `SCR-*` `testID`s for root screen assertions.
- Prefer stable control IDs over visible text when possible.
- Do not make localization-sensitive assertions when an ID exists.
- Use visible text only when the design contract intentionally validates copy.
- Avoid selectors that depend on incidental view nesting or child order.

## File naming rules

- Journey files: `apps/mobile/maestro/flows/JRN-<ID>-<slug>.yaml`
- Screen smoke/state files: `apps/mobile/maestro/flows/SCR-<ID>-<state-or-purpose>.yaml`
- Shared helpers or setup flows: `apps/mobile/maestro/flows/_support/<name>.yaml`

## Coverage model

### 1. Journey flows
Use one Maestro flow per `JRN-*` happy path, plus selected high-risk alternate paths.
These flows verify that the app can move through the intended user journey end to end.

### 2. Screen/state coverage
Add dedicated Maestro smoke/state flows for:
- screens not covered by any journey
- required loading, empty, error, timeout, and blocker states
- modal surfaces with no standalone journey ownership

## Route lookup rule

When a route is needed for implementation or debugging, look it up in the matching `docs/design/screen-specs/SCR-*.yaml` file first.
Use `docs/design/screen-inventory.yaml` only as a synchronized summary.

## Minimal scenario template

```yaml
appId: <mobile app id>
---
- launchApp
- assertVisible:
    id: "SCR-SHARED-002"
```

## Per-flow metadata requirements

Each Maestro file should start with comments documenting:
- source journey ID or screen ID
- covered states
- actor/role preconditions
- feature flags or phase assumptions
- whether the file is a happy path, alternate path, smoke test, or state coverage flow

Example header:

```yaml
# source: JRN-CUST-01
# coverage: happy_path
# actor: customer
# states: SCR-CUST-001 -> SCR-CUST-008
# flags: none
```

## Assertion rules

- Assert the root `SCR-*` screen ID immediately after navigation settles.
- For stateful screens, assert one or more state-distinguishing controls or messages after the root screen assertion.
- For error/timeout states, assert the recovery action as well as the error marker.
- For modal flows, assert both the underlying screen context and the modal identity if both are rendered.

## Robustness rules

- Prefer deterministic test setup over long wait chains.
- Use Maestro waits only to absorb known async transitions, not to mask flaky selectors.
- Keep one primary responsibility per file.
- Split large flows when a failure would otherwise hide which screen/state regressed.

## Traceability rules

- Every `JRN-*` flow should map back to `docs/design/journey-catalog.yaml`.
- Every `SCR-*` smoke/state flow should map back to `docs/design/screen-specs/SCR-*.yaml` and `docs/design/state-matrix.yaml`.
- If a required state has no feasible Maestro path yet, record the gap in `docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md` instead of silently skipping it.
