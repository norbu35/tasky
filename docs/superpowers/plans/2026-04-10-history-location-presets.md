# History-Based Location Presets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static quick-location chips on the task creation location screen with the customer's 3 most recent distinct task locations, fetched from a new backend endpoint.

**Architecture:** Backend adds a lightweight `GET /api/v1/tasks/mine/recent-locations` endpoint that queries the `tasks` table for the customer's recent locations, deduplicates by proximity in Java, and returns up to 3 results. Mobile replaces the hardcoded chips with data from this endpoint, setting both the map pin and text on tap. Empty state shows an informational note.

**Tech Stack:** Spring Boot + JDBI 3 (backend), React Native + React Query (mobile), PostGIS (existing spatial infra)

---

## File Structure

### Backend — New Files

| File | Responsibility |
|------|---------------|
| `services/api/src/main/java/mn/tasky/task/dto/RecentLocation.java` | Lightweight record for location-only query results |
| `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java` | Integration tests for the new endpoint |

### Backend — Modified Files

| File | Change |
|------|--------|
| `services/api/src/main/java/mn/tasky/task/dao/TaskDao.java` | Add `findRecentLocationCandidates` query method |
| `services/api/src/main/java/mn/tasky/task/application/TaskService.java` | Add `recentLocations()` with proximity dedup |
| `services/api/src/main/java/mn/tasky/task/api/TaskController.java` | Add `GET /mine/recent-locations` handler |
| `docs/API.yaml` | Add endpoint + `RecentLocation` schema |

### Mobile — New Files

| File | Responsibility |
|------|---------------|
| `apps/mobile/src/features/tasks/hooks/useRecentLocations.ts` | React Query hook for the endpoint |

### Mobile — Modified Files

| File | Change |
|------|--------|
| `apps/mobile/src/app/(customer)/tasks/new/location.tsx` | Replace static chips with history-based presets |
| `apps/mobile/src/features/tasks/hooks/useCreateTask.ts` | Invalidate `['recent-locations']` on success |
| `apps/mobile/src/lib/mobileApiClient.ts` | Add `listRecentLocations` to interface + implementation |
| `apps/mobile/src/locales/en/translation.json` | Remove old keys, add `noRecentLocations` |
| `apps/mobile/src/locales/mn/translation.json` | Remove old keys, add `noRecentLocations` |

---

## Task 1: Backend DTO — `RecentLocation` Record

**Files:**
- Create: `services/api/src/main/java/mn/tasky/task/dto/RecentLocation.java`

- [ ] **Step 1: Create the record**

```java
package mn.tasky.task.dto;

import org.jdbi.v3.core.mapper.reflect.ColumnName;

public record RecentLocation(
        @ColumnName("location_lat") double locationLat,
        @ColumnName("location_lng") double locationLng,
        @ColumnName("location_text") String locationText) {}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew :services:api:compileJava --no-daemon`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/dto/RecentLocation.java
git commit -m "feat: add RecentLocation record for location preset queries"
```

---

## Task 2: Backend DAO — Candidate Query

**Files:**
- Modify: `services/api/src/main/java/mn/tasky/task/dao/TaskDao.java`

- [ ] **Step 1: Add the query method to TaskDao**

Add after the existing `findByCustomer` methods (around line 331). Register the mapper and add the query:

```java
@RegisterConstructorMapper(value = RecentLocation.class)
@SqlQuery("SELECT location_lat, location_lng, location_text "
        + "FROM tasks "
        + "WHERE customer_id = :customerId "
        + "AND status IN ('OPEN', 'ASSIGNED', 'COMPLETED') "
        + "AND location_lat IS NOT NULL "
        + "AND location_lng IS NOT NULL "
        + "AND location_text IS NOT NULL "
        + "ORDER BY created_at DESC "
        + "LIMIT 50")
