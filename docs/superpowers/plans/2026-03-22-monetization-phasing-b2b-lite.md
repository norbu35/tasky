# Monetization Phasing & B2B Lite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update PRD.md and create ADR 0003 to reflect the revised monetization phasing with B2B Lite advanced from Phase 4 to Phase 2-3.

**Architecture:** This is a document-only change. All edits target `docs/PRD.md` (11 edit sites across 6 sections) and one new file `docs/adr/0003-b2b-lite-phase-advancement.md`. No code, no migrations, no tests.

**Spec:** `docs/superpowers/specs/2026-03-22-monetization-phasing-b2b-lite-design.md`

---

## File Map

| File | Action | Sections Affected |
|------|--------|-------------------|
| `docs/PRD.md` | Modify | Section 3 (line ~113), Section 7.5 (lines ~371, ~392, ~395, ~398, ~408, ~410), Section 7.12.4 (line ~650), Section 7.12.5 (lines ~686-691), Section 9 (lines ~886, ~898-903), Section 10.2 (line ~977), Section 12.4 (lines ~1082-1112), Section 12.5 (lines ~1114-1128), Section 12.6 (lines ~1130-1143) |
| `docs/adr/0003-b2b-lite-phase-advancement.md` | Create | New file |

**Important:** Line numbers are approximate. Before each edit, read the surrounding context to locate the exact text to replace. The spec provides exact old/new text for each replacement.

---

### Task 1: Update Deferred Items Table (Section 3)

**Files:**
- Modify: `docs/PRD.md:~113`

**Spec reference:** Section 3

- [ ] **Step 1: Read context around line 113**

Run: Read `docs/PRD.md` lines 100-120 to locate the exact B2B row.

- [ ] **Step 2: Replace B2B row**

Find:
```
| B2B recurring service products                 | Phase 4      |
```

Replace with:
```
| B2B Lite (bulk-buyer subscriptions)            | Phase 2      |
| B2B Managed (SaaS platform, Shape B)           | Post-Phase 4 |
```

- [ ] **Step 3: Verify edit**

Read lines 110-120 and confirm both new rows appear correctly in the table.

- [ ] **Step 4: Commit**

```bash
git add docs/PRD.md
git commit -m "docs(prd): move B2B Lite to Phase 2 in deferred items table"
```

---

### Task 2: Update REQ-PAY-14 (Section 7.5 — Phase 2 Pricing Policy)

**Files:**
- Modify: `docs/PRD.md:~371`

**Spec reference:** Section 4.2

- [ ] **Step 1: Read context around line 371**

Run: Read `docs/PRD.md` lines 368-375.

- [ ] **Step 2: Replace REQ-PAY-14**

Find:
```
* **REQ-PAY-14**: Lead-unlock credit pricing MUST follow a ramp-up policy in Phase 2 (starting at 1 credit),
  configurable by admin as trust and demand stabilize.
```

Replace with:
```
* **REQ-PAY-14**: Lead-unlock credit pricing MUST follow category-tiered pricing
  as defined in REQ-PAY-27. The initial ramp-up period MAY use a flat introductory
  rate before tiered pricing activates, configurable by admin.
```

- [ ] **Step 3: Verify edit**

Read lines 368-378 and confirm the updated text.

---

### Task 3: Insert Phase 2 Promoted Listings + B2B Lite Requirements (Section 7.5)

**Files:**
- Modify: `docs/PRD.md:~392`

**Spec reference:** Section 4.1

- [ ] **Step 1: Read context around line 392**

Run: Read `docs/PRD.md` lines 388-396 to find the end of the Phase 2 Credit System block (after REQ-PAY-22).

- [ ] **Step 2: Insert new subsections after the Phase 2 Credit System block**

After the line containing REQ-PAY-22 (credits are non-expiring...), insert the full text from spec Section 4.1:
- `##### Phase 2 Promoted Listings & Visibility Products` (REQ-PAY-23, REQ-PAY-24)
- `##### Phase 2 B2B Lite (Domain Model)` (REQ-PAY-25, REQ-PAY-26, REQ-PAY-27, REQ-PAY-28)

Copy exact text from spec Section 4.1.

- [ ] **Step 3: Verify edit**

Read the area around the insertion to confirm the new subsections appear between the credit system block and Phase 3.

---

### Task 4: Update REQ-PAY-30 (Section 7.5 — Phase 3 Subscription)

**Files:**
- Modify: `docs/PRD.md:~395` (line shifted due to Task 3 insertion)

