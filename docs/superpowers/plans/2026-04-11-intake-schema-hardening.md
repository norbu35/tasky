# Intake Schema Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 issues in the intake schema system — broken rollback, web/mobile divergence, missing i18n, limited field types — in a single atomic sweep.

**Architecture:** Rewrite the JSONB schema contract to use structured options (`{value, label, label_mn}`) and bilingual field labels. Remove the broken rollback/LKG machinery. Add `text` and `textarea` field types. Update all consumers: migrations, backend services, mobile renderer, web renderer, admin panel.

**Tech Stack:** Java 21 / Spring Boot / JDBI 3 / Flyway, React Native (Expo), React + Vite, TanStack Query

**Spec:** `docs/superpowers/specs/2026-04-11-intake-schema-hardening-design.md`

---

### Task 1: Database Migration — Remove LKG Columns

Remove `last_known_good_schema_version` from `categories` and `is_last_known_good` from `category_schema_versions`. DB is freely wipeable — edit existing migrations directly.

**Files:**

- Modify: `services/api/src/main/resources/db/migration/V10__phase0_schema_alignment.sql:33-36,163-176`

- [ ] **Step 1: Remove `last_known_good_schema_version` from categories**

In `V10__phase0_schema_alignment.sql`, delete line 36:

```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_known_good_schema_version INT;
```

- [ ] **Step 2: Remove `is_last_known_good` from `category_schema_versions` table**

In `V10__phase0_schema_alignment.sql`, in the `CREATE TABLE IF NOT EXISTS category_schema_versions` block (lines 163-176), remove the `is_last_known_good` column. The table becomes:

```sql
CREATE TABLE IF NOT EXISTS category_schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories (id),
    version INT NOT NULL,
    schema_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CANARY', 'ACTIVE', 'ROLLED_BACK')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at TIMESTAMPTZ,
    UNIQUE (category_id, version)
);
CREATE INDEX IF NOT EXISTS idx_category_schema_versions_active ON category_schema_versions (category_id, status)
    WHERE status = 'ACTIVE';
```

- [ ] **Step 3: Verify migration syntax**

Run: `cd services/api && ../../gradlew flywayValidate 2>&1 | tail -5` (or just confirm no SQL syntax errors)

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/resources/db/migration/V10__phase0_schema_alignment.sql
git commit -m "refactor(db): remove last_known_good columns from categories and schema versions"
```

---

### Task 2: Rewrite Seed Schemas with Structured Options and label_mn

Rewrite V11 to use structured option objects and add `label_mn` to every field.

**Files:**

- Modify: `services/api/src/main/resources/db/migration/V11__seed_intake_schemas.sql`

- [ ] **Step 1: Rewrite Cleaning schema**

Replace the Cleaning INSERT (lines 8-12) with:

```sql
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[
      {"key":"property_type","label":"Property type","label_mn":"Үл хөдлөх хөрөнгийн төрөл","type":"single_select","required":true,"options":[{"value":"apartment","label":"Apartment","label_mn":"Орон сууц"},{"value":"ger","label":"Ger","label_mn":"Гэр"},{"value":"office","label":"Office","label_mn":"Оффис"},{"value":"house","label":"House","label_mn":"Байшин"}]},
      {"key":"size_or_rooms","label":"Number of rooms","label_mn":"Өрөөний тоо","type":"numeric_counter","required":true,"min":1,"max":10},
      {"key":"cleaning_type","label":"Cleaning type","label_mn":"Цэвэрлэгээний төрөл","type":"single_select","required":true,"options":[{"value":"standard","label":"Standard","label_mn":"Энгийн"},{"value":"deep_clean","label":"Deep Clean","label_mn":"Нүдэн цэвэрлэгээ"},{"value":"move_in_out","label":"Move-in/Move-out","label_mn":"Нүүхэд зориулсан"},{"value":"post_renovation","label":"Post-Renovation","label_mn":"Засварын дараах"}]},
      {"key":"supplies_provided","label":"Supplies provided by customer","label_mn":"Захиалагч цэвэрлэгээний хэрэгсэл өгөх эсэх","type":"yes_no","required":true}
    ]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Cleaning';
```

Note: `is_last_known_good` column removed — no longer in INSERT.

- [ ] **Step 2: Rewrite Moving & Hauling schema**

Replace the Moving & Hauling INSERT (lines 23-27) with:

```sql
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[
      {"key":"moving_scope","label":"Moving scope","label_mn":"Зөөврийн хэмжээ","type":"multi_select","required":true,"options":[{"value":"few_items","label":"A few items","label_mn":"Цөөн зүйл"},{"value":"1_2_room","label":"1-2 room apartment","label_mn":"1-2 өрөө"},{"value":"3_plus_room","label":"3+ room apartment","label_mn":"3+ өрөө"},{"value":"office","label":"Office","label_mn":"Оффис"}]},
      {"key":"origin_floor","label":"Origin floor access","label_mn":"Гарах давхрын нөхцөл","type":"single_select","required":true,"options":[{"value":"ground","label":"Ground","label_mn":"1-р давхар"},{"value":"2_4_no_elevator","label":"2nd-4th (no elevator)","label_mn":"2-4 давхар (лифтгүй)"},{"value":"5_plus_no_elevator","label":"5+ (no elevator)","label_mn":"5+ давхар (лифтгүй)"},{"value":"freight_elevator","label":"Freight elevator","label_mn":"Ачааны лифт"},{"value":"passenger_elevator","label":"Passenger elevator","label_mn":"Зорчигчийн лифт"}]},
      {"key":"destination_floor","label":"Destination floor access","label_mn":"Очих давхрын нөхцөл","type":"single_select","required":true,"options":[{"value":"ground","label":"Ground","label_mn":"1-р давхар"},{"value":"2_4_no_elevator","label":"2nd-4th (no elevator)","label_mn":"2-4 давхар (лифтгүй)"},{"value":"5_plus_no_elevator","label":"5+ (no elevator)","label_mn":"5+ давхар (лифтгүй)"},{"value":"freight_elevator","label":"Freight elevator","label_mn":"Ачааны лифт"},{"value":"passenger_elevator","label":"Passenger elevator","label_mn":"Зорчигчийн лифт"}]},
      {"key":"heavy_lifting","label":"Heavy lifting required","label_mn":"Хүнд зүйл зөөх шаардлагатай эсэх","type":"yes_no","required":true}
    ]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Moving & Hauling';
