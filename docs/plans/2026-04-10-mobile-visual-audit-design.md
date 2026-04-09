# Mobile Visual Audit Design

**Date:** 2026-04-10
**Status:** approved
**Scope:** Active mobile screens first, deferred-gated screens only when explicitly included in a batch

## Goal

Use Maestro as a deterministic navigation and screenshot harness to visually audit the mobile application, identify major design flaws, and fix them in the most token-efficient way possible while preserving consistency with the existing Tasky mobile design system.

## Problem

The mobile application has already gone through alignment and polish work, but visual defects can still survive in the composed UI even when routes, tests, and copy are otherwise correct. A naive screen-by-screen cleanup would waste time and tokens because many issues come from shared templates, shells, spacing primitives, or token misuse rather than isolated screen code.

The audit method therefore needs to:

- capture stable visual evidence cheaply
- judge screens against the actual mobile design system, not subjective taste
- separate systemic defects from local defects
- minimize repeated analysis by fixing shared layers first
- keep Maestro flows trustworthy after UI changes

## Constraints

- Maestro is an evidence and navigation tool, not the design authority.
- Active launch-live surfaces must remain the main priority.
- Deferred screens should not expand the main audit scope unless explicitly selected into a later batch.
- Screenshot capture must stay deterministic enough that before/after comparisons are meaningful.
- Fixes should prefer design-system compliance over bespoke local styling.

## Recommended Approach

Use a `system-first screenshot audit`.

This means:

1. lock a single capture environment
2. build a route-to-screen ledger
3. capture one canonical screenshot per stable screen state
4. review screenshots against a strict rubric tied to tokens/layout
5. fix shared templates and primitives first
6. apply only necessary screen-level overrides
7. recapture changed screens and rerun Maestro

This approach is preferred over a pure screen-by-screen beautification pass because it produces more consistent results and avoids repeating the same diagnosis on multiple screens that share the same underlying template or shell.

## Alternatives Considered

### 1. Screen-by-screen audit

Pros:

- straightforward to execute
- easy to assign one screen at a time

Cons:

- duplicates analysis
- encourages inconsistent local fixes
- high token cost

### 2. System-first clustered audit

Pros:

- best token efficiency
- catches shared defects early
- improves visual consistency

Cons:

- requires a short setup phase before edits

### 3. Golden screenshot diff first

Pros:

- strong long-term regression model

Cons:

- weak starting point if current screens still need active cleanup
- requires a cleaner baseline before diffs become useful

## Audit Environment

The visual audit should run in one canonical environment:

- iOS simulator only
- light mode only
- one primary locale for main audit, one secondary locale for overflow spot checks
- one fixed text scale
- one fixed auth posture
- deterministic data or dev-auth personas

The environment should be documented alongside the screenshot ledger so later runs can be compared meaningfully.

## Audit Ledger

Every audited screen should have a row with:

- screen ID
- route
- entry flow
- stable capture point
- screen family
- template family
- launch-live or deferred-gated classification
- current status: `pass`, `systemic-fix`, `screen-fix`, `defer`

The ledger is the control surface for batching. It prevents wasting time on unreachable or low-value screens.

## Review Rubric

Each screenshot should be judged against the same compact rubric:

- spacing rhythm
- typography hierarchy
- CTA hierarchy
- token compliance for color, radius, and elevation
- alignment and visual balance
- empty/loading/error-state quality
- keyboard and safe-area behavior
- localization fit and truncation
- consistency with sibling screens

The reviewer should classify each defect as either:

- systemic
- screen-specific
- content-only
- not worth fixing now

## Fix Order

The implementation order must be:

1. templates
2. shared shells
3. shared primitives
4. family-level screen helpers
5. individual screens

This is the main token-efficiency rule. The audit should not dive into many local screen fixes until shared design defects have been removed.

## Evidence Model

For each batch:

- capture canonical screenshots
- record defects using the rubric
- apply fixes
- recapture changed screens
- rerun the affected Maestro flows

The audit does not need pixel-perfect archival of every intermediate state. One stable screenshot per screen plus targeted extra states is sufficient:

- keyboard open if relevant
- empty state
- error state
- bottom sheet/modal state

## Subagent Split

The work should be split into independent responsibilities:

- `Audit operator`: capture screenshots and maintain the ledger
- `Design-system reviewer`: classify defects against tokens and layout rules
- `Shared UI implementer`: fix templates, shells, and primitives
- `Customer screens implementer`: fix customer-only screen defects
- `Tasker/shared screens implementer`: fix tasker/shared screen defects
- `Verification/doc owner`: recapture, rerun Maestro, and update audit docs

The shared UI implementer must own all files under common templates and shells so screen-focused agents do not duplicate or conflict with those edits.

## Success Criteria

This program is successful when:

- active screens visually adhere to the mobile design system
- shared layout and CTA patterns are consistent
- major visual defects are removed without broad redesign churn
- Maestro still runs after the changes
- the screenshot ledger can be rerun later as a lightweight visual regression process

## Non-Goals

- building a full image diff platform in this pass
- redesigning the application visual language
- polishing deferred/unreachable screens by default
- capturing every interactive micro-state
