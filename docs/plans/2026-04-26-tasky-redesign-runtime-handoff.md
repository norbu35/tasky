# Tasky Redesign Runtime Handoff

**Date:** 2026-04-26
**Status:** Draft handoff for first runtime implementation slice

## Runtime Plan Handoff

First slice: Customer task posting

Design inputs:

- `docs/plans/2026-04-26-tasky-redesign-thesis.md`
- `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
- `docs/design/screen-specs/SCR-CUST-002.yaml` through `SCR-CUST-008.yaml`

Required validation for the runtime slice:

- `pnpm verify:i18n`
- `pnpm --filter @tasky/web typecheck`
- `pnpm --filter @tasky/web test:unit`
- `pnpm --filter @tasky/mobile typecheck`
- `pnpm --filter @tasky/mobile test:unit`
- `pnpm --filter @tasky/mobile structure:check` if mobile route/screen structure changes

Runtime scope guardrails:

- Start with guided density, structured scope, pricing clarity, address privacy, deterministic summary, and next-step guidance.
- Preserve direct settlement and avoid payment-protection, escrow, wallet, or checkout claims.
- Preserve the Phase 1 no-open-ended-pre-booking-chat rule.
- Keep all user-facing web and mobile copy i18n-backed in the app-owned locale files.
- Do not promote tokens or components globally until the posting proof surfaces validate the pattern.