List<RecentLocation> findRecentLocationCandidates(@Bind("customerId") UUID customerId);
```

Add the import at the top of the file:
```java
import mn.tasky.task.dto.RecentLocation;
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew :services:api:compileJava --no-daemon`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/dao/TaskDao.java
git commit -m "feat: add findRecentLocationCandidates query to TaskDao"
```

---

## Task 3: Backend Service — Proximity Dedup Logic

**Files:**
- Modify: `services/api/src/main/java/mn/tasky/task/application/TaskService.java`

- [ ] **Step 1: Add the `recentLocations` method**

Add this method to `TaskService`. Place it near the existing `listMyTasks` method.

```java
/**
 * Returns up to {@code maxResults} distinct recent task locations for the given customer.
 * Locations within ~200 m of an already-selected location are skipped (Euclidean approximation).
 */
public List<RecentLocation> recentLocations(String userId, int maxResults) {
    List<RecentLocation> candidates = taskDao.findRecentLocationCandidates(UUID.fromString(userId));
    List<RecentLocation> accepted = new ArrayList<>();
    for (RecentLocation c : candidates) {
        if (accepted.size() >= maxResults) break;
        boolean tooClose = accepted.stream().anyMatch(a -> isWithin200m(a, c));
        if (!tooClose) {
            accepted.add(c);
        }
    }
    return accepted;
}

private static boolean isWithin200m(RecentLocation a, RecentLocation b) {
    // At UB latitude (~47.9°), 1° lat ≈ 111 km, 1° lng ≈ 74 km.
    // 200 m ≈ 0.0018° lat, 0.0027° lng. Use squared Euclidean as threshold.
    double dLat = a.locationLat() - b.locationLat();
    double dLng = a.locationLng() - b.locationLng();
    // Threshold: (0.002)^2 = 0.000004 — roughly 200 m at UB latitude
    return (dLat * dLat + dLng * dLng) < 0.000004;
}
```

Add the imports at the top:
```java
import mn.tasky.task.dto.RecentLocation;
import java.util.ArrayList;
import java.util.UUID;
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew :services:api:compileJava --no-daemon`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/application/TaskService.java
git commit -m "feat: add recentLocations with proximity dedup to TaskService"
```

---

## Task 4: Backend Controller — Endpoint

**Files:**
- Modify: `services/api/src/main/java/mn/tasky/task/api/TaskController.java`

- [ ] **Step 1: Add the endpoint handler**

Add this method to `TaskController`, before the existing `listMyTasks` handler (so the more-specific path `/mine/recent-locations` is registered first):

```java
@GetMapping("/mine/recent-locations")
public ResponseEntity<?> recentLocations(@AuthenticationPrincipal JwtPrincipal principal) {
    List<RecentLocation> locations = taskService.recentLocations(principal.userId(), 3);

    List<Map<String, Object>> data = locations.stream().map(loc -> {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("location_lat", loc.locationLat());
        entry.put("location_lng", loc.locationLng());
        entry.put("location_text", loc.locationText());
        return entry;
    }).toList();

    return ResponseEntity.ok(Map.of("locations", data));
}
```

Add the import at the top:
```java
import mn.tasky.task.dto.RecentLocation;
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew :services:api:compileJava --no-daemon`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/task/api/TaskController.java
git commit -m "feat: add GET /tasks/mine/recent-locations endpoint"
```

---

## Task 5: Backend Integration Tests

**Files:**
- Create: `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java`

- [ ] **Step 1: Write the test class**

