# Tasky Redesign Refero and Proof-Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the Refero reference matrix and proof-screen design contracts needed before any Tasky web or mobile redesign implementation begins.

**Architecture:** This is a design-contract tranche, not a runtime-code tranche. The plan creates research and proof-screen planning artifacts under `docs/plans/`, then updates active `docs/design/screen-specs/SCR-*.yaml` files only after the matrix and proof-screen contracts are reviewed. Runtime implementation gets a separate plan after these contracts are approved.

**Tech Stack:** Refero MCP, Markdown design plans, YAML screen specs, Tasky docs governance validators, `pnpm repo:docs:check`.

---

## Scope Boundaries

This plan implements the approved thesis in `docs/plans/2026-04-26-tasky-redesign-thesis.md`.

It does not:

- edit web or mobile runtime code
- change Phase 1 product behavior
- introduce tasker verification tiers
- expose escrow, wallet, payment protection, payout protection, or paid lead features
- make Refero examples the source of truth for Tasky behavior

Stop after Task 5 and request review before Task 6 updates active screen specs.

## File Structure

- Create: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
  - Owns Refero research findings, adopted/rejected patterns, and web/mobile/token implications.
- Create: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
  - Owns the five proof-screen briefs, exact active screen-spec mapping, and cross-platform acceptance criteria.
- Modify after review: `docs/plans/2026-04-26-tasky-redesign-thesis.md`
  - Add links to the reference matrix and proof-screen contract once they exist.
- Modify after review: `docs/design/screen-specs/SCR-CUST-002.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-003.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-004.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-005.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-006.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-007.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-008.yaml`
- Modify after review: `docs/design/screen-specs/SCR-TASK-001.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-009.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-011.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-013.yaml`
- Modify after review: `docs/design/screen-specs/SCR-CUST-017.yaml`
- Modify after review: `docs/design/screen-specs/SCR-TASK-013.yaml`
- Modify after review: `docs/design/screen-specs/SCR-SHARED-012.yaml`

## Current Proof-Screen Mapping

| Proof surface                           | Active design specs                            | Why these specs are in scope                                                                                                  |
| --------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Customer task posting                   | `SCR-CUST-002` through `SCR-CUST-008`          | Category, intake, photos, location, schedule, review, and success states prove guided density.                                |
| Tasker task feed                        | `SCR-TASK-001`                                 | Browse/feed proves operational density, filters, metadata hierarchy, and apply momentum.                                      |
| Customer task detail / applicant review | `SCR-CUST-009`, `SCR-CUST-011`, `SCR-CUST-013` | Detail, applicants, and public tasker profile prove contextual trust and comparison.                                          |
| Booking detail                          | `SCR-CUST-017`, `SCR-TASK-013`                 | Customer and tasker booking detail prove lifecycle timeline, address reveal, contact, cancellation, and dispute entry points. |
| Profile / reviews                       | `SCR-SHARED-012`, `SCR-CUST-013`               | Own profile and public tasker profile prove verification, low-review states, and human warmth.                                |

## Task 1: Create the Reference Matrix Shell

**Files:**

- Create: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`

- [ ] **Step 1: Create the matrix document**

Add this complete initial file:

```markdown
# Tasky Redesign Refero Reference Matrix

**Date:** 2026-04-26
**Status:** Draft research matrix for proof-screen design
**Parent thesis:** `docs/plans/2026-04-26-tasky-redesign-thesis.md`

## Research rules

- Use Refero as an evidence source, not as a source of product truth.
- Record both adopted and rejected patterns.
- Compare web and iOS separately before extracting a shared Tasky pattern.
- Do not adopt references that depend on escrow, payment protection, wallet safety, provider tiers, instant match, or paid lead unlock.
- Keep Tasky's Phase 1 model explicit: verified taskers may apply, customers choose from open applications, settlement is direct, trust is process-backed.

## Matrix