```

- [ ] **Step 3: Rewrite Handyman schema**

Replace the Handyman INSERT (lines 38-42) with:

```sql
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[
      {"key":"issue_type","label":"Type of work","label_mn":"Ажлын төрөл","type":"single_select","required":true,"options":[{"value":"furniture_assembly","label":"Furniture assembly","label_mn":"Тавилга угсрах"},{"value":"wall_repair","label":"Wall repair","label_mn":"Ханын засвар"},{"value":"door_window_fix","label":"Door/window fix","label_mn":"Хаалга/цонхны засвар"},{"value":"shelving_mounting","label":"Shelving/mounting","label_mn":"Тавиур бэхлэх"},{"value":"other","label":"Other","label_mn":"Бусад"}]},
      {"key":"tools_needed","label":"Special tools needed","label_mn":"Тусгай багаж хэрэгсэл шаардлагатай эсэх","type":"yes_no","required":true},
      {"key":"estimated_hours","label":"Estimated hours","label_mn":"Таамаглаж буй цаг","type":"numeric_counter","required":true,"min":1,"max":8}
    ]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Handyman';
```

- [ ] **Step 4: Update the category UPDATE statements**

Remove `is_last_known_good` references from the three category UPDATE blocks. Each becomes (e.g., Cleaning):

```sql
UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Cleaning';
```

(These should already be correct — they don't reference `is_last_known_good`. Just verify.)

- [ ] **Step 5: Commit**

```bash
git add services/api/src/main/resources/db/migration/V11__seed_intake_schemas.sql
git commit -m "refactor(db): rewrite seed schemas with structured options and label_mn"
```

---

### Task 3: Backend DTOs — Remove LKG Fields

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/dto/CategoryState.java`
- Modify: `services/api/src/main/java/mn/tasky/category/dto/CategorySchemaVersion.java`
- Modify: `services/api/src/main/java/mn/tasky/category/dto/SchemaVersionResponse.java`

- [ ] **Step 1: Remove `lastKnownGoodSchemaVersion` from CategoryState**

Replace the full record:

```java
package mn.tasky.category.dto;

import org.springframework.lang.Nullable;

public record CategoryState(
        String id,
        String name,
        String nameMn,
        String iconUrl,
        boolean isActive,
        int sortOrder,
        @Nullable Boolean intakeEnabled,
        @Nullable Integer intakeSchemaVersion,
        @Nullable String intakeSchemaJson) {}
```

- [ ] **Step 2: Remove `isLastKnownGood` from CategorySchemaVersion**

Replace the full record:

```java
package mn.tasky.category.dto;

import java.time.Instant;

public record CategorySchemaVersion(
        String id,
        String categoryId,
        int version,
        String schemaJson,
        String status,
        String createdBy,
        Instant createdAt,
        Instant activatedAt) {}
```

- [ ] **Step 3: Remove `isLastKnownGood` from SchemaVersionResponse**

Replace the full record:

```java
package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record SchemaVersionResponse(
        String id,
        @JsonProperty("category_id") String categoryId,
        int version,
        @JsonProperty("schema_json") String schemaJson,
        String status,
        @JsonProperty("created_by") String createdBy,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("activated_at") Instant activatedAt) {}
```

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/dto/CategoryState.java \
      services/api/src/main/java/mn/tasky/category/dto/CategorySchemaVersion.java \
      services/api/src/main/java/mn/tasky/category/dto/SchemaVersionResponse.java
git commit -m "refactor(dto): remove last-known-good fields from category DTOs"
```

---

### Task 4: CategoryDao — Remove LKG Parameter

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`

- [ ] **Step 1: Update insert methods**

Remove `lastKnownGoodSchemaVersion` from both insert overloads. Default wrapper becomes:

```java
default void insert(
        String id,
        String name,
        String nameMn,
        String iconUrl,
        boolean isActive,
        int sortOrder,
        Boolean intakeEnabled,
        Integer intakeSchemaVersion,
        String intakeSchemaJson) {
    insert(
            required(id, "id"),
            name,
            nameMn,
            iconUrl,
            isActive,
            sortOrder,
            intakeEnabled,
            intakeSchemaVersion,
            intakeSchemaJson);
}
```

SQL insert becomes:

```java
@SqlUpdate("INSERT INTO categories (id, name, name_mn, icon_url, is_active, sort_order, "
        + "intake_enabled, intake_schema_version, intake_schema_json) "
        + "VALUES (:id, :name, :nameMn, :iconUrl, :isActive, :sortOrder, "
        + "COALESCE(:intakeEnabled, true), :intakeSchemaVersion, "
        + "CAST(:intakeSchemaJson AS jsonb))")
void insert(
        @Bind("id") UUID id,
        @Bind("name") String name,
        @Bind("nameMn") String nameMn,
        @Bind("iconUrl") String iconUrl,
        @Bind("isActive") boolean isActive,
        @Bind("sortOrder") int sortOrder,
        @Bind("intakeEnabled") Boolean intakeEnabled,
        @Bind("intakeSchemaVersion") Integer intakeSchemaVersion,
        @Bind("intakeSchemaJson") String intakeSchemaJson);
```

- [ ] **Step 2: Update update methods**

Same removal for both update overloads. Default wrapper:

```java
default void update(
        String id,
        String name,
        String nameMn,
        String iconUrl,
        boolean isActive,
        int sortOrder,
        Boolean intakeEnabled,
        Integer intakeSchemaVersion,
        String intakeSchemaJson) {
    update(
            required(id, "id"),
            name,
            nameMn,
            iconUrl,
            isActive,
            sortOrder,
            intakeEnabled,
            intakeSchemaVersion,
            intakeSchemaJson);
}
```

SQL update becomes:

