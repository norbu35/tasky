# Tasky V2 Rewrite Finalization Architect Handoff

**Date:** 2026-04-14
**Status:** handoff
**Audience:** frontier-model architect preparing design and delegation slices for a weaker implementation model
**Scope:** backend rewrite finalization only; web and mobile remain out of scope for this handoff

## Purpose

Use this document as the architect-level handoff for the final Tasky v2 backend rewrite push.

The immediate job is **not** to start coding. The immediate job is to:

1. assess the current backend rewrite state against the intended v2 architecture
2. decide which remaining issues are merely cleanup versus foundational design gaps
3. produce a precise execution design for the remaining work
4. decompose that design into small, reviewable slices that can be delegated to a weaker model safely

This handoff is meant to continue the workflow we have been using:

- frontier model does architecture, sequencing, and review
- weaker model executes bounded slices
- frontier model reviews, patches, and consolidates

## Current Branch Context

Work is on `feature/rewrite`.

Recent rewrite-finalization commits already landed:

- `711b65cf` `docs(arch): finalize backend rewrite with v2 request-path spec and tranche 10 completion`
- `26768d1b` `refactor(runtime): create missing composition services and eliminate DAO deps from runtime`
- `a4b8514e` `refactor(async): delete speculative OutboxEnvelope and AutomationJobEnvelope placeholders`
- `7c1696dc` `test(arch): lock backend finalization boundary with explicit exception registry`
- `529782ec` `fix(rewrite): restore smoke gate after workspace cleanup`
- `163a0808` `docs(rewrite): update Tranche 10 handoff, remove DomainEventOutboxProcessor refs, dedupe CHANGELOG`

There is also an uncommitted lower-level implementation artifact:

- `docs/plans/2026-04-14-tasky-rewrite-hardening-followup.md`

Treat that file as a **tactical input**, not as the canonical architectural answer.

## Canonical Inputs

Start from these documents first:

- `docs/ARCHITECTURE.md`
- `docs/plans/2026-04-13-tasky-v2-architecture-design.md`
- `docs/plans/2026-04-13-tasky-v2-backend-finalization-design.md`
- `docs/plans/2026-04-13-tasky-v2-rewrite-implementation.md`
- `CHANGELOG.md`

Then validate the docs against the live code before delegating execution.

## What Is Already Settled

These points should be treated as architectural decisions, not reopened casually:

### 1. Backend request-path style is now intentionally narrow

The target live shapes are:

1. `controller -> runtime.{publicapi|adminapi}.composition service -> module publicapi ports`
2. `controller -> module-owned publicapi command/query port`

There is no third general-purpose style.

### 2. Runtime composition is a boundary, not a domain home

Runtime composition may:

- orchestrate audience-specific responses
- coordinate multiple modules
- perform boundary mapping

Runtime composition may not:

- depend on DAOs directly
- depend on another module's internal application service as an integration shortcut
- become a disguised domain-service layer

### 3. The persisted outbox relay remains the live async durability boundary

The current chosen foundation is:

`transaction -> domain_outbox_events -> relay publisher -> RabbitMQ -> workflow handler`

Do not reopen direct broker publication during this pass unless a full redesign is explicitly approved. The rewrite has
already chosen simplification around the current durable path, not a new async model.

### 4. Speculative generic async abstractions should stay deleted

The prior cleanup removed unused generic async placeholders. Do not reintroduce job-envelope or outbox-envelope style
abstractions without a real live caller, handler, and ownership boundary.

### 5. Web and mobile are out of scope

This handoff is for backend finalization. Do not expand it into UI cleanup.

## What Is Claimed Complete Versus What Still Needs Judgment

The docs currently describe Tranche 10 as completed. That is directionally correct, but not the end of the
architectural story.

The branch appears to have completed the broad rewrite convergence:

- architecture tests now encode controller-accountability and exception registration
- runtime composition no longer appears to depend directly on DAOs
- speculative async scaffolding was deleted
- docs now describe the v2 request-path model explicitly

However, the branch still carries remaining issues that matter for long-term foundation quality.

