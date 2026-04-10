# Location Subsystem Finalization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the location subsystem so the mobile app seeds from device location, reverse-geocodes on pin drop, persists location in drafts, sends device coordinates in feed queries, and replaces naive random fuzzing with deterministic district-level approximation.

**Architecture:** Backend adds location columns to `task_drafts`, exposes a provider-agnostic `/location` API surface (initially backed by a district-centroid lookup, swappable to Google/Geoapify after benchmarking), and replaces random coordinate fuzzing with deterministic nearest-district derivation. Mobile installs `expo-location`, wires device location into the map screen and tasker feed queries, and calls the reverse-geocode endpoint on pin drop.

**Tech Stack:** Spring Boot + JDBI 3 + Flyway (backend), React Native + Expo + react-native-maps (mobile), PostGIS (geo queries), expo-location (device location)

---

## File Structure

### Backend — New Files

| File                                                                                      | Responsibility                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| `services/api/src/main/resources/db/migration/V20__location_subsystem.sql`                | Draft location columns + district centroids |
| `services/api/src/main/java/mn/tasky/location/api/LocationController.java`                | Reverse-geocode + search endpoints          |
| `services/api/src/main/java/mn/tasky/location/application/LocationService.java`           | Orchestrates geocoding via provider         |
| `services/api/src/main/java/mn/tasky/location/application/GeocodingProvider.java`         | Provider interface (pluggable)              |
| `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java` | Launch default: nearest-district lookup     |
| `services/api/src/main/java/mn/tasky/location/dao/DistrictGeoDao.java`                    | District centroid queries                   |
| `services/api/src/main/java/mn/tasky/location/dto/ReverseGeocodeResponse.java`            | Response DTO                                |
| `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResponse.java`            | Search results wrapper                      |
| `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResult.java`              | Single search result                        |
| `services/api/src/test/java/mn/tasky/location/DistrictGeocodingProviderTests.java`        | Unit tests for district lookup              |
| `services/api/src/test/java/mn/tasky/location/LocationApiTests.java`                      | Integration tests for endpoints             |
| `services/api/src/test/java/mn/tasky/task/TaskDraftLocationTests.java`                    | Unit tests for draft location               |
| `services/api/src/test/java/mn/tasky/task/LocationFuzzingTests.java`                      | Unit tests for deterministic fuzzing        |

### Backend — Modified Files

| File                                                                         | Change                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `services/api/src/main/java/mn/tasky/task/dto/TaskDraft.java`                | Add `locationLat`, `locationLng`, `locationText`                   |
| `services/api/src/main/java/mn/tasky/task/dto/TaskDraftResponse.java`        | Expose location fields                                             |
| `services/api/src/main/java/mn/tasky/task/dto/UpdateDraftRequest.java`       | Accept location fields                                             |
| `services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java`             | Location-aware INSERT/SELECT/UPDATE                                |
| `services/api/src/main/java/mn/tasky/task/application/TaskDraftService.java` | Accept location params                                             |
| `services/api/src/main/java/mn/tasky/task/api/TaskController.java`           | Inject LocationService, use for fuzzing                            |
| `docs/API.yaml`                                                              | Fix draft contract, add location fields, add `/location` endpoints |

### Mobile — Modified Files

| File                                                    | Change                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/mobile/package.json`                              | Add `expo-location`                                               |
| `apps/mobile/app.json`                                  | Add location permission plugin config                             |
| `apps/mobile/src/utils/permissions.ts`                  | Implement real location permission + getCurrentLocation           |
| `apps/mobile/src/app/(customer)/tasks/new/location.tsx` | Device location seed, locate/zoom buttons, reverse-geocode on pin |
| `apps/mobile/src/features/tasks/hooks/useTasks.ts`      | Pass device coords in task list query                             |

---

## Task 1: Flyway Migration — Draft Location Columns + District Centroids

**Files:**

- Create: `services/api/src/main/resources/db/migration/V20__location_subsystem.sql`

- [ ] **Step 1: Write the migration**

```sql
-- V20__location_subsystem.sql
-- Extend task_drafts with location fields so the wizard can persist pin state.

ALTER TABLE task_drafts
    ADD COLUMN location_lat   DOUBLE PRECISION,
    ADD COLUMN location_lng   DOUBLE PRECISION,
    ADD COLUMN location_text  TEXT;

-- Add centroid coordinates to districts for deterministic fuzzing.
-- These replace the random-offset approach with district-level approximation.

ALTER TABLE districts
    ADD COLUMN centroid_lat DOUBLE PRECISION,
    ADD COLUMN centroid_lng DOUBLE PRECISION;

UPDATE districts SET centroid_lat = 47.9133, centroid_lng = 106.8684 WHERE slug = 'bayangol';
UPDATE districts SET centroid_lat = 47.9322, centroid_lng = 106.9856 WHERE slug = 'bayanzurkh';
UPDATE districts SET centroid_lat = 47.9379, centroid_lng = 106.8919 WHERE slug = 'chingeltei';
UPDATE districts SET centroid_lat = 47.8766, centroid_lng = 106.9782 WHERE slug = 'khan-uul';
UPDATE districts SET centroid_lat = 47.9057, centroid_lng = 106.7674 WHERE slug = 'songinokhairkhan';
UPDATE districts SET centroid_lat = 47.9213, centroid_lng = 106.9197 WHERE slug = 'sukhbaatar';
UPDATE districts SET centroid_lat = 47.7531, centroid_lng = 107.3484 WHERE slug = 'nalaikh';
UPDATE districts SET centroid_lat = 47.8330, centroid_lng = 108.3577 WHERE slug = 'bagakhangai';
UPDATE districts SET centroid_lat = 47.7597, centroid_lng = 108.3512 WHERE slug = 'baganuur';
```

- [ ] **Step 2: Validate the migration locally**

Run: `docker compose up -d postgres && ./gradlew flywayMigrate -i`
Expected: Migration V20 applied successfully, no errors.

- [ ] **Step 3: Verify columns exist**

Run: `docker compose exec postgres psql -U tasky -c "\d task_drafts"` and `docker compose exec postgres psql -U tasky -c "SELECT slug, centroid_lat, centroid_lng FROM districts ORDER BY slug;"`
Expected: `task_drafts` has `location_lat`, `location_lng`, `location_text` columns. All 9 districts have non-null centroid values.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/resources/db/migration/V20__location_subsystem.sql
git commit -m "feat(db): add location columns to task_drafts and district centroids (V20)"
```