```java
@SqlUpdate("UPDATE categories SET name = :name, name_mn = :nameMn, icon_url = :iconUrl, "
        + "is_active = :isActive, sort_order = :sortOrder, "
        + "intake_enabled = COALESCE(:intakeEnabled, intake_enabled), "
        + "intake_schema_version = :intakeSchemaVersion, "
        + "intake_schema_json = CAST(:intakeSchemaJson AS jsonb) "
        + "WHERE id = :id")
void update(
        @Bind("id") UUID id,
        @Bind("name") String name,
        @Bind("nameMn") String nameMn,
        @Bind("iconUrl") String iconUrl,
        @Bind("isActive") boolean isActive,
        @Bind("sortOrder") int sortOrder,
        @Bind("intakeEnabled") Boolean intakeEnabled,
        @Bind("intakeSchemaVersion") Integer intakeSchemaVersion,
        @Bind("intakeSchemaJson") String intakeSchemaJson);
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java
git commit -m "refactor(dao): remove last_known_good_schema_version from CategoryDao"
```

---

### Task 5: CategorySchemaVersionDao — Remove LKG Methods

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`

- [ ] **Step 1: Remove LKG methods**

Delete these 6 methods (lines 74-103):

- `clearLastKnownGood(String categoryId)` (line 74-76)
- `clearLastKnownGood(UUID categoryId)` (line 78-79)
- `markLastKnownGood(String id)` (line 81-83)
- `markLastKnownGood(UUID id)` (line 85-86)
- `findLastKnownGoodByCategoryId(String categoryId)` (line 95-97)
- `findLastKnownGoodByCategoryId(UUID categoryId)` (line 99-103)

- [ ] **Step 2: Remove `is_last_known_good` from SELECT clauses**

Update all `@SqlQuery` annotations that select `is_last_known_good`. There are 4 query methods:

- `findByCategoryId` (line 41-44): remove `is_last_known_good,` from SELECT
- `findByCategoryIdAndVersion` (line 51-52): remove `is_last_known_good,` from SELECT
- `findActiveByCategoryId` (line 61-64): remove `is_last_known_good,` from SELECT

Each becomes (example for `findByCategoryId`):

```java
@SqlQuery("SELECT id, category_id, version, schema_json, status, "
        + "created_by, created_at, activated_at "
        + "FROM category_schema_versions WHERE category_id = :categoryId "
        + "ORDER BY version DESC")
List<CategorySchemaVersion> findByCategoryId(@Bind("categoryId") UUID categoryId);
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java
git commit -m "refactor(dao): remove LKG methods from CategorySchemaVersionDao"
```

---

### Task 6: CategoryService — Remove LKG References

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/application/CategoryService.java:97-159`

- [ ] **Step 1: Update createCategory**

Remove the `null` LKG argument from the `CategoryState` constructor and `categoryDao.insert()` call. Lines 98-120 become:

```java
public CategoryState createCategory(CreateCategory command) {
    CategoryState created = new CategoryState(
            UUID.randomUUID().toString(),
            command.name().trim(),
            command.nameMn().trim(),
            command.iconUrl().trim(),
            true,
            command.sortOrder(),
            null,
            null,
            null);
    categoryDao.insert(
            created.id(),
            created.name(),
            created.nameMn(),
            created.iconUrl(),
            created.isActive(),
            created.sortOrder(),
            created.intakeEnabled(),
            created.intakeSchemaVersion(),
            created.intakeSchemaJson());
    return created;
}
```

- [ ] **Step 2: Update updateCategory**

Remove LKG from the `CategoryState` constructor and `categoryDao.update()` call. Lines 137-159 become:

```java
CategoryState updated = new CategoryState(
        current.id(),
        command.name() != null ? command.name().trim() : current.name(),
        command.nameMn() != null ? command.nameMn().trim() : current.nameMn(),
        command.iconUrl() != null ? command.iconUrl().trim() : current.iconUrl(),
        command.isActive() != null ? command.isActive() : current.isActive(),
        command.sortOrder() != null ? command.sortOrder() : current.sortOrder(),
        current.intakeEnabled(),
        current.intakeSchemaVersion(),
        current.intakeSchemaJson());
categoryDao.update(
        updated.id(),
        updated.name(),
        updated.nameMn(),
        updated.iconUrl(),
        updated.isActive(),
        updated.sortOrder(),
        updated.intakeEnabled(),
        updated.intakeSchemaVersion(),
        updated.intakeSchemaJson());
return Optional.of(updated);
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/application/CategoryService.java
git commit -m "refactor(service): remove LKG references from CategoryService"
```

---

### Task 7: CategoryController — Remove LKG from Response Mapping

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/api/CategoryController.java:201-212`

- [ ] **Step 1: Update toSchemaVersionResponse**

Remove `sv.isLastKnownGood()` from the mapping:

```java
private SchemaVersionResponse toSchemaVersionResponse(CategorySchemaVersion sv) {
    return new SchemaVersionResponse(
            sv.id(),
            sv.categoryId(),
            sv.version(),
            sv.schemaJson(),
            sv.status(),
            sv.createdBy(),
            sv.createdAt(),
            sv.activatedAt());
}
```

- [ ] **Step 2: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/api/CategoryController.java
git commit -m "refactor(api): remove LKG from schema version response"
```

---

### Task 8: CategorySchemaVersionService — Remove Rollback, Fix Activate, Expand Validation

This is the core task. Remove rollback, allow ROLLED_BACK activation, add @Transactional, expand validation for new schema contract.

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`

- [ ] **Step 1: Update constants**

Replace lines 24-29:

```java
private static final Set<String> SUPPORTED_FIELD_TYPES =
        Set.of("single_select", "multi_select", "dropdown", "yes_no", "numeric_counter", "text", "textarea");

private static final Set<String> OPTION_REQUIRED_TYPES = Set.of("single_select", "multi_select", "dropdown");

private static final Set<String> TEXT_TYPES = Set.of("text", "textarea");

