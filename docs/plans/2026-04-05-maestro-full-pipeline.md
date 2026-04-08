# Maestro Full Testing Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Maestro from a skeleton of stub flows to a complete, running E2E test suite covering all implemented screens and journeys, with a structured error report that a patching agent can act on directly.

**Architecture:** Five phases gated by explicit verification steps. Phase 1 (pre-flight code fixes) must produce a green typecheck before Phase 2 (doc alignment). Phase 3 (flow authoring) produces runnable YAML files. Phase 4 (execution) captures live output. Phase 5 (error docs) formats failures into patch-ready reports.

**Tech Stack:** Maestro CLI, Expo Router (React Native), YAML flow files, pnpm workspace commands, TypeScript

**Authority chain (read-only during this plan):**
- Flow authority: `docs/design/journey-catalog.yaml`
- Screen route/state authority: `docs/design/screen-specs/SCR-*.yaml`
- Required state checklist: `docs/design/state-matrix.yaml`
- Implementation status: `docs/quality/mobile-implementation-status-2026-04-05.md`
- Coverage backlog: `docs/quality/mobile-maestro-coverage-backlog-2026-04-04.md`
- Authoring rules: `docs/quality/mobile-maestro-authoring-rules.md`

**Authentication prerequisite:** Flows that require a logged-in user depend on `apps/mobile/maestro/flows/_support/login-customer.yaml` and `_support/login-tasker.yaml`. These support files are written in Task 6. They assume the test device has a pre-configured Facebook test account (or dev auth bypass) accessible via the `facebook-login-button`. Configure the test account before running Phase 4.

---

## Phase 1 — Pre-flight Code Fixes

Fix all TypeScript errors and missing testIDs so the build is green before authoring flows.

---

### Task 1: Fix 12 duplicate testID TypeScript errors

**Files to modify (fix each, no other changes):**
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx:78`
- `apps/mobile/src/app/(customer)/rebook.tsx:107`
- `apps/mobile/src/app/(customer)/tasks/new/location.tsx:79`
- `apps/mobile/src/app/(customer)/tasks/new/photos.tsx:74`
- `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx:185`
- `apps/mobile/src/app/(shared)/profile/edit.tsx:66`
- `apps/mobile/src/app/(tabs)/profile.tsx:52`
- `apps/mobile/src/app/(tasker)/credits/pay.tsx:32`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx:56`
- `apps/mobile/src/app/(tasker)/profile/polish.tsx:206`
- `apps/mobile/src/app/(tasker)/verification/approved.tsx:17`
- `apps/mobile/src/app/(tasker)/verification/submitted.tsx:17`

- [ ] **Step 1: Verify baseline failures**
  ```bash
  pnpm --filter @tasky/mobile typecheck 2>&1 | grep "duplicate"
  ```
  Expected: 12 errors like `JSX elements cannot have multiple attributes with the same name: 'testID'`

- [ ] **Step 2: Fix each file — keep `SCR-*` testID, remove the legacy ad-hoc one**

  Pattern to apply in every affected file: find the root component (`ScreenContainer`, `DetailTemplate`, `SuccessCelebrationTemplate`, or `FormWizardTemplate`) that has two `testID` props. Delete the one that is NOT the `SCR-*` identifier.

  Example — before (duplicate):
  ```tsx
  <ScreenContainer testID="SCR-CUST-024" testID="dispute-screen">
  ```
  Example — after (keep SCR-*):
  ```tsx
  <ScreenContainer testID="SCR-CUST-024">
  ```

  Apply this pattern to each of the 12 files at the line numbers listed. Do not change anything else in the files.

- [ ] **Step 3: Verify all errors resolved**
  ```bash
  pnpm --filter @tasky/mobile typecheck
  ```
  Expected: 0 errors. If any remain, re-read the failing file and look for a second `testID=` on the same opening JSX tag.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/app
  git commit -m "fix(mobile): remove duplicate testID props — keep SCR-* identifiers"
  ```

---

### Task 2: Add missing SCR testIDs to three infra screens

**Files to modify:**
- `apps/mobile/src/app/(shared)/network-error.tsx`
- `apps/mobile/src/app/(shared)/app-update.tsx`
- `apps/mobile/src/app/(shared)/session-expired.tsx`

These three screens have substantive implementations but were missed by the earlier testID injection script. They currently use ad-hoc testIDs (`network-error-screen`, `app-update-screen`, `session-expired-screen`) on inner elements. Add the SCR-* testID to the root container of each.

- [ ] **Step 1: Edit `network-error.tsx`**

  Find the root container/template component (e.g. `<View>`, `<ScreenContainer>`, or similar) at the top of the render tree. Add `testID="SCR-INFRA-001"` to it. The existing `testID="network-error-screen"` on inner elements should remain — only add the SCR-* id to the root.

  Result: root element has `testID="SCR-INFRA-001"`.

- [ ] **Step 2: Edit `app-update.tsx`**

  Same pattern: add `testID="SCR-INFRA-002"` to the root container.
  Result: root element has `testID="SCR-INFRA-002"`.

- [ ] **Step 3: Edit `session-expired.tsx`**

  Add `testID="SCR-INFRA-003"` to the root container.
  Result: root element has `testID="SCR-INFRA-003"`.

- [ ] **Step 4: Verify no new type errors**
  ```bash
  pnpm --filter @tasky/mobile typecheck
  ```
  Expected: 0 errors.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/app/(shared)/network-error.tsx \
          apps/mobile/src/app/(shared)/app-update.tsx \
          apps/mobile/src/app/(shared)/session-expired.tsx
  git commit -m "fix(mobile): add SCR-INFRA-001/002/003 testIDs to infra screens"
  ```

---

### Task 3: Verify build gate before proceeding

- [ ] **Step 1: Full typecheck**
  ```bash
  pnpm --filter @tasky/mobile typecheck
  ```
  Expected: exit code 0, no errors.

- [ ] **Step 2: Lint**
  ```bash
  pnpm --filter @tasky/mobile lint
  ```
  Expected: 0 errors (warnings are acceptable).

  If either command fails, do NOT proceed to Phase 2. Fix the reported errors first.

---

## Phase 2 — Derived Doc Alignment

Repair `screen-inventory.yaml` and `state-matrix.yaml` to match the canonical `screen-specs/SCR-*.yaml` sources. These docs are read by other agents; keeping them accurate prevents drift.

**Note:** Only fix the known documented mismatches. Do not add new screens or states beyond what the canonical sources contain. The authority for what is correct is always `docs/design/screen-specs/SCR-*.yaml`.

---

### Task 4: Repair `screen-inventory.yaml` — 3 known state mismatches

The authority audit identified 3 state mismatches between `screen-inventory.yaml` and the screen specs:
- SCR-SHARED-001 (Splash): states in inventory don't match screen spec
- SCR-CUST-006 (Schedule & Budget): states mismatch
- SCR-CUST-007 (Review & Submit): states mismatch

**File:** `docs/design/screen-inventory.yaml`

- [ ] **Step 1: Read canonical sources for the 3 screens**
  ```bash
  cat docs/design/screen-specs/SCR-SHARED-001.yaml
  cat docs/design/screen-specs/SCR-CUST-006.yaml
  cat docs/design/screen-specs/SCR-CUST-007.yaml
  ```
  Note the exact `states:` list in each spec.

- [ ] **Step 2: Read the current inventory entries for these 3 screens**
  ```bash
  grep -A 10 "SCR-SHARED-001" docs/design/screen-inventory.yaml
  grep -A 10 "SCR-CUST-006" docs/design/screen-inventory.yaml
  grep -A 10 "SCR-CUST-007" docs/design/screen-inventory.yaml
  ```

- [ ] **Step 3: For each screen, update the `states:` block in `screen-inventory.yaml` to exactly match the spec**

  Apply edits one screen at a time. The states list in `screen-inventory.yaml` must be an exact subset/match of what `screen-specs/SCR-*.yaml` declares. Do not invent new states.