These should be triaged by the architect into two buckets:

### Bucket A: foundation work that should land before calling the rewrite truly finalized

- runtime-composition boundary still needs to be verified against **all** module-internal application-service dependencies, not only DAOs
- durable audit guarantees should exist for admin override flows that must leave evidence
- workflow idempotency remains handler-level and should be assessed for stronger database-backed guarantees where appropriate
- payment/provider separation still needs scrutiny where provider-specific logic leaked into broader services during the rewrite

### Bucket B: cleanup that should not derail finalization unless it hides a deeper design flaw

- accidental repo hygiene drift such as `package-lock.json` in a pnpm repo
- stale or overclaimed docs
- compatibility leftovers that are already inert and low-risk

The architect should decide which remaining items are truly foundational and which are just tidy-up tasks.

## Known Architectural Concerns To Reassess

These are the known concerns carried forward from review and prior tranche handoffs. They should be reassessed against
the live code, not accepted blindly from docs.

### 1. Runtime-composition boundary may still be incomplete

Current docs claim runtime composition routes through public ports, but the branch needs a full pass to ensure no
runtime composition service still depends on feature-module `application` classes. The existing test coverage appears
stronger on DAO leakage than on all internal-service leakage.

Architect question:

- should the rule be "runtime composition may depend only on `publicapi` plus owned mappers", with explicit ArchUnit enforcement?

Recommended answer: yes.

### 2. Durable audit for admin override flows may have regressed

At least one prior review found that concierge assignment moved from durable audit persistence to structured logging.
That may be acceptable for observability, but it is weaker if the business process requires durable administrative
evidence.

Architect question:

- which admin actions require durable audit records as part of the platform's trust model, and through which narrow seam should they be written?

Recommended answer:

- define a narrow admin-audit public command seam for durable events rather than letting runtime/admin composition call audit persistence directly

### 3. Workflow idempotency may still be too soft

The rewrite introduced `WorkflowIdempotencyGuard`, which is useful, but previous reviews noted that the current posture
appears handler-level rather than database-guaranteed.

Architect question:

- for the migrated aftermath flows, is handler-level duplicate suppression sufficient, or should idempotency become constraint-backed at the persistence boundary for the critical event families?

Recommended answer:

- do not attempt a broad, abstract idempotency framework redesign
- instead, identify the critical event families and make the persistence boundary the source of truth where duplicate processing would create business risk

### 4. Payment/provider boundaries may still be partially blurred

Earlier tranche handoffs carried a warning that `PaymentService` still held QPay-specific logic in parallel with
`QPayPaymentProvider`.

Architect question:

- is the provider boundary now clean, or does one more pass need to move payment-provider behavior fully behind provider contracts?

Recommended answer:

- verify this explicitly and clean it if still present; payment is a foundational boundary, not a cosmetic refactor

### 5. Docs may currently overstate architectural completion

The rewrite docs are close, but the architect should assume they may still overclaim until verified against code.

Architect question:

- which docs are canonical after the final pass, and what claims should be downgraded until the code and tests prove them?

Recommended answer:

- `docs/ARCHITECTURE.md` should describe only live-enforced structure
- tranche handoff docs may describe remaining gaps, but should not mask them

## Architect Deliverable

Before delegating implementation, produce one short design artifact that answers the remaining backend-finalization
questions concretely.

That design artifact should:

1. state the final backend boundary rules in code-reviewable language
2. list the remaining foundational gaps that must be closed before declaring the rewrite finalized
3. reject work that is tempting but non-essential for this pass
4. define the exact order of execution
5. define the verification bar for each slice

The output should be shorter and stricter than the broad rewrite docs. It should act as the execution constitution for
the last pass.

## Recommended Execution Strategy

Do the remaining work in **two stages**, not one.

### Stage 1: Re-validate the architecture against live code

This is a frontier-model task.

Do not delegate it immediately to a weaker model.

Re-check:

- runtime composition dependencies
- admin durable-audit seams
- critical workflow idempotency posture
- payment/provider separation
- dead or transitional structural paths still present in runtime code
- docs that overclaim completion