private static final int MIN_FIELDS = 3;
private static final int MAX_FIELDS = 5;
```

- [ ] **Step 2: Delete `rollbackToLastKnownGood()` method**

Delete the entire method (lines 154-188).

- [ ] **Step 3: Fix `activate()` — allow ROLLED_BACK, add @Transactional, remove LKG logic**

Add `import org.springframework.transaction.annotation.Transactional;` to imports.

Replace the entire `activate()` method (lines 89-135):

```java
@Transactional
public CategorySchemaVersion activate(String categoryId, int version) {
    CategorySchemaVersion target = schemaVersionDao
            .findByCategoryIdAndVersion(categoryId, version)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Schema version " + version + " not found for category " + categoryId));

    String status = target.status();
    if ("ACTIVE".equals(status)) {
        throw new IllegalStateException("Schema version " + version + " is already active.");
    }
    if (!"DRAFT".equals(status) && !"CANARY".equals(status) && !"ROLLED_BACK".equals(status)) {
        throw new IllegalStateException(
                "Schema version " + version + " cannot be activated from status " + status);
    }

    // Roll back current active version if one exists
    schemaVersionDao
            .findActiveByCategoryId(categoryId)
            .ifPresent(active -> schemaVersionDao.updateStatus(active.id(), "ROLLED_BACK"));

    // Activate the target version
    schemaVersionDao.updateStatusAndActivatedAt(target.id(), "ACTIVE");

    // Update the category with the activated schema
    CategoryState category = categoryDao
            .findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Category " + categoryId + " not found."));

    categoryDao.update(
            category.id(),
            category.name(),
            category.nameMn(),
            category.iconUrl(),
            category.isActive(),
            category.sortOrder(),
            category.intakeEnabled(),
            version,
            target.schemaJson());

    return schemaVersionDao
            .findByCategoryIdAndVersion(categoryId, version)
            .orElseThrow(() -> new IllegalStateException("Activated version could not be retrieved."));
}
```

- [ ] **Step 4: Expand `validateField()` for new schema contract**

Replace the entire `validateField()` method (lines 214-239):

```java
private void validateField(JsonNode field, int index) {
    if (!field.isObject()) {
        throw new IllegalArgumentException("Field at index " + index + " must be a JSON object.");
    }

    String key = requireString(field, "key", index);
    requireString(field, "label", index);
    requireString(field, "label_mn", index);

    String type = requireString(field, "type", index);
    if (!SUPPORTED_FIELD_TYPES.contains(type)) {
        throw new IllegalArgumentException("Field '" + key + "' has unsupported type '" + type
                + "'. Supported types: " + SUPPORTED_FIELD_TYPES);
    }

    if (!field.has("required") || !field.get("required").isBoolean()) {
        throw new IllegalArgumentException("Field '" + key + "' must have a boolean 'required' property.");
    }

    if (OPTION_REQUIRED_TYPES.contains(type)) {
        validateOptionsArray(field, key);
    }

    if (TEXT_TYPES.contains(type)) {
        validateTextConstraints(field, key);
    }

    // Reject options on non-option types
    if (!OPTION_REQUIRED_TYPES.contains(type) && field.has("options")) {
        throw new IllegalArgumentException(
                "Field '" + key + "' of type '" + type + "' must not have an 'options' property.");
    }
}

private void validateOptionsArray(JsonNode field, String key) {
    JsonNode options = field.get("options");
    if (options == null || !options.isArray() || options.isEmpty()) {
        throw new IllegalArgumentException(
                "Field '" + key + "' must have a non-empty 'options' array.");
    }
    for (int i = 0; i < options.size(); i++) {
        JsonNode opt = options.get(i);
        if (!opt.isObject()) {
            throw new IllegalArgumentException(
                    "Field '" + key + "' option at index " + i + " must be a JSON object.");
        }
        requireOptionString(opt, "value", key, i);
        requireOptionString(opt, "label", key, i);
        requireOptionString(opt, "label_mn", key, i);
    }
}

private void requireOptionString(JsonNode opt, String property, String fieldKey, int optIndex) {
    JsonNode node = opt.get(property);
    if (node == null || !node.isTextual() || node.asText().isBlank()) {
        throw new IllegalArgumentException(
                "Field '" + fieldKey + "' option at index " + optIndex
                        + " must have a non-blank string '" + property + "' property.");
    }
}

private void validateTextConstraints(JsonNode field, String key) {
    JsonNode maxLength = field.get("max_length");
    if (maxLength == null || !maxLength.isInt() || maxLength.asInt() <= 0) {
        throw new IllegalArgumentException(
                "Field '" + key + "' of type '" + field.get("type").asText()
                        + "' must have a positive integer 'max_length' property.");
    }
    JsonNode minLength = field.get("min_length");
    if (minLength != null) {
        if (!minLength.isInt() || minLength.asInt() < 0) {
            throw new IllegalArgumentException(
                    "Field '" + key + "': 'min_length' must be a non-negative integer.");
        }
        if (minLength.asInt() >= maxLength.asInt()) {
            throw new IllegalArgumentException(
                    "Field '" + key + "': 'min_length' must be less than 'max_length'.");
        }
    }
}
```

- [ ] **Step 5: Verify the file compiles**

Run: `cd services/api && ../../gradlew compileJava 2>&1 | tail -10`

- [ ] **Step 6: Commit**

```bash
git add services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java
git commit -m "feat(service): remove rollback, fix activate, expand schema validation for new contract"
```

---

### Task 9: TaskService.validateIntakeAnswers — Structured Options + Text Types

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskService.java:294-404`

- [ ] **Step 1: Update validateIntakeAnswers**

Replace the entire method (lines 294-404):

