# API Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align backend DTOs and mobile UI validation with the API.yaml contract so constraint mismatches can never cause silent server rejections.

**Architecture:** API.yaml is the single source of truth. Backend Java DTOs are fixed to match its constraints exactly. Mobile UI adds matching client-side validation so users see instant feedback before the request fires. No new files are created — all changes are in-place on the relevant DTOs and screens.

**Tech Stack:** Spring Boot / Jakarta Validation (backend), React Native / Expo Router (mobile), OpenAPI 3.0 (contract)

---

## Mismatch Inventory

| Field | API.yaml | Backend DTO | Mobile UI | Fix |
|---|---|---|---|---|
| `description` minLength | none | `@Size(min=10)` | 0 enforced (only non-empty) | Remove backend min=10; align UI to check non-empty |
| `description` maxLength | 2000 | `@Size(max=2000)` ✓ | `maxLength={500}` | UI: raise to 2000 |
| `budget` minimum | 1001 | `@Min(5000)` | `MIN_BUDGET=1001` | Backend stricter than spec; update API.yaml to 5000 to match intent |
| `location_text` maxLength | 500 | `@Size(max=500)` ✓ | `maxLength={100}` | UI: raise to 500 |
| `intake_answers` required | yes | no `@NotNull` | always sent | Backend: add `@NotNull` |
| `intake_schema_version` required | yes | `Integer` (nullable) | hard-coded `'1'` | Backend: add `@NotNull` |

**Decision on `budget`:** The backend enforces 5000 MNT minimum. The mobile already shows "at least ₮1,001" (from `MIN_BUDGET=1001`). The right fix is to make backend, API.yaml, and mobile all agree on **5000 MNT** — the backend's value is the authoritative business rule.

---

## Files Modified

| File | What changes |
|---|---|
| `docs/API.yaml` | `budget.minimum: 1001 → 5000`; add `description.minLength: 10` |
| `services/api/src/main/java/mn/tasky/task/dto/CreateTaskRequest.java` | `@NotNull` on `intakeAnswersJson` and `intakeSchemaVersion` |
| `apps/mobile/src/app/(customer)/tasks/new/intake.tsx` | description `maxLength` 500→2000; add minLength=10 validation |
| `apps/mobile/src/app/(customer)/tasks/new/location.tsx` | location_text `maxLength` 100→500 |
| `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx` | `MIN_BUDGET` 1001→5000; update error message |
| `apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx` | Update test fixtures to match new limits |
| `services/api/src/test/java/mn/tasky/task/TaskScenarioTests.java` | Ensure existing tests reflect new constraints |

---

## Task 1: Fix API.yaml — align budget minimum and add description minLength

**Files:**
- Modify: `docs/API.yaml` (CreateTaskRequest schema, lines ~551–600)

- [ ] **Step 1: Update API.yaml**

Find the `CreateTaskRequest` schema. Change `budget.minimum` from `1001` to `5000`. Add `minLength: 10` to `description`.

```yaml
    CreateTaskRequest:
      type: object
      required: [ category_id, description, budget, location_lat, location_lng, location_text, scheduled_at, intake_answers, intake_schema_version ]
      properties:
        category_id:
          type: string
          format: uuid
        description:
          type: string
          minLength: 10
          maxLength: 2000
        budget:
          type: integer
          minimum: 5000
          description: Fixed budget in MNT. Must be at least ₮5,000.
```

- [ ] **Step 2: Validate the API contract**

```bash
./gradlew --no-daemon openApiValidate
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add docs/API.yaml
git commit -m "fix(api): align CreateTaskRequest — budget min 5000, description minLength 10"
```

---

## Task 2: Fix backend DTO — add @NotNull for required fields

**Files:**
- Modify: `services/api/src/main/java/mn/tasky/task/dto/CreateTaskRequest.java`

The backend must enforce `intake_answers` and `intake_schema_version` as required (per spec). Currently both are nullable. Also note `description` already has `@Size(min=10)` which now matches the updated spec — leave it.

- [ ] **Step 1: Add @NotNull to intakeAnswersJson and intakeSchemaVersion**

```java
package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateTaskRequest(
        @JsonProperty("category_id") @NotBlank @Size(max = 512) String categoryId,
        @NotBlank @Size(min = 10, max = 2000) String description,
        @Min(5000) @Max(50_000_000) int budget,
        @JsonProperty("location_lat") @NotNull @Min(-90) @Max(90) double locationLat,
        @JsonProperty("location_lng") @NotNull @Min(-180) @Max(180) double locationLng,
        @JsonProperty("location_text") @NotBlank @Size(min = 5, max = 500) String locationText,
        @JsonProperty("scheduled_at") @NotBlank @Size(max = 64) String scheduledAt,
        @JsonProperty("photo_keys") @Size(max = 3) List<String> photoKeys,
        @JsonProperty("intake_answers") @NotNull JsonNode intakeAnswersJson,
        @JsonProperty("intake_schema_version") @NotNull Integer intakeSchemaVersion,
        @JsonProperty("scope_summary") @Size(max = 2000) String scopeSummary,
        @JsonProperty("draft_id") @Size(max = 512) String draftId) {}
```

- [ ] **Step 2: Compile**

```bash
./gradlew --no-daemon :services:api:compileJava
```

Expected: `BUILD SUCCESSFUL` (2 pre-existing NullablePrimitive warnings are fine)

- [ ] **Step 3: Run backend task tests**

```bash
./gradlew --no-daemon :services:api:test --tests "mn.tasky.task.*"
```

Expected: all tests pass (the mobile always sends these fields, so existing tests should be unaffected)

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/dto/CreateTaskRequest.java
git commit -m "fix(api): @NotNull on intake_answers and intake_schema_version per spec"
```

---

## Task 3: Fix mobile intake screen — description constraints

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`

