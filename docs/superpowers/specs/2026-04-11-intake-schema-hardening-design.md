# Intake Schema Hardening

Fixes 8 issues in the category intake schema system: a broken rollback mechanism, web/mobile divergence, missing i18n, and limited field types.

**Approach:** Single atomic sweep. One branch, one migration rewrite, all consumers updated together.

**Prerequisite:** Database can be freely wiped and remigrated (dev phase).

---

## 1. Schema Shape Change

### Field contract

Every intake field must have:

| Property                    | Type                    | Required                  | Notes                                        |
| --------------------------- | ----------------------- | ------------------------- | -------------------------------------------- |
| `key`                       | string                  | yes                       | Stable machine-readable identifier           |
| `label`                     | string                  | yes                       | English display label                        |
| `label_mn`                  | string                  | yes                       | Mongolian display label                      |
| `type`                      | string                  | yes                       | One of 7 supported types                     |
| `required`                  | boolean                 | yes                       | Whether the field must be answered           |
| `options`                   | array of option objects | for select/dropdown types | See below                                    |
| `min` / `max`               | number                  | for `numeric_counter`     | Bounds                                       |
| `min_length` / `max_length` | number                  | for `text` / `textarea`   | `max_length` required, `min_length` optional |

### Option objects

For `single_select`, `multi_select`, and `dropdown` fields, options change from plain strings to structured objects:

```json
// Before
"options": ["Apartment", "Ger", "Office", "House"]

// After
"options": [
  { "value": "apartment", "label": "Apartment", "label_mn": "Орон сууц" },
  { "value": "ger", "label": "Ger", "label_mn": "Гэр" },
  { "value": "office", "label": "Office", "label_mn": "Оффис" },
  { "value": "house", "label": "House", "label_mn": "Байшин" }
]
```

- `value` is a stable slug stored in `intake_answers_json` on tasks. Labels can change without invalidating stored answers.
- `label` and `label_mn` are display strings. Both required.

### Supported field types (7)

| Type              | Renders as (web)      | Renders as (mobile)                | Has options | Has length constraints |
| ----------------- | --------------------- | ---------------------------------- | ----------- | ---------------------- |
| `single_select`   | Radio buttons         | Chip group                         | yes         | no                     |
| `multi_select`    | Checkboxes            | Chip group                         | yes         | no                     |
| `dropdown`        | `<select>` element    | Chip group (same as single_select) | yes         | no                     |
| `yes_no`          | Radio (Yes/No)        | Chip (Yes/No)                      | no          | no                     |
| `numeric_counter` | Stepper (+/-/input)   | Numeric input                      | no          | no                     |
| `text`            | `<input type="text">` | Single-line Input                  | no          | yes                    |
| `textarea`        | `<textarea>`          | Multi-line Input                   | no          | yes                    |

`dropdown` is a web-layout hint. Mobile renders it identically to `single_select` as chips. The distinction gives admins control over web presentation for longer option lists.

### Example: text and textarea fields

```json
{
  "key": "surface_type",
  "label": "What surface?",
  "label_mn": "Ямар гадаргуу?",
  "type": "text",
  "required": true,
  "max_length": 200
}
```

```json
{
  "key": "special_instructions",
  "label": "Special instructions",
  "label_mn": "Тусгай зааварчилгаа",
  "type": "textarea",
  "required": false,
  "max_length": 2000
}
```

---

## 2. Remove Rollback Machinery, Fix Activation

### Removed

- `CategorySchemaVersionService.rollbackToLastKnownGood()` method
- `CategorySchemaVersionDao`: `findLastKnownGoodByCategoryId()`, `clearLastKnownGood()`, `markLastKnownGood()`
- `is_last_known_good` column from `category_schema_versions` table
- `last_known_good_schema_version` column from `categories` table
- `CategoryState.lastKnownGoodSchemaVersion` field
- Test scenarios SCN-CATEGORY-007 and SCN-CATEGORY-008

### Activation changes

`activate()` guard expands to allow re-activation from ROLLED_BACK:

```java
if (!"DRAFT".equals(status) && !"CANARY".equals(status) && !"ROLLED_BACK".equals(status)) {
    throw new IllegalStateException(...);
}
```

Remove LKG clear/mark calls from `activate()`.

Add `@Transactional` to `activate()` so the 3 remaining writes (roll back old active, activate new, update category cache) are atomic.

### Admin workflow for reverting

Admin opens the schema version list, sees all versions with statuses, and activates the older version they want. Same endpoint, same flow.

---

## 3. Backend Validation Changes

### Schema creation validation (`CategorySchemaVersionService.validateSchemaJson`)

- Field count: 3-5 (unchanged)
- Required properties per field: `key`, `label`, `label_mn`, `type`, `required` (adds `label_mn`)
- Supported types: 7 (adds `text`, `textarea`)
- Option-required types (`single_select`, `multi_select`, `dropdown`): each option must be an object with `value`, `label`, `label_mn` strings
- `text`/`textarea` types: `max_length` required and positive. `min_length` optional, must be non-negative and less than `max_length` if present
- Reject `options` on non-option types (`text`, `textarea`, `yes_no`, `numeric_counter`)

### Task creation validation (`TaskService.validateIntakeAnswers`)

- `single_select`/`dropdown`: answer value checked against `option.value` (not raw string)
- `multi_select`: each selected value checked against `option.value`
- `text`: required check, `max_length` enforcement, `min_length` if set
- `textarea`: same as `text`
- `numeric_counter`/`yes_no`: unchanged