---

## Task 2: Backend DTOs — TaskDraft + Request/Response Location Fields

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/dto/TaskDraft.java`
- Modify: `services/api/src/main/java/mn/tasky/task/dto/UpdateDraftRequest.java`
- Modify: `services/api/src/main/java/mn/tasky/task/dto/TaskDraftResponse.java`

- [ ] **Step 1: Write failing test — TaskDraftResponse includes location fields**

Create: `services/api/src/test/java/mn/tasky/task/TaskDraftLocationTests.java`

```java
package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskDraftResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskDraftLocationTests {

    @Test
    @DisplayName("TaskDraftResponse.from() maps location fields")
    void responseIncludesLocationFields() {
        var draft = new TaskDraft(
                "d1", "c1", "cat1", null, 1, null,
                47.9184, 106.9177, "Near State Dept Store",
                Instant.now(), Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isEqualTo(47.9184);
        assertThat(response.locationLng()).isEqualTo(106.9177);
        assertThat(response.locationText()).isEqualTo("Near State Dept Store");
    }

    @Test
    @DisplayName("TaskDraftResponse.from() handles null location")
    void responseHandlesNullLocation() {
        var draft = new TaskDraft(
                "d1", "c1", "cat1", null, 1, null,
                null, null, null,
                Instant.now(), Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isNull();
        assertThat(response.locationLng()).isNull();
        assertThat(response.locationText()).isNull();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "mn.tasky.task.TaskDraftLocationTests" --no-daemon`
Expected: FAIL — `TaskDraft` constructor does not accept location parameters.

- [ ] **Step 3: Update TaskDraft record**

In `services/api/src/main/java/mn/tasky/task/dto/TaskDraft.java`, replace the entire record:

```java
package mn.tasky.task.dto;

import java.time.Instant;

public record TaskDraft(
        String id,
        String customerId,
        String categoryId,
        String intakeAnswersJson,
        int intakeSchemaVersion,
        String summaryDraft,
        Double locationLat,
        Double locationLng,
        String locationText,
        Instant createdAt,
        Instant expiresAt) {}
```

- [ ] **Step 4: Update TaskDraftResponse record**

In `services/api/src/main/java/mn/tasky/task/dto/TaskDraftResponse.java`, replace the entire record:

```java
package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record TaskDraftResponse(
        String id,
        @JsonProperty("customer_id") String customerId,
        @JsonProperty("category_id") String categoryId,
        @JsonProperty("intake_answers") String intakeAnswers,
        @JsonProperty("intake_schema_version") int intakeSchemaVersion,
        @JsonProperty("summary_draft") String summaryDraft,
        @JsonProperty("location_lat") Double locationLat,
        @JsonProperty("location_lng") Double locationLng,
        @JsonProperty("location_text") String locationText,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("expires_at") Instant expiresAt) {

    public static TaskDraftResponse from(TaskDraft draft) {
        return new TaskDraftResponse(
                draft.id(),
                draft.customerId(),
                draft.categoryId(),
                draft.intakeAnswersJson(),
                draft.intakeSchemaVersion(),
                draft.summaryDraft(),
                draft.locationLat(),
                draft.locationLng(),
                draft.locationText(),
                draft.createdAt(),
                draft.expiresAt());
    }
}
```

- [ ] **Step 5: Update UpdateDraftRequest record**

In `services/api/src/main/java/mn/tasky/task/dto/UpdateDraftRequest.java`, replace the entire record:

```java
package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;

public record UpdateDraftRequest(
        @JsonProperty("intake_answers") JsonNode intakeAnswers,
        @JsonProperty("summary_draft") @Size(max = 2000) String summaryDraft,
        @JsonProperty("location_lat") Double locationLat,
        @JsonProperty("location_lng") Double locationLng,
        @JsonProperty("location_text") @Size(max = 500) String locationText) {}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `./gradlew test --tests "mn.tasky.task.TaskDraftLocationTests" --no-daemon`
Expected: PASS — both tests green.

- [ ] **Step 7: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/dto/TaskDraft.java \
       services/api/src/main/java/mn/tasky/task/dto/TaskDraftResponse.java \
       services/api/src/main/java/mn/tasky/task/dto/UpdateDraftRequest.java \
       services/api/src/test/java/mn/tasky/task/TaskDraftLocationTests.java
git commit -m "feat(task): add location fields to draft DTOs"
```

---

## Task 3: Backend DAO + Service — Location-Aware Draft Persistence

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java`
- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskDraftService.java`
- Modify: `services/api/src/main/java/mn/tasky/task/api/TaskController.java` (updateDraft handler)

- [ ] **Step 1: Add failing test — updateDraft persists location**

Append to `services/api/src/test/java/mn/tasky/task/TaskDraftLocationTests.java`:

```java
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.Optional;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.dao.TaskDraftDao;

// ... inside the class body:

    @Test
    @DisplayName("updateDraft passes location fields to DAO")
    void updateDraftPassesLocation() {
        TaskDraftDao dao = mock(TaskDraftDao.class);
        CategoryDao catDao = mock(CategoryDao.class);
        CategorySchemaVersionDao schemaDao = mock(CategorySchemaVersionDao.class);
        var service = new TaskDraftService(dao, catDao, schemaDao);

        var existing = new TaskDraft(
                "d1", "user1", "cat1", null, 1, null,
                null, null, null,
                Instant.now(), Instant.now().plusSeconds(86400));
        when(dao.findById("d1")).thenReturn(Optional.of(existing));

        service.updateDraft("d1", "user1", null, null,
                47.9184, 106.9177, "Near State Dept Store");

        verify(dao).update(eq("d1"), any(), any(),
                eq(47.9184), eq(106.9177), eq("Near State Dept Store"));
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "mn.tasky.task.TaskDraftLocationTests.updateDraftPassesLocation" --no-daemon`
Expected: FAIL — `updateDraft` does not accept location parameters.

- [ ] **Step 3: Update TaskDraftDao — add location to all queries**

Replace the entire file `services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java`:

```java
package mn.tasky.task.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.Optional;
import java.util.UUID;
import mn.tasky.task.dto.TaskDraft;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(TaskDraft.class)
public interface TaskDraftDao {

    default void insert(
            String id,
            String customerId,
            String categoryId,
            String intakeAnswersJson,
            int intakeSchemaVersion,
            String summaryDraft) {
        insert(
                required(id, "id"),
                required(customerId, "customerId"),
                required(categoryId, "categoryId"),
                intakeAnswersJson,
                intakeSchemaVersion,
                summaryDraft);
    }

    @SqlUpdate("INSERT INTO task_drafts (id, customer_id, category_id, intake_answers_json, "
            + "intake_schema_version, summary_draft) "
            + "VALUES (:id, :customerId, :categoryId, CAST(:intakeAnswersJson AS jsonb), "
            + ":intakeSchemaVersion, :summaryDraft)")
    void insert(
            @Bind("id") UUID id,
            @Bind("customerId") UUID customerId,
            @Bind("categoryId") UUID categoryId,
            @Bind("intakeAnswersJson") String intakeAnswersJson,
            @Bind("intakeSchemaVersion") int intakeSchemaVersion,
            @Bind("summaryDraft") String summaryDraft);

    default Optional<TaskDraft> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT id, customer_id, category_id, intake_answers_json, "
            + "intake_schema_version, summary_draft, location_lat, location_lng, "
            + "location_text, created_at, expires_at "
            + "FROM task_drafts WHERE id = :id")
    Optional<TaskDraft> findById(@Bind("id") UUID id);

    default void update(String id, String intakeAnswersJson, String summaryDraft,
                        Double locationLat, Double locationLng, String locationText) {
        update(required(id, "id"), intakeAnswersJson, summaryDraft,
                locationLat, locationLng, locationText);
    }

    @SqlUpdate("UPDATE task_drafts SET intake_answers_json = CAST(:intakeAnswersJson AS jsonb), "
            + "summary_draft = :summaryDraft, "
            + "location_lat = :locationLat, location_lng = :locationLng, "
            + "location_text = :locationText "
            + "WHERE id = :id")
    void update(
            @Bind("id") UUID id,
            @Bind("intakeAnswersJson") String intakeAnswersJson,
            @Bind("summaryDraft") String summaryDraft,
            @Bind("locationLat") Double locationLat,
            @Bind("locationLng") Double locationLng,
            @Bind("locationText") String locationText);
}
```

- [ ] **Step 4: Update TaskDraftService.updateDraft() to accept and pass location**

In `services/api/src/main/java/mn/tasky/task/application/TaskDraftService.java`, replace the `updateDraft` method:

```java
    public TaskDraft updateDraft(
            String draftId, String requestingUserId,
            String intakeAnswersJson, String summaryDraft,
            Double locationLat, Double locationLng, String locationText) {
        TaskDraft existing =
                taskDraftDao.findById(draftId).orElseThrow(() -> new IllegalArgumentException("Draft not found."));

        if (!existing.customerId().equals(requestingUserId)) {
            throw new IllegalArgumentException("Draft not found.");
        }

        if (existing.expiresAt() != null && !existing.expiresAt().isAfter(Instant.now())) {
            throw new IllegalStateException("Draft has expired.");
        }

        taskDraftDao.update(draftId, intakeAnswersJson, summaryDraft,
                locationLat, locationLng, locationText);

        return taskDraftDao
                .findById(draftId)
                .orElseThrow(() -> new IllegalStateException("Draft was updated but could not be retrieved."));
    }
```

- [ ] **Step 5: Update TaskController.updateDraft() to pass location from request body**

In `services/api/src/main/java/mn/tasky/task/api/TaskController.java`, in the `updateDraft` method (PUT /drafts/{id}), change the `taskDraftService.updateDraft(...)` call:

Replace:

```java
        TaskDraft updated =
                taskDraftService.updateDraft(id, principal.userId(),
                        body.intakeAnswers() != null ? body.intakeAnswers().toString() : null,
                        body.summaryDraft());
```

With:

```java
        TaskDraft updated =
                taskDraftService.updateDraft(id, principal.userId(),
                        body.intakeAnswers() != null ? body.intakeAnswers().toString() : null,
                        body.summaryDraft(),
                        body.locationLat(), body.locationLng(), body.locationText());
```

- [ ] **Step 6: Fix any other callers of the old update signature**

Search for other calls to `taskDraftService.updateDraft` or `taskDraftDao.update` and update them. The old 2-arg `update(id, json, summary)` no longer exists — all callers must pass 6 args.

- [ ] **Step 7: Run tests to verify they pass**

Run: `./gradlew test --tests "mn.tasky.task.TaskDraftLocationTests" --no-daemon`
Expected: PASS — all three tests green.

- [ ] **Step 8: Run full test suite to check for compile/signature breakage**

Run: `./gradlew test --no-daemon`
Expected: All existing tests pass (especially `TaskAcceptScenarioTests` which mocks `TaskDraftDao`).

- [ ] **Step 9: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java \
       services/api/src/main/java/mn/tasky/task/application/TaskDraftService.java \
       services/api/src/main/java/mn/tasky/task/api/TaskController.java \
       services/api/src/test/java/mn/tasky/task/TaskDraftLocationTests.java
git commit -m "feat(task): persist location fields in task drafts"
```

---

## Task 4: Backend — GeocodingProvider Interface + District-Based Implementation

**Files:**

- Create: `services/api/src/main/java/mn/tasky/location/application/GeocodingProvider.java`
- Create: `services/api/src/main/java/mn/tasky/location/dto/ReverseGeocodeResponse.java`
- Create: `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResponse.java`
- Create: `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResult.java`
- Create: `services/api/src/main/java/mn/tasky/location/dao/DistrictGeoDao.java`
- Create: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`
- Create: `services/api/src/test/java/mn/tasky/location/DistrictGeocodingProviderTests.java`

- [ ] **Step 1: Write failing test — reverse geocode returns nearest district**

Create: `services/api/src/test/java/mn/tasky/location/DistrictGeocodingProviderTests.java`

```java
package mn.tasky.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.location.application.DistrictGeocodingProvider;
import mn.tasky.location.dao.DistrictGeoDao;
import mn.tasky.location.dao.DistrictGeoDao.DistrictCentroid;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DistrictGeocodingProviderTests {

    private DistrictGeoDao districtGeoDao;
    private DistrictGeocodingProvider provider;

    @BeforeEach
    void setUp() {
        districtGeoDao = mock(DistrictGeoDao.class);
        provider = new DistrictGeocodingProvider(districtGeoDao);

        when(districtGeoDao.findAllCentroids()).thenReturn(List.of(
                new DistrictCentroid("Sukhbaatar", "Сүхбаатар", 47.9213, 106.9197),
                new DistrictCentroid("Bayangol", "Баянгол", 47.9133, 106.8684),
                new DistrictCentroid("Chingeltei", "Чингэлтэй", 47.9379, 106.8919)));
    }

    @Test
    @DisplayName("reverse geocode returns nearest district for point near Sukhbaatar")
    void reverseGeocodeNearSukhbaatar() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(result.district()).isEqualTo("Sukhbaatar");
        assertThat(result.districtMn()).isEqualTo("Сүхбаатар");
        assertThat(result.formattedAddress()).isEqualTo("Sukhbaatar, Ulaanbaatar");
    }

    @Test
    @DisplayName("reverse geocode returns nearest district for point near Bayangol")
    void reverseGeocodeNearBayangol() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9100, 106.8700);

        assertThat(result.district()).isEqualTo("Bayangol");
        assertThat(result.formattedAddress()).isEqualTo("Bayangol, Ulaanbaatar");
    }

    @Test
    @DisplayName("approximate location returns district centroid, not original point")
    void approximateLocationUsesDistrictCentroid() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(result.approximateLat()).isEqualTo(47.9213);
        assertThat(result.approximateLng()).isEqualTo(106.9197);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "mn.tasky.location.DistrictGeocodingProviderTests" --no-daemon`
Expected: FAIL — classes do not exist yet.

- [ ] **Step 3: Create ReverseGeocodeResponse DTO**

Create: `services/api/src/main/java/mn/tasky/location/dto/ReverseGeocodeResponse.java`

```java
package mn.tasky.location.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ReverseGeocodeResponse(
        @JsonProperty("formatted_address") String formattedAddress,
        String district,
        @JsonProperty("district_mn") String districtMn,
        @JsonProperty("approximate_lat") double approximateLat,
        @JsonProperty("approximate_lng") double approximateLng) {}
```

- [ ] **Step 4: Create LocationSearchResult and LocationSearchResponse DTOs**

Create: `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResult.java`

```java
package mn.tasky.location.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LocationSearchResult(
        @JsonProperty("formatted_address") String formattedAddress,
        double lat,
        double lng,
        String district) {}
```

Create: `services/api/src/main/java/mn/tasky/location/dto/LocationSearchResponse.java`

```java
package mn.tasky.location.dto;

import java.util.List;

public record LocationSearchResponse(List<LocationSearchResult> results) {}
```

- [ ] **Step 5: Create DistrictGeoDao**

Create: `services/api/src/main/java/mn/tasky/location/dao/DistrictGeoDao.java`

```java
package mn.tasky.location.dao;

import java.util.List;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

public interface DistrictGeoDao {

    record DistrictCentroid(String name, String nameMn, double centroidLat, double centroidLng) {}

    @SqlQuery("SELECT name, name_mn, centroid_lat, centroid_lng "
            + "FROM districts WHERE is_active = true "
            + "AND centroid_lat IS NOT NULL AND centroid_lng IS NOT NULL")
    @RegisterConstructorMapper(DistrictCentroid.class)
    List<DistrictCentroid> findAllCentroids();
}
```

- [ ] **Step 6: Create GeocodingProvider interface**

Create: `services/api/src/main/java/mn/tasky/location/application/GeocodingProvider.java`

```java
package mn.tasky.location.application;

import java.util.List;
import mn.tasky.location.dto.LocationSearchResult;
import mn.tasky.location.dto.ReverseGeocodeResponse;

/**
 * Provider-agnostic geocoding. Launch default: district-centroid lookup.
 * Swap to Google/Geoapify/Mapbox after provider benchmarking.
 */
public interface GeocodingProvider {

    ReverseGeocodeResponse reverseGeocode(double lat, double lng);

    List<LocationSearchResult> search(String query, Double biasLat, Double biasLng);
}
```

- [ ] **Step 7: Create DistrictGeocodingProvider**

Create: `services/api/src/main/java/mn/tasky/location/application/DistrictGeocodingProvider.java`

```java
package mn.tasky.location.application;

import java.util.List;
import mn.tasky.location.dao.DistrictGeoDao;
import mn.tasky.location.dao.DistrictGeoDao.DistrictCentroid;
import mn.tasky.location.dto.LocationSearchResult;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.stereotype.Component;

/**
 * Launch-default geocoding backed by district centroids.
 * Returns the nearest UB district as the address approximation.
 */
@Component
public class DistrictGeocodingProvider implements GeocodingProvider {

    private final DistrictGeoDao districtGeoDao;

    public DistrictGeocodingProvider(DistrictGeoDao districtGeoDao) {
        this.districtGeoDao = districtGeoDao;
    }

    @Override
    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        List<DistrictCentroid> districts = districtGeoDao.findAllCentroids();
        DistrictCentroid nearest = findNearest(districts, lat, lng);
        return new ReverseGeocodeResponse(
                nearest.name() + ", Ulaanbaatar",
                nearest.name(),
                nearest.nameMn(),
                nearest.centroidLat(),
                nearest.centroidLng());
    }

    @Override
    public List<LocationSearchResult> search(String query, Double biasLat, Double biasLng) {
        List<DistrictCentroid> districts = districtGeoDao.findAllCentroids();
        String q = query.toLowerCase();
        return districts.stream()
                .filter(d -> d.name().toLowerCase().contains(q)
                        || d.nameMn().contains(query))
                .map(d -> new LocationSearchResult(
                        d.name() + ", Ulaanbaatar",
                        d.centroidLat(), d.centroidLng(), d.name()))
                .toList();
    }

    private DistrictCentroid findNearest(List<DistrictCentroid> districts, double lat, double lng) {
        DistrictCentroid nearest = null;
        double minDist = Double.MAX_VALUE;
        for (DistrictCentroid d : districts) {
            double dLat = d.centroidLat() - lat;
            double dLng = d.centroidLng() - lng;
            double dist = dLat * dLat + dLng * dLng;
            if (dist < minDist) {
                minDist = dist;
                nearest = d;
            }
        }
        if (nearest == null) {
            return new DistrictCentroid("Ulaanbaatar", "Улаанбаатар", 47.9184, 106.9177);
        }
        return nearest;
    }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `./gradlew test --tests "mn.tasky.location.DistrictGeocodingProviderTests" --no-daemon`
Expected: PASS — all three tests green.

- [ ] **Step 9: Commit**

```bash
git add services/api/src/main/java/mn/tasky/location/ \
       services/api/src/test/java/mn/tasky/location/DistrictGeocodingProviderTests.java
git commit -m "feat(location): geocoding provider interface with district-centroid default"
```

---

## Task 5: Backend — LocationController + LocationService

**Files:**

- Create: `services/api/src/main/java/mn/tasky/location/application/LocationService.java`
- Create: `services/api/src/main/java/mn/tasky/location/api/LocationController.java`
- Create: `services/api/src/test/java/mn/tasky/location/LocationApiTests.java`

- [ ] **Step 1: Write failing integration test — reverse geocode endpoint**

Create: `services/api/src/test/java/mn/tasky/location/LocationApiTests.java`

Look at how `IntegrationTestBase` is used in the existing `TaskScenarioTests` for the test superclass pattern. This test uses `TestRestTemplate`.

```java
package mn.tasky.location;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import mn.tasky.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class LocationApiTests extends IntegrationTestBase {

    private final TestRestTemplate http = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("GET /location/reverse-geocode returns district-level address")
    void reverseGeocodeReturnsDistrict() {
        String token = obtainCustomerToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<Map> response = http.exchange(
                "http://localhost:" + port + "/api/v1/location/reverse-geocode?lat=47.92&lng=106.92",
                HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("formatted_address");
        assertThat(response.getBody()).containsKey("district");
        assertThat(response.getBody().get("formatted_address").toString()).contains("Ulaanbaatar");
    }

    @Test
    @DisplayName("GET /location/reverse-geocode requires authentication")
    void reverseGeocodeRequiresAuth() {
        ResponseEntity<Map> response = http.exchange(
                "http://localhost:" + port + "/api/v1/location/reverse-geocode?lat=47.92&lng=106.92",
                HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("GET /location/search returns matching districts")
    void searchReturnsDistricts() {
        String token = obtainCustomerToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<Map> response = http.exchange(
                "http://localhost:" + port + "/api/v1/location/search?q=sukh",
                HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("results");
    }
}
```

> **Note:** `obtainCustomerToken()` — check how `IntegrationTestBase` or `TaskScenarioTests` obtains auth tokens and follow the same pattern. Adapt the helper method name to match the existing convention.

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "mn.tasky.location.LocationApiTests" --no-daemon`
Expected: FAIL — endpoint does not exist (404).

- [ ] **Step 3: Create LocationService**

Create: `services/api/src/main/java/mn/tasky/location/application/LocationService.java`

```java
package mn.tasky.location.application;

import mn.tasky.location.dto.LocationSearchResponse;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

    private final GeocodingProvider geocodingProvider;

    public LocationService(GeocodingProvider geocodingProvider) {
        this.geocodingProvider = geocodingProvider;
    }

    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        return geocodingProvider.reverseGeocode(lat, lng);
    }

    public LocationSearchResponse search(String query, Double biasLat, Double biasLng) {
        return new LocationSearchResponse(geocodingProvider.search(query, biasLat, biasLng));
    }
}
```

- [ ] **Step 4: Create LocationController**

Create: `services/api/src/main/java/mn/tasky/location/api/LocationController.java`

```java
package mn.tasky.location.api;

