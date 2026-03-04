# PRD -> Architecture -> API Validation (2026-03-04)

## Scope

- Source docs:
    - `docs/PRD.md` (v1.3 content with acceptance criteria)
    - `docs/ARCHITECTURE.md` (revised traceability + flow updates)
    - `docs/API.yaml` (realigned contract)
- Validation focus: external API contract coverage and implementation-readiness alignment.

## Validation Method

1. Cross-checked PRD Section 7 requirement clusters against Architecture Section 4/5/6/9.
2. Realigned `docs/API.yaml` schemas/paths/status models to architecture data and flow contracts.
3. Ran OpenAPI structural validation:
    - `./gradlew --no-daemon openApiValidate` (PASS)
4. Regenerated SDK types from updated spec:
    - `pnpm --filter @tasky/sdk generate`

## Coverage Summary

### Fully aligned (API + Architecture)

- Auth model and phase posture:
    - Facebook OAuth primary in Phase 0-1, OTP path for Phase 2+, OAuth outage 503 behavior.
- Structured task intake and drafts:
    - Category intake schema metadata (`intake_enabled`, `intake_schema_version`, `intake_schema_json`)
    - Draft endpoints and schema-version binding.
- Task and booking state machines:
    - `NO_SHOW` included in task/booking statuses.
    - No-show adjudication endpoint and deterministic rules.
    - Reschedule request/response endpoints and schedule event retrieval.
- Matching and application contracts:
    - Ranked applications, recommended flag, application-cap error semantics.
    - Instant-match initiation endpoint (Phase 3+).
- Monetization:
    - Lead unlock accept/decline behavior.
    - Credit packs/balance/transactions/purchase endpoints.
    - Lead-unlock price admin endpoints.
    - Escrow status field and payout/admin process contracts.
    - Subscription activation endpoint (Phase 3+).
- Trust & safety:
    - Structured bilateral review payload.
    - Dispute evidence minimum payload and resolution action model.
    - Consent capture in verification submit payload.
    - DAN verification endpoint for Phase 2+ fast path.
- Admin operations:
    - User search (name/facebook/phone), verification queue actions, disputes, concierge assignment.
    - Category schema version lifecycle endpoints (create/list/activate/rollback mode).
    - Runtime feature toggles endpoint.
- Referrals:
    - Referral summary endpoint with monthly cap visibility.

### Aligned by design (Architecture-owned, non-public API contract)

- Operational alerts and product analytics event emission.
- Verification SLA metrics, leakage-signal monitoring, scope-clarity monitoring.
- No-applicant rescue scheduler behavior internals.
- Review hard-lock trigger internals.
- Data retention/deletion job internals and incident forensics.

### Partial / residual gaps (to close in later API iterations)

1. Phase 4 B2B depth is minimal in API.
    - Current: `POST /business/accounts` placeholder.
    - Missing: seat/member management and recurring scheduling contract surface.
2. Subscription billing lifecycle is minimal.
    - Current: tasker subscription activation endpoint.
    - Missing: cancel/renew/history endpoints and billing failure states.
3. Notification trigger audit visibility is internal-only.
    - Current: device registration endpoints only.
    - Missing (optional): admin/read endpoint for notification delivery/idempotency diagnostics.

## Implementability Assessment

- **API structural validity:** PASS
- **Schema/flow consistency with architecture:** PASS for MVP + Phase 2/3 core contracts
- **PRD functional contract coverage in API:** PASS for MVP-critical and near-term monetization/trust flows
- **Known intentional deferrals:** Phase 4 deep B2B and advanced billing/ops read APIs

## Verification Evidence

- OpenAPI validation command: `./gradlew --no-daemon openApiValidate` -> PASS
- SDK generation command: `pnpm --filter @tasky/sdk generate` -> PASS