The Description field currently:
- Has `maxLength={500}` but spec allows 2000
- Shows counter `X / 500` but spec cap is 2000
- Only validates non-empty on `handleNext`; spec and backend require min 10 chars

- [ ] **Step 1: Add minLength constant and update maxLength**

At the top of the file, add a constant:

```tsx
const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 2000;
```

- [ ] **Step 2: Update handleNext validation**

```tsx
const handleNext = () => {
  if (!description.trim()) {
    setError(t('customer.postTask.validation.required', 'This field is required'));
    return;
  }
  if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
    setError(
      t(
        'customer.postTask.validation.descriptionMin',
        'Description must be at least {{min}} characters',
      ).replace('{{min}}', String(DESCRIPTION_MIN_LENGTH)),
    );
    return;
  }
  setError('');
  router.push({
    pathname: '/(customer)/tasks/new/photos',
    params: {
      categoryId: params.categoryId,
      description,
      intakeAnswers: JSON.stringify(intakeAnswers),
      intakeSchemaVersion: '1',
    },
  });
};
```

- [ ] **Step 3: Update the Input and counter**

```tsx
<Input
  testID="intake-description-input"
  value={description}
  onChangeText={(text: string) => {
    setDescription(text);
    if (error) setError('');
  }}
  placeholder={t('customer.postTask.intakePlaceholder', 'What needs to be done?')}
  multiline
  numberOfLines={4}
  maxLength={DESCRIPTION_MAX_LENGTH}
  invalid={!!error}
  style={styles.descriptionInput}
/>
<View style={styles.fieldMeta}>
  <Text style={styles.fieldHint}>
    {t(
      'customer.postTask.intakeHint',
      'Include size, access, timing, and any tools or materials involved.',
    )}
  </Text>
  <Text style={styles.counter}>{`${descriptionLength} / ${DESCRIPTION_MAX_LENGTH}`}</Text>
</View>
```

- [ ] **Step 4: Run mobile tests**

```bash
pnpm --filter @tasky/mobile test -- --testPathPattern="intake" --passWithNoTests
```

Expected: passes (or no test file — we'll update tests in Task 6)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/intake.tsx
git commit -m "fix(mobile): description minLength 10, maxLength 2000 on intake screen"
```

---

## Task 4: Fix mobile location screen — location_text maxLength

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`

The location text input currently has `maxLength={100}` but the spec and backend allow up to 500.

- [ ] **Step 1: Update the Input maxLength**

Find the Input for location text (around line 167) and change `maxLength={100}` to `maxLength={500}`:

```tsx
<Input
  testID="location-text-input"
  value={locationText}
  onChangeText={setLocationText}
  placeholder={t('customer.postTask.locationPlaceholder', 'Describe the location...')}
  maxLength={500}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/location.tsx
git commit -m "fix(mobile): location_text maxLength 100→500 to match API spec"
```

---

## Task 5: Fix mobile schedule screen — budget minimum

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`

`MIN_BUDGET` is currently `1001` but backend requires `5000`. The error message says "₮1,001" — update both.

- [ ] **Step 1: Update MIN_BUDGET and error message**

```tsx
const MIN_BUDGET = 5000;
```

Find the `budgetError` string and update the message:

```tsx
const budgetError =
  touchedBudget && budget !== '' && !isBudgetValid
    ? t('customer.postTask.budgetError', 'Budget must be at least ₮5,000')
    : '';
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/schedule.tsx
git commit -m "fix(mobile): MIN_BUDGET 1001→5000 to match backend constraint"
```

---

## Task 6: Update mobile tests to reflect corrected constraints

**Files:**
- Modify: `apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx`

Check if this test file hardcodes budget or description values that fall outside the corrected limits.

- [ ] **Step 1: Read the test file**

```bash
cat apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx
```

- [ ] **Step 2: Fix any out-of-range fixture values**

If the test submits a `budget` < 5000, update it. If `description` < 10 chars, update it. For example:

```tsx
// Before (if present):
budget: '3000'        // < 5000, will fail backend
description: 'Fix'   // < 10 chars, will fail

// After:
budget: '10000'
description: 'Fix the kitchen sink leak under the cabinet'
```

- [ ] **Step 3: Run all mobile tests**

```bash
pnpm --filter @tasky/mobile test
```

Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx
git commit -m "fix(mobile-test): update fixtures to satisfy corrected contract constraints"
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Run full backend test suite**

```bash
./gradlew --no-daemon :services:api:test
```

Expected: all tests pass

- [ ] **Step 2: Run full mobile test suite**

```bash
pnpm -r test
```

Expected: all pass

- [ ] **Step 3: Run typecheck**

```bash
pnpm -r typecheck
```

Expected: no errors

- [ ] **Step 4: Run lint**

```bash
pnpm -r lint
```

Expected: no errors

- [ ] **Step 5: Validate API contract**

```bash
./gradlew --no-daemon openApiValidate
```

Expected: `BUILD SUCCESSFUL`

---

## Self-Review Checklist

- [x] `description` minLength: API.yaml updated to 10, backend already had min=10, UI now enforces 10
- [x] `description` maxLength: API.yaml 2000 ✓, backend 2000 ✓, UI raised 500→2000 ✓
- [x] `budget` minimum: all three layers now agree on 5000
- [x] `location_text` maxLength: API.yaml 500 ✓, backend 500 ✓, UI raised 100→500 ✓
- [x] `intake_answers` required: backend now has @NotNull ✓
- [x] `intake_schema_version` required: backend now has @NotNull ✓
- [x] No "TBD" or "similar to Task N" — all steps show exact code
- [x] All method names consistent across tasks (no drift)
