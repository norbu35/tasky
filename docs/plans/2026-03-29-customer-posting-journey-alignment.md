# Customer Posting Journey Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the first five customer posting journey screens in the mobile app to the authored Tasky screen specs and the connected Stitch mobile design project.

**Architecture:** Keep the existing Expo route structure and task-draft parameter passing, but normalize the screen flow against `SCR-CUST-001` to `SCR-CUST-005`. Use the screen specs for route, state, and navigation truth, and use `Tasky Mobile v2` as the visual reference for layout and styling refinements.

**Tech Stack:** Expo Router, React Native, TypeScript, Jest, React Native Testing Library, shared mobile design tokens

---

### Task 1: Document The Screen Mapping

**Files:**
- Create: `docs/design/customer-posting-journey-mapping.md`

**Step 1: Write the mapping doc**

- Record `SCR-CUST-001` to `SCR-CUST-005`
- Link each screen to its screen spec, route component, and test file
- Note the key discrepancies discovered before implementation

**Step 2: Verify the doc content locally**

Run: `sed -n '1,240p' docs/design/customer-posting-journey-mapping.md`
Expected: screen mapping table and discrepancy notes are present

### Task 2: Tighten Customer Posting Journey Tests

**Files:**
- Modify: `apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx`
- Modify: `apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx`

**Step 1: Write or adjust failing assertions for the spec-aligned journey**

- Assert visible wizard progress and merged spec/design copy
- Assert route transitions remain in the correct order
- Assert key spec copy and helper text
- Assert the category screen back action returns to My Tasks behaviorally
- Assert Location keeps the Next CTA disabled until a pin exists

**Step 2: Run the targeted tests to verify failures**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`
Expected: failures on changed screen expectations

### Task 3: Preserve Existing Wizard Progress Semantics

**Files:**
- No file edits unless verification proves a real mismatch

**Step 1: Verify the existing zero-based `FormWizardTemplate` semantics**

- Confirm the posted journey already renders steps 2/7, 3/7, and 4/7 correctly
- Avoid changing the shared template unless the verification shows a real defect

### Task 4: Align `SCR-CUST-001` My Tasks

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/index.tsx`
- Test: `apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`

**Step 1: Refine the screen toward the authored structure**

- Preserve header title plus notifications action
- Preserve FAB navigation to category selection
- Adjust styling toward the spec and Tasky Mobile v2 design language
- Keep the My Tasks filter tabs as an approved product extension

**Step 2: Run the screen test**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`
Expected: PASS

### Task 5: Align `SCR-CUST-002` Category Selection

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- Test: `apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx`

**Step 1: Update the category screen to match the spec and design intent**

- Keep step 1 of 7
- Keep category selection push behavior
- Strengthen layout and selection presentation toward a category-grid feel
- Ensure back behavior remains correct for the journey

**Step 2: Run the screen test**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx`
Expected: PASS

### Task 6: Align `SCR-CUST-003` Intake Form

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Test: `apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx`

**Step 1: Correct the screen to spec**

- Show step 2 of 7
- Keep validation inline
- Keep navigation to photo upload
- Improve visual hierarchy using the Tasky Mobile v2 direction

**Step 2: Run the screen test**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx`
Expected: PASS

### Task 7: Align `SCR-CUST-004` Photo Upload

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Possibly modify: `apps/mobile/src/components/ui/PhotoGrid.tsx`
- Test: `apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx`

**Step 1: Correct the screen to spec**

- Show step 3 of 7
- Preserve zero-photo continue behavior
- Strengthen empty and helper states toward the design artifact
- Keep photo param persistence

**Step 2: Run the screen test**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx`
Expected: PASS

### Task 8: Align `SCR-CUST-005` Location Pin

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Test: `apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx`

**Step 1: Correct the screen to spec**

- Show step 4 of 7
- Keep map pin required before continue
- Preserve privacy note and helper text
- Tune visual hierarchy to better match the Stitch design

**Step 2: Run the screen test**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx`
Expected: PASS

### Task 9: Run Focused Verification

**Files:**
- No file edits

**Step 1: Run the targeted customer-posting suite**

Run: `pnpm test -- --runInBand apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx`
Expected: all passing

**Step 2: Run typecheck if the touched surface requires it**

Run: `pnpm -C apps/mobile typecheck`
Expected: PASS