**Spec reference:** Section 4.3

- [ ] **Step 1: Locate REQ-PAY-30**

Search for `REQ-PAY-30` in `docs/PRD.md` within Section 7.5 (not acceptance criteria).

- [ ] **Step 2: Replace REQ-PAY-30**

Find:
```
* **REQ-PAY-30**: Top-rated Taskers (Pro Badge holders) MUST be offered a **Monthly Subscription** tier: flat monthly
  fee in exchange for zero lead-fee credit costs, algorithmic priority in search results, and Premium badge visibility.
```

Replace with the full updated text from spec Section 4.3 (Tasky Pro Subscription with Standard/Premium tiers, hysteresis thresholds, eligibility gate).

- [ ] **Step 3: Verify edit**

Read the surrounding lines and confirm the two-tier subscription text with earned badge gate.

---

### Task 5: Update REQ-PAY-32 (Section 7.5 — Escrow Opt-In)

**Files:**
- Modify: `docs/PRD.md` (near REQ-PAY-32 in Section 7.5)

**Spec reference:** Section 4.3

- [ ] **Step 1: Locate REQ-PAY-32**

Search for `REQ-PAY-32` in `docs/PRD.md` within Section 7.5.

- [ ] **Step 2: Replace REQ-PAY-32**

Find:
```
* **REQ-PAY-32**: System MUST support **escrow** flow: Customer pays at booking confirmation → funds held by platform →
  released to Tasker's wallet 4 hours after Customer marks completion (or earlier if manually confirmed). `[F6]`
```

Replace with the opt-in escrow text from spec Section 4.3 (300K MNT threshold, 10-20% deposit, not default).

- [ ] **Step 3: Verify edit**

Confirm "opt-in escrow" and "NOT the default settlement mode" appear.

---

### Task 6: Insert REQ-PAY-39 (Section 7.5 — B2B Billing)

**Files:**
- Modify: `docs/PRD.md` (after REQ-PAY-38)

**Spec reference:** Section 4.3

- [ ] **Step 1: Locate REQ-PAY-38**

Search for `REQ-PAY-38` in `docs/PRD.md` within Section 7.5.

- [ ] **Step 2: Insert REQ-PAY-39 after REQ-PAY-38**

Insert the full B2B Subscription Billing requirement text from spec Section 4.3 (Host Lite, Ops Standard, billing_cycle_day, b2b_enabled toggle).

- [ ] **Step 3: Verify edit**

Read the area and confirm REQ-PAY-39 appears between REQ-PAY-38 and the Phase 4 header.

- [ ] **Step 4: Commit Tasks 2-6**

```bash
git add docs/PRD.md
git commit -m "docs(prd): add Phase 2 promoted listings, B2B Lite, tiered pricing, and update Phase 3 subscription/escrow requirements"
```

---

### Task 7: Replace Phase 4 Block (Section 7.5)

**Files:**
- Modify: `docs/PRD.md` (Phase 4 header and REQ-PAY-40/41/42)

**Spec reference:** Section 4.4

- [ ] **Step 1: Locate the Phase 4 block**

Search for `#### Phase 4 — Recurring Revenue & Ecosystem` in Section 7.5.

- [ ] **Step 2: Replace entire Phase 4 block**

Replace the header + REQ-PAY-40 + REQ-PAY-41 + REQ-PAY-42 with the updated text from spec Section 4.4 (rewritten REQ-PAY-40, REQ-PAY-41 Shape B contingent, REQ-PAY-42 unchanged, new REQ-PAY-43 Family Plan).

- [ ] **Step 3: Verify edit**

Confirm REQ-PAY-41 now says "B2B Managed (Shape B)" and REQ-PAY-43 exists.

- [ ] **Step 4: Commit**

```bash
git add docs/PRD.md
git commit -m "docs(prd): rewrite Phase 4 — B2B Managed contingent on Shape A, add Family Plan"
```

---

### Task 8: Update REQ-PAY-14 Acceptance Criteria (Section 7.12.4)

**Files:**
- Modify: `docs/PRD.md:~650`

**Spec reference:** Section 10

- [ ] **Step 1: Read context around line 650**

Run: Read `docs/PRD.md` lines 648-655.

- [ ] **Step 2: Replace REQ-PAY-14 acceptance criteria**

Find:
```
* **REQ-PAY-14**: Lead-unlock price table is admin-configurable by category/district with minimum start value 1 credit;
  all price changes are versioned with effective timestamp.
```