- [ ] **Step 4: Verify no YAML syntax errors**
  ```bash
  python3 -c "import yaml; yaml.safe_load(open('docs/design/screen-inventory.yaml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 5: Commit**
  ```bash
  git add docs/design/screen-inventory.yaml
  git commit -m "fix(docs): repair 3 state mismatches in screen-inventory.yaml"
  ```

---

### Task 5: Repair `state-matrix.yaml` — align with screen-inventory

The state-matrix should reflect the same states as the inventory. After Task 4, re-verify alignment.

**File:** `docs/design/state-matrix.yaml`

- [ ] **Step 1: Check for mismatches against updated inventory**
  ```bash
  python3 tooling/scripts/validate-migrations.py 2>&1 || true
  ```
  If there is a doc parity validation script, run it. If not, manually compare `state-matrix.yaml` rows for SCR-SHARED-001, SCR-CUST-006, SCR-CUST-007 against the now-fixed inventory.

- [ ] **Step 2: Update `state-matrix.yaml` rows to match**

  Each row in the matrix has the format:
  ```yaml
  - id: SCR-SHARED-001
    states: [state_a, state_b]
  ```
  Update only the rows for the 3 screens repaired in Task 4.

- [ ] **Step 3: Verify YAML syntax**
  ```bash
  python3 -c "import yaml; yaml.safe_load(open('docs/design/state-matrix.yaml'))" && echo "YAML OK"
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add docs/design/state-matrix.yaml
  git commit -m "fix(docs): align state-matrix.yaml with repaired screen-inventory"
  ```

---

## Phase 3 — Maestro Support Infrastructure

Create reusable support files before writing journey flows.

---

### Task 6: Create Maestro support flows

**Files to create:**
- `apps/mobile/maestro/flows/_support/login-customer.yaml`
- `apps/mobile/maestro/flows/_support/login-tasker.yaml`
- `apps/mobile/maestro/flows/_support/assert-tab-bar.yaml`

These are included by journey flows via `- runFlow: path` syntax.

- [ ] **Step 1: Create `_support/login-customer.yaml`**

  ```yaml
  # _support/login-customer.yaml
  # Precondition: App is launched and at login screen (SCR-SHARED-002)
  # Postcondition: User is logged in as Customer and on customer task list (SCR-CUST-001)
  # Requires: Test device configured with a Facebook test account that has customer role

  - assertVisible:
      id: "SCR-SHARED-002"
  - tapOn:
      id: "facebook-login-button"
  # Facebook OAuth opens — wait for return to app
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 30000
  ```

- [ ] **Step 2: Create `_support/login-tasker.yaml`**

  ```yaml
  # _support/login-tasker.yaml
  # Precondition: App is launched and at login screen (SCR-SHARED-002)
  # Postcondition: User is logged in as Tasker and on tasker feed (SCR-TASK-001)
  # Requires: Test device configured with a Facebook test account that has tasker role

  - assertVisible:
      id: "SCR-SHARED-002"
  - tapOn:
      id: "facebook-login-button"
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-001"
      timeout: 30000
  ```

- [ ] **Step 3: Create `_support/assert-tab-bar.yaml`**

  ```yaml
  # _support/assert-tab-bar.yaml
  # Asserts the main tab bar is visible — used as sanity check after login

  - assertVisible:
      id: "SCR-SHARED-012"
  ```

- [ ] **Step 4: Verify directory exists**
  ```bash
  ls apps/mobile/maestro/flows/_support/
  ```
  Expected: three files listed.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/maestro/flows/_support/
  git commit -m "feat(maestro): add login and assert support flows"
  ```

---

## Phase 4 — P0 Journey Flow Authoring

Implement all 13 journeys where every screen is ✅ ready. Replace all `# TODO` stubs with real interactions.

---

### Task 7: Complete JRN-SHARED-01 — First Launch & Onboarding

**File:** `apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml`

The flow already exists with partial implementation. Fix the permission steps to use system dialog handling correctly, and assert the correct home screen testID.

- [ ] **Step 1: Overwrite file with complete implementation**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-01: First Launch & Onboarding
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-001 (splash), SCR-SHARED-005 (onboarding),
  #   SCR-SHARED-006 (role select), SCR-SHARED-007/008/009 (permissions)
  # Actor: new user (no role yet)
  # Flow type: happy path

  - launchApp:
      clearState: true

  # Splash → Onboarding carousel
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-005"
      timeout: 10000

  # Swipe through 3 slides using Next button
  - tapOn:
      id: "onboarding-next"
  - tapOn:
      id: "onboarding-next"
  # Third slide: Get Started button
  - tapOn: "Get Started"

  # Role selection screen
  - assertVisible:
      id: "SCR-SHARED-006"
  - tapOn:
      id: "role-card-customer"
  - tapOn:
      id: "role-confirm-button"

  # Camera permission system dialog
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-007"
      timeout: 5000
  - tapOn:
      id: "permission-allow-button"

  # Location permission system dialog
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-008"
      timeout: 5000
  - tapOn:
      id: "permission-allow-button"

  # Notification permission system dialog
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-009"
      timeout: 5000
  - tapOn:
      id: "permission-allow-button"

  # Login screen (fresh state — user must log in after onboarding)
  - assertVisible:
      id: "SCR-SHARED-002"
  ```

  **Note on permissions:** The permission screens (SCR-SHARED-007/008/009) are Expo wrapper screens, not OS system dialogs. Check the actual testID on the "Allow" button in those files; if it differs from `permission-allow-button`, update accordingly. If the OS dialog appears instead, replace `- tapOn: id: "..."` with `- tapOn: "Allow"` (text match).

- [ ] **Step 2: Validate YAML syntax**
  ```bash
  maestro test apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml --dry-run 2>&1 || true
  ```
  Expected: no YAML parse errors (runtime failures are acceptable at this stage).

- [ ] **Step 3: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml
  git commit -m "feat(maestro): complete JRN-SHARED-01 onboarding flow"
  ```

---

### Task 8: Write JRN-SHARED-03 — Phase 2 OTP Login