```java
private String validateIntakeAnswers(String schemaJson, String answersJson) {
    try {
        JsonNode schemaArray = objectMapper.readTree(schemaJson);
        if (!schemaArray.isArray()) {
            return "Schema is not a valid JSON array.";
        }
        Map<String, Object> answers = objectMapper.readValue(answersJson, new TypeReference<>() {});
        JsonNode answersNode = objectMapper.readTree(answersJson);

        List<String> errors = new ArrayList<>();

        for (JsonNode field : schemaArray) {
            String key = field.has("key") ? field.get("key").asText() : null;
            if (key == null) {
                continue;
            }
            String label = field.has("label") ? field.get("label").asText() : key;
            String type = field.has("type") ? field.get("type").asText() : "text";
            boolean required =
                    field.has("required") && field.get("required").asBoolean();

            Object answerValue = answers.get(key);
            JsonNode answerNode = answersNode.get(key);

            // Required field check
            if (required && (answerValue == null || (answerValue instanceof String s && s.isBlank()))) {
                errors.add(label + " is required.");
                continue;
            }

            // Skip further validation if answer is not provided
            if (answerValue == null) {
                continue;
            }

            // Type-specific validation
            switch (type) {
                case "single_select", "dropdown" -> {
                    if (field.has("options") && field.get("options").isArray()) {
                        List<String> validValues = new ArrayList<>();
                        for (JsonNode opt : field.get("options")) {
                            if (opt.isObject() && opt.has("value")) {
                                validValues.add(opt.get("value").asText());
                            }
                        }
                        String val = String.valueOf(answerValue);
                        if (!validValues.contains(val)) {
                            errors.add(label + ": '" + val + "' is not a valid option.");
                        }
                    }
                }
                case "multi_select" -> {
                    if (field.has("options") && field.get("options").isArray()
                            && answerNode != null && answerNode.isArray()) {
                        List<String> validValues = new ArrayList<>();
                        for (JsonNode opt : field.get("options")) {
                            if (opt.isObject() && opt.has("value")) {
                                validValues.add(opt.get("value").asText());
                            }
                        }
                        for (JsonNode selectedNode : answerNode) {
                            String selected = selectedNode.asText();
                            if (!validValues.contains(selected)) {
                                errors.add(label + ": '" + selected + "' is not a valid option.");
                            }
                        }
                    }
                }
                case "numeric_counter" -> {
                    try {
                        double numVal;
                        if (answerValue instanceof Number num) {
                            numVal = num.doubleValue();
                        } else {
                            numVal = Double.parseDouble(String.valueOf(answerValue));
                        }
                        if (field.has("min") && numVal < field.get("min").asDouble()) {
                            errors.add(label + ": value must be at least "
                                    + field.get("min").asText() + ".");
                        }
                        if (field.has("max") && numVal > field.get("max").asDouble()) {
                            errors.add(label + ": value must be at most "
                                    + field.get("max").asText() + ".");
                        }
                    } catch (NumberFormatException e) {
                        errors.add(label + ": value must be numeric.");
                    }
                }
                case "yes_no" -> {
                    if (answerValue instanceof Boolean) {
                        // valid
                    } else {
                        String strVal = String.valueOf(answerValue).toLowerCase(Locale.ROOT);
                        if (!"yes".equals(strVal)
                                && !"no".equals(strVal)
                                && !"true".equals(strVal)
                                && !"false".equals(strVal)) {
                            errors.add(label + ": value must be yes/no or true/false.");
                        }
                    }
                }
                case "text", "textarea" -> {
                    String strVal = String.valueOf(answerValue);
                    if (field.has("max_length")) {
                        int maxLen = field.get("max_length").asInt();
                        if (strVal.length() > maxLen) {
                            errors.add(label + ": value must be at most " + maxLen + " characters.");
                        }
                    }
                    if (field.has("min_length")) {
                        int minLen = field.get("min_length").asInt();
                        if (strVal.length() < minLen) {
                            errors.add(label + ": value must be at least " + minLen + " characters.");
                        }
                    }
                }
                default -> {
                    // no additional validation for unknown types
                }
            }
        }

        if (errors.isEmpty()) {
            return null;
        }
        return String.join(" ", errors);
    } catch (Exception e) {
        log.warn("Failed to validate intake answers against schema", e);
        return "Failed to validate intake answers: " + e.getMessage();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/application/TaskService.java
git commit -m "feat(validation): update intake validation for structured options and text types"
```

---

### Task 10: ScopeSummaryGenerator — Resolve Option Labels

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/application/ScopeSummaryGenerator.java:58-72,85-103`

- [ ] **Step 1: Update generate() to resolve option labels**

Replace the field-iteration loop (lines 58-72):

```java
List<String> lines = new ArrayList<>();
for (JsonNode field : schemaArray) {
    String key = field.get("key").asText();
    String label = field.get("label").asText();

    Object value = answers.get(key);
    if (value == null) {
        continue;
    }

    String formattedValue = formatValue(value, field, answersJson, key);
    lines.add(label + ": " + formattedValue);
}
```

- [ ] **Step 2: Update formatValue to accept the field node and resolve labels**

Replace the entire `formatValue` method (lines 85-103):

```java
private String formatValue(Object value, JsonNode field, String answersJson, String key) {
    // For option types, resolve value → label
    if (field.has("options") && field.get("options").isArray()) {
        Map<String, String> valueLabelMap = new java.util.HashMap<>();
        for (JsonNode opt : field.get("options")) {
            if (opt.isObject() && opt.has("value") && opt.has("label")) {
                valueLabelMap.put(opt.get("value").asText(), opt.get("label").asText());
            }
        }

        if (value instanceof List<?> listValue) {
            return listValue.stream()
                    .map(v -> valueLabelMap.getOrDefault(String.valueOf(v), String.valueOf(v)))
                    .collect(Collectors.joining(", "));
        }

        // Check if raw JSON is array
        try {
            JsonNode answersNode = objectMapper.readTree(answersJson);
            JsonNode valueNode = answersNode.get(key);
            if (valueNode != null && valueNode.isArray()) {
                return StreamSupport.stream(valueNode.spliterator(), false)
                        .map(n -> valueLabelMap.getOrDefault(n.asText(), n.asText()))
                        .collect(Collectors.joining(", "));
            }
        } catch (Exception ignored) {
            // fall through
        }

        String strVal = String.valueOf(value);
        return valueLabelMap.getOrDefault(strVal, strVal);
    }

    // Non-option types: format directly
    if (value instanceof List<?> listValue) {
        return listValue.stream().map(String::valueOf).collect(Collectors.joining(", "));
    }
    return String.valueOf(value);
}
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/application/ScopeSummaryGenerator.java
git commit -m "feat(summary): resolve option value→label in scope summary generation"
```

---

### Task 11: CategoryScenarioTests — Update for New Contract

**Files:**

- Modify: `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`

- [ ] **Step 1: Update test schema constants**

Replace lines 35-55:

```java
// Three valid required fields — minimal passing schema (new contract with label_mn + structured options)
private static final String VALID_3_FIELD_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String TOO_FEW_FIELDS_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String TOO_MANY_FIELDS_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"d\",\"label\":\"D\",\"label_mn\":\"D_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"e\",\"label\":\"E\",\"label_mn\":\"E_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"f\",\"label\":\"F\",\"label_mn\":\"F_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String UNSUPPORTED_TYPE_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"free_text\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String MISSING_LABEL_MN_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String VALID_TEXT_TEXTAREA_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"text\",\"required\":true,\"max_length\":200},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"textarea\",\"required\":false,\"max_length\":2000},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String TEXT_MISSING_MAX_LENGTH_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"text\",\"required\":true},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