import mn.tasky.location.application.LocationService;
import mn.tasky.location.dto.LocationSearchResponse;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/location")
@Validated
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/reverse-geocode")
    public ResponseEntity<ReverseGeocodeResponse> reverseGeocode(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ResponseEntity.ok(locationService.reverseGeocode(lat, lng));
    }

    @GetMapping("/search")
    public ResponseEntity<LocationSearchResponse> search(
            @RequestParam String q,
            @RequestParam(value = "bias_lat", required = false) Double biasLat,
            @RequestParam(value = "bias_lng", required = false) Double biasLng) {
        return ResponseEntity.ok(locationService.search(q, biasLat, biasLng));
    }
}
```

- [ ] **Step 5: Register DistrictGeoDao in JDBI config**

Find the JDBI configuration class (search for `JdbiPlugin` or `SqlObjectPlugin` or where other DAOs like `TaskDraftDao` are registered). Add `DistrictGeoDao` to the same registration pattern.

- [ ] **Step 6: Run integration tests to verify they pass**

Run: `./gradlew test --tests "mn.tasky.location.LocationApiTests" --no-daemon`
Expected: PASS — all three tests green.

- [ ] **Step 7: Commit**

```bash
git add services/api/src/main/java/mn/tasky/location/ \
       services/api/src/test/java/mn/tasky/location/LocationApiTests.java