**File:** `apps/mobile/maestro/flows/JRN-SHARED-03-phase-2-otp-login-new-user.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-03: Phase 2 OTP Login (New User)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-002 (login), SCR-SHARED-003 (OTP verify)
  # Actor: new or returning user with phone number
  # Flow type: happy path
  # Phase gate: Phase 2 (OTP auth)

  - launchApp:
      clearState: true

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-002"
      timeout: 10000

  # Switch to OTP tab / phone entry if visible
  # (Phase 2 adds OTP option alongside Facebook)
  - tapOn: "Утасны дугаар"  # "Phone Number" in Mongolian — or the OTP tab label

  - assertVisible:
      id: "SCR-SHARED-003"

  # Enter test phone number
  - tapOn:
      id: "otp-phone-input"
  - inputText: "+97699000001"
  - tapOn:
      id: "otp-send-button"

  # OTP code entry — use a test code seeded in the backend
  - extendedWaitUntil:
      visible:
        id: "otp-code-input"
      timeout: 5000
  - tapOn:
      id: "otp-code-input"
  - inputText: "000000"
  - tapOn:
      id: "otp-verify-button"

  # Success — reach home screen
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 15000
  ```

  **Note:** The exact testIDs on OTP inputs (`otp-phone-input`, `otp-send-button`, `otp-code-input`, `otp-verify-button`) must match what is in `app/(auth)/otp.tsx`. Read that file if they differ. The test phone number and code must be configured in the backend test environment.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-SHARED-03-phase-2-otp-login-new-user.yaml
  git commit -m "feat(maestro): write JRN-SHARED-03 OTP login flow"
  ```

---

### Task 9: Write JRN-SHARED-07 — Review Submission

**File:** `apps/mobile/maestro/flows/JRN-SHARED-07-review-submission.yaml`

Precondition: a completed booking exists with `bookingId` available to navigate to the review screen.

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-07: Review Submission
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-017 (review form)
  # Actor: customer (post-booking)
  # Flow type: happy path
  # Precondition: Logged in as customer; completed booking exists

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Navigate to bookings list
  - tapOn:
      id: "tab-bookings"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-016"
      timeout: 5000

  # Tap first completed booking
  - tapOn:
      id: "booking-card-completed"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-017"
      timeout: 5000

  # Tap 'Leave a review' link
  - tapOn:
      id: "booking-detail-screen-review-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-017"
      timeout: 5000

  # Rate 5 stars
  - tapOn:
      id: "review-star-5"

  # Write comment
  - tapOn:
      id: "review-comment-input"
  - inputText: "Маш сайн ажиллав. Цаг баримталсан."

  # Submit
  - tapOn:
      id: "review-submit-button"

  # Confirm we returned to booking detail or task list
  - extendedWaitUntil:
      anyOf:
        - visible:
            id: "SCR-CUST-017"
        - visible:
            id: "SCR-CUST-001"
      timeout: 5000
  ```

  **Note:** `tab-bookings`, `booking-card-completed`, `review-star-5`, `review-comment-input`, `review-submit-button` testIDs must be verified in the actual component files. Update if they differ.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-SHARED-07-review-submission.yaml
  git commit -m "feat(maestro): write JRN-SHARED-07 review submission flow"
  ```

---

### Task 10: Write JRN-CUST-02 — Review Applicants & Confirm Booking (Phase 0-1)

**File:** `apps/mobile/maestro/flows/JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-02: Review Applicants & Confirm Booking (Phase 0-1)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-009, SCR-CUST-011, SCR-CUST-013, SCR-CUST-014, SCR-CUST-015
  # Actor: customer
  # Flow type: happy path
  # Precondition: Logged in as customer; posted task has at least 1 applicant

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Customer home → open a task with applicants
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000
  - tapOn:
      id: "my-tasks-feed"

  # Task detail
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-009"
      timeout: 5000

  # Tap 'View Applicants'
  - tapOn:
      id: "task-detail-view-applicants"

  # Applicants list
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-011"
      timeout: 5000

  # Tap first applicant card to see public profile
  - tapOn:
      id: "applicant-card-0"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-013"
      timeout: 5000

  # Go back to applicants list
  - tapOn:
      id: "applicants-list-back"

  - assertVisible:
      id: "SCR-CUST-011"

  # Accept the applicant
  - tapOn:
      id: "applicant-card-0"
  - tapOn:
      id: "applicant-accept-sheet"
  - tapOn:
      id: "applicant-accept-sheet-confirm"

  # Booking confirmation screen
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-014"
      timeout: 5000

  # Confirm
  - tapOn:
      id: "booking-confirm-cta"

  # Booking confirmed screen
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-015"
      timeout: 5000

  - assertVisible:
      id: "booking-confirmed-screen-cta"
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml"
  git commit -m "feat(maestro): write JRN-CUST-02 applicants & confirm flow"
  ```

---

### Task 11: Write JRN-CUST-04 — Manage Active Booking (Customer)

**File:** `apps/mobile/maestro/flows/JRN-CUST-04-manage-active-booking.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-04: Manage Active Booking (Customer)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-016, SCR-CUST-017, SCR-CUST-019
  # Actor: customer
  # Flow type: happy path
  # Precondition: Logged in as customer; active (assigned) booking exists

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Navigate to Bookings tab
  - tapOn:
      id: "tab-bookings"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-016"
      timeout: 5000

  # Open active booking
  - tapOn:
      id: "booking-card-active"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-017"
      timeout: 5000

  # Verify key elements on booking detail
  - assertVisible:
      id: "booking-detail-screen-tasker-card"
  - assertVisible:
      id: "booking-detail-screen-timeline-link"

  # Open timeline view
  - tapOn:
      id: "booking-detail-screen-timeline-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-019"
      timeout: 5000

  # Go back to booking detail
  - tapOn: "Back"

  - assertVisible:
      id: "SCR-CUST-017"
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-CUST-04-manage-active-booking.yaml
  git commit -m "feat(maestro): write JRN-CUST-04 manage active booking flow"
  ```

---

### Task 12: Write JRN-CUST-05 — Rebook Tasker

**File:** `apps/mobile/maestro/flows/JRN-CUST-05-rebook-tasker.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-05: Rebook Tasker
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-017, SCR-CUST-023, SCR-CUST-015
  # Actor: customer
  # Flow type: happy path
  # Precondition: Logged in as customer; completed booking with same tasker exists

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Navigate to completed booking
  - tapOn:
      id: "tab-bookings"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-016"
      timeout: 5000

  - tapOn:
      id: "booking-card-completed"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-017"
      timeout: 5000

  # Tap 'Rebook' action
  - tapOn:
      id: "booking-detail-rebook-button"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-023"
      timeout: 5000

  # Set date and budget
  - tapOn:
      id: "rebook-screen-date-picker"
  - inputText: "2026.05.01 10:00"

  - tapOn:
      id: "rebook-screen-budget"
  - clearText
  - inputText: "50000"

  # Confirm rebook
  - tapOn:
      id: "rebook-confirm-button"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-015"
      timeout: 10000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-CUST-05-rebook-tasker.yaml
  git commit -m "feat(maestro): write JRN-CUST-05 rebook tasker flow"
  ```

---

### Task 13: Write JRN-CUST-07 — Cancel Open Task

**File:** `apps/mobile/maestro/flows/JRN-CUST-07-cancel-open-task.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-07: Cancel Open Task
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-009 (task detail), cancel sheet
  # Actor: customer
  # Flow type: happy path
  # Precondition: Logged in as customer; open task (no applicants) exists

  - launchApp

  - runFlow: _support/login-customer.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000

  # Tap open task
  - tapOn:
      id: "my-tasks-feed"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-009"
      timeout: 5000

  # Open cancel sheet
  - tapOn:
      id: "task-detail-cancel-button"

  # TaskCancelSheet — confirm cancellation
  - extendedWaitUntil:
      visible:
        id: "task-cancel-sheet"
      timeout: 3000
  - tapOn:
      id: "task-cancel-confirm"

  # Return to task list with task removed or marked cancelled
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000
  ```

  **Note:** `task-detail-cancel-button`, `task-cancel-sheet`, `task-cancel-confirm` must match testIDs in `app/(customer)/tasks/[taskId]/index.tsx` and `features/tasks/components/TaskCancelSheet.tsx`.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-CUST-07-cancel-open-task.yaml
  git commit -m "feat(maestro): write JRN-CUST-07 cancel open task flow"
  ```

---

### Task 14: Write JRN-CUST-08 — Instant Match (Phase 3)

**File:** `apps/mobile/maestro/flows/JRN-CUST-08-instant-match-phase-3.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-08: Instant Match (Phase 3)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-027 / SCR-P3-005 (instant match modal)
  # Actor: customer
  # Flow type: happy path
  # Phase gate: Phase 3
  # Precondition: Logged in as customer; task has instant match option enabled

  - launchApp

  - runFlow: _support/login-customer.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000

  # Open a task that supports instant match
  - tapOn:
      id: "my-tasks-feed"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-009"
      timeout: 5000

  # Tap 'Instant Match' button on task detail
  - tapOn:
      id: "task-detail-instant-match-button"

  # Instant match modal appears
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-027"
      timeout: 5000

  # Confirm instant match
  - tapOn:
      id: "instant-match-confirm-button"

  # Success — booking confirmed
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-015"
      timeout: 10000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-CUST-08-instant-match-phase-3.yaml
  git commit -m "feat(maestro): write JRN-CUST-08 instant match flow"
  ```