private static final String INVALID_OPTIONS_SCHEMA =
        "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"single_select\",\"required\":true,"
        + "\"options\":[{\"value\":\"x\",\"label\":\"X\"}]},"
        + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
        + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";
```

- [ ] **Step 2: Update helper methods**

Replace the `activeCategory()` helper (line 74-77) — remove LKG field:

```java
private CategoryState activeCategory() {
    return new CategoryState(CAT_ID, "Test", "Тест", "https://example.com/icon.png",
            true, 1, true, 1, VALID_3_FIELD_SCHEMA);
}
```

Replace the `schemaVersion()` helper (line 79-82) — remove isLastKnownGood:

```java
private CategorySchemaVersion schemaVersion(int version, String status) {
    return new CategorySchemaVersion(UUID.randomUUID().toString(), CAT_ID, version,
            VALID_3_FIELD_SCHEMA, status, ADMIN_ID, Instant.now(), null);
}
```

- [ ] **Step 3: Delete old SCN-007 and SCN-008 tests**

Delete lines 179-212 (rollbackRestoresLastKnownGoodVersion and rollbackWithoutLastKnownGoodFails).

- [ ] **Step 4: Update SCN-006 to test ROLLED_BACK activation**

Replace the SCN-006 test:

```java
@Test
@DisplayName("SCN-CATEGORY-006: Admin can activate a schema version, including from ROLLED_BACK status")
void activationFromRolledBackStatusSucceeds() {
    CategorySchemaVersion rolledBack = schemaVersion(1, "ROLLED_BACK");
    when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 1))
            .thenReturn(Optional.of(rolledBack));
    when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
    when(schemaVersionDao.findActiveByCategoryId(CAT_ID))
            .thenReturn(Optional.of(schemaVersion(2, "ACTIVE")));
    when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 1))
            .thenReturn(Optional.of(rolledBack));

    schemaVersionService.activate(CAT_ID, 1);

    verify(schemaVersionDao).updateStatusAndActivatedAt(eq(rolledBack.id()), eq("ACTIVE"));
}
```

- [ ] **Step 5: Add new test scenarios**

Add after the existing tests:

```java
// ── SCN-CATEGORY-007 (new) ──────────────────────────────────────────