git commit -m "feat(location): reverse-geocode and search endpoints with district provider"
```

---

## Task 6: Backend — Deterministic Fuzzing in TaskController

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/task/api/TaskController.java`
- Create: `services/api/src/test/java/mn/tasky/task/LocationFuzzingTests.java`

- [ ] **Step 1: Write failing test — fuzzing uses district lookup instead of random offset**

Create: `services/api/src/test/java/mn/tasky/task/LocationFuzzingTests.java`

```java
package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import mn.tasky.location.application.GeocodingProvider;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LocationFuzzingTests {

    @Test
    @DisplayName("Deterministic fuzzing: same input always returns same district")
    void fuzzingIsDeterministic() {
        GeocodingProvider provider = mock(GeocodingProvider.class);
        when(provider.reverseGeocode(anyDouble(), anyDouble()))
                .thenReturn(new ReverseGeocodeResponse(
                        "Sukhbaatar, Ulaanbaatar", "Sukhbaatar", "Сүхбаатар",
                        47.9213, 106.9197));

        // Call twice with exact same input
        ReverseGeocodeResponse r1 = provider.reverseGeocode(47.9200, 106.9200);
        ReverseGeocodeResponse r2 = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(r1.approximateLat()).isEqualTo(r2.approximateLat());
        assertThat(r1.approximateLng()).isEqualTo(r2.approximateLng());
        assertThat(r1.formattedAddress()).isEqualTo(r2.formattedAddress());
        assertThat(r1.formattedAddress()).doesNotContain("Fuzzed");
    }
}
```