---

### Task 15: Write JRN-TASK-03 — Lead Unlock Accept/Decline (Phase 2)

**File:** `apps/mobile/maestro/flows/JRN-TASK-03-lead-unlock-accept-decline-phase-2.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-03: Lead Unlock Accept/Decline (Phase 2)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-TASK-013 (tasker booking detail), LeadUnlockSheet
  # Actor: tasker
  # Flow type: happy path
  # Phase gate: Phase 2
  # Precondition: Logged in as tasker; booking with unlock prompt available

  - launchApp

  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-012"
      timeout: 5000

  # Open booking requiring lead unlock
  - tapOn:
      id: "job-card-pending-unlock"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-013"
      timeout: 5000

  # Lead unlock sheet appears
  - extendedWaitUntil:
      visible:
        id: "lead-unlock-sheet"
      timeout: 3000

  # Accept unlock (spend credits)
  - tapOn:
      id: "lead-unlock-accept"

  # Confirm decision
  - extendedWaitUntil:
      anyOf:
        - visible:
            id: "SCR-TASK-013"
        - visible:
            id: "lead-unlock-success"
      timeout: 5000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-03-lead-unlock-accept-decline-phase-2.yaml
  git commit -m "feat(maestro): write JRN-TASK-03 lead unlock flow"
  ```

---

### Task 16: Write JRN-TASK-04 — Manage Active Booking (Tasker)

**File:** `apps/mobile/maestro/flows/JRN-TASK-04-manage-active-booking-tasker.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-04: Manage Active Booking (Tasker)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-TASK-012, SCR-TASK-013
  # Actor: tasker
  # Flow type: happy path
  # Precondition: Logged in as tasker; assigned booking exists

  - launchApp

  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-012"
      timeout: 5000

  # Filter to active jobs
  - tapOn:
      id: "my-jobs-filter-bar"

  # Open active job
  - tapOn:
      id: "job-card-active"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-013"
      timeout: 5000

  # Verify key elements
  - assertVisible:
      id: "booking-detail-tasker-cancel"

  # Mark job as done
  - tapOn:
      id: "booking-detail-mark-done"

  # Confirm completion
  - extendedWaitUntil:
      visible:
        id: "booking-detail-confirm-completion-sheet"
      timeout: 3000
  - tapOn:
      id: "booking-detail-confirm-done"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-012"
      timeout: 5000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-04-manage-active-booking-tasker.yaml
  git commit -m "feat(maestro): write JRN-TASK-04 tasker manage booking flow"
  ```

---

### Task 17: Write JRN-TASK-05 — Credit Purchase (Phase 2)

**File:** `apps/mobile/maestro/flows/JRN-TASK-05-credit-purchase.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-05: Credit Purchase
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-P2-001 (credits balance), SCR-P2-002 (QPay payment)
  # Actor: tasker
  # Flow type: happy path
  # Phase gate: Phase 2
  # Precondition: Logged in as tasker

  - launchApp

  - runFlow: _support/login-tasker.yaml

  # Navigate to Credits via profile or tab
  - extendedWaitUntil:
      visible:
        id: "SCR-P2-001"
      timeout: 5000

  # Verify balance screen
  - assertVisible:
      id: "tasker-credits-topup-secondary"

  # Tap to top up
  - tapOn:
      id: "tasker-credits-topup-secondary"

  # Payment screen
  - extendedWaitUntil:
      visible:
        id: "SCR-P2-002"
      timeout: 5000

  # QPay QR code or pack selection visible
  - assertVisible:
      id: "credits-pack-selection"

  # Select first pack
  - tapOn:
      id: "credits-pack-0"

  # Initiate payment
  - tapOn:
      id: "credits-pay-button"

  # Wait for payment confirmation (QPay returns async)
  - extendedWaitUntil:
      visible:
        id: "SCR-P2-001"
      timeout: 30000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-05-credit-purchase.yaml
  git commit -m "feat(maestro): write JRN-TASK-05 credit purchase flow"
  ```

---

### Task 18: Write JRN-TASK-07 — Tasker Pro Subscription (Phase 3)

**File:** `apps/mobile/maestro/flows/JRN-TASK-07-tasker-pro-subscription-phase-3.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-07: Tasker Pro Subscription (Phase 3)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-P3-004 (subscription), subscription confirm sheet
  # Actor: tasker
  # Flow type: happy path
  # Phase gate: Phase 3
  # Precondition: Logged in as tasker; eligible for subscription (not already subscribed)

  - launchApp

  - runFlow: _support/login-tasker.yaml

  # Navigate to subscription screen (likely from profile or settings)
  - extendedWaitUntil:
      visible:
        id: "SCR-P3-004"
      timeout: 5000

  - assertVisible:
      id: "subscription-screen-cta"

  # Tap subscribe
  - tapOn:
      id: "subscription-screen-cta"

  # Confirmation sheet
  - extendedWaitUntil:
      visible:
        id: "subscription-confirm-sheet"
      timeout: 3000

  - tapOn:
      id: "subscription-confirm"

  # Subscribed state — screen updates
  - extendedWaitUntil:
      visible:
        id: "SCR-P3-004"
      timeout: 10000

  # The locked indicator should be gone
  - assertNotVisible:
      id: "subscription-screen-locked"
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-07-tasker-pro-subscription-phase-3.yaml
  git commit -m "feat(maestro): write JRN-TASK-07 subscription flow"
  ```

---

### Task 19: Write JRN-INFRA-02 — Suspended / Banned Account

**File:** `apps/mobile/maestro/flows/JRN-INFRA-02-suspended-banned-account.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-INFRA-02: Suspended / Banned Account
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-020 (suspended), SCR-SHARED-021 (banned)
  # Actor: customer or tasker
  # Flow type: blocker surface
  # Precondition: Test account that is suspended exists; separate test account that is banned exists

  # --- Part A: Suspended ---
  - launchApp:
      clearState: true

  - runFlow: _support/login-customer.yaml
  # Assumes login-customer.yaml uses the suspended test account

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-020"
      timeout: 10000

  - assertVisible:
      id: "suspended-appeal-button"
  - assertVisible:
      id: "suspended-logout-button"

  # Tap logout
  - tapOn:
      id: "suspended-logout-button"

  # Return to login screen
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-002"
      timeout: 5000

  # --- Part B: Banned (separate launch) ---
  - launchApp:
      clearState: true

  # Use banned test account
  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-002"
      timeout: 5000
  - tapOn:
      id: "facebook-login-button"
  # Assumes banned account logs in and is redirected to banned screen

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-021"
      timeout: 15000

  - assertVisible:
      id: "banned-support-button"
  - assertVisible:
      id: "banned-logout-button"
  ```

  **Note:** This flow requires two separate test accounts — one suspended, one banned. Configure in test environment before running.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-INFRA-02-suspended-banned-account.yaml
  git commit -m "feat(maestro): write JRN-INFRA-02 suspended/banned account flow"
  ```

---

## Phase 5 — P1 Journey Flow Authoring

Implement 11 journeys that are partially implemented (⚠️). Target the happy path only; document any step that hits a known TODO as a `# NOTE` comment rather than skipping it.

---

### Task 20: Write JRN-SHARED-04 — Messaging (happy path)

**File:** `apps/mobile/maestro/flows/JRN-SHARED-04-messaging.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-04: Messaging
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-010 (inbox list), SCR-SHARED-011 (chat detail)
  # Actor: customer or tasker
  # Flow type: happy path
  # Precondition: Logged in; at least one conversation exists

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Navigate to Inbox tab
  - tapOn:
      id: "tab-inbox"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-010"
      timeout: 5000

  # Open first conversation
  - tapOn:
      id: "conversation-card-0"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-011"
      timeout: 5000

  # Send a message
  - tapOn:
      id: "chat-message-input"
  - inputText: "Сайн байна уу? Захиалга баталгаажих уу?"
  - tapOn:
      id: "chat-send-button"

  # Message visible in thread
  - extendedWaitUntil:
      visible: "Сайн байна уу?"
      timeout: 5000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-SHARED-04-messaging.yaml
  git commit -m "feat(maestro): write JRN-SHARED-04 messaging happy path flow"
  ```