| Tasky surface                | Platform  | Refero examples | Adopted pattern | Rejected pattern | Web implication | Mobile implication | Token/component implication |
| ---------------------------- | --------- | --------------- | --------------- | ---------------- | --------------- | ------------------ | --------------------------- |
| Customer posting and booking | Web       |                 |                 |                  |                 |                    |                             |
| Customer posting and booking | iOS       |                 |                 |                  |                 |                    |                             |
| Tasker feed and application  | Web       |                 |                 |                  |                 |                    |                             |
| Tasker feed and application  | iOS       |                 |                 |                  |                 |                    |                             |
| Profiles and reputation      | Web       |                 |                 |                  |                 |                    |                             |
| Profiles and reputation      | iOS       |                 |                 |                  |                 |                    |                             |
| Trust and recourse           | Web       |                 |                 |                  |                 |                    |                             |
| Trust and recourse           | iOS       |                 |                 |                  |                 |                    |                             |
| Cross-platform parity        | Web + iOS |                 |                 |                  |                 |                    |                             |

## Refero search log

| Lane | Platform | Query | Useful result IDs | Notes |
| ---- | -------- | ----- | ----------------- | ----- |

## Pattern decisions

### Adopt

| Decision | Reason | Applies to |
| -------- | ------ | ---------- |

### Reject

| Decision | Reason | Applies to |
| -------- | ------ | ---------- |

## Open design questions

| Question | Decision owner | Blocks |
| -------- | -------------- | ------ |
```

- [ ] **Step 2: Verify the file renders and has no placeholder markers**

Run:

```bash
rg -n "TBD|TODO|FIXME|implement later" docs/plans/2026-04-26-tasky-redesign-reference-matrix.md
```

Expected: no output.

- [ ] **Step 3: Commit the shell only if the worktree scope is clean**

Run:

```bash
git status --short
```

Expected: existing unrelated dirty files may be present. If so, do not stage them.

Commit only this file if committing is part of the current execution brief:

```bash
git add docs/plans/2026-04-26-tasky-redesign-reference-matrix.md
git commit -m "docs(design): add redesign reference matrix shell"
```

## Task 2: Fill Refero Research Lanes

**Files:**

- Modify: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`

- [ ] **Step 1: Research customer posting and booking**

Run these Refero searches:

```text
refero_search_flows(platform="web", query="appointment booking structured form confirmation")
refero_search_flows(platform="ios", query="service booking review and confirm")
refero_search_screens(platform="web", query="service booking form sticky summary cancellation confirmation")
refero_search_screens(platform="ios", query="service selection booking confirmation sticky CTA")
```

Record at least three useful web or iOS references. Include `ReferoURL`, screen or flow ID, and one sentence on why each reference is useful.

- [ ] **Step 2: Research tasker feed and application**

Run these Refero searches:

```text
refero_search_screens(platform="ios", query="job feed apply relevant open jobs filters compact cards")
refero_search_screens(platform="web", query="job marketplace feed filters applicant cards apply")
refero_search_flows(platform="ios", query="job application")
refero_search_flows(platform="web", query="job application")
```

Record references that help Tasky with operational density, compact metadata, task status, objective filter-backed groupings, and application confirmation. Reject patterns that over-index on corporate recruiting, social networking, personal bookmarking mechanics, or algorithmic task ranking.

- [ ] **Step 3: Research profiles and reputation**

Run these Refero searches:

```text
refero_search_screens(platform="ios", query="provider profile verified reviews services booking")
refero_search_screens(platform="web", query="provider profile reviews services booking trust")
refero_search_screens(platform="ios", query="reviews rating summary low reviews search reviews")
refero_search_screens(platform="web", query="service provider reviews rating profile")
```

Record references that show public profile, review threshold, team/provider card, and low-review handling patterns. Reject "top provider" or "guest favorite" style labels unless the pattern can be translated into Tasky's verified/review-threshold model without inventing ranking.

- [ ] **Step 4: Research trust and recourse**

Run these Refero searches:

```text
refero_search_screens(platform="ios", query="dispute support evidence upload booking cancellation warning")
refero_search_screens(platform="web", query="appointment cancellation confirmation status support evidence")
refero_search_flows(platform="web", query="appointment cancellation status")
refero_search_flows(platform="ios", query="support booking cancellation")
```

Record references for destructive confirmations, cancellation reason capture, evidence guidance, help/support routing, and clear after-states.