Replace with:
```
* **REQ-PAY-14**: Lead-unlock pricing follows category-tiered model (REQ-PAY-27);
  tier-to-category mapping is admin-configurable; all price changes are versioned
  with effective timestamp; optional flat introductory rate may precede tiered
  activation.
```

- [ ] **Step 3: Verify edit**

Read lines 648-658 and confirm.

---

### Task 9: Replace Acceptance Criteria Block (Section 7.12.5)

**Files:**
- Modify: `docs/PRD.md:~686-691`

**Spec reference:** Section 5

- [ ] **Step 1: Locate the REQ-PAY-40/41/42 acceptance criteria block**

Read `docs/PRD.md` lines 684-695.

- [ ] **Step 2: Replace the block**

Find:
```
* **REQ-PAY-40**: Tasky Plus subscribers receive priority queueing and SLA tracking...
* **REQ-PAY-41**: B2B plans support recurring scheduling...
* **REQ-PAY-42**: In Phase 4, checkout supports QPay plus SocialPay...
```

Replace with the full acceptance criteria block from spec Section 5 (REQ-PAY-23 through REQ-PAY-43).

- [ ] **Step 3: Verify edit**

Confirm all new requirements (23, 24, 25, 26, 27, 28, 30, 32, 39, 40, 41, 42, 43) have acceptance criteria.

- [ ] **Step 4: Commit Tasks 8-9**

```bash
git add docs/PRD.md
git commit -m "docs(prd): update acceptance criteria for new monetization requirements"
```

---

### Task 10: Update Section 9 (Metrics Table + Worked Example)

**Files:**
- Modify: `docs/PRD.md:~886` and `docs/PRD.md:~898-903`

**Spec reference:** Section 9

- [ ] **Step 1: Read metrics table around line 886**

Run: Read `docs/PRD.md` lines 883-890.

- [ ] **Step 2: Update revenue gate in metrics table**

Find:
```
| Monthly net revenue | Gross platform revenue minus direct variable platform costs (payment rails, SMS, infra) | Must be >= 12,000,000 MNT for 3 consecutive months before Phase 3    |
```

Replace with:
```
| Monthly net revenue | Gross platform revenue minus direct variable platform costs (payment rails, SMS, infra) | Must be >= 6,000,000 MNT for 2 consecutive months before Phase 3     |
```

- [ ] **Step 3: Read worked example around lines 898-903**

Run: Read `docs/PRD.md` lines 896-906.

- [ ] **Step 4: Replace worked example**

Find the block starting with `Worked example for the current gate:` and ending with the `RequiredPaidTransactions` calculation. Replace with the diversified revenue worked example from spec Section 9.2.

- [ ] **Step 5: Verify both edits**

Read lines 883-910 and confirm 6M/2-month gate in both locations.

- [ ] **Step 6: Commit**

```bash
git add docs/PRD.md
git commit -m "docs(prd): lower Phase 3 revenue gate from 12M/3mo to 6M/2mo with diversified revenue example"
```

---

### Task 11: Update Risk Table (Section 10.2)

**Files:**
- Modify: `docs/PRD.md:~977`

**Spec reference:** Section 11

- [ ] **Step 1: Read context around line 977**

Run: Read `docs/PRD.md` lines 975-980.

- [ ] **Step 2: Update Market Size Ceiling row**

Find:
```
| **Market Size Ceiling** (UB ~500K–600K households)         | High     | High       | Phase 4 city expansion (Darkhan, Erdenet). Higher-value category expansion. B2B recurring services. `[F12]`                                                                                  |
```

Replace with:
```
| **Market Size Ceiling** (UB ~500K–600K households)         | High     | High       | B2B Lite from Phase 2 (supply lock-in + revenue diversification). Phase 4 city expansion (Darkhan, Erdenet). Higher-value category expansion. B2B Managed services. `[F12]`                  |
```

- [ ] **Step 3: Verify edit**

Read the line and confirm "B2B Lite from Phase 2" appears.

- [ ] **Step 4: Commit**

```bash
git add docs/PRD.md
git commit -m "docs(prd): update Market Size Ceiling risk mitigation to reflect B2B Lite in Phase 2"
```

---

### Task 12: Replace Section 12.4 (Phase 2 Roadmap)

**Files:**
- Modify: `docs/PRD.md:~1082-1112`

**Spec reference:** Section 6

- [ ] **Step 1: Locate Section 12.4**

Search for `### 12.4 Phase 2` in `docs/PRD.md`.

