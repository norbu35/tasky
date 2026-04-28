# ADR Directory

This directory stores ADR-style decision drafts and historical decision notes.

ADRs are not currently a governing documentation class for Tasky. Until
`docs/maintenance/DOCUMENTATION_GOVERNANCE.md` explicitly adopts an ADR process, these files are context only and must
not override `docs/PRD.md`, `docs/STRATEGY.md`, `docs/METRICS.md`, `docs/ROLLOUT_PHASES.md`, maintenance policy,
architecture, OpenAPI, or design contracts.

## Naming

Use incremental numeric prefixes:

- `0001-title.md`
- `0002-title.md`

## Required Sections

1. Status (`proposed`, `accepted`, `superseded`, `deferred`, `deprecated`)
2. Date (ISO format)
3. Context
4. Decision
5. Consequences
6. Alternatives considered

If an ADR conflicts with the current governing docs, mark it `superseded` or `deferred` and add a short supersession
note rather than deleting the historical context.
