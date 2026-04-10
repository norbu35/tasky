# Mobile Doc Authority Audit (2026-04-04)

## Scope

This audit covers live files under `docs/` only and excludes `archive/` from authority decisions.
The goal is to identify which documentation surfaces are authoritative for mobile UI parity and Maestro coverage, and which surfaces are derived views that must stay synchronized with the authoritative layer.

## Canonical sources

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/design/journey-catalog.yaml`
- `docs/design/screen-specs/SCR-*.yaml`

## Derived sources

- `docs/ARCHITECTURE_INDEX.md`
- `docs/design/screen-inventory.yaml`
- `docs/design/state-matrix.yaml`
- `docs/design/screen-graph.yaml`
- `docs/design/prompts/**`
- `docs/plans/2026-04-05-maestro-setup-handoff.md`

## Why these are canonical

### `docs/PRD.md`
Product scope, phase boundaries, user journeys, and behavioral requirements originate here.

### `docs/ARCHITECTURE.md`
The technical baseline, parity expectations, Expo/mobile architecture constraints, and design-system runtime rules originate here.

### `docs/design/journey-catalog.yaml`
This is the authoritative journey-level definition for mobile user flows, happy paths, and alternate branches.

### `docs/design/screen-specs/SCR-*.yaml`
These files are the authoritative per-screen definitions for route intent, states, copy intent, components, and acceptance criteria.
`docs/design/prompts/README.md` explicitly states that `screen-specs/SCR-*.yaml` is the exhaustive source for per-screen states and acceptance criteria.

## Why the other files are derived

### `docs/ARCHITECTURE_INDEX.md`
This file explicitly says it is non-normative and serves as a routing table to canonical documents.

### `docs/design/screen-inventory.yaml`
This file is intended as a summary screen list and generation-order input, not the deepest behavioral contract.
It must mirror screen specs rather than define competing route/state values.

### `docs/design/state-matrix.yaml`
This file is a coverage matrix used for completeness validation.
It is useful for testing and parity tracking but should not override `screen-specs/`.

### `docs/design/screen-graph.yaml`
This file is a derived navigation helper.
Its header says it depends on `journey-catalog.yaml` and `screen-inventory.yaml`.

### `docs/design/prompts/**`
Prompt artifacts are generated for Stitch/design generation workflows.
They derive from the authored design docs rather than acting as the source of runtime truth.

### `docs/plans/2026-04-05-maestro-setup-handoff.md`
This is a handoff/operational plan document.
It should reflect the authority chain, not define it.

## Drift found

### `docs/design/screen-inventory.yaml`
- 64 route mismatches compared with `docs/design/screen-specs/SCR-*.yaml`
- 57 state mismatches compared with `docs/design/screen-specs/SCR-*.yaml`

This makes `screen-inventory.yaml` unreliable as route/state authority for Expo Router or Maestro until repaired.

### `docs/design/state-matrix.yaml`
- 3 state mismatches compared with `docs/design/screen-specs/SCR-*.yaml`
- mismatched screens: `SCR-SHARED-001`, `SCR-CUST-006`, `SCR-CUST-007`

This makes `state-matrix.yaml` mostly reliable but still subordinate to screen specs.

### `docs/design/journey-catalog.yaml`
- 22 screens are not covered by a `JRN-*` flow reference

This means journey coverage alone cannot fully drive complete Maestro UI coverage.
Additional screen/state-level Maestro coverage is required.

## Working precedence order

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/design/journey-catalog.yaml`
4. `docs/design/screen-specs/SCR-*.yaml`
5. `docs/design/state-matrix.yaml`
6. `docs/design/screen-graph.yaml`
7. `docs/design/screen-inventory.yaml`
8. `docs/design/prompts/**`
9. `docs/plans/**`

## Enforcement rule

When derived docs conflict with canonical docs, canonical docs win.
Derived docs must be repaired to mirror the canonical layer instead of introducing alternate route/state definitions.

## Maestro implication

For mobile UI alignment and Maestro coverage:
- use `docs/design/journey-catalog.yaml` for flow authority
- use `docs/design/screen-specs/SCR-*.yaml` for screen-level route, state, and acceptance authority
- use `docs/design/state-matrix.yaml` as a completeness checklist after it is synchronized
- treat `docs/design/screen-inventory.yaml` as a synchronized summary only

## Scope discipline notes

- This audit excludes `archive/` from authority decisions.
- No runtime/source-code facts are asserted here unless already evidenced by live docs.
- The audit distinguishes authoritative docs from derived docs explicitly so implementation and Maestro authoring can follow one stable chain.
