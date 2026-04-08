# Repo Finish Hardening Design

**Date:** 2026-04-09
**Status:** approved for planning

## Goal

Turn Tasky from an AI-generated greenfield codebase into a maintenance-grade repository with:

- one unambiguous source-of-truth hierarchy
- trustworthy verification gates
- behavior-first tests instead of optics-heavy reassurance
- stale helper scripts, generated files, and superseded docs removed or archived
- a release process that matches the files and commands that actually exist

## Problem Statement

The repository is operational, but its verification and documentation surfaces are still mixed between active,
historical, generated, and partially-stale artifacts. Repomix analysis shows a large footprint with too much derived
material left in live paths, including tracked generated output, stale release-gate references, and broad mobile test
coverage that over-indexes on existence assertions instead of observable behavior.

The result is false confidence:

- green tests do not always mean user journeys work
- CI configuration does not fully match the current repo
- derived docs disagree with canonical docs
- "E2E" mobile commands can silently fall back to component tests

## Source Of Truth Hierarchy

When sources disagree, agents must use this order:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/API.yaml`
4. `tests/scenarios/*.md` plus `tests/registry.yaml` for backend verification state
5. `docs/design/journey-catalog.yaml`
6. `docs/design/screen-specs/SCR-*.yaml`
7. `docs/design/state-matrix.yaml`
8. live operational docs under `docs/quality/` and `docs/maintenance/`

Derived or historical material is never authoritative against the list above:

- `docs/superpowers/**`
- dated one-off audits that describe a point-in-time repo state
- generated output under `dist/`, `build/`, or local result folders
- archived material under `archive/**`

## Chosen Approach

Use six ordered tranches. The first two tranches are sequential and blocking. Only after they pass should later lanes
run in parallel.

### Tranche order

1. Ratify authority and remove stale surfaces
2. Repair local and CI verification gates
3. Rebuild backend test trust from scenario authority
4. Align mobile behavior and replace low-signal unit coverage
5. Build real end-to-end coverage for mobile and web
6. Ratify release readiness and durable documentation

## Why Cleanup Comes First

Cleanup is not cosmetic here. It changes which files agents read, which checks they trust, and which failures they
treat as real. If stale docs and dead scripts remain in live paths, later agents will continue reintroducing drift.

Cleanup must therefore remove or archive:

- live docs that taxonomy already classifies as archived
- tracked generated artifacts
- dead workflow references
- helper flows and scripts that are not part of the canonical execution model
- dated derived audits that are still discoverable as if current

## Verification Model

### Backend

- Scenario specs remain the only authority for scenario tests.
- Existing contract and security boundary tests stay, but mutation analysis is used to strengthen assertions.
- `gateSmoke` and `gateRegression` become the required backend trust boundary.

### Mobile

- Keep unit tests for pure utilities, reusable primitives, and isolated state adapters.
- Rewrite screen and journey tests around observable behavior:
  routing, state transitions, API effects, role gating, error handling, and policy enforcement.
- Maestro becomes the only thing called "E2E".
- Maestro flows must follow the design authority chain and use stable `SCR-*` selectors.

### Web

- Existing Vitest suites remain useful as mocked UI and routing checks, but are not sufficient as end-to-end proof.
- Playwright coverage must expand beyond a shell smoke to cover at least one customer happy path, one tasker happy path,
  and one auth failure or guard path.

### Release

- Release readiness must rely only on maintained files and executable commands.
- Missing self-verify files referenced by CI must either be restored as live maintained surfaces or removed from the
  gate entirely.

## Autonomous Agent Workflow

Use one active plan file as the controlling document for this hardening effort.

### Rules

- Tranches 1 and 2 run serially.
- After Tranche 2 passes, backend, mobile, and web lanes may run in parallel if their write sets are disjoint.
- Every tranche must end by updating durable docs, not only code.
- No agent should write new tests from derived docs when canonical product or design sources exist.
- No agent should keep a helper script, audit file, or generated output in a live path without a current consumer.

## Scope Boundaries

### In scope

- Repo cleanup and archival hygiene
- CI and local verification repair
- Replacement of low-signal tests with reliable ones
- Mobile bug remediation needed to satisfy authoritative journeys
- Maestro and Playwright expansion
- Production-readiness documentation and release gate repair

### Out of scope unless explicitly required by the authority chain

- net-new features for deferred phases
- speculative B2B implementation beyond cleanup of misleading references
- rewriting stable subsystems that are already covered by authoritative tests

## Key Findings Driving The Plan

- `test-results.json` is tracked generated output and dominates repository noise.
- `docs/superpowers/**` still exists live even though taxonomy classifies it as archived.
- `.github/workflows/release-gate.yml` references missing self-verify files and scripts.
- mobile "E2E" scripts can fall back to Jest component tests instead of failing.
- `tests/registry.yaml` still has untested scenarios and zero mutation kill-rate domains.
- mobile tests heavily overuse existence assertions, making them broad but weak.

## Exit Condition

The hardening program is complete when:

- all live docs point to current authority
- no dead scripts or dead CI references remain in active paths
- local and CI gate definitions match actual commands and artifacts
- backend critical and high-risk verification is scenario-backed and trustworthy
- mobile and web have real end-to-end coverage for primary journeys
- release-gate verification can run without relying on deleted historical systems