### Scope summary generation (`ScopeSummaryGenerator`)

- For option types: look up the answer's `value` in the schema's `options` array, emit `label` (English). Locale-aware summaries are a future enhancement.
- For `text`/`textarea`: emit the raw answer string
- Fallback path unchanged

---

## 4. Mobile Frontend Changes

### Type definitions (`intake.tsx`)

```typescript
type FieldType =
  | 'single_select'
  | 'multi_select'
  | 'dropdown'
  | 'yes_no'
  | 'numeric_counter'
  | 'text'
  | 'textarea';

interface IntakeFieldOption {
  value: string;
  label: string;
  label_mn: string;
}

interface IntakeField {
  key: string;
  label: string;
  label_mn: string;
  type: FieldType;
  required: boolean;
  options?: IntakeFieldOption[] | null;
  min?: number | null;
  max?: number | null;
  min_length?: number | null;
  max_length?: number | null;
}
```

### Label localization

- Helper function `getLabel(item, locale)` returns `label_mn` or `label` based on current i18n locale
- Applied to field labels and option labels throughout `renderSchemaField`
- Locale read from existing `useTranslation()` hook

### Rendering

- `dropdown` renders as chips (same as `single_select`)
- `text` renders as single-line `<Input>` with `maxLength`
- `textarea` renders as multi-line `<Input>` with `multiline`, `numberOfLines={4}`, `maxLength`

### ChipGroup changes

- Displays `getLabel(option, locale)` visually
- Toggles on `option.value`

### Validation

- `text`/`textarea`: required check, `min_length`/`max_length`
- Option types: answers store `option.value`, validated against `option.value`

---

## 5. Web Frontend Changes

### IntakeFormRenderer.tsx

- Option shape already matches `{ value, label, label_mn }` — parsing layer passes structured options through
- Add `TextField` component: `<input type="text">` with `maxLength`, label with locale, error display
- Add `TextareaField` component: `<textarea>` with `maxLength`, row hint, label with locale, error display

### AdminCategoriesPage.tsx

- Schema editor supports new option shape: admin enters `value`, `label`, `label_mn` per option
- `text`/`textarea` fields show `max_length` (required) and `min_length` (optional) inputs instead of options list
- Field type selector expands from 5 to 7 choices

---

## 6. Seed Data Migration

Database is freely wipeable. Rewrite existing migrations rather than adding transform migrations.

### V10\_\_phase0_schema_alignment.sql

- Remove `last_known_good_schema_version` column from `categories`
- Remove `is_last_known_good` column from `category_schema_versions`

### V11\_\_seed_intake_schemas.sql

Rewrite all 3 seeded schemas (Cleaning, Moving & Hauling, Handyman) with:

- `label_mn` on every field
- Structured options with `value`, `label`, `label_mn` on every option

### V19\_\_seed_test_data.sql

Update any intake-related test data to match the new shape.

---

## 7. Test Changes

### Remove

- SCN-CATEGORY-007 (rollback restores LKG)
- SCN-CATEGORY-008 (rollback without LKG fails)

### Modify

- SCN-CATEGORY-006: verify activation from ROLLED_BACK status works
- All test schema constants: rewrite with `label_mn` and structured options
- `UNSUPPORTED_TYPE_SCHEMA`: `free_text` stays unsupported

### Add

| ID                     | Scenario                                                   |
| ---------------------- | ---------------------------------------------------------- |
| SCN-CATEGORY-007 (new) | Schema with missing `label_mn` rejected                    |
| SCN-CATEGORY-008 (new) | Schema with `text` and `textarea` types accepted           |
| SCN-CATEGORY-009       | Schema with `text` type missing `max_length` rejected      |
| SCN-CATEGORY-010       | Activation from ROLLED_BACK status succeeds                |
| SCN-CATEGORY-011       | Option objects missing `value`/`label`/`label_mn` rejected |

### TaskService intake validation

- Update answers to use `value` keys instead of raw strings
- Add cases for `text`/`textarea` length validation

---

## Files Affected

### Backend (`services/api/src/`)

- `main/java/mn/tasky/category/application/CategorySchemaVersionService.java` — validation expansion, remove rollback, add @Transactional to activate
- `main/java/mn/tasky/category/application/CategoryService.java` — remove LKG field references
- `main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java` — remove LKG queries
- `main/java/mn/tasky/category/dto/CategoryState.java` — remove lastKnownGoodSchemaVersion
- `main/java/mn/tasky/category/dto/CategorySchemaVersion.java` — remove isLastKnownGood
- `main/java/mn/tasky/task/application/TaskService.java` — validateIntakeAnswers for new shapes
- `main/java/mn/tasky/task/application/ScopeSummaryGenerator.java` — resolve option labels
- `main/resources/db/migration/V10__phase0_schema_alignment.sql` — remove LKG columns
- `main/resources/db/migration/V11__seed_intake_schemas.sql` — rewrite with structured options + label_mn
- `test/java/mn/tasky/category/CategoryScenarioTests.java` — remove/modify/add scenarios

### Mobile (`apps/mobile/src/`)

- `app/(customer)/tasks/new/intake.tsx` — types, renderers, localization, validation

### Web (`apps/web/src/`)

- `components/task-creation/IntakeFormRenderer.tsx` — add TextField, TextareaField
- `pages/admin/AdminCategoriesPage.tsx` — schema editor for new option shape and text types