- [ ] **Step 5: Add pattern decisions**

Update the `Pattern decisions` section with decisions using this format:

```markdown
| Decision                                               | Reason                                                                                                                                                                          | Applies to                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Use sticky booking summaries on web proof screens      | Refero booking references repeatedly preserve context during multi-step booking decisions; Tasky needs price, schedule, and trust state visible without re-reading prior steps. | Customer posting, applicant review, booking detail |
| Use bottom sticky CTAs on mobile proof screens         | Mobile booking references keep the primary next action reachable while details scroll; Tasky already uses native shell/CTA patterns.                                            | Posting, task detail, booking detail               |
| Reject provider ranking badges before review threshold | Tasky Phase 1 requires verification-gated eligibility and thresholded reputation, not inferred provider tiers.                                                                  | Applicant review, public profile                   |
```

- [ ] **Step 6: Verify docs lane**

Run:

```bash
pnpm repo:docs:check
```

Expected: all checks pass.

## Task 3: Create the Proof-Screen Contract

**Files:**

- Create: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`

- [ ] **Step 1: Create the contract document**

Add this complete initial file:

```markdown
# Tasky Redesign Proof-Screen Contract

**Date:** 2026-04-26
**Status:** Draft proof-screen contract for review
**Parent thesis:** `docs/plans/2026-04-26-tasky-redesign-thesis.md`
**Reference matrix:** `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`

## Purpose

This contract translates the approved redesign thesis into five proof-screen briefs. It does not implement runtime UI and does not activate deferred product behavior.

## Shared proof rules

- Use `guided`, `balanced`, and `operational` density deliberately.
- Treat `Verified tasker` as eligibility, not a rank.
- Use contextual trust modules at risk points.
- Preserve approximate location before confirmation and exact address only after confirmation.
- Preserve direct settlement and avoid payment-protection copy.
- Keep copy implementation i18n-backed when runtime work begins.

## Proof screens

### 1. Customer task posting

**Specs:** `SCR-CUST-002`, `SCR-CUST-003`, `SCR-CUST-004`, `SCR-CUST-005`, `SCR-CUST-006`, `SCR-CUST-007`, `SCR-CUST-008`
**Density:** `guided`
**Primary proof:** A customer can move through structured posting with enough guidance to feel confident, without making the flow feel slow.
**Trust cues:** structured scope, address privacy, pricing mode clarity, deterministic summary, success next steps.
**Web pattern:** stepper or split layout with sticky summary after enough data exists.
**Mobile pattern:** native step flow with sticky bottom CTA and short contextual helper rows.

### 2. Tasker task feed

**Specs:** `SCR-TASK-001`
**Density:** `operational`
**Primary proof:** A verified or pending tasker can scan available work quickly and understand price, location, schedule, and eligibility.
**Trust cues:** verified-required apply state, approximate location, no pre-booking chat expectation, clear task freshness/status.
**Web pattern:** dense list with filters and metadata hierarchy.
**Mobile pattern:** compact task cards with filter sheet and stable apply affordance.

### 3. Customer task detail / applicant review

**Specs:** `SCR-CUST-009`, `SCR-CUST-011`, `SCR-CUST-013`
**Density:** `balanced`
**Primary proof:** A customer can compare applicants without fake ranking and choose a tasker with process-backed confidence.
**State proof:** Selection is not instant booking; the proof must show pending selected-tasker acceptance, confirmation only after acceptance/recording/liability acknowledgement/locked price, and expiry back to selectable applicants.
**Trust cues:** task detail and applicant list carry structured pricing response, approximate location until booking, and pending-acceptance expiry; public profile contributes verified eligibility, completed jobs, review-threshold state, service categories, and no direct contact before booking.
**Web pattern:** task detail plus applicant comparison pane or sticky applicant summary.
**Mobile pattern:** task detail stack, applicants list, and public profile as focused native screens/sheets.
**Rejected Refero pattern:** Do not copy dating-style swipe selection, open chat threads, or "best match" ordering; applicants remain customer-reviewed without fake ranking.

### 4. Booking detail