- [ ] **Step 2: Run test to verify it passes (this validates the contract)**

Run: `./gradlew test --tests "mn.tasky.task.LocationFuzzingTests" --no-daemon`
Expected: PASS — the mock validates determinism; the real work is wiring.

- [ ] **Step 3: Inject LocationService into TaskController**

In `services/api/src/main/java/mn/tasky/task/api/TaskController.java`:

Add import:

```java
import mn.tasky.location.application.LocationService;
```

Add field:

```java
    private final LocationService locationService;
```

Update constructor to accept and assign `LocationService`:

```java
    public TaskController(
            TaskService taskService,
            TaskDraftService taskDraftService,
            CategoryService categoryService,
            AuthService authService,
            BookingService bookingService,
            IdempotencyService idempotencyService,
            ObjectMapper objectMapper,
            LocationService locationService) {
        this.taskService = taskService;
        this.taskDraftService = taskDraftService;
        this.categoryService = categoryService;
        this.authService = authService;
        this.bookingService = bookingService;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
        this.locationService = locationService;
    }
```

- [ ] **Step 4: Replace fuzzCoordinates() with locationService in toPublicTaskResponse()**

In `toPublicTaskResponse()`, replace:

```java
        double[] fuzzedLocation = fuzzCoordinates(task.locationLat(), task.locationLng());
        // ...
        response.put("approximate_location", "Ulaanbaatar, Mongolia (Fuzzed)");
        response.put("approximate_lat", fuzzedLocation[0]);
        response.put("approximate_lng", fuzzedLocation[1]);
```

