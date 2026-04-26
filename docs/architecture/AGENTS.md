# Tasky Architecture Router

Routes to the smallest derived architecture surface for the change. The working-area routing table lives in root
`AGENTS.md`; this file describes which architecture doc owns what content and how authority resolves.

Architecture docs describe implementation reality and design. They do not govern intended product behavior. Product
behavior lives in `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, and the relevant maintenance policy docs.

## What Each Doc Owns

- `common.md` — system context, cross-cutting tech decisions, runtime patterns, NFR baseline, dev workflow, cross-reference index.
- `api.md` — backend module layout, request-path architecture, data schemas and flows, API/security contracts, backend runtime concerns, backend testing.
- `web.md` — web-only structural contract.
- `mobile.md` — mobile structural contract.
- `shared-frontend.md` — tokens, parity baseline, intake renderer contract, frontend behavioral/technical test naming rules.
- `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, `docs/design/domain-lifecycles.yaml` — machine-readable structural docs validated by `pnpm repo:design:check`.
- `docs/design/screen-specs/SCR-*.yaml` — per-screen UX contracts with traceability back to live PRD, journey, screen graph, and scenario IDs; validated by `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` or `pnpm repo:docs:check`.
- `docs/design/component-contract.yaml` — component inventory validated by `python3 tooling/scripts/governance/validate-design-contracts.py` or `pnpm repo:docs:check`.

New structural guidance belongs in the doc whose scope matches, not in this router.

`docs/API.yaml` is generated output, not an independent maintained source.

## Authority Model

### Product requirements and policy

When architecture prose conflicts with product intent, precedence is:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md` for deferred-phase sequencing that does not override the active Phase 1 baseline
4. relevant `docs/maintenance/*.md`
5. architecture prose

If runtime behavior differs from PRD or strategy without an explicit document change, treat it as a code-and-doc mismatch and record the fix.

### Backend implementation order

When backend architecture docs conflict with code or tests about current implementation reality:

1. ArchUnit tests (`services/api/src/test/java/mn/tasky/architecture/`)
2. Flyway migrations (`services/api/src/main/resources/db/migration/`)
3. Runtime code (package structure, public ports, composition services)
4. Architecture prose (`api.md`, `common.md`, module `AGENTS.md`)

If prose says X but code/tests say Y, code/tests win for implementation reality. File a doc fix.