@Test
@DisplayName("SCN-CATEGORY-007: Schema with missing label_mn is rejected")
void schemaWithMissingLabelMnRejected() {
    assertThatThrownBy(() ->
            schemaVersionService.createVersion(CAT_ID, MISSING_LABEL_MN_SCHEMA, ADMIN_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("label_mn");
}

// ── SCN-CATEGORY-008 (new) ──────────────────────────────────────────

@Test
@DisplayName("SCN-CATEGORY-008: Schema with text and textarea field types is accepted")
void schemaWithTextAndTextareaTypesAccepted() {
    when(schemaVersionDao.findMaxVersion(CAT_ID)).thenReturn(Optional.of(0));
    when(schemaVersionDao.findByCategoryIdAndVersion(eq(CAT_ID), eq(1)))
            .thenReturn(Optional.of(schemaVersion(1, "DRAFT")));

    CategorySchemaVersion result = schemaVersionService.createVersion(
            CAT_ID, VALID_TEXT_TEXTAREA_SCHEMA, ADMIN_ID);

    assertThat(result).isNotNull();
}

// ── SCN-CATEGORY-009 ────────────────────────────────────────────────

@Test
@DisplayName("SCN-CATEGORY-009: Text field without max_length is rejected")
void textFieldWithoutMaxLengthRejected() {
    assertThatThrownBy(() ->
            schemaVersionService.createVersion(CAT_ID, TEXT_MISSING_MAX_LENGTH_SCHEMA, ADMIN_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("max_length");
}

// ── SCN-CATEGORY-010 ────────────────────────────────────────────────

@Test
@DisplayName("SCN-CATEGORY-010: Activation from ROLLED_BACK status succeeds")
void activateFromRolledBackStatus() {
    CategorySchemaVersion target = schemaVersion(1, "ROLLED_BACK");
    when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 1))
            .thenReturn(Optional.of(target));
    when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
    when(schemaVersionDao.findActiveByCategoryId(CAT_ID)).thenReturn(Optional.empty());

    schemaVersionService.activate(CAT_ID, 1);

    verify(schemaVersionDao).updateStatusAndActivatedAt(eq(target.id()), eq("ACTIVE"));
}

// ── SCN-CATEGORY-011 ────────────────────────────────────────────────

@Test
@DisplayName("SCN-CATEGORY-011: Option objects missing label_mn are rejected")
void optionWithMissingLabelMnRejected() {
    assertThatThrownBy(() ->
            schemaVersionService.createVersion(CAT_ID, INVALID_OPTIONS_SCHEMA, ADMIN_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("label_mn");
}
```

- [ ] **Step 6: Run tests**

Run: `cd services/api && ../../gradlew test --tests "mn.tasky.category.CategoryScenarioTests" 2>&1 | tail -20`
Expected: All tests pass (11 scenarios)

- [ ] **Step 7: Commit**

```bash
git add services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java
git commit -m "test(category): update scenario tests for new schema contract"
```

---

### Task 12: V19 Test Seed Data — Update Intake Answers

The test seed data uses free-form JSON for intake answers. These don't strictly need to match the schema (they're test data for various categories, most without schemas), but the Cleaning and Moving & Hauling tasks should use `value` keys matching the new structured options.

**Files:**

- Modify: `services/api/src/main/resources/db/migration/V19__seed_test_data.sql:240-303`

- [ ] **Step 1: Update Cleaning task intake answers**

Line 247 — task 40000000-...-001 (Cleaning):

```sql
'{"property_type": "apartment", "size_or_rooms": 7, "supplies_provided": true}'::jsonb
```

Line 278 — task 40000000-...-009 (Cleaning):

```sql
'{"property_type": "apartment", "size_or_rooms": 4, "cleaning_type": "post_renovation", "supplies_provided": true}'::jsonb
```

- [ ] **Step 2: Update Moving & Hauling task intake answers**

Line 271 — task 40000000-...-007 (Moving & Hauling):

```sql
'{"moving_scope": ["few_items"], "origin_floor": "5_plus_no_elevator", "destination_floor": "passenger_elevator", "heavy_lifting": true}'::jsonb
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/resources/db/migration/V19__seed_test_data.sql
git commit -m "fix(seed): update test intake answers to use structured option values"
```

---

### Task 13: Mobile intake.tsx — Types, Renderers, i18n

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`

- [ ] **Step 1: Update types**

Replace lines 13-25:

```typescript
// ── Schema types ──────────────────────────────────────────────────────────────

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

- [ ] **Step 2: Add locale helper**

Add after the `parseAnswers` function (after line 50):

```typescript
function getFieldLabel(field: { label: string; label_mn: string }, locale: string): string {
  return locale === 'mn' ? field.label_mn : field.label;
}
```

- [ ] **Step 3: Update ChipGroup to use structured options**

Replace the `ChipGroup` component (lines 54-116):

```typescript
function ChipGroup({
  options,
  value,
  multi,
  onChange,
  testIDPrefix,
  locale,
}: {
  options: IntakeFieldOption[];
  value: string | string[] | null;
  multi: boolean;
  onChange: (v: string | string[]) => void;
  testIDPrefix: string;
  locale: string;
}) {
  const selected = multi
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string'
      ? [value]
      : [];

  const toggle = (optValue: string) => {
    if (multi) {
      const arr = selected.includes(optValue)
        ? selected.filter((s) => s !== optValue)
        : [...selected, optValue];
      onChange(arr);
    } else {
      onChange(optValue);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-sm">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        const displayLabel = locale === 'mn' ? opt.label_mn : opt.label;
        return (
          <Pressable
            key={opt.value}
            onPress={() => toggle(opt.value)}
            className="px-md py-sm rounded-sm justify-center items-center"
            style={[
              { minHeight: 40 },
              active
                ? { ...elevations.soft, backgroundColor: '#1B3A5C' }
                : { backgroundColor: '#F3F1EC' },
            ]}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${opt.value}`}
          >
            <Text
              className={
                active
                  ? 'text-caption font-bold text-primary-foreground'
                  : 'text-caption font-bold text-text-secondary'
              }
            >
              {displayLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Update renderSchemaField for all 7 types**

Replace the `renderSchemaField` function (lines 264-314):

```typescript
const locale = i18n.language ?? 'en';

const renderSchemaField = (field: IntakeField) => {
  const error = fieldErrors[field.key];
  const fieldLabel = getFieldLabel(field, locale);

  if (field.type === 'single_select' || field.type === 'multi_select' || field.type === 'dropdown') {
    const val =
      (answers[field.key] as string | string[] | undefined) ??
      (field.type === 'multi_select' ? [] : null);
    return (
      <FormField key={field.key} label={fieldLabel} errorText={error}>
        <ChipGroup
          options={field.options ?? []}
          value={val as string | string[] | null}
          multi={field.type === 'multi_select'}
          onChange={(v) => setField(field.key, v)}
          testIDPrefix={field.key}
          locale={locale}
        />
      </FormField>
    );
  }
  if (field.type === 'yes_no') {
    const val = answers[field.key];
    const boolVal = val === true ? true : val === false ? false : null;
    return (
      <FormField key={field.key} label={fieldLabel} errorText={error}>
        <YesNo
          value={boolVal}
          onChange={(v) => setField(field.key, v)}
          testIDPrefix={field.key}
        />
      </FormField>
    );
  }
  if (field.type === 'numeric_counter') {
    const val = answers[field.key];
    return (
      <FormField key={field.key} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${field.key}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => {
            setField(field.key, text === '' ? '' : Number(text));
          }}
          placeholder={field.min != null && field.max != null ? `${field.min}–${field.max}` : ''}
          keyboardType="numeric"
          maxLength={3}
          invalid={!!error}
        />
      </FormField>
    );
  }
  if (field.type === 'text') {
    const val = answers[field.key];
    return (
      <FormField key={field.key} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${field.key}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => setField(field.key, text)}
          maxLength={field.max_length ?? 200}
          invalid={!!error}
        />
      </FormField>
    );
  }
  if (field.type === 'textarea') {
    const val = answers[field.key];
    return (
      <FormField key={field.key} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${field.key}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => setField(field.key, text)}
          multiline
          numberOfLines={4}
          maxLength={field.max_length ?? 2000}
          invalid={!!error}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />
      </FormField>
    );
  }
  return null;
};
```

Note: `locale` must be derived from `i18n` (from `useTranslation`). Add `const { t, i18n } = useTranslation();` if not already destructuring `i18n`.

- [ ] **Step 5: Update validate() for new types**

Replace the schema field validation block inside `validate()` (lines 214-244):

```typescript
// Validate schema fields
if (intakeEnabled && schema) {
  const newErrors: Record<string, string> = {};
  for (const field of schema) {
    if (!field.required) continue;
    const val = answers[field.key];
    if (field.type === 'yes_no') {
      if (val !== true && val !== false) {
        newErrors[field.key] = t('Intake.required');
      }
    } else if (field.type === 'multi_select') {
      if (!Array.isArray(val) || val.length === 0) {
        newErrors[field.key] = t('Intake.required');
      }
    } else if (field.type === 'numeric_counter') {
      const num = Number(val);
      if (val === undefined || val === null || val === '' || !Number.isFinite(num)) {
        newErrors[field.key] = t('Intake.required');
      } else if (field.min != null && num < field.min) {
        newErrors[field.key] = t('Intake.minimumValue').replace('{{min}}', String(field.min));
      } else if (field.max != null && num > field.max) {
        newErrors[field.key] = t('Intake.maximumValue').replace('{{max}}', String(field.max));
      }
    } else if (field.type === 'text' || field.type === 'textarea') {
      const strVal = typeof val === 'string' ? val : '';
      if (!strVal.trim()) {
        newErrors[field.key] = t('Intake.required');
      } else if (field.min_length != null && strVal.length < field.min_length) {
        newErrors[field.key] = t('Intake.minimumLength', { min: field.min_length });
      } else if (field.max_length != null && strVal.length > field.max_length) {
        newErrors[field.key] = t('Intake.maximumLength', { max: field.max_length });
      }
    } else {
      // single_select, dropdown
      if (!val) {
        newErrors[field.key] = t('Intake.required');
      }
    }
  }
  setFieldErrors(newErrors);
  if (Object.keys(newErrors).length > 0) valid = false;
}
```

- [ ] **Step 6: Verify typecheck passes**

Run: `cd apps/mobile && pnpm typecheck 2>&1 | tail -10`

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/intake.tsx
git commit -m "feat(mobile): add dropdown/text/textarea renderers, i18n labels, structured options"
```

---

### Task 14: Web IntakeFormRenderer.tsx — Add Text Field Renderers

**Files:**

- Modify: `apps/web/src/components/task-creation/IntakeFormRenderer.tsx`

- [ ] **Step 1: Update IntakeField type to include text constraints**

Replace lines 1-10:

```typescript
export interface IntakeField {
  name: string;
  label: string;
  label_mn: string;
  type:
    | 'single_select'
    | 'multi_select'
    | 'dropdown'
    | 'yes_no'
    | 'numeric_counter'
    | 'text'
    | 'textarea';
  required: boolean;
  options?: { value: string; label: string; label_mn: string }[];
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
}
```

- [ ] **Step 2: Add TextField component**

Add before the `IntakeFormRenderer` export (before line 278):

```typescript
function TextField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: 'en' | 'mn';
}) {
  const fieldLabel = getLabel(field, locale);
  return (
    <div data-field={field.name}>
      <label htmlFor={field.name}>
        {fieldLabel}
        {field.required && <span>*</span>}
      </label>
      <input
        type="text"
        id={field.name}
        value={typeof value === 'string' ? value : ''}
        maxLength={field.max_length}
        aria-required={field.required ? 'true' : undefined}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function TextareaField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: 'en' | 'mn';
}) {
  const fieldLabel = getLabel(field, locale);
  return (
    <div data-field={field.name}>
      <label htmlFor={field.name}>
        {fieldLabel}
        {field.required && <span>*</span>}
      </label>
      <textarea
        id={field.name}
        value={typeof value === 'string' ? value : ''}
        maxLength={field.max_length}
        rows={4}
        aria-required={field.required ? 'true' : undefined}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Add cases to the switch in IntakeFormRenderer**

Add after the `numeric_counter` case (after line 350):

```typescript
case 'text':
  return (
    <TextField
      key={field.name}
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      locale={locale}
    />
  );
case 'textarea':
  return (
    <TextareaField
      key={field.name}
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      locale={locale}
    />
  );
```

- [ ] **Step 4: Verify typecheck passes**

Run: `pnpm --filter @tasky/web typecheck 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/task-creation/IntakeFormRenderer.tsx
git commit -m "feat(web): add text and textarea field renderers to IntakeFormRenderer"
```

---

### Task 15: Web AdminCategoriesPage.tsx — Schema Editor for New Contract

The current admin schema editor is a raw JSON textarea. Update the placeholder and description to guide admins toward the new structured format.

**Files:**

- Modify: `apps/web/src/pages/admin/AdminCategoriesPage.tsx:141-213`

- [ ] **Step 1: Update SchemaFormDialog placeholder and description**

Replace the placeholder (line 197) and description (line 186):

```typescript
<DialogDescription>
  {t(
    'admin.categories.createSchemaDesc',
    'Paste the intake schema JSON array. Each field needs: key, label, label_mn, type, required. Option types need options as [{value, label, label_mn}]. Text types need max_length.',
  )}
</DialogDescription>
```

Update the placeholder:

```typescript
<Textarea
  id="schema-json"
  rows={12}
  value={jsonText}
  onChange={(e) => setJsonText(e.target.value)}
  placeholder={`[
  {
    "key": "example",
    "label": "Example field",
    "label_mn": "Жишээ талбар",
    "type": "single_select",
    "required": true,
    "options": [
      { "value": "opt1", "label": "Option 1", "label_mn": "Сонголт 1" }
    ]
  }
]`}
/>
```

- [ ] **Step 2: Remove `is_last_known_good` from SchemaVersionsPanel display**

Search the `SchemaVersionsPanel` component for any rendering of `is_last_known_good` or `isLastKnownGood` and remove it. The status badges (ACTIVE, DRAFT, CANARY, ROLLED_BACK) are sufficient.

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter @tasky/web typecheck 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/AdminCategoriesPage.tsx
git commit -m "feat(admin): update schema editor for new structured option contract"
```

---

### Task 16: Final Verification

- [ ] **Step 1: Full backend test suite**

Run: `cd services/api && ../../gradlew test 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 2: Frontend typecheck**

Run: `pnpm -r typecheck 2>&1 | tail -20`
Expected: No type errors

- [ ] **Step 3: Frontend lint**

Run: `pnpm -r lint 2>&1 | tail -20`
Expected: No new lint errors

- [ ] **Step 4: Verify DB migration works cleanly**

Run:

```bash
docker compose down -v && docker compose up -d postgres minio minio-bootstrap
cd services/api && ../../gradlew flywayMigrate 2>&1 | tail -10
```

Expected: All migrations applied successfully

- [ ] **Step 5: Commit any remaining fixes, then final commit message**

If all green, no action needed. If any fixes were required, commit them with descriptive messages.