**Specs:** `SCR-CUST-017`, `SCR-TASK-013`
**Density:** `balanced`
**Primary proof:** Both roles can understand booking state, next action, address visibility, contact availability, and recourse.
**Trust cues:** lifecycle timeline, exact address reveal rule, platform-mediated contact, cancellation/no-show warnings, dispute entry.
**Web pattern:** two-column detail with lifecycle rail and action summary.
**Mobile pattern:** timeline-first detail with sticky next action and contextual sheets for risky actions.

### 5. Profile / reviews

**Specs:** `SCR-SHARED-012`, `SCR-CUST-013`
**Density:** `balanced`
**Primary proof:** Profiles feel human and trustworthy while respecting early-launch low-review reality.
**Trust cues:** verified eligibility, review threshold, completed jobs, role-specific review dimensions, neutral no-review state.
**Web pattern:** profile hero plus trust/reputation sections.
**Mobile pattern:** avatar hero, trust summary, compact review cards, edit/booking CTA where applicable.

## Acceptance criteria before runtime implementation

- Each proof surface names target density, trust cues, web pattern, and mobile pattern.
- Each proof surface rejects at least one unsuitable Refero pattern.
- Active screen-spec edits stay aligned with live PRD and journey refs.
- No proof screen adds Phase 2, Phase 3, or Phase 4 product behavior.
- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` passes after screen-spec edits.
- `pnpm repo:docs:check` passes before handoff.
```

- [ ] **Step 2: Verify the contract has no placeholder markers**

Run:

```bash
rg -n "TBD|TODO|FIXME|implement later" docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md
```

Expected: no output.

- [ ] **Step 3: Verify docs lane**

Run:

```bash
pnpm repo:docs:check
```

Expected: all checks pass.

## Task 4: Link the Thesis to the New Research Artifacts

**Files:**

- Modify: `docs/plans/2026-04-26-tasky-redesign-thesis.md`

- [ ] **Step 1: Add a related artifacts section after the status block**

Insert this section after the status line:

```markdown
## Related artifacts

- Refero reference matrix: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- Proof-screen contract: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
```

- [ ] **Step 2: Verify links resolve**

Run:

```bash
test -f docs/plans/2026-04-26-tasky-redesign-reference-matrix.md
test -f docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md
pnpm repo:docs:check
```

Expected: both `test -f` commands exit 0 and docs checks pass.

## Task 5: Review Gate Before Active Screen-Spec Changes

**Files:**

- Review: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- Review: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`

- [ ] **Step 1: Summarize matrix decisions**

Prepare a short review note with this exact structure. Replace any decision below only if the completed matrix provides
stronger evidence; do not leave generic bracketed placeholders in the review note.

```markdown
## Refero Matrix Review

Adopt:

- Use sticky booking summaries on web proof screens so price, schedule, status, and trust context remain visible during longer decisions.
- Use native sticky bottom CTAs and focused sheets on mobile proof screens so the main action stays reachable without flattening every detail into the first viewport.
- Use verified eligibility, completed jobs, and thresholded reviews as profile trust cues instead of provider levels.

Reject:

- Reject provider ranking badges before Tasky has a backed ranking model and review threshold.
- Reject escrow, deposit, payment protection, and wallet references from booking examples because those are not Phase 1 behavior.
- Reject social-network or recruiting tone from job-feed examples when translating tasker feed mechanics.

Proof-screen implications:

- Customer posting: use guided density with a visible summary once enough structured fields exist.
- Tasker feed: use operational density with compact metadata, filters, and apply-state clarity.
- Applicant review: use balanced density with verified eligibility and structured pricing response, not fake ranking.
- Booking detail: use timeline-first status, exact-address reveal rules, and contextual risky-action sheets.
- Profile/reviews: use human profile presentation with neutral low-review states and thresholded reputation.
```

The final review note must match decisions actually recorded in the matrix.

- [ ] **Step 2: Ask for approval**

Stop and ask the user to approve the reference matrix and proof-screen contract before editing active screen specs.

Expected user-facing message:

```text
The Refero matrix and proof-screen contract are ready for review. Please approve them before I update active screen specs.
```

## Task 6: Update Customer Posting Screen Specs After Approval

**Files:**

- Modify: `docs/design/screen-specs/SCR-CUST-002.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-003.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-004.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-005.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-006.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-007.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-008.yaml`

- [ ] **Step 1: Read current specs**

Run:

```bash
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-002.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-003.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-004.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-005.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-006.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-007.yaml
sed -n '1,220p' docs/design/screen-specs/SCR-CUST-008.yaml
```

Expected: each file contains a valid `traceability` block and Phase 1 posting behavior.

- [ ] **Step 2: Add proof metadata to each posting spec**

For each file, add or update design guidance using the existing local YAML shape. The content must express:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: guided
  proof_scope: customer_posting_wizard_surface
  cue_scope: flow_level_cues_not_required_on_every_step
  trust_cues:
    - structured_scope
    - pricing_mode_clarity
    - address_privacy
    - deterministic_summary
    - next_step_guidance
  non_goals:
    - no_runtime_ai_posting
    - no_payment_protection_claims
    - no_open_ended_pre_booking_chat
```

If the existing schema does not use a `redesign_proof` block, add equivalent content under the nearest existing design-notes field and keep the terms identical.

- [ ] **Step 3: Run traceability validation**

Run:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Expected: both commands pass.

## Task 7: Update Tasker Feed and Applicant Review Screen Specs After Approval

**Files:**

- Modify: `docs/design/screen-specs/SCR-TASK-001.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-009.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-011.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-013.yaml`

- [ ] **Step 1: Read current specs**

Run:

```bash
sed -n '1,280p' docs/design/screen-specs/SCR-TASK-001.yaml
sed -n '1,280p' docs/design/screen-specs/SCR-CUST-009.yaml
sed -n '1,280p' docs/design/screen-specs/SCR-CUST-011.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-013.yaml
```

- [ ] **Step 2: Add proof metadata for operational and applicant surfaces**

`SCR-TASK-001` must express:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: operational
  trust_cues:
    - verified_required_apply_state
    - approximate_location
    - structured_application_not_chat
    - task_freshness_status
  non_goals:
    - no_instant_match_claim
    - no_tasker_ranking_tiers
```

`SCR-CUST-009` and `SCR-CUST-011` must express:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: balanced
  trust_cues:
    - verified_badge_as_eligibility
    - completed_jobs
    - review_threshold_state
    - structured_pricing_response
    - approximate_location_until_booking
  non_goals:
    - no_fake_top_candidate_ranking
    - no_payment_protection_claims
```

`SCR-CUST-013` must express the public-profile portion of applicant review, without claiming pricing or location cues that are owned by task detail and applicant-list surfaces:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: balanced
  trust_cues:
    - verified_badge_as_eligibility
    - completed_jobs
    - review_threshold_state
    - service_categories
    - no_direct_contact_before_booking
  non_goals:
    - no_fake_top_candidate_ranking
    - no_payment_protection_claims
```

If the existing schema does not use a `redesign_proof` block, add equivalent content under the nearest existing design-notes field and keep the terms identical.

- [ ] **Step 3: Run traceability validation**

Run:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Expected: both commands pass.

## Task 8: Update Booking Detail and Profile Screen Specs After Approval

**Files:**

- Modify: `docs/design/screen-specs/SCR-CUST-017.yaml`
- Modify: `docs/design/screen-specs/SCR-TASK-013.yaml`
- Modify: `docs/design/screen-specs/SCR-SHARED-012.yaml`
- Modify: `docs/design/screen-specs/SCR-CUST-013.yaml`

- [ ] **Step 1: Read current specs**

Run:

```bash
sed -n '1,320p' docs/design/screen-specs/SCR-CUST-017.yaml
sed -n '1,420p' docs/design/screen-specs/SCR-TASK-013.yaml
sed -n '1,300p' docs/design/screen-specs/SCR-SHARED-012.yaml
sed -n '1,260p' docs/design/screen-specs/SCR-CUST-013.yaml
```

- [ ] **Step 2: Add booking proof metadata**

`SCR-CUST-017` and `SCR-TASK-013` must express:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: balanced
  trust_cues:
    - lifecycle_timeline
    - exact_address_reveal_rule
    - platform_mediated_contact
    - cancellation_no_show_warning
    - dispute_entry
  non_goals:
    - no_escrow_claim
    - no_wallet_claim
    - no_payment_protection_claim
```

