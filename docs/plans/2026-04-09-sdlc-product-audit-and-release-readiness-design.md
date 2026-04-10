# SDLC Product Audit And Release Readiness Design

**Date:** 2026-04-09
**Status:** approved for planning

## Goal

Finish Tasky as an AI-generated greenfield product by converting it from "mostly built, partially documented, partially
verified" into a launch-ready system with:

- a narrow, truthful Phase 1 launch baseline
- explicit classification of later-phase capabilities by implementation reality
- a reduced canonical documentation set with clear authority rules
- verification gates that measure behavior instead of optics
- staging and production readiness criteria tied to real operational evidence

## Problem Statement

Tasky has reached the late-stage hardening period where documentation, implementation, and verification are no longer
guaranteed to agree. The project contains canonical product and architecture docs, many derived design and quality
artifacts, feature-flagged future-phase references, and a broad test surface of uneven signal strength.

That creates three launch risks:

1. product truth risk: the PRD can overstate what is actually ready
2. engineering truth risk: later-phase features may be described as toggle-only when they are only partially built
3. release truth risk: green checks may not prove real user or operator behavior

The finishing program must therefore establish ground truth before it cleans docs, and must clean docs before it
trusts tests.

## Product Position

### Launch commitment

Tasky launches on **Phase 1 behavior**. Phase 1 is the customer promise, operational model, KPI baseline, and default
staging/production toggle posture unless a later capability is explicitly promoted after verification.

### Later-phase treatment

Later phases remain part of the product strategy, but canonical docs may only describe them in one of the following
states:

- **Implemented and gated**: code exists, runtime is wired, and activation behavior is testable
- **Partially implemented**: some backend, web, or mobile surfaces exist, but end-to-end behavior is incomplete
- **Specified only**: described in docs or SDK contracts, not supported by complete runtime behavior
- **Archived/deferred**: intentionally not part of the current authoritative baseline

No future-phase capability may be represented in the PRD as "toggle-only" until the capability matrix proves that
status across API, backend, web/mobile surfaces, data model, and verification coverage.

## Evidence Snapshot Before Audit

The current codebase already supports some but not all deferred capabilities:

- `escrow_enabled` is wired through runtime backend controllers for payments, wallet, payouts, and admin payout
  operations.
- feature toggle administration is implemented in backend and web admin surfaces.
- the architecture doc already records at least one activation gap for `lead_fee_enabled`.
- several later-phase mobile and web surfaces exist only as placeholder UI or future-facing contract pages.
- API and SDK surfaces include deferred endpoints for credits, referrals, subscriptions, instant match, and DAN
  verification that are not yet proven by equivalent runtime controllers.

This is enough evidence to justify a capability-matrix-first audit, and not enough evidence to claim "Phase 3 is fully
implemented" at repository level.

## Source Of Truth Hierarchy