---

### Task 21: Write JRN-SHARED-05 — Profile Management

**File:** `apps/mobile/maestro/flows/JRN-SHARED-05-profile-management.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-05: Profile Management
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-012 (profile), SCR-SHARED-013 (profile edit)
  # Actor: customer or tasker
  # Flow type: happy path
  # Note: profile/edit.tsx has TODO markers; test navigation only, not deep form validation

  - launchApp

  - runFlow: _support/login-customer.yaml

  # Navigate to Profile tab
  - tapOn:
      id: "tab-profile"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-012"
      timeout: 5000

  # Tap Edit Profile
  - tapOn:
      id: "profile-edit-button"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-013"
      timeout: 5000

  # Go back without saving
  - tapOn: "Back"

  - assertVisible:
      id: "SCR-SHARED-012"
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-SHARED-05-profile-management.yaml
  git commit -m "feat(maestro): write JRN-SHARED-05 profile management flow"
  ```

---

### Task 22: Write JRN-SHARED-06 — Settings & Account

**File:** `apps/mobile/maestro/flows/JRN-SHARED-06-settings-&-account.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-SHARED-06: Settings & Account
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-SHARED-014 (settings)
  # Actor: customer or tasker
  # Flow type: happy path
  # Note: profile/delete.tsx has TODOs; navigate to settings only

  - launchApp

  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "tab-profile"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-012"
      timeout: 5000

  - tapOn:
      id: "profile-settings-button"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-014"
      timeout: 5000

  - assertVisible:
      id: "settings-screen"
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-SHARED-06-settings-&-account.yaml"
  git commit -m "feat(maestro): write JRN-SHARED-06 settings flow"
  ```

---

### Task 23: Write JRN-CUST-01 — Post a Task (wizard happy path)

**File:** `apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-01: Post a Task
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-001..008 (full wizard)
  # Actor: customer
  # Flow type: happy path
  # Note: category/intake/location/schedule have TODOs but happy path navigation works

  - launchApp

  - runFlow: _support/login-customer.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000

  # Tap FAB to post new task
  - tapOn:
      id: "my-tasks-fab"

  # Step 1: Category selection
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-002"
      timeout: 5000

  # Tap first category card in grid
  - tapOn:
      id: "category-selection-grid"

  # Step 2: Intake form
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-003"
      timeout: 5000

  - tapOn:
      id: "intake-description-input"
  - inputText: "Гэрийн цэвэрлэгээ хэрэгтэй байна. 3 өрөө байшин."

  - tapOn:
      id: "intake-next-button"

  # Step 3: Photo upload (skip — tap next/continue)
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-004"
      timeout: 5000

  - tapOn:
      id: "photo-upload-next-button"

  # Step 4: Location pin
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-005"
      timeout: 5000

  # Accept current location or use default
  - tapOn:
      id: "location-use-current"

  - tapOn:
      id: "location-next-button"

  # Step 5: Schedule & budget
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-006"
      timeout: 5000

  - tapOn:
      id: "schedule-budget-input"
  - clearText
  - inputText: "50000"

  - tapOn:
      id: "schedule-next-button"

  # Step 6: Review & submit
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-007"
      timeout: 5000

  - assertVisible:
      id: "review-submit-screen"

  - tapOn:
      id: "review-submit-button"

  # Step 7: Success
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-008"
      timeout: 10000

  - tapOn:
      id: "task-posted-success-screen-done"

  - assertVisible:
      id: "SCR-CUST-001"
  ```

  **Note:** `intake-next-button`, `photo-upload-next-button`, `location-use-current`, `location-next-button`, `schedule-next-button`, `review-submit-button` must be verified against actual testIDs. Update if they differ.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml
  git commit -m "feat(maestro): write JRN-CUST-01 post a task wizard flow"
  ```

---

### Task 24: Write JRN-CUST-06 — Raise & Track Dispute

**File:** `apps/mobile/maestro/flows/JRN-CUST-06-raise-&-track-dispute.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-06: Raise & Track Dispute
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-024 (raise dispute), SCR-CUST-025 (dispute detail)
  # Actor: customer
  # Flow type: happy path
  # Note: dispute.tsx has TODOs; navigate to dispute screens and assert visibility

  - launchApp

  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "tab-bookings"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-016"
      timeout: 5000

  # Open a booking eligible for dispute
  - tapOn:
      id: "booking-card-active"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-017"
      timeout: 5000

  - tapOn:
      id: "booking-detail-screen-report-issue-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-024"
      timeout: 5000

  # Select dispute reason
  - tapOn:
      id: "dispute-reason-option-0"

  # Submit dispute
  - tapOn:
      id: "dispute-submit-button"

  # Dispute detail / tracking screen
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-025"
      timeout: 10000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-CUST-06-raise-&-track-dispute.yaml"
  git commit -m "feat(maestro): write JRN-CUST-06 raise dispute flow"
  ```

---

### Task 25: Write JRN-TASK-01 — Tasker Verification Funnel

**File:** `apps/mobile/maestro/flows/JRN-TASK-01-tasker-verification.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-01: Tasker Verification
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-TASK-003, SCR-TASK-004, SCR-TASK-005, SCR-TASK-010
  # Actor: tasker (unverified)
  # Flow type: happy path
  # Note: upload.tsx has TODOs; navigate through screens without actual file upload

  - launchApp

  - runFlow: _support/login-tasker.yaml

  # Verification gate appears when unverified tasker taps Apply
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-001"
      timeout: 5000

  - tapOn:
      id: "task-feed"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-002"
      timeout: 5000

  # Apply — triggers verification gate
  - tapOn:
      id: "task-detail-apply-button"

  # Verification gate screen
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-003"
      timeout: 5000

  - tapOn:
      id: "verification-gate-start-button"

  # Consent screen
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-004"
      timeout: 5000

  - assertVisible:
      id: "consent-screen-cta"
  - tapOn:
      id: "consent-screen-cta"

  # Upload screen
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-005"
      timeout: 5000

  # Tap upload ID front (system picker opens — dismiss or mock)
  - tapOn:
      id: "upload-id-front-button"
  # NOTE: File picker opens; Maestro cannot select files from gallery without OS interaction.
  # If this step fails, document as KNOWN-LIMITATION: file picker requires device setup.

  # Navigate to submitted state if picker is skippable
  - tapOn:
      id: "upload-submit-button"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-010"
      timeout: 10000

  - assertVisible:
      id: "SCR-TASK-010"
  ```

  **Note on file upload:** Maestro cannot natively select files from the OS gallery. This step will likely fail in CI without additional Maestro device setup (e.g., `copyTextToClipboard` + app deep link). Document this as a known limitation if it fails.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-01-tasker-verification.yaml
  git commit -m "feat(maestro): write JRN-TASK-01 verification funnel flow"
  ```

---

### Task 26: Write JRN-TASK-02 — Browse & Apply to Task

**File:** `apps/mobile/maestro/flows/JRN-TASK-02-browse-&-apply-to-task.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-02: Browse & Apply to Task
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-TASK-001 (feed), SCR-TASK-002 (task detail)
  # Actor: tasker (verified)
  # Flow type: happy path

  - launchApp

  - runFlow: _support/login-tasker.yaml

  # Tasker feed
  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-001"
      timeout: 5000

  # Use filter
  - tapOn:
      id: "task-feed-filter-bar"

  # Tap first task card
  - tapOn:
      id: "task-feed"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-002"
      timeout: 5000

  - assertVisible:
      id: "task-detail-photos"

  # Apply to task
  - tapOn:
      id: "task-detail-apply-button"

  # Success state — application sent
  - extendedWaitUntil:
      visible:
        id: "application-sent-success"
      timeout: 10000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-TASK-02-browse-&-apply-to-task.yaml"
  git commit -m "feat(maestro): write JRN-TASK-02 browse and apply flow"
  ```