- [ ] **Step 3: Add profile proof metadata**

`SCR-SHARED-012` must express:

```yaml
redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: balanced
  trust_cues:
    - verified_eligibility
    - review_threshold
    - completed_jobs
    - role_specific_review_dimensions
    - neutral_no_review_state
  non_goals:
    - no_provider_level_badges
    - no_unbacked_reputation_claims
```

`SCR-CUST-013` must preserve its applicant-review `redesign_proof` block and add the profile payload as a sibling block:

```yaml
profile_redesign_proof:
  thesis: warm_marketplace_with_operational_spine
  density: balanced
  trust_cues:
    - verified_eligibility
    - review_threshold
    - completed_jobs
    - role_specific_review_dimensions
    - neutral_no_review_state
  non_goals:
    - no_provider_level_badges
    - no_unbacked_reputation_claims
```

- [ ] **Step 4: Run traceability validation**

Run:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Expected: both commands pass.

## Task 9: Final Verification and Handoff

**Files:**

- Review all files changed by this plan.

- [ ] **Step 1: Check dirty scope**

Run:

```bash
git status --short
git diff -- docs/plans/2026-04-26-tasky-redesign-thesis.md docs/plans/2026-04-26-tasky-redesign-reference-matrix.md docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md docs/design/screen-specs/SCR-CUST-002.yaml docs/design/screen-specs/SCR-CUST-003.yaml docs/design/screen-specs/SCR-CUST-004.yaml docs/design/screen-specs/SCR-CUST-005.yaml docs/design/screen-specs/SCR-CUST-006.yaml docs/design/screen-specs/SCR-CUST-007.yaml docs/design/screen-specs/SCR-CUST-008.yaml docs/design/screen-specs/SCR-TASK-001.yaml docs/design/screen-specs/SCR-CUST-009.yaml docs/design/screen-specs/SCR-CUST-011.yaml docs/design/screen-specs/SCR-CUST-013.yaml docs/design/screen-specs/SCR-CUST-017.yaml docs/design/screen-specs/SCR-TASK-013.yaml docs/design/screen-specs/SCR-SHARED-012.yaml
```

Expected: diff contains only redesign research, proof-contract, or approved screen-spec metadata.

- [ ] **Step 2: Run final docs verification**

Run:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

Expected: both commands pass.

- [ ] **Step 3: Commit only the approved redesign contract slice if requested**

If the execution brief asks for a commit, stage only files touched by this plan:

```bash
git add docs/plans/2026-04-26-tasky-redesign-thesis.md docs/plans/2026-04-26-tasky-redesign-reference-matrix.md docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md docs/design/screen-specs/SCR-CUST-002.yaml docs/design/screen-specs/SCR-CUST-003.yaml docs/design/screen-specs/SCR-CUST-004.yaml docs/design/screen-specs/SCR-CUST-005.yaml docs/design/screen-specs/SCR-CUST-006.yaml docs/design/screen-specs/SCR-CUST-007.yaml docs/design/screen-specs/SCR-CUST-008.yaml docs/design/screen-specs/SCR-TASK-001.yaml docs/design/screen-specs/SCR-CUST-009.yaml docs/design/screen-specs/SCR-CUST-011.yaml docs/design/screen-specs/SCR-CUST-013.yaml docs/design/screen-specs/SCR-CUST-017.yaml docs/design/screen-specs/SCR-TASK-013.yaml docs/design/screen-specs/SCR-SHARED-012.yaml
git commit -m "docs(design): plan tasky redesign proof screens"
```

Do not stage unrelated dirty files from backend, OpenAPI, SDK, tests, scenarios, web runtime, or mobile runtime changes.

- [ ] **Step 4: Handoff to runtime implementation planning**

Prepare a new plan for the first approved implementation slice. The proposed first runtime slice is customer task posting because it proves guided density and creates reusable density/trust decisions for later surfaces.

The handoff note must include:

```markdown
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
```