When sources disagree during this program, use this order:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/API.yaml`
4. `tests/scenarios/*.md` and `tests/registry.yaml`
5. `docs/design/journey-catalog.yaml`
6. `docs/design/screen-specs/SCR-*.yaml`
7. `docs/design/state-matrix.yaml`
8. maintained operational docs under `docs/quality/` and `docs/maintenance/`

Derived or historical documents may provide context, but they cannot override the hierarchy above.

## Program Principles

### 1. Canonical docs stay small

The PRD, architecture spec, API contract, ADRs, and a small set of maintenance/quality docs must carry the program.
Generated planning debris, dated audits, and design prompts must not remain discoverability-equal to the truth.

### 2. Product intent outranks generated residue

If generated code or docs imply a strategy that product does not want to launch, product wins. The repo should document
the chosen strategy and classify the rest as deferred, partial, or archived.

### 3. Capability claims require cross-layer evidence

A feature is only "implemented" when its API, backend behavior, data path, client surfaces, and release verification
agree. SDK presence or mock UI alone is not implementation.

### 4. Green tests are not trusted by default

A check becomes blocking only after it proves user, operator, or contract behavior. Placeholder tests, existence-only
assertions, and mislabeled E2E flows do not qualify.

### 5. Activation is a product decision, not only a toggle action

Even genuinely implemented dormant capabilities require readiness evidence, operational runbooks, KPI guardrails, and
rollback posture before promotion in staging or production.

## Chosen Approach

Use eight ordered tranches.

### Tranche order

1. establish authority, inventory docs, and classify every major surface
2. build a cross-layer capability matrix for Phase 1 through Phase 3/B2B claims
3. rewrite canonical product and architecture docs from verified truth
4. remove or archive unnecessary derived documentation and dead documentation paths
5. audit current test signal and map launch-critical requirements to evidence
6. rebuild verification and release gates where evidence is weak
7. ratify staging readiness with seeded data, toggle posture, and runbooks
8. ratify production readiness with monitoring, incident, and activation governance

## Detailed Tranche Design

### Tranche 1: Documentation Authority Reset

Purpose:

- produce one inventory of what exists
- classify documents by authority and operational value
- decide what remains canonical versus archived or deleted

Key outputs:

- documentation inventory
- canonical-vs-derived taxonomy
- explicit authority chain for future agents

### Tranche 2: Capability Truth Audit

Purpose:

- inspect each major PRD and deferred-phase claim across docs, API, backend, web, mobile, database, and tests
- prevent unsupported product claims from surviving into the revised PRD

Key outputs:

- capability matrix
- implementation reality classifications
- activation gap list

### Tranche 3: Canonical Product Rewrite

Purpose:

- rewrite the PRD from a product management perspective around the launch baseline
- separate launch commitments from dormant or future capabilities

Key outputs:

- launch-grade PRD
- clearer KPI, scope, and activation criteria
- requirement language that matches engineering reality

### Tranche 4: Canonical Technical Rewrite And Derived Cleanup

Purpose:

- align architecture and API docs to verified truth
- delete or archive redundant or misleading doc artifacts

Key outputs:

- architecture and API documents that match runtime posture
- archive policy enforced in real file layout
- reduced `docs/` noise floor

### Tranche 5: Verification Trust Audit

Purpose:

- determine which tests prove behavior and which are ceremonial
- map business-critical launch flows to explicit coverage evidence and gaps

Key outputs:

- requirement-to-test matrix
- ceremonial-test backlog
- blocker check shortlist

### Tranche 6: Verification Rebuild

Purpose:

- strengthen or replace weak tests
- repair CI and local gates so they run the checks they claim to run

Key outputs:

- trustworthy backend, web, and mobile release checks
- clarified E2E definitions and runner contracts
- release-blocking matrix

### Tranche 7: Staging Readiness

Purpose:

- make the system operable in a realistic environment with correct toggles, seeded data, secrets, and smoke flows

Key outputs:

- staging runbook
- seed-data and account kit
- staging toggle posture
- release rehearsal evidence

### Tranche 8: Production Readiness

Purpose:

- define launch decision rules, monitoring, rollback, and dormant-capability activation governance

Key outputs:

- production checklist
- KPI dashboard definitions
- alerting and incident matrix
- feature-activation governance

## Capability Matrix Model

Every material capability should be evaluated using the same dimensions:

- product intent
- API contract status
- database/model readiness
- backend runtime readiness
- web readiness
- mobile readiness
- operator/admin readiness
- automated verification coverage
- staging data/support readiness
- classification
- activation blockers

Suggested classifications:

- `launch-live`
- `implemented-gated`
- `partial`
- `contract-only`
- `deferred`
- `archive`

## Deliverables

At minimum the finishing program should leave behind:

- revised `docs/PRD.md`
- revised `docs/ARCHITECTURE.md`
- revised `docs/API.yaml`
- `docs/quality/capability-matrix.md`
- `docs/quality/requirement-verification-matrix.md`
- `docs/maintenance/STAGING_RUNBOOK.md`
- `docs/maintenance/PRODUCTION_READINESS.md`
- a reduced, policy-compliant `docs/` directory

## Out Of Scope

Unless the capability matrix proves the work is nearly complete and activation is explicitly chosen, this program does
not include:

- building net-new Phase 2/3/B2B product features
- product-strategy expansion beyond launch and verified dormant capabilities
- speculative refactors unrelated to launch truth, test trust, or release readiness

## Exit Condition

The program is complete when:

- canonical docs are concise and truthful
- every major product claim has a verified status
- unnecessary derived docs are archived or removed
- release checks measure real behavior
- staging has a clear, executable runbook
- production launch decisions can be made from evidence instead of repo folklore
