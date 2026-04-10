# Test Rehabilitation Backlog

Last updated: 2026-04-10

## Objective

Track the highest-risk evidence gaps after the launch-critical verification matrix was assembled, then convert mock-heavy or shell-only checks into blocker-grade proof where it matters.

## Priority Queue

### P0 - Launch-critical evidence gaps

- [ ] Add a direct backend scenario for `REQ-P1-AUTH-04` so verification-gated tasker role activation is proven in code, not just in shell UI.
- [ ] Add a direct backend scenario for `REQ-P1-SAFE-01` so the pending-to-approved verification lifecycle is exercised end to end.
- [ ] Add direct backend proof for `REQ-P1-SAFE-05` so the Pro badge threshold is testable as a runtime rule rather than a fixture detail.
- [ ] Add a direct backend admin scenario for `REQ-P1-ADMIN-04` so ban/unban changes are verified independently of the UI mock.

### P1 - Reduce advisory and ceremonial evidence

- [ ] Replace the legacy blanket JaCoCo package floor with an evidence-based backend coverage policy if a release-blocking coverage KPI is still required.
- [ ] Decide whether a fast scoped mutation gate should return for `gateRegression`, or whether mutation should remain exclusively in `gateFull` now that the deploy gate is scenario-first.
- [ ] Replace `apps/web/src/pages/admin/__tests__/AdminFeaturesPage.test.tsx` with a backend-backed toggle round-trip or mark it explicitly as ceremonial in future audit docs.
- [ ] Promote `apps/web/src/pages/admin/__tests__/AdminVerificationsPage.test.tsx` from mock-only UI coverage to a backend-backed verification workflow test.
- [ ] Add direct runtime evidence for concierge dispatch so `REQ-P1-ADMIN-05` is not justified only by dispute scenarios plus mock UI.
- [ ] Add a non-mocked booking confirmation path for applicant review and acceptance so `REQ-P1-BOOK-02` has stronger browser evidence than fixture-based UI tests.
- [ ] Add a device-backed push smoke for `REQ-P1-MSG-03` so notification delivery is proven on a real client path instead of only through backend semantics.

### P2 - Journey coverage hardening

- [x] Add a small set of outcome-based browser journeys in `apps/web/e2e/` for one customer, one tasker, and one admin critical path.
- [x] Retire the leftover Playwright route smoke checks (`apps/web/e2e/smoke.spec.ts` and `apps/web/e2e/auth-guard.spec.ts`) now that outcome-based browser journeys exist.
- [x] Turn `pnpm --filter @tasky/mobile test:e2e:smoke` into a real Phase 1 Maestro gate (`smoke.yaml`, `JRN-CUST-01-post-a-task.yaml`, and `JRN-TASK-02-browse-&-apply-to-task.yaml`) instead of an app-launch-only check.
- [x] Wire the trusted web and mobile smoke journeys into CI (`quality-gates.yml`, `nightly-regression.yml`, and `release-gate.yml`) with runner-specific Playwright/Maestro setup.
- [ ] Add a true end-to-end mobile journey for verification, review submission, and dispute resolution that asserts final runtime state instead of only screen presence.
- [ ] Reduce reliance on mocked `apiClient` fixtures in launch-critical web integration tests where the backend scenarios already exist.

### P3 - Hygiene and signal maintenance

- [ ] Reduce React Router future-flag warning noise in web tests so real failures stand out.
- [x] Finish migrating mobile suites off inline `react-i18next` stubs onto `apps/mobile/__tests__/test-utils/mockI18n.ts` so translated copy tests stop failing on raw keys.
- [x] Remove the remaining provider/store harness drift in mobile tests after the new global `AsyncStorage` Jest mock landed.
- [x] Replace brittle exact-string and raw-`className` assertions in mobile suites such as `KeyComponents.test.tsx` with assertions on observable behavior or merged class tokens.
- [x] Continue migrating top mobile red suites by failure weight from `/tmp/tasky-mobile-jest-19.json`: `ReviewForm`, `BookingConfirmScreen`, `CategorySelectionScreen`, `ChatDetail`, `TaskerStatsScreen`, and `MyJobsScreen`.
- [x] Sweep the next remaining translation-drift cluster: `ConversationList`, `OtpMigrationScreen`, `BookingTimelineScreen`, `ReferralsScreen`, `ReviewForm`, `BookingConfirmScreen`, `CategorySelectionScreen`, and `ChatDetail`.
- [x] Finish the remaining profile/jobs tail after the latest rehab, starting with `TaskerStatsScreen` and `MyJobsScreen`.
- [x] Clear the tasker credits tail: `CreditsIndexScreen` and `CreditsPayScreen`.
- [ ] Characterize why the ordinary mobile JSON Jest run still emits the generic post-run open-handle warning even though `/tmp/tasky-mobile-jest-22.json` is green and a full `--detectOpenHandles` pass exited cleanly without identifying a concrete leaking handle.
- [ ] Add a documented warning-budget policy for CI logs so advisory noise does not hide blocker failures.
- [ ] Reconcile legacy `tests/registry.yaml` `prd_ref` values with the launch-only `REQ-P1-*` set, or maintain an explicit mapping artifact if registry re-keying must wait.
- [ ] Keep the requirement verification matrix and trust audit in sync with future scenario additions.

## Exit Criteria

- Every `REQ-P1-*` launch-critical requirement has at least one backend scenario or an explicitly documented mixed/missing-evidence judgment.
- Mock-only UI checks are never cited as launch proof without a blocker-grade backend companion.
- The launch matrix, trust audit, and rehab backlog stay aligned with the approved capability matrix and launch baseline.