---

### Task 27: Write JRN-TASK-06 — Wallet & Payout (Phase 3)

**File:** `apps/mobile/maestro/flows/JRN-TASK-06-wallet-&-payout-phase-3.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-06: Wallet & Payout (Phase 3)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-P3-001 (wallet balance)
  # Note: SCR-P3-002 (payout) has TODOs — navigate to wallet only
  # Actor: tasker
  # Flow type: happy path (wallet view only)

  - launchApp

  - runFlow: _support/login-tasker.yaml

  # Navigate to wallet (from profile or tab)
  - extendedWaitUntil:
      visible:
        id: "SCR-P3-001"
      timeout: 5000

  # Verify wallet screen loaded
  - assertVisible:
      id: "SCR-P3-001"
  # NOTE: payout form has TODOs — not tested in this flow
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-TASK-06-wallet-&-payout-phase-3.yaml"
  git commit -m "feat(maestro): write JRN-TASK-06 wallet view flow"
  ```

---

### Task 28: Write JRN-TASK-08 — AI Profile Polish

**File:** `apps/mobile/maestro/flows/JRN-TASK-08-ai-profile-polish.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-TASK-08: AI Profile Polish
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-TASK-019 (profile polish)
  # Actor: tasker
  # Flow type: happy path (entry screen only — AI generation has TODOs)

  - launchApp

  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-019"
      timeout: 5000

  - assertVisible:
      id: "SCR-TASK-019"
  # NOTE: AI profile generation flow has TODOs — not tested beyond screen arrival
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-TASK-08-ai-profile-polish.yaml
  git commit -m "feat(maestro): write JRN-TASK-08 profile polish entry flow"
  ```

---

### Task 29: Write JRN-INFRA-01 — Error Recovery

**File:** `apps/mobile/maestro/flows/JRN-INFRA-01-error-recovery.yaml`

This flow requires the SCR testIDs added in Task 2.

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-INFRA-01: Error Recovery
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-INFRA-001 (network error), SCR-INFRA-003 (session expired)
  # Actor: any
  # Flow type: infrastructure blocker surface
  # Precondition: Test can trigger network error (e.g. airplane mode or backend unreachable)
  # Note: SCR testIDs added in Phase 1 Task 2

  # --- Part A: Network Error Screen ---
  - launchApp

  # Trigger network error by navigating when network is unavailable
  # (This requires the device to be in airplane mode or the API to be unreachable)
  - extendedWaitUntil:
      visible:
        id: "SCR-INFRA-001"
      timeout: 15000

  - assertVisible:
      id: "network-error-screen-retry"

  # Tap retry
  - tapOn:
      id: "network-error-screen-retry"

  # --- Part B: Session Expired ---
  # Trigger by invalidating token (backend-controlled test setup)
  - extendedWaitUntil:
      visible:
        id: "SCR-INFRA-003"
      timeout: 15000

  - assertVisible:
      id: "session-expired-screen"
  ```

  **Note:** Triggering these error states requires test infrastructure (airplane mode toggle or backend token invalidation). Document as INFRA-DEPENDENCY if they cannot be triggered in the test environment.

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/flows/JRN-INFRA-01-error-recovery.yaml
  git commit -m "feat(maestro): write JRN-INFRA-01 error recovery flow"
  ```

---

### Task 30: Write JRN-CUST-03 — Lead Unlock Confirm (Phase 2)

**File:** `apps/mobile/maestro/flows/JRN-CUST-03-review-applicants-&-confirm-booking-phase-2-—-lead-unlock.yaml`