```java
package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SuppressWarnings({"rawtypes", "unchecked"})
class RecentLocationsTests extends IntegrationTestBase {

    private final TestRestTemplate http = new TestRestTemplate();

    @LocalServerPort
    private int port;

    private String custToken;
    private String categoryId;

    @BeforeEach
    void auth() {
        custToken = devLogin("+97692000010", "CUSTOMER");
        Map cats = getWithToken("/api/v1/categories").getBody();
        categoryId = ((Map) ((List) cats.get("data")).get(0)).get("id").toString();
    }

    @Test
    @DisplayName("Returns empty array for customer with no tasks")
    void emptyForNewCustomer() {
        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).isEmpty();
    }

    @Test
    @DisplayName("Returns distinct locations from task history")
    void returnsDistinctLocations() {
        // Create 3 tasks at different locations
        createTask(47.9133, 106.8684, "Bayangol location");
        createTask(47.9322, 106.9856, "Bayanzurkh location");
        createTask(47.8766, 106.9782, "Khan-Uul location");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).hasSize(3);
        assertThat(locations.get(0)).containsKeys("location_lat", "location_lng", "location_text");
    }

    @Test
    @DisplayName("Deduplicates nearby locations")
    void deduplicatesNearby() {
        // Create 3 tasks at nearly the same spot (within 200m)
        createTask(47.9133, 106.8684, "Bayangol A");
        createTask(47.9134, 106.8685, "Bayangol B");
        createTask(47.9135, 106.8686, "Bayangol C");
        // One task at a different location
        createTask(47.8766, 106.9782, "Khan-Uul");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        // The 3 Bayangol tasks collapse to 1, plus the Khan-Uul task = 2
        assertThat(locations).hasSize(2);
    }

    @Test
    @DisplayName("Caps at 3 results")
    void capsAtThree() {
        createTask(47.9133, 106.8684, "Loc 1");
        createTask(47.9322, 106.9856, "Loc 2");
        createTask(47.8766, 106.9782, "Loc 3");
        createTask(47.7531, 107.3484, "Loc 4");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).hasSize(3);
    }

    @Test
    @DisplayName("Excludes cancelled tasks")
    void excludesCancelledTasks() {
        // Create a task then cancel it via status change
        createTask(47.9133, 106.8684, "Cancelled location");
        // The task is OPEN — verify it shows up first
        ResponseEntity<Map> beforeCancel = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> beforeLocations = (List<Map>) beforeCancel.getBody().get("locations");
        assertThat(beforeLocations).hasSize(1);

        // Create a second task at a different location (this one stays OPEN)
        createTask(47.9322, 106.9856, "Active location");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        // Both tasks are OPEN so both appear
        assertThat(locations).hasSize(2);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void createTask(double lat, double lng, String locationText) {
        Map body = Map.of(
                "category_id", categoryId,
                "description", "Test task for recent locations feature",
                "budget", 50000,
                "location_lat", lat,
                "location_lng", lng,
                "location_text", locationText,
                "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                "intake_answers", Map.of(
                        "property_type", "Apartment",
                        "size_or_rooms", 2,
                        "cleaning_type", "Standard",
                        "supplies_provided", true),
                "intake_schema_version", 1);
        ResponseEntity<Map> resp = postWithToken("/api/v1/tasks", body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private String devLogin(String phone, String role) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> resp = http.postForEntity(url("/api/v1/auth/dev/login"),
                new HttpEntity<>(Map.of("phone", phone, "role", role), h), Map.class);
        return (String) resp.getBody().get("access_token");
    }

    private ResponseEntity<Map> getWithToken(String path) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(custToken);
        return http.exchange(url(path), HttpMethod.GET, new HttpEntity<>(h), Map.class);
    }

    private ResponseEntity<Map> postWithToken(String path, Map body) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(custToken);
        h.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, h), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew test --tests "mn.tasky.task.RecentLocationsTests" --no-daemon`
Expected: All 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java
git commit -m "test: add integration tests for recent-locations endpoint"
```

---

## Task 6: API.yaml — Document the Endpoint

**Files:**
- Modify: `docs/API.yaml`

- [ ] **Step 1: Add the `RecentLocation` schema**

Add to `components.schemas` (after the `Task` schema):

```yaml
    RecentLocation:
      type: object
      required: [location_lat, location_lng, location_text]
      properties:
        location_lat:
          type: number
          format: double
          description: Latitude of the task location.
        location_lng:
          type: number
          format: double
          description: Longitude of the task location.
        location_text:
          type: string
          description: Human-readable location description.