With:

```java
        var approx = locationService.reverseGeocode(task.locationLat(), task.locationLng());
        // ...
        response.put("approximate_location", approx.formattedAddress());
        response.put("approximate_lat", approx.approximateLat());
        response.put("approximate_lng", approx.approximateLng());
```

- [ ] **Step 5: Remove dead code**

Delete `fuzzCoordinates()`, `roundToTwoDecimals()`, the `MAX_PUBLIC_OFFSET_METERS` constant, the `LOCATION_FUZZ_RANDOM` field, and the `SecureRandom` import.

- [ ] **Step 6: Run full test suite**

Run: `./gradlew test --no-daemon`
Expected: All tests pass. If `TaskScenarioTests` integration tests fail, check that `LocationService` is properly wired by Spring (it should be, since `@Service` + `@Component` are in place).

- [ ] **Step 7: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/api/TaskController.java \
       services/api/src/test/java/mn/tasky/task/LocationFuzzingTests.java
git commit -m "feat(task): replace random fuzzing with deterministic district-level approximation"
```

---

## Task 7: API Contract — Fix Draft Mismatch + Location Fields + Location Endpoints

**Files:**

- Modify: `docs/API.yaml`

- [ ] **Step 1: Fix POST /tasks/drafts request schema**

The current API.yaml says `required: [ category_id, intake_answers, intake_schema_version ]` for draft creation, but the server only accepts `category_id` (resolves schema version internally). Fix:

In `docs/API.yaml`, in the POST `/tasks/drafts` requestBody, replace:

```yaml
required: [category_id, intake_answers, intake_schema_version]
properties:
  category_id:
    type: string
    format: uuid
  intake_answers:
    type: object
    additionalProperties: true
  intake_schema_version:
    type: integer
  summary_draft:
    type: string
    nullable: true
```

With:

```yaml
required: [category_id]
properties:
  category_id:
    type: string
    format: uuid
```

- [ ] **Step 2: Add location fields to TaskDraft schema**

In `docs/API.yaml`, in the `TaskDraft` schema under `components/schemas`, add after `summary_draft`:

```yaml
location_lat:
  type: number
  format: double
  nullable: true
location_lng:
  type: number
  format: double
  nullable: true
location_text:
  type: string
  nullable: true
```

- [ ] **Step 3: Add location fields to PUT /tasks/drafts/{id} request body**

In the `put` operation for `/tasks/drafts/{id}`, add to the request schema properties:

```yaml
location_lat:
  type: number
  format: double
  nullable: true