- [ ] **Step 2: Replace entire section**

Replace from `### 12.4 Phase 2 — Soft Monetization` through the Phase 2 exit criteria (ending before `### 12.5`) with the full replacement from spec Section 6.

Key changes: new title includes "Promoted Listings + B2B Lite", new rows (Promoted, B2B Lite, Grandfathering), revenue gate 6M/2mo, new exit criterion "10+ active B2B accounts".

- [ ] **Step 3: Verify edit**

Read the replacement and confirm the B2B Lite row, category-tiered credits row, and 6M gate all appear.

---

### Task 13: Replace Section 12.5 (Phase 3 Roadmap)

**Files:**
- Modify: `docs/PRD.md:~1114-1128`

**Spec reference:** Section 7

- [ ] **Step 1: Locate Section 12.5**

Search for `### 12.5 Phase 3` in `docs/PRD.md`.

- [ ] **Step 2: Replace entire section**

Replace from `### 12.5 Phase 3` through the end of the section (before `### 12.6`) with the full replacement from spec Section 7.

Key changes: new title "Subscription + Opt-In Escrow + B2B Billing", new rows (Subscription with tiers, B2B Billing), escrow is opt-in, new exit criteria (20+ B2B accounts, 30+ Pro subscribers, escrow opt-in rate).

- [ ] **Step 3: Verify edit**

Confirm "Opt-In Escrow" in title and "Host Lite" / "Ops Standard" in B2B Billing row.

---

### Task 14: Replace Section 12.6 (Phase 4 Roadmap)

**Files:**
- Modify: `docs/PRD.md:~1130-1143`

**Spec reference:** Section 8

- [ ] **Step 1: Locate Section 12.6**

Search for `### 12.6 Phase 4` in `docs/PRD.md`.

- [ ] **Step 2: Replace entire section**

Replace from `### 12.6 Phase 4` through the end of the section (before `### 12.7`) with the full replacement from spec Section 8.

Key changes: B2B row becomes "B2B Managed" (Shape B, contingent), new Family Plan row, Customer Sub clarified.

- [ ] **Step 3: Verify edit**

Confirm B2B Lite row is gone, "B2B Managed" row exists with "contingent" language.

- [ ] **Step 4: Commit Tasks 12-14**

```bash
git add docs/PRD.md
git commit -m "docs(prd): rewrite Phase 2-4 roadmaps with B2B Lite, promoted listings, opt-in escrow, and tiered subscriptions"
```

---

### Task 15: Create ADR 0003

**Files:**
- Create: `docs/adr/0003-b2b-lite-phase-advancement.md`

**Spec reference:** Section 12

- [ ] **Step 1: Verify ADR directory exists**

Run: `ls docs/adr/`

- [ ] **Step 2: Create the ADR file**

Write the full ADR content from spec Section 12 to `docs/adr/0003-b2b-lite-phase-advancement.md`. Include the phase mapping table in the References section.

- [ ] **Step 3: Verify file**

Read the created file and confirm: Status is "proposed", Date is "2026-03-22", all 4 sections (Context, Decision, Consequences, Alternatives Considered) are present, phase mapping table is in References.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0003-b2b-lite-phase-advancement.md
git commit -m "docs(adr): add ADR 0003 — B2B Lite phase advancement from Phase 4 to Phase 2"
```

---

### Task 16: Final Verification

- [ ] **Step 1: Search for stale "12,000,000" references**

Run: `grep -n "12,000,000\|12M" docs/PRD.md` — should return zero hits in gate/trigger contexts. (May appear in Phase 4 exit criteria at 12M+ which is correct.)

- [ ] **Step 2: Search for stale Phase 4 B2B references**

Run: `grep -n "B2B" docs/PRD.md` — verify all B2B mentions align with new phasing (Lite in Phase 2, Managed in Phase 4).

- [ ] **Step 3: Verify requirement numbering continuity**

Confirm no duplicate REQ-PAY numbers exist: `grep -c "REQ-PAY-" docs/PRD.md` and spot-check that 23-28, 39, 43 all appear exactly as intended.

- [ ] **Step 4: Read Section 7.5 end-to-end**

Read the full monetization section to verify the narrative flow: Phase 0-1 (free) → Phase 2 (promoted listings, credits, B2B domain) → Phase 3 (subscriptions, B2B billing, escrow) → Phase 4 (Tasky Plus, B2B Managed, Family Plan).

- [ ] **Step 5: Commit if any fixups were needed**

Only if verification found issues that required edits.