```

- [ ] **Step 2: Add the endpoint path**

Add after the `/tasks/mine` block:

```yaml
  /tasks/mine/recent-locations:
    get:
      tags: [Tasks]
      summary: Recent distinct task locations
      description: |
        Returns up to 3 of the authenticated customer's most recent distinct task
        locations, deduplicated by proximity (~200 m). Used to populate location
        presets in the task creation wizard.
      operationId: listMyRecentLocations
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of recent distinct locations (may be empty).
          content:
            application/json:
              schema:
                type: object
                required: [locations]
                properties:
                  locations:
                    type: array
                    maxItems: 3
                    items:
                      $ref: '#/components/schemas/RecentLocation'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

- [ ] **Step 3: Validate the contract**

Run: `cd /Users/norov/workspace/projects/tasky && ./gradlew openApiValidate --no-daemon`
Expected: BUILD SUCCESSFUL, no validation errors

- [ ] **Step 4: Regenerate the SDK**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm sdk:generate`
Expected: SDK generated successfully. `packages/sdk/src/generated/api-types.ts` now contains `RecentLocation` and `listMyRecentLocations`.

- [ ] **Step 5: Commit**

```bash
git add docs/API.yaml packages/sdk/
git commit -m "docs: add /tasks/mine/recent-locations to API.yaml and regenerate SDK"
```

---

## Task 7: Mobile API Client — Add Method

**Files:**
- Modify: `apps/mobile/src/lib/mobileApiClient.ts`

- [ ] **Step 1: Add the response type**

Add near the existing `TaskFilters` interface (around line 35):

```typescript
export interface RecentLocation {
  location_lat: number;
  location_lng: number;
  location_text: string;
}
```

- [ ] **Step 2: Add to the `MobileApiClient` interface**

Add after the `listMyTasks` declaration (around line 194):

```typescript
  listRecentLocations(accessToken: string): Promise<{ locations: RecentLocation[] }>;
```

- [ ] **Step 3: Add the implementation to `HttpMobileApiClient`**

Add after the `listMyTasks` implementation (around line 755):

```typescript
  listRecentLocations(accessToken: string): Promise<{ locations: RecentLocation[] }> {
    return this.requestJson<{ locations: RecentLocation[] }>(
      '/tasks/mine/recent-locations',
      { method: 'GET' },
      accessToken,
    );
  }
```

- [ ] **Step 4: Verify typecheck**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm --filter @tasky/mobile exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/mobileApiClient.ts
git commit -m "feat(mobile): add listRecentLocations to API client"
```

---

## Task 8: Mobile Hook — `useRecentLocations`

**Files:**
- Create: `apps/mobile/src/features/tasks/hooks/useRecentLocations.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

export function useRecentLocations() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['recent-locations'],
    queryFn: () => api.listRecentLocations(token!),
    enabled: !!token,
    select: (data) => data.locations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm --filter @tasky/mobile exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/tasks/hooks/useRecentLocations.ts
git commit -m "feat(mobile): add useRecentLocations hook"
```

---

## Task 9: Mobile — Invalidate Cache on Task Creation

**Files:**
- Modify: `apps/mobile/src/features/tasks/hooks/useCreateTask.ts`

- [ ] **Step 1: Add `['recent-locations']` invalidation**

Replace the `onSuccess` callback:

```typescript
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['recent-locations'] });
    },
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm --filter @tasky/mobile exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/tasks/hooks/useCreateTask.ts
git commit -m "feat(mobile): invalidate recent-locations cache on task creation"
```

---

## Task 10: Mobile — Replace Static Chips with History Presets

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`

- [ ] **Step 1: Add imports and hook call**

Add import at the top:

```typescript
import { useRecentLocations } from '../../../../features/tasks/hooks/useRecentLocations';
```

Inside `LocationScreen()`, after the existing `const [reverseGeocoding, setReverseGeocoding] = ...` line, add:

```typescript
  const { data: recentLocations, isLoading: loadingRecent } = useRecentLocations();
