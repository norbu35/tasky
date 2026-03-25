# Missing Mobile Screen Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the Stitch prompt-generation pipeline to cover the agreed missing mobile screens through Phase 3.

**Architecture:** The design system remains spec-first. New authored screen specs are added under `docs/design/screen-specs/`, then wired into inventory, journeys, graph, and state matrix. `scripts/generate-prompts.js` is updated only to recognize the new screen family in manifest generation, and the generated prompt files are then refreshed.

**Tech Stack:** YAML design artifacts, Node.js prompt generator (`js-yaml`), repository docs.

---

### Task 1: Create the missing authored screen specs

**Files:**
- Create: `docs/design/screen-specs/SCR-TASK-019.yaml`
- Create: `docs/design/screen-specs/SCR-CUST-028.yaml`
- Create: `docs/design/screen-specs/SCR-CUST-029.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-001.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-002.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-003.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-004.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-005.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-006.yaml`
- Create: `docs/design/screen-specs/SCR-B2B-007.yaml`
- Modify: `docs/design/screen-specs/SCR-TASK-017.yaml`

**Step 1: Author specs using an existing packet as the template**

Use the same structure as existing files:
- metadata
- layout
- components
- states
- copy
- api_endpoints
- analytics_events
- acceptance_criteria

**Step 2: Add grandfathered discount disclosure as a checkout state**

Extend the lead-unlock flow spec instead of creating a standalone screen.

**Step 3: Review each spec for route, phase, and role correctness**

Ensure B2B screens do not imply a separate booking lifecycle.

### Task 2: Wire the new screens into the design navigation/state source-of-truth

**Files:**
- Modify: `docs/design/screen-inventory.yaml`
- Modify: `docs/design/journey-catalog.yaml`
- Modify: `docs/design/screen-graph.yaml`
- Modify: `docs/design/state-matrix.yaml`

**Step 1: Add new screen inventory entries**

Update summary counts and add a dedicated B2B section.

**Step 2: Add journeys**

Add one journey for AI Profile Polish, one for promoted/urgent boosts, and one or more B2B journeys covering account setup, posting as business, and subscription billing.

**Step 3: Add navigation graph nodes**

Wire entry/exit edges from existing profile/task/task-detail screens into the new nodes.

**Step 4: Add state matrix rows**

Keep the state names aligned to the detailed spec packet state IDs.

### Task 3: Extend the prompt-generation pipeline and docs

**Files:**
- Modify: `scripts/generate-prompts.js`
- Modify: `docs/design/prompts/README.md`
- Modify: `docs/design/prompts/generation-tracker.md`
- Modify: `docs/design/evaluation-report.md`

**Step 1: Add `SCR-B2B-*` grouping to manifest generation**

Keep existing groups unchanged and append the new group.

**Step 2: Expand tracker scope**

Add the new screens as pending Stitch generation items.

**Step 3: Update docs to reflect the expanded pack**

Keep Phase 4 exclusions explicit.

### Task 4: Regenerate prompt files and manifest

**Files:**
- Modify: `docs/design/prompts/screens/SCR-*.yaml`
- Modify: `docs/design/prompts/journeys/JRN-*.yaml`
- Modify: `docs/design/prompts/prompt-manifest.yaml`

**Step 1: Run generator**

Run: `node scripts/generate-prompts.js`

**Step 2: Inspect new prompt files**

Confirm every new screen and journey has a generated prompt artifact and manifest entry.

### Task 5: Verify alignment

**Files:**
- Verify: `docs/design/*`
- Verify: `docs/design/prompts/*`

**Step 1: Parse YAML and compare ID sets**

Check inventory, graph, matrix, specs, prompt files, and manifest counts.

**Step 2: Check for broken graph/journey references**

Ensure no edge or journey points at a missing screen.

**Step 3: Confirm doc language**

Make sure the expanded prompt pack is described accurately and Phase 4 remains explicitly excluded.