location_lng:
  type: number
  format: double
  nullable: true
location_text:
  type: string
  nullable: true
  maxLength: 500
```

- [ ] **Step 4: Add /location endpoints to API.yaml**

Add new path entries:

```yaml
/location/reverse-geocode:
  get:
    tags: [Location]
    summary: Reverse geocode coordinates
    description: Returns district-level address for the given coordinates.
    operationId: reverseGeocode
    security:
      - BearerAuth: []
    parameters:
      - name: lat
        in: query
        required: true
        schema:
          type: number
          format: double
      - name: lng
        in: query
        required: true
        schema:
          type: number
          format: double
    responses:
      '200':
        description: Geocoded address.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReverseGeocodeResponse'
      '401':
        $ref: '#/components/responses/Unauthorized'

/location/search:
  get:
    tags: [Location]
    summary: Search locations
    description: Returns matching locations for the query string.
    operationId: searchLocations
    security:
      - BearerAuth: []
    parameters:
      - name: q
        in: query
        required: true
        schema:
          type: string
      - name: bias_lat
        in: query
        required: false
        schema:
          type: number
          format: double
      - name: bias_lng
        in: query
        required: false
        schema:
          type: number
          format: double
    responses:
      '200':
        description: Search results.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LocationSearchResponse'
      '401':
        $ref: '#/components/responses/Unauthorized'
```

- [ ] **Step 5: Add response schemas to components/schemas**

```yaml
ReverseGeocodeResponse:
  type: object
  required: [formatted_address, district, approximate_lat, approximate_lng]
  properties:
    formatted_address:
      type: string
    district:
      type: string
    district_mn:
      type: string
    approximate_lat:
      type: number
      format: double
    approximate_lng:
      type: number
      format: double

LocationSearchResponse:
  type: object
  required: [results]
  properties:
    results:
      type: array
      items:
        $ref: '#/components/schemas/LocationSearchResult'

LocationSearchResult:
  type: object
  required: [formatted_address, lat, lng]
  properties:
    formatted_address:
      type: string
    lat:
      type: number
      format: double
    lng:
      type: number
      format: double
    district:
      type: string
```

- [ ] **Step 6: Validate the API contract**

Run: `./gradlew openApiValidate --no-daemon`
Expected: Validation passes with no errors.

- [ ] **Step 7: Regenerate SDK**

Run: `pnpm sdk:generate`
Expected: TypeScript SDK regenerated with new types: `ReverseGeocodeResponse`, `LocationSearchResponse`, `LocationSearchResult`, updated `TaskDraft`, updated `UpdateDraftRequest`.

- [ ] **Step 8: Typecheck all workspaces**

Run: `pnpm -r typecheck`
Expected: Pass. If mobile/web code references old `CreateDraftRequest` shape with `intake_answers`, fix those callers.

- [ ] **Step 9: Commit**

```bash
git add docs/API.yaml packages/sdk/
git commit -m "feat(api): fix draft contract, add location fields and /location endpoints"
```

---

## Task 8: Mobile — Install expo-location + Implement Permission

**Files:**

- Modify: `apps/mobile/package.json` (via `expo install`)
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/src/utils/permissions.ts`

- [ ] **Step 1: Install expo-location**

Run: `cd apps/mobile && npx expo install expo-location`
Expected: `expo-location` added to `package.json` dependencies.

- [ ] **Step 2: Add location permission plugin to app.json**

In `apps/mobile/app.json`, add to the `plugins` array:

```json
[
  "expo-location",
  {
    "locationAlwaysAndWhenInUsePermission": "Tasky uses your location to show nearby tasks and set task location.",
    "locationWhenInUsePermission": "Tasky uses your location to show nearby tasks and set task location."
  }
]
```

- [ ] **Step 3: Implement requestLocationPermission**

In `apps/mobile/src/utils/permissions.ts`, replace the location stub:

```typescript
export async function requestLocationPermission(): Promise<{ status: string }> {
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { status };
  } catch {
    return { status: 'unavailable' };
  }
}
```

- [ ] **Step 4: Add getCurrentLocation utility**

In `apps/mobile/src/utils/permissions.ts`, add:

```typescript
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const Location = require('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/src/utils/permissions.ts
git commit -m "feat(mobile): install expo-location and implement location permission"
```

> **Note:** Run `pnpm install` from repo root after this step to update the lockfile.

---

## Task 9: Mobile — Location Screen Enhancement

**Files:**

- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`

- [ ] **Step 1: Add imports and device-location state**

At the top of `location.tsx`, add:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { getCurrentLocation } from '../../../../utils/permissions';
```

Add `useRef` for the MapView:

```typescript
const mapRef = useRef<MapView>(null);
```

Add state for loading:

```typescript
const [locating, setLocating] = useState(false);
```

- [ ] **Step 2: Seed map from device location on mount**

Add an effect after the state declarations:

```typescript
useEffect(() => {
  if (initialLat !== null && initialLng !== null) {
    return; // already have a pin from params, don't override
  }
  let cancelled = false;
  getCurrentLocation().then((loc) => {
    if (cancelled || !loc) return;
    setPin({ latitude: loc.latitude, longitude: loc.longitude });
    mapRef.current?.animateToRegion(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  });
  return () => {
    cancelled = true;
  };
}, []);
```

- [ ] **Step 3: Wire the locate button**

Create a handler:

```typescript
const handleLocate = useCallback(async () => {
  setLocating(true);
  try {
    const loc = await getCurrentLocation();
    if (!loc) return;
    setPin({ latitude: loc.latitude, longitude: loc.longitude });
    mapRef.current?.animateToRegion(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  } finally {
    setLocating(false);
  }
}, []);
```

Add `onPress={handleLocate}` to the LocateFixed `Pressable` and pass `ref={mapRef}` to the `MapView`.

- [ ] **Step 4: Wire zoom buttons**

Create zoom handlers:

```typescript
const handleZoom = useCallback((direction: 'in' | 'out') => {
  mapRef.current?.getCamera().then((camera) => {
    if (!camera) return;
    const factor = direction === 'in' ? 0.5 : 2.0;
    mapRef.current?.animateCamera(
      {
        center: camera.center,
        zoom: (camera.zoom ?? 12) + (direction === 'in' ? 1 : -1),
      },
      { duration: 300 },
    );
  });
}, []);
```

Add `onPress={() => handleZoom('in')}` to the Plus button and `onPress={() => handleZoom('out')}` to the Minus button.

- [ ] **Step 5: Reverse-geocode on pin drop**

Add a debounced reverse-geocode effect. Import the SDK client or use fetch directly:

```typescript
import { useApiClient } from '../../../../features/api/useApiClient';
```

> **Note:** Adapt the import to match the project's existing API client pattern. Check how other screens call the backend (e.g., `useCreateTask` in review.tsx).

Add an effect that fires when `pin` changes:

```typescript
const [reverseGeocoding, setReverseGeocoding] = useState(false);

useEffect(() => {
  if (!pin) return;
  let cancelled = false;
  setReverseGeocoding(true);

  fetch(
    `${API_BASE_URL}/api/v1/location/reverse-geocode?lat=${pin.latitude}&lng=${pin.longitude}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
    .then((r) => r.json())
    .then((data) => {
      if (cancelled) return;
      if (data.formatted_address && !locationText) {
        setLocationText(data.formatted_address);
      }
    })
    .catch(() => {})
    .finally(() => {
      if (!cancelled) setReverseGeocoding(false);
    });

  return () => {
    cancelled = true;
  };
}, [pin?.latitude, pin?.longitude]);
```

> **Note:** Adapt `API_BASE_URL` and `token` to match the project's existing API configuration and auth token retrieval pattern. The reverse-geocode only auto-fills when `locationText` is empty — the user's manual edits are preserved.

- [ ] **Step 6: Update the pinned-area label to show reverse-geocoded text**

Replace the static label section:

```typescript
          <Text className="text-subtitle font-extrabold text-primaryDeep">
            {pin ? t('LocationScreen.locationPinnedArea') : t('LocationScreen.locationAwaitingPin')}
          </Text>
          <Text className="text-caption text-textSecondary">
            {pin ? t('LocationScreen.pinSet') : t('LocationScreen.tapToPin')}
          </Text>
```

With:

```typescript
          <Text className="text-subtitle font-extrabold text-primaryDeep">
            {pin
              ? (reverseGeocoding
                  ? t('LocationScreen.locationResolving', { defaultValue: 'Resolving address…' })
                  : t('LocationScreen.locationPinnedArea'))
              : t('LocationScreen.locationAwaitingPin')}
          </Text>
          <Text className="text-caption text-textSecondary">
            {pin ? t('LocationScreen.pinSet') : t('LocationScreen.tapToPin')}
          </Text>
```

- [ ] **Step 7: Run mobile typecheck**

Run: `pnpm --filter @tasky/mobile typecheck`
Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/location.tsx
git commit -m "feat(mobile): seed map from device location, wire controls, reverse-geocode on pin"
```

---

## Task 10: Mobile — Tasker Feed Location Pass-Through

**Files:**

- Modify: `apps/mobile/src/features/tasks/hooks/useTasks.ts`

- [ ] **Step 1: Add device location to task list query**

In `apps/mobile/src/features/tasks/hooks/useTasks.ts`, update `useTasks` to accept optional coordinates and pass them as query params:

```typescript
import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../../../utils/permissions';
```

Update the hook to request device location and pass it to the API:

```typescript
export function useTasks() {
  const [deviceLoc, setDeviceLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getCurrentLocation().then((loc) => {
      if (loc) setDeviceLoc({ lat: loc.latitude, lng: loc.longitude });
    });
  }, []);

  // Build query params — include lat/lng if available
  const params = new URLSearchParams();
  if (deviceLoc) {
    params.set('lat', String(deviceLoc.lat));
    params.set('lng', String(deviceLoc.lng));
    params.set('radius_km', '10');
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';

  // Pass queryString into the existing API call
  // Adapt to match the project's existing React Query + SDK pattern
  // ...
}
```

> **Note:** Adapt the implementation to match how `useTasks` currently calls the API. The key change is appending `lat`, `lng`, and `radius_km` query parameters when device coordinates are available. The existing backend `GET /tasks` endpoint already supports these parameters and uses `ST_DWithin` for geo-filtering.

- [ ] **Step 2: Run mobile typecheck**

Run: `pnpm --filter @tasky/mobile typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/tasks/hooks/useTasks.ts
git commit -m "feat(mobile): pass device coordinates in tasker feed queries for geo-radius filtering"
```

---

## Task 11: Full Verification

- [ ] **Step 1: Run backend tests**

Run: `./gradlew test --no-daemon`
Expected: All tests pass.

- [ ] **Step 2: Validate API contract**

Run: `./gradlew openApiValidate --no-daemon`
Expected: Valid.

- [ ] **Step 3: Run migration validation**

Run: `python3 tooling/scripts/validate-migrations.py`
Expected: All migrations valid.

- [ ] **Step 4: Run mobile typecheck**

Run: `pnpm -r typecheck`
Expected: All workspaces pass.

- [ ] **Step 5: Run mobile lint**

Run: `pnpm -r lint`
Expected: No new lint errors.

---

## Provider Upgrade Path (Post-Benchmarking)

Once the map API provider is selected after benchmarking 25–50 real Mongolian addresses:

1. Create `GoogleGeocodingProvider` (or `GeoapifyGeocodingProvider`) implementing `GeocodingProvider`
2. Add API key configuration to `application.yml`
3. Use `@ConditionalOnProperty` or `@Primary` to swap provider
4. `DistrictGeocodingProvider` remains as offline fallback
5. No changes needed to `LocationController`, `LocationService`, mobile code, or API contract

The provider interface is the only seam. Everything else stays the same.