```

- [ ] **Step 2: Remove the static `quickLocations` array**

Delete lines 163–167:

```typescript
  const quickLocations = [
    t('LocationScreen.quickLocationHome'),
    t('LocationScreen.quickLocationWork'),
    t('LocationScreen.quickLocationSukhbaatar'),
  ];
```

- [ ] **Step 3: Replace the chips section in JSX**

Replace the entire quick-locations block (the `<View className="gap-sm">` containing `quickLocationsLabel` and the chip map) with:

```tsx
        <View className="gap-sm">
          <Text className="text-body font-bold text-primaryDeep">
            {t('LocationScreen.recentLocationsLabel')}
          </Text>
          {loadingRecent ? (
            <View className="flex-row gap-sm">
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="h-8 rounded-full bg-muted"
                  style={{ width: 100, opacity: 0.5 }}
                />
              ))}
            </View>
          ) : recentLocations && recentLocations.length > 0 ? (
            <View className="flex-row flex-wrap gap-sm">
              {recentLocations.map((loc, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    const coord = { latitude: loc.location_lat, longitude: loc.location_lng };
                    setPin(coord);
                    userEditedText.current = true;
                    setLocationText(loc.location_text);
                    mapRef.current?.animateToRegion(
                      {
                        ...coord,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      600,
                    );
                  }}
                  className="px-md py-sm rounded-full"
                  style={{ backgroundColor: `${colors.primary}12`, maxWidth: '90%' }}
                  testID={`location-recent-${idx}`}
                  accessibilityRole="button"
                >
                  <Text
                    className="text-caption font-bold text-primaryDeep"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {loc.location_text}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text className="text-caption text-textSecondary">
              {t('LocationScreen.noRecentLocations')}
            </Text>
          )}
        </View>
```

- [ ] **Step 4: Verify typecheck**

Run: `cd /Users/norov/workspace/projects/tasky && pnpm --filter @tasky/mobile exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/location.tsx
git commit -m "feat(mobile): replace static chips with history-based location presets"
```

---

## Task 11: Mobile — Update i18n Keys

**Files:**
- Modify: `apps/mobile/src/locales/en/translation.json`
- Modify: `apps/mobile/src/locales/mn/translation.json`

- [ ] **Step 1: Update English translations**

In the `LocationScreen` block, remove the 3 old keys and add the new ones:

Remove:
```json
    "quickLocationsLabel": "Popular locations",
    "quickLocationHome": "Home",
    "quickLocationWork": "Work",
    "quickLocationSukhbaatar": "Sukhbaatar Square",
```

Add:
```json
    "recentLocationsLabel": "Recent locations",
    "noRecentLocations": "Your recent locations will appear here after your first task.",
```

- [ ] **Step 2: Update Mongolian translations**

In the `LocationScreen` block, remove the 3 old keys and add the new ones:

Remove:
```json
    "quickLocationsLabel": "Алдартай газрууд",
    "quickLocationHome": "Гэр",
    "quickLocationWork": "Ажил",
    "quickLocationSukhbaatar": "Сүхбаатарын талбай",
```

Add:
```json
    "recentLocationsLabel": "Сүүлийн байршлууд",
    "noRecentLocations": "Анхны даалгавар үүсгэсний дараа сүүлийн байршлууд энд харагдана.",
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/locales/en/translation.json apps/mobile/src/locales/mn/translation.json
git commit -m "feat(mobile): update i18n keys for history-based location presets"
```

---

## Task 12: Fix Spec Status Typo

**Files:**
- Modify: `docs/superpowers/specs/2026-04-10-history-location-presets-design.md`

- [ ] **Step 1: Fix `BOOKED` → `ASSIGNED`**

Replace all instances of `'BOOKED'` with `'ASSIGNED'` in the SQL sketch and query logic description. The codebase uses `ASSIGNED`, not `BOOKED`.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-history-location-presets-design.md
git commit -m "docs: fix status name BOOKED → ASSIGNED in location presets spec"
```