- [ ] **Step 1: Overwrite file**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Journey JRN-CUST-03: Review Applicants & Confirm Booking (Phase 2 — Lead Unlock)
  # Source: docs/design/journey-catalog.yaml
  # Covered states: SCR-CUST-011 (applicants), LeadUnlockSheet (customer-side)
  # Actor: customer
  # Flow type: happy path
  # Phase gate: Phase 2
  # Precondition: Logged in as customer; task has applicants requiring lead unlock

  - launchApp

  - runFlow: _support/login-customer.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-001"
      timeout: 5000

  - tapOn:
      id: "my-tasks-feed"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-009"
      timeout: 5000

  - tapOn:
      id: "task-detail-view-applicants"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-011"
      timeout: 5000

  # Accept applicant — triggers LeadUnlockSheet
  - tapOn:
      id: "applicant-card-0"
  - tapOn:
      id: "applicant-accept-sheet"

  # Lead unlock sheet appears
  - extendedWaitUntil:
      visible:
        id: "lead-unlock-sheet"
      timeout: 3000
  - tapOn:
      id: "lead-unlock-accept"

  # Booking confirmation
  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-014"
      timeout: 5000
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add "apps/mobile/maestro/flows/JRN-CUST-03-review-applicants-&-confirm-booking-phase-2-—-lead-unlock.yaml"
  git commit -m "feat(maestro): write JRN-CUST-03 lead unlock confirm flow"
  ```

---

## Phase 6 — P2 Screen/State Smoke Flows

Individual screen smoke tests for screens not covered by any journey. One flow per screen; assert the screen testID is visible, then check one required state.

---

### Task 31: Write screen smoke flows — Shared & Infra utility screens

**Files to create:**
- `apps/mobile/maestro/flows/SCR-SHARED-016-notification-center.yaml`
- `apps/mobile/maestro/flows/SCR-INFRA-004-terms-of-service.yaml`
- `apps/mobile/maestro/flows/SCR-TASK-016-tasker-stats.yaml`
- `apps/mobile/maestro/flows/SCR-TASK-018-privacy-policy.yaml`

- [ ] **Step 1: Create `SCR-SHARED-016-notification-center.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-SHARED-016: Notification Center
  # Required states: loading_initial, empty, populated, loading_refresh, error_network
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "my-tasks-notifications"

  - extendedWaitUntil:
      visible:
        id: "SCR-SHARED-016"
      timeout: 5000

  - assertVisible:
      id: "SCR-SHARED-016"
  ```

- [ ] **Step 2: Create `SCR-INFRA-004-terms-of-service.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-INFRA-004: Terms of Service
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "tab-profile"
  - tapOn:
      id: "profile-settings-button"
  - tapOn:
      id: "settings-terms-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-INFRA-004"
      timeout: 5000
  ```

- [ ] **Step 3: Create `SCR-TASK-016-tasker-stats.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-TASK-016: Tasker Stats Dashboard
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-tasker.yaml

  - tapOn:
      id: "tab-profile"
  - tapOn:
      id: "profile-stats-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-016"
      timeout: 5000
  ```

- [ ] **Step 4: Create `SCR-TASK-018-privacy-policy.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-TASK-018: Privacy Policy
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "tab-profile"
  - tapOn:
      id: "profile-settings-button"
  - tapOn:
      id: "settings-privacy-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-TASK-018"
      timeout: 5000
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/maestro/flows/SCR-SHARED-016-notification-center.yaml \
          apps/mobile/maestro/flows/SCR-INFRA-004-terms-of-service.yaml \
          apps/mobile/maestro/flows/SCR-TASK-016-tasker-stats.yaml \
          apps/mobile/maestro/flows/SCR-TASK-018-privacy-policy.yaml
  git commit -m "feat(maestro): add P2 screen smoke flows for shared/infra/tasker utility screens"
  ```

---

### Task 32: Write screen smoke flows — Phase 2 & 3 screens

**Files to create:**
- `apps/mobile/maestro/flows/SCR-P2-001-credits-balance.yaml`
- `apps/mobile/maestro/flows/SCR-P2-003-credits-history.yaml`
- `apps/mobile/maestro/flows/SCR-P2-005-referrals.yaml`
- `apps/mobile/maestro/flows/SCR-P3-003-escrow-payment.yaml`

- [ ] **Step 1: Create `SCR-P2-001-credits-balance.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-P2-001: Credits Balance & Purchase
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-P2-001"
      timeout: 5000

  - assertVisible:
      id: "tasker-credits-topup-secondary"
  - assertVisible:
      id: "tasker-credits-history-secondary"
  ```

- [ ] **Step 2: Create `SCR-P2-003-credits-history.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-P2-003: Credits Transaction History
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-P2-001"
      timeout: 5000

  - tapOn:
      id: "tasker-credits-history-secondary"

  - extendedWaitUntil:
      visible:
        id: "SCR-P2-003"
      timeout: 5000
  ```

- [ ] **Step 3: Create `SCR-P2-005-referrals.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-P2-005: Referral Code & Stats
  # Flow type: smoke test

  - launchApp
  - runFlow: _support/login-tasker.yaml

  - extendedWaitUntil:
      visible:
        id: "SCR-P2-001"
      timeout: 5000

  - tapOn:
      id: "tasker-credits-referrals"

  - extendedWaitUntil:
      visible:
        id: "SCR-P2-005"
      timeout: 5000
  ```

- [ ] **Step 4: Create `SCR-P3-003-escrow-payment.yaml`**

  ```yaml
  appId: mn.tasky.mobile
  ---
  # Screen SCR-P3-003: Escrow Payment Flow
  # Flow type: smoke test
  # Precondition: Logged in as customer; booking eligible for escrow payment exists

  - launchApp
  - runFlow: _support/login-customer.yaml

  - tapOn:
      id: "tab-bookings"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-016"
      timeout: 5000

  - tapOn:
      id: "booking-card-escrow-eligible"

  - extendedWaitUntil:
      visible:
        id: "SCR-CUST-017"
      timeout: 5000

  - tapOn:
      id: "booking-detail-escrow-link"

  - extendedWaitUntil:
      visible:
        id: "SCR-P3-003"
      timeout: 5000
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/maestro/flows/SCR-P2-001-credits-balance.yaml \
          apps/mobile/maestro/flows/SCR-P2-003-credits-history.yaml \
          apps/mobile/maestro/flows/SCR-P2-005-referrals.yaml \
          apps/mobile/maestro/flows/SCR-P3-003-escrow-payment.yaml
  git commit -m "feat(maestro): add P2 screen smoke flows for Phase 2/3 screens"
  ```

---

## Phase 7 — Maestro Execution

Run all authored flows against the running app, capture output for error documentation.

---

### Task 33: Create a Maestro run script

**File:** `apps/mobile/maestro/run-all.sh`

- [ ] **Step 1: Create the script**

  ```bash
  #!/bin/bash
  # run-all.sh — Run all Maestro flows and capture output
  # Usage: ./apps/mobile/maestro/run-all.sh [P0|P1|P2|ALL]
  # Output: apps/mobile/maestro/results/<timestamp>/

  set -euo pipefail

  SCOPE="${1:-ALL}"
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  RESULTS_DIR="apps/mobile/maestro/results/${TIMESTAMP}"
  FLOWS_DIR="apps/mobile/maestro/flows"
  PASS=0
  FAIL=0
  SKIP=0

  mkdir -p "$RESULTS_DIR"

  declare -A P0_FLOWS=(
    [JRN-SHARED-01]="JRN-SHARED-01-onboarding.yaml"
    [JRN-SHARED-03]="JRN-SHARED-03-phase-2-otp-login-new-user.yaml"
    [JRN-SHARED-07]="JRN-SHARED-07-review-submission.yaml"
    [JRN-CUST-02]="JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml"
    [JRN-CUST-04]="JRN-CUST-04-manage-active-booking.yaml"
    [JRN-CUST-05]="JRN-CUST-05-rebook-tasker.yaml"
    [JRN-CUST-07]="JRN-CUST-07-cancel-open-task.yaml"
    [JRN-CUST-08]="JRN-CUST-08-instant-match-phase-3.yaml"
    [JRN-TASK-03]="JRN-TASK-03-lead-unlock-accept-decline-phase-2.yaml"
    [JRN-TASK-04]="JRN-TASK-04-manage-active-booking-tasker.yaml"
    [JRN-TASK-05]="JRN-TASK-05-credit-purchase.yaml"
    [JRN-TASK-07]="JRN-TASK-07-tasker-pro-subscription-phase-3.yaml"
    [JRN-INFRA-02]="JRN-INFRA-02-suspended-banned-account.yaml"
  )

  declare -A P1_FLOWS=(
    [JRN-SHARED-04]="JRN-SHARED-04-messaging.yaml"
    [JRN-SHARED-05]="JRN-SHARED-05-profile-management.yaml"
    [JRN-SHARED-06]="JRN-SHARED-06-settings-&-account.yaml"
    [JRN-CUST-01]="JRN-CUST-01-post-a-task.yaml"
    [JRN-CUST-03]="JRN-CUST-03-review-applicants-&-confirm-booking-phase-2-—-lead-unlock.yaml"
    [JRN-CUST-06]="JRN-CUST-06-raise-&-track-dispute.yaml"
    [JRN-TASK-01]="JRN-TASK-01-tasker-verification.yaml"
    [JRN-TASK-02]="JRN-TASK-02-browse-&-apply-to-task.yaml"
    [JRN-TASK-06]="JRN-TASK-06-wallet-&-payout-phase-3.yaml"
    [JRN-TASK-08]="JRN-TASK-08-ai-profile-polish.yaml"
    [JRN-INFRA-01]="JRN-INFRA-01-error-recovery.yaml"
  )

  declare -A P2_FLOWS=(
    [SCR-SHARED-016]="SCR-SHARED-016-notification-center.yaml"
    [SCR-INFRA-004]="SCR-INFRA-004-terms-of-service.yaml"
    [SCR-TASK-016]="SCR-TASK-016-tasker-stats.yaml"
    [SCR-TASK-018]="SCR-TASK-018-privacy-policy.yaml"
    [SCR-P2-001]="SCR-P2-001-credits-balance.yaml"
    [SCR-P2-003]="SCR-P2-003-credits-history.yaml"
    [SCR-P2-005]="SCR-P2-005-referrals.yaml"
    [SCR-P3-003]="SCR-P3-003-escrow-payment.yaml"
  )

  run_flow() {
    local id="$1"
    local file="$2"
    local log="${RESULTS_DIR}/${id}.log"

    echo "Running $id..."
    if maestro test "${FLOWS_DIR}/${file}" > "$log" 2>&1; then
      echo "  PASS: $id"
      echo "PASS" >> "${RESULTS_DIR}/summary.txt"
      PASS=$((PASS + 1))
    else
      echo "  FAIL: $id (see $log)"
      echo "FAIL: $id" >> "${RESULTS_DIR}/summary.txt"
      FAIL=$((FAIL + 1))
    fi
  }

  echo "=== Maestro Run: ${TIMESTAMP} ===" | tee "${RESULTS_DIR}/summary.txt"
  echo "Scope: ${SCOPE}" | tee -a "${RESULTS_DIR}/summary.txt"

  if [[ "$SCOPE" == "P0" || "$SCOPE" == "ALL" ]]; then
    echo "--- P0 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
    for id in "${!P0_FLOWS[@]}"; do
      run_flow "$id" "${P0_FLOWS[$id]}"
    done
  fi

  if [[ "$SCOPE" == "P1" || "$SCOPE" == "ALL" ]]; then
    echo "--- P1 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
    for id in "${!P1_FLOWS[@]}"; do
      run_flow "$id" "${P1_FLOWS[$id]}"
    done
  fi

  if [[ "$SCOPE" == "P2" || "$SCOPE" == "ALL" ]]; then
    echo "--- P2 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
    for id in "${!P2_FLOWS[@]}"; do
      run_flow "$id" "${P2_FLOWS[$id]}"
    done
  fi

  echo "" | tee -a "${RESULTS_DIR}/summary.txt"
  echo "Results: PASS=${PASS} FAIL=${FAIL}" | tee -a "${RESULTS_DIR}/summary.txt"
  echo "Logs: ${RESULTS_DIR}/"
  ```

- [ ] **Step 2: Make executable**
  ```bash
  chmod +x apps/mobile/maestro/run-all.sh
  ```

- [ ] **Step 3: Add results directory to .gitignore**
  ```bash
  echo "apps/mobile/maestro/results/" >> apps/mobile/.gitignore
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/maestro/run-all.sh apps/mobile/.gitignore
  git commit -m "feat(maestro): add run-all.sh execution script"
  ```

---

### Task 34: Run P0 flows and capture output

Prerequisite: The app is running on a connected device or emulator (`pnpm --filter @tasky/mobile start`). Test accounts are configured.

- [ ] **Step 1: Start the app (if not already running)**
  ```bash
  pnpm --filter @tasky/mobile start
  ```
  Wait until Metro bundler is ready.

- [ ] **Step 2: Run P0 flows**
  ```bash
  ./apps/mobile/maestro/run-all.sh P0
  ```
  Expected: each flow either PASS or FAIL, output logged to `apps/mobile/maestro/results/<timestamp>/`.

- [ ] **Step 3: Review summary**
  ```bash
  cat apps/mobile/maestro/results/*/summary.txt | tail -20
  ```

- [ ] **Step 4: Do NOT fix failures yet** — record them in Phase 8.

---

### Task 35: Run P1 flows and capture output

- [ ] **Step 1: Run P1 flows**
  ```bash
  ./apps/mobile/maestro/run-all.sh P1
  ```

- [ ] **Step 2: Review summary**
  ```bash
  cat apps/mobile/maestro/results/*/summary.txt
  ```

---

## Phase 8 — Error Documentation

Format all Maestro failures into a structured patch report that a patching agent can act on without additional context.

---

### Task 36: Create error report template

**File:** `apps/mobile/maestro/ERROR-REPORT-TEMPLATE.md`

- [ ] **Step 1: Create the template**

  ```markdown
  # Maestro Error Report — <DATE>

  **Run scope:** P0 / P1 / P2
  **Run timestamp:** <TIMESTAMP>
  **Logs directory:** `apps/mobile/maestro/results/<TIMESTAMP>/`

  ## Summary

  | Flow ID | Status | Category |
  |---------|--------|----------|
  | JRN-XXX | FAIL | TESTID_MISSING |

  ## Category Legend

  | Category | Meaning | Patching action |
  |----------|---------|-----------------|
  | `TESTID_MISSING` | Maestro could not find a `testID` — element exists but ID is wrong or missing | Add/fix testID in the screen component |
  | `SCREEN_NOT_REACHED` | Navigation did not arrive at the expected screen | Fix navigation logic or screen routing |
  | `ELEMENT_NOT_VISIBLE` | Screen arrived but expected element not rendered | Fix rendering condition or component state |
  | `TIMEOUT` | Screen or element never appeared within timeout | May indicate loading failure, network error, or missing test data |
  | `FLOW_ERROR` | YAML parsing error or unsupported Maestro command | Fix the flow YAML |
  | `INFRA_DEPENDENCY` | Test requires external setup (file picker, airplane mode, test account) | Configure test environment |
  | `KNOWN_LIMITATION` | Feature has TODOs in implementation — cannot be fully tested yet | No patch needed; re-test after TODO resolved |

  ## Failure Details

  ### <FLOW_ID> — <FLOW_NAME>

  **Category:** <CATEGORY>
  **Log file:** `apps/mobile/maestro/results/<TIMESTAMP>/<FLOW_ID>.log`

  **Failing step:**
  ```yaml
  - tapOn:
      id: "some-testid"
  ```

  **Error message:**
  ```
  [paste exact Maestro error line here]
  ```

  **Root cause:** <one sentence — e.g. "testID 'some-testid' not present in component; screen uses 'other-id' instead">

  **Patch instruction:**
  File: `apps/mobile/src/app/path/to/screen.tsx`
  Change: Add `testID="some-testid"` to the `<Pressable>` at line ~42

  **Verification after patch:**
  ```bash
  maestro test apps/mobile/maestro/flows/<FLOW_FILE>.yaml
  ```
  Expected: PASS
  ```
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/mobile/maestro/ERROR-REPORT-TEMPLATE.md
  git commit -m "feat(maestro): add structured error report template"
  ```