The result of Stage 1 should be a precise list of confirmed gaps, not inherited assumptions.

### Stage 2: Convert confirmed gaps into small execution slices

This is where the weaker model becomes useful.

Each slice should satisfy all of the following:

- one architectural concern only
- small file set
- explicit tests to write or update
- explicit docs to sync if truth changes
- one clear success condition
- safe to review independently

Do not hand a weak model a vague "finish the architecture" mandate.

## Suggested Slice Order

Unless Stage 1 changes the diagnosis materially, the recommended order is:

1. strengthen architecture tests so runtime composition is blocked from depending on module internals, not just DAOs
2. patch the corresponding runtime-composition seams to use public ports where still needed
3. restore durable audit for admin override flows that require evidence
4. verify and, if needed, finish payment-provider boundary cleanup
5. assess critical workflow idempotency and strengthen only the event families that truly need persistence-backed guarantees
6. remove residual dead code and stale docs after the structural truth is stable

That order matters. Boundary enforcement should come before cleanup claims.

## Delegation Guidance For A Weaker Model

The weaker model should not be asked to invent architecture. It should only execute within a design that already exists.

For each delegated task:

- name the exact files to inspect and likely files to change
- state the one boundary rule being enforced
- require a failing test first where practical
- require targeted verification commands, not just "run the suite"
- keep the commit scope narrow
- require a review checkpoint before the next slice

Avoid delegation prompts like:

- "finalize the rewrite"
- "clean up the architecture"
- "remove dead code and update docs"

Prefer delegation prompts like:

- "enforce that runtime composition depends only on public ports and patch the notification seam accordingly"
- "restore durable concierge-assignment audit through a narrow admin audit port and prove it with a targeted test"

## Non-Goals For The Finalization Pass

The architect should actively prevent scope creep into these areas:

- web or mobile UI work
- replacing RabbitMQ or redesigning the outbox pipeline broadly
- introducing a generic durable jobs framework
- speculative abstractions for future automation
- broad renames or package reshuffles that do not improve a live boundary
- product-behavior changes disguised as architectural cleanup

## Verification Standard Before Calling The Rewrite Finalized

Do not call the rewrite finalized until all of the following are true:

### 1. Boundary truth

- meaningful backend request paths conform to the two allowed shapes
- runtime composition depends only on public ports and owned mapping helpers
- exception controllers remain explicit and narrowly justified

### 2. Async and aftermath truth

- the persisted outbox relay remains the singular live async durability path
- critical aftermath handlers are retry-safe
- idempotency posture is explicit and justified for the important event families

### 3. Operational trust truth

- admin override flows that require durable evidence actually persist it
- payment/provider separation is explicit enough that new providers or payment changes do not require editing broad orchestration services

### 4. Repo truth

- dead structural leftovers are removed or intentionally documented
- docs describe the live backend, not the hoped-for backend
- package-manager and test-registry hygiene match repo conventions

### 5. Gate truth

At minimum:

- targeted architecture tests for boundary rules
- targeted tests for each changed foundational seam
- `./gradlew openApiValidate`
- `./gradlew gateSmoke`

## Immediate Next Move For The Frontier Architect

1. verify the current branch against the known concerns above
2. produce a short finalization-design addendum only for the confirmed remaining gaps
3. translate that addendum into bite-sized execution slices for the weaker model
4. review each slice after execution and patch before proceeding
5. only then update canonical docs to declare the rewrite fully finalized

## Bottom Line

The rewrite is no longer in "broad migration" mode. It is in **foundational hardening and truth-alignment** mode.

That changes the architect's job:

- less invention
- less surface-area expansion
- more strict validation of live boundaries
- more attention to what is actually foundational

The remaining work should be judged by one question:

**Will this make Tasky safer to build on for the next year of platform work, or is it just making the branch look tidy?**

If it is only tidying, deprioritize it. If it strengthens a live boundary, durability guarantee, or ownership rule,
it belongs in the final pass.
