# Frontend Design Implementation Plan

## Objective
Implement a coherent cross-platform UI system where:
1. Web uses `shadcn/ui` as the base component library.
2. Mobile uses native components mapped to the same design tokens and state semantics.
3. Accessibility and parity checks are part of normal delivery gates.

## Requirements Source
1. `REQ-UI-01`
2. `REQ-UI-02`
3. `NFR-UI-01`
4. `NFR-UI-02`

Authoritative requirement text lives in `docs/PRD.md`.

## Architecture Alignment
1. Web stack: React + Tailwind + `shadcn/ui` primitives (`apps/web/src/components/ui`).
2. Mobile stack: React Native + token adapter + native component layer.
3. Shared token source: recommended `packages/design-tokens` with platform adapters.

See `docs/ARCHITECTURE.md` for baseline.

## Delivery Phases

### Phase 1: Web Design Foundation (`TASK-070`)
1. Initialize and standardize `shadcn/ui` primitives.
2. Define token source of truth and wire to Tailwind/theme variables.
3. Implement at least one feature screen using primitives only.

Exit criteria:
1. Web primitives are reusable and documented.
2. No additional third-party UI frameworks used.
3. Tests cover primitive usage and token binding.

### Phase 2: Mobile Parity Base (`TASK-071`)
1. Add mobile token adapter that consumes shared tokens.
2. Implement core component equivalents: Button, Input, FormField, Modal/Sheet, Toast.
3. Publish component parity matrix with states and interaction rules.

Exit criteria:
1. Shared tokens used on mobile components.
2. Component state semantics match parity matrix.
3. Unit/component tests verify token + state behavior.

### Phase 3: Accessibility and Parity Gate (`TASK-072`)
1. Add web keyboard navigation checks for touched flows.
2. Add WCAG 2.1 AA contrast checks for touched flows.
3. Add cross-platform parity checks against token and state contracts.

Exit criteria:
1. Accessibility checks pass in CI for affected web flows.
2. Parity checks pass for shared components.
3. Ticket AC evidence includes parity/a11y test IDs.

## Guardrails
1. Web runtime UI frameworks other than `shadcn/ui` are forbidden unless approved by ADR.
2. Mobile does not import or run `shadcn/ui`; it implements native equivalents.
3. Any UI ticket must include:
   1. Token impact notes
   2. Parity impact notes
   3. Accessibility test evidence (web)

## Verification and Evidence
1. Ticket specs (`tickets/TASK-*.json`) must include AC and `TID-*` for UI/parity/a11y criteria.
2. Self-verification logs must expose `TID-*` identifiers.
3. `docs/TRACEABILITY.md` and `docs/BACKLOG_MVP.md` must remain synchronized.