---

### Task 37: Fill error report from P0 and P1 run results

- [ ] **Step 1: Find all FAIL lines in results**
  ```bash
  grep "^FAIL" apps/mobile/maestro/results/*/summary.txt
  ```

- [ ] **Step 2: For each FAIL, read the log to extract error**
  ```bash
  # Example for JRN-SHARED-01:
  cat apps/mobile/maestro/results/*/JRN-SHARED-01.log
  ```
  Look for lines like:
  - `No element found with id: "some-id"` → category: `TESTID_MISSING`
  - `Timeout waiting for element` → category: `TIMEOUT`
  - `java.lang.Exception` or similar → category: `FLOW_ERROR`
  - Navigation never reached expected screen → category: `SCREEN_NOT_REACHED`

- [ ] **Step 3: Create the error report**

  Copy `apps/mobile/maestro/ERROR-REPORT-TEMPLATE.md` to:
  ```
  apps/mobile/maestro/results/ERROR-REPORT-<TIMESTAMP>.md
  ```

  Fill in one entry per FAIL. Use the exact error message from the log. Write the patch instruction so a patching agent can act on it without reading the log.

  **Required fields for each failure:**
  - Flow ID and name
  - Category (from legend)
  - Log file path
  - Exact failing YAML step
  - Exact error message (copy-paste from log)
  - Root cause (one sentence)
  - Patch instruction with file path and change description
  - Verification command

- [ ] **Step 4: Commit the error report**
  ```bash
  git add "apps/mobile/maestro/results/ERROR-REPORT-*.md"
  git commit -m "docs(maestro): add error report from P0/P1 run"
  ```

---

## Phase Gate Summary

| Phase | Gate | Proceed when |
|-------|------|-------------|
| 1 Pre-flight | `pnpm --filter @tasky/mobile typecheck` exits 0 | All 12 TS errors fixed |
| 2 Doc alignment | YAML parse succeeds on both docs | screen-inventory + state-matrix valid |
| 3 Support infra | 3 support files exist in `_support/` | ls check passes |
| 4 P0 authoring | 13 flow files exist with no `# TODO` stubs | All P0 stubs replaced |
| 5 P1 authoring | 11 flow files exist with no `# TODO` stubs | All P1 stubs replaced |
| 6 P2 smoke flows | 8 smoke flow files exist | All smoke files present |
| 7 Execution | Run script exits; summary.txt contains results | Even FAIL counts as done |
| 8 Error docs | Error report contains one entry per FAIL | Report is complete and actionable |

---

## Deferred — Do Not Implement

These are explicitly out of scope for this plan:

| Item | Reason |
|------|--------|
| JRN-B2B-01..04 | No B2B screens in codebase |
| JRN-CUST-09 | SCR-P2-004 file does not exist |
| JRN-SHARED-02 | OTP migration screen has significant TODOs |
| SCR-B2B-001..007 | No B2B screens |
| SCR-P2-004 low balance alert | No route — component only |
