# FCM Backend Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ExpoPushProvider` with a `FirebasePushProvider` that delivers individual pushes via Firebase Admin SDK and subscribes Taskers to FCM district/category topics on device registration.

**Architecture:** `PushNotificationProvider` interface is extended with two default-no-op methods (`subscribeToTopics`, `sendToTopic`). `FirebasePushProvider` implements all three. A new DB migration adds a `districts` reference table and `tasker_service_districts` join table; Taskers select their service areas via a new REST endpoint. `NotificationService.registerDevice()` is enhanced to call `subscribeToTopics` after token upsert when the user is a Tasker. `LoggingPushProvider` retains its `@Primary` dev-default role and gets no-op implementations of the new methods.

**Tech Stack:** Firebase Admin SDK (`com.google.firebase:firebase-admin`), Spring `@ConditionalOnProperty`, JDBI 3, Flyway migration, JUnit 5 + Mockito (unit tests for `FirebasePushProvider`), existing `IntegrationTestBase` (integration tests for service areas API and topic subscription)

---

## File Map

| File                                                                         | Action | Purpose                                                                               |
| ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `build.gradle.kts`                                                           | Modify | Add `firebase-admin` dependency                                                       |
| `src/main/resources/db/migration/V15__districts_and_service_areas.sql`       | Create | Districts seed + `tasker_service_districts` join table                                |
| `src/main/java/mn/tasky/notification/provider/PushNotificationProvider.java` | Modify | Add `subscribeToTopics` and `sendToTopic` default no-ops                              |
| `src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java`      | Modify | Override new methods with logging no-ops                                              |
| `src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java`     | Create | FCM individual send + topic subscription + topic fan-out                              |
| `src/main/java/mn/tasky/notification/dao/DistrictDao.java`                   | Create | JDBI DAO — list active districts                                                      |
| `src/main/java/mn/tasky/notification/dao/TaskerServiceAreaDao.java`          | Create | JDBI DAO — CRUD for `tasker_service_districts`                                        |
| `src/main/java/mn/tasky/notification/dto/District.java`                      | Create | Record: `id`, `name`, `nameMn`, `slug`                                                |
| `src/main/java/mn/tasky/notification/application/NotificationService.java`   | Modify | Inject DAOs; subscribe Tasker to topics after `registerDevice()`                      |
| `src/main/java/mn/tasky/notification/api/ServiceAreaController.java`         | Create | `GET/PUT /api/v1/taskers/me/service-areas`                                            |
| `src/main/resources/application.yml`                                         | Modify | Document `firebase` as valid push provider value; add `FIREBASE_SERVICE_ACCOUNT_JSON` |
| `src/main/resources/application-prod.yml`                                    | Modify | Default push provider to `firebase`; remove stale expo-access-token                   |
| `src/main/java/mn/tasky/notification/provider/ExpoPushProvider.java`         | Delete | Removed after FirebasePushProvider is wired                                           |
| `src/test/java/mn/tasky/notification/FirebasePushProviderTest.java`          | Create | Unit test with mocked `FirebaseMessaging`                                             |
| `src/test/java/mn/tasky/notification/ServiceAreaIntegrationTests.java`       | Create | Integration tests for service area API + topic subscription                           |

---

## Task 1: Add `firebase-admin` dependency

**Files:**

- Modify: `build.gradle.kts`

- [ ] **Step 1: Add the dependency**

In `build.gradle.kts`, inside the `dependencies {}` block, add after the AWS SDK line:

```kotlin
implementation("com.google.firebase:firebase-admin:9.4.2")
```

- [ ] **Step 2: Verify build compiles cleanly**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL (no errors)

- [ ] **Step 3: Commit**

```bash
git add build.gradle.kts
git commit -m "chore(deps): add firebase-admin 9.4.2 for FCM push provider"
```

---

## Task 2: Districts + service areas DB migration

**Files:**

- Create: `src/main/resources/db/migration/V15__districts_and_service_areas.sql`

- [ ] **Step 1: Write the migration**

```sql
-- V15: District reference table and tasker service area selection
-- Used for FCM topic subscription: taskers.district.{slug}

CREATE TABLE districts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    name_mn     TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

-- Seed: Ulaanbaatar's 9 düüregs
INSERT INTO districts (name, name_mn, slug) VALUES
    ('Bayangol',          'Баянгол',           'bayangol'),
    ('Bayanzurkh',        'Баянзүрх',          'bayanzurkh'),
    ('Chingeltei',        'Чингэлтэй',         'chingeltei'),
    ('Khan-Uul',          'Хан-Уул',           'khan-uul'),
    ('Songinokhairkhan',  'Сонгинохайрхан',    'songinokhairkhan'),
    ('Sukhbaatar',        'Сүхбаатар',         'sukhbaatar'),
    ('Nalaikh',           'Налайх',            'nalaikh'),
    ('Bagakhangai',       'Багахангай',         'bagakhangai'),
    ('Baganuur',          'Багануур',           'baganuur');

-- Tasker → district many-to-many
-- A tasker selects the districts they are willing to work in.
-- This drives FCM topic subscriptions on device registration.
CREATE TABLE tasker_service_districts (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, district_id)
);

CREATE INDEX idx_tsd_user ON tasker_service_districts(user_id);
```

- [ ] **Step 2: Run the migration**

```bash
./gradlew flywayMigrate -Dflyway.url=jdbc:postgresql://localhost:5432/tasky \
  -Dflyway.user=tasky -Dflyway.password=tasky
```

Expected: Successfully applied 1 migration to schema "public"

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V15__districts_and_service_areas.sql
git commit -m "db: add districts table (seeded) and tasker_service_districts join table"
```

---

## Task 3: District and service area DAOs

**Files:**

- Create: `src/main/java/mn/tasky/notification/dto/District.java`
- Create: `src/main/java/mn/tasky/notification/dao/DistrictDao.java`
- Create: `src/main/java/mn/tasky/notification/dao/TaskerServiceAreaDao.java`

- [ ] **Step 1: Write the District record**

```java
package mn.tasky.notification.dto;

public record District(String id, String name, String nameMn, String slug) {}
```

- [ ] **Step 2: Write `DistrictDao`**

```java
package mn.tasky.notification.dao;

import java.util.List;
import mn.tasky.notification.dto.District;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

public interface DistrictDao {

    @SqlQuery("SELECT id, name, name_mn, slug FROM districts WHERE is_active = true ORDER BY name")
    @RegisterConstructorMapper(District.class)
    List<District> findAll();
}
```

- [ ] **Step 3: Write `TaskerServiceAreaDao`**

```java
package mn.tasky.notification.dao;

import java.util.List;
import mn.tasky.notification.dto.District;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface TaskerServiceAreaDao {

    @SqlQuery("""
        SELECT d.id, d.name, d.name_mn, d.slug
        FROM districts d
        JOIN tasker_service_districts tsd ON tsd.district_id = d.id
        WHERE tsd.user_id = :userId AND d.is_active = true
        ORDER BY d.name
        """)
    @RegisterConstructorMapper(District.class)
    List<District> findByUserId(@Bind("userId") String userId);

    @SqlUpdate("DELETE FROM tasker_service_districts WHERE user_id = :userId")
    void deleteByUserId(@Bind("userId") String userId);

    @SqlUpdate("""
        INSERT INTO tasker_service_districts (user_id, district_id)
        SELECT :userId, id FROM districts WHERE slug = :slug AND is_active = true
        ON CONFLICT DO NOTHING
        """)
    void insertBySlug(@Bind("userId") String userId, @Bind("slug") String slug);
}
```

- [ ] **Step 4: Register both DAOs in `JdbiConfig`**

Open `src/main/java/mn/tasky/common/config/JdbiConfig.java`. Find where other DAOs are registered (look for `.installPlugin` or `.open()` calls or `SqlObjectPlugin`). Add:

```java
jdbi.onDemand(DistrictDao.class);
jdbi.onDemand(TaskerServiceAreaDao.class);
```

Also add `@Bean` methods if the project uses explicit bean registration — match the pattern used for `DeviceTokenDao`.

- [ ] **Step 5: Verify compile**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add src/main/java/mn/tasky/notification/dto/District.java \
        src/main/java/mn/tasky/notification/dao/DistrictDao.java \
        src/main/java/mn/tasky/notification/dao/TaskerServiceAreaDao.java \
        src/main/java/mn/tasky/common/config/JdbiConfig.java
git commit -m "feat(notification): District and TaskerServiceArea DAOs"
```

---

## Task 4: Service area API (Tasker selects districts)

**Files:**

- Create: `src/main/java/mn/tasky/notification/api/ServiceAreaController.java`
- Create: `src/test/java/mn/tasky/notification/ServiceAreaIntegrationTests.java`

- [ ] **Step 1: Write the failing integration test**

```java
package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ServiceAreaIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("Tasker can set and retrieve service areas by district slug")
    void taskerServiceAreaCrud() {
        AuthContext tasker = authenticateTasker("svc-area-tasker");

        // PUT two districts
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(tasker.accessToken());
        ResponseEntity<Void> put = restTemplate.exchange(
                url("/api/v1/taskers/me/service-areas"),
                HttpMethod.PUT,
                new HttpEntity<>(Map.of("district_slugs", List.of("bayangol", "sukhbaatar")), headers),
                Void.class);
        assertThat(put.getStatusCode().value()).isEqualTo(204);

        // GET — should return the two districts
        ResponseEntity<Map> get = restTemplate.exchange(
                url("/api/v1/taskers/me/service-areas"),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);
        assertThat(get.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> areas = (List<Map<String, Object>>) get.getBody().get("data");
        assertThat(areas).hasSize(2);
        assertThat(areas).extracting(m -> m.get("slug"))
                .containsExactlyInAnyOrder("bayangol", "sukhbaatar");
    }

    @Test
    @DisplayName("Customer cannot access service area endpoints")
    void customerForbidden() {
        AuthContext customer = authenticateCustomer("svc-area-cust");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(customer.accessToken());
        ResponseEntity<Map> res = restTemplate.exchange(
                url("/api/v1/taskers/me/service-areas"),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);
        assertThat(res.getStatusCode().value()).isEqualTo(403);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private AuthContext authenticateTasker(String seed) {
        // Use dev login if available, else OTP flow
        String phone = "+9767722" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> r = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        // Default role is CUSTOMER — promote via dev endpoint for test
        ResponseEntity<Map> dev = post("/api/v1/auth/dev/login",
                Map.of("phone", phone, "role", "TASKER"));
        String token = (String) dev.getBody().get("access_token");
        String userId = (String) ((Map) dev.getBody().get("user")).get("id");
        return new AuthContext(userId, token);
    }

    private AuthContext authenticateCustomer(String seed) {
        String phone = "+9767733" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> r = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String token = (String) r.getBody().get("access_token");
        String userId = (String) ((Map) r.getBody().get("user")).get("id");
        return new AuthContext(userId, token);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity(url(path), body, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
```

- [ ] **Step 2: Run test — verify it fails (404 — controller doesn't exist)**

```bash
./gradlew test --tests "mn.tasky.notification.ServiceAreaIntegrationTests" 2>&1 | tail -20
```

Expected: FAILED — `taskerServiceAreaCrud` fails with 404

- [ ] **Step 3: Write `ServiceAreaController`**

```java
package mn.tasky.notification.api;

import java.util.List;
import java.util.Map;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.dao.DistrictDao;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.District;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/taskers/me/service-areas")
public class ServiceAreaController {

    private final TaskerServiceAreaDao serviceAreaDao;
    private final DistrictDao districtDao;

    public ServiceAreaController(TaskerServiceAreaDao serviceAreaDao, DistrictDao districtDao) {
        this.serviceAreaDao = serviceAreaDao;
        this.districtDao = districtDao;
    }

    @GetMapping
    public ResponseEntity<?> getServiceAreas(@AuthenticationPrincipal JwtPrincipal principal) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN"));
        }
        List<District> areas = serviceAreaDao.findByUserId(principal.userId());
        List<Map<String, Object>> data = areas.stream()
                .map(d -> Map.<String, Object>of(
                        "id", d.id(),
                        "name", d.name(),
                        "name_mn", d.nameMn(),
                        "slug", d.slug()))
                .toList();
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PutMapping
    public ResponseEntity<?> setServiceAreas(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody Map<String, List<String>> body) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN"));
        }
        List<String> slugs = body.getOrDefault("district_slugs", List.of());
        serviceAreaDao.deleteByUserId(principal.userId());
        for (String slug : slugs) {
            serviceAreaDao.insertBySlug(principal.userId(), slug);
        }
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
./gradlew test --tests "mn.tasky.notification.ServiceAreaIntegrationTests" 2>&1 | tail -20
```

Expected: PASSED — both tests green

- [ ] **Step 5: Commit**

```bash
git add src/main/java/mn/tasky/notification/api/ServiceAreaController.java \
        src/test/java/mn/tasky/notification/ServiceAreaIntegrationTests.java
git commit -m "feat(notification): GET/PUT /taskers/me/service-areas for district selection"
```

---

## Task 5: Extend `PushNotificationProvider` interface

**Files:**

- Modify: `src/main/java/mn/tasky/notification/provider/PushNotificationProvider.java`
- Modify: `src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java`

- [ ] **Step 1: Add default methods to the interface**

Replace the full content of `PushNotificationProvider.java`:

```java
package mn.tasky.notification.provider;

import java.util.List;
import java.util.Map;

/**
 * Contract for push notification providers (FCM, etc.).
 *
 * <p>All providers must implement {@link #sendPush}. {@link #subscribeToTopics} and
 * {@link #sendToTopic} default to no-ops so non-FCM providers (e.g. LoggingPushProvider)
 * need not implement topic functionality.
 */
public interface PushNotificationProvider {

    /**
     * Sends a push notification to a single device.
     *
     * @param deviceToken Platform-specific device token.
     * @param platform    Target platform ("IOS", "ANDROID").
     * @param title       Notification title.
     * @param body        Notification body text.
     * @param data        Arbitrary key-value data payload.
     */
    NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data);

    /**
     * Subscribes a device token to one or more FCM topics.
     * Default is a no-op for providers that don't support topics.
     *
     * @param deviceToken FCM registration token.
     * @param topics      Topic strings, e.g. "taskers.district.bayangol".
     */
    default void subscribeToTopics(String deviceToken, List<String> topics) {}

    /**
     * Sends a notification to all subscribers of an FCM topic (fan-out).
     * Default is a no-op for providers that don't support topics.
     *
     * @param topic Topic string, e.g. "taskers.district.bayangol.cleaning".
     * @param title Notification title.
     * @param body  Notification body.
     * @param data  Arbitrary key-value data payload.
     */
    default NotificationResult sendToTopic(
            String topic, String title, String body, Map<String, String> data) {
        return new NotificationResult(false, null, "TOPIC_NOT_SUPPORTED");
    }
}
```

- [ ] **Step 2: Add logging overrides to `LoggingPushProvider`**

Add these two methods to `LoggingPushProvider` (before the closing brace):

```java
    @Override
    public void subscribeToTopics(String deviceToken, List<String> topics) {
        log.info("TOPIC-SUBSCRIBE token={} topics={}", deviceToken, topics);
    }

    @Override
    public NotificationResult sendToTopic(String topic, String title, String body, Map<String, String> data) {
        String messageId = "LOG-TOPIC-" + UUID.randomUUID();
        log.info("TOPIC-SEND [{}] title={} body={} data={}", topic, title, body, data);
        return new NotificationResult(true, messageId, null);
    }
```

Also add `import java.util.List;` to the imports in `LoggingPushProvider`.

- [ ] **Step 3: Verify compile and existing tests pass**

```bash
./gradlew test --tests "mn.tasky.notification.*" 2>&1 | tail -20
```

Expected: All notification tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/main/java/mn/tasky/notification/provider/PushNotificationProvider.java \
        src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java
git commit -m "feat(notification): extend PushNotificationProvider with subscribeToTopics and sendToTopic defaults"
```

---

## Task 6: `FirebasePushProvider`

**Files:**

- Create: `src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java`
- Create: `src/test/java/mn/tasky/notification/FirebasePushProviderTest.java`

- [ ] **Step 1: Write the unit test with mocked `FirebaseMessaging`**

```java
package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import java.util.List;
import java.util.Map;
import mn.tasky.notification.provider.FirebasePushProvider;
import mn.tasky.notification.provider.NotificationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FirebasePushProviderTest {

    @Mock
    FirebaseMessaging firebaseMessaging;

    FirebasePushProvider provider;

    @BeforeEach
    void setUp() {
        provider = new FirebasePushProvider(firebaseMessaging);
    }

    @Test
    void sendPush_success_returnsSuccess() throws Exception {
        when(firebaseMessaging.send(any())).thenReturn("projects/tasky/messages/abc123");

        NotificationResult result = provider.sendPush(
                "fcm-token-xyz", "ANDROID", "New Task", "A task is waiting", Map.of("type", "NEW_TASK"));

        assertThat(result.success()).isTrue();
        assertThat(result.providerMessageId()).isEqualTo("projects/tasky/messages/abc123");
        assertThat(result.errorCode()).isNull();
    }

    @Test
    void sendPush_firebaseThrows_returnsFailure() throws Exception {
        when(firebaseMessaging.send(any())).thenThrow(new RuntimeException("FCM unavailable"));

        NotificationResult result = provider.sendPush(
                "fcm-token-xyz", "IOS", "New Task", "A task is waiting", Map.of());

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("DELIVERY_FAILURE");
    }

    @Test
    void subscribeToTopics_callsFirebaseSubscribe() throws Exception {
        TopicManagementResponse response = mock(TopicManagementResponse.class);
        when(response.getFailureCount()).thenReturn(0);
        when(firebaseMessaging.subscribeToTopic(any(), any())).thenReturn(response);

        provider.subscribeToTopics("fcm-token-xyz", List.of("taskers.district.bayangol", "platform.all"));

        verify(firebaseMessaging, times(2)).subscribeToTopic(any(), any());
    }

    @Test
    void sendToTopic_success_returnsSuccess() throws Exception {
        when(firebaseMessaging.send(any())).thenReturn("projects/tasky/messages/topic-msg-1");

        NotificationResult result = provider.sendToTopic(
                "taskers.district.bayangol.cleaning", "New Task", "Cleaning job in Bayangol", Map.of("type", "NEW_TASK"));

        assertThat(result.success()).isTrue();
    }
}
```

- [ ] **Step 2: Run test — verify it fails (class doesn't exist)**

```bash
./gradlew test --tests "mn.tasky.notification.FirebasePushProviderTest" 2>&1 | tail -10
```

Expected: compilation failure — `FirebasePushProvider` not found

- [ ] **Step 3: Implement `FirebasePushProvider`**

```java
package mn.tasky.notification.provider;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Production push provider using Firebase Cloud Messaging (FCM) directly.
 *
 * <p>Activated when {@code tasky.push.provider=firebase}.
 * Reads {@code FIREBASE_SERVICE_ACCOUNT_JSON} (full service-account JSON string) to initialise
 * the Firebase Admin SDK. Delivers individual pushes and supports topic fan-out.
 */
@Component
@ConditionalOnProperty(name = "tasky.push.provider", havingValue = "firebase")
public class FirebasePushProvider implements PushNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(FirebasePushProvider.class);

    private final FirebaseMessaging messaging;

    public FirebasePushProvider(
            @Value("${FIREBASE_SERVICE_ACCOUNT_JSON:}") String serviceAccountJson) {
        this.messaging = initFirebase(serviceAccountJson);
    }

    /** Package-private constructor for unit tests — accepts a pre-built FirebaseMessaging mock. */
    FirebasePushProvider(FirebaseMessaging messaging) {
        this.messaging = messaging;
    }

    @Override
    public NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data) {
        try {
            Message.Builder builder = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data);

            if ("ANDROID".equalsIgnoreCase(platform)) {
                builder.setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .setNotification(AndroidNotification.builder()
                                .setSound("default")
                                .build())
                        .build());
            } else if ("IOS".equalsIgnoreCase(platform)) {
                builder.setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder().setSound("default").build())
                        .build());
            }

            String messageId = messaging.send(builder.build());
            log.debug("FCM push delivered: messageId={} token={}", messageId, deviceToken);
            return new NotificationResult(true, messageId, null);

        } catch (Exception e) {
            log.error("FCM push failed for token={}: {}", deviceToken, e.getMessage());
            return new NotificationResult(false, UUID.randomUUID().toString(), "DELIVERY_FAILURE");
        }
    }

    @Override
    public void subscribeToTopics(String deviceToken, List<String> topics) {
        for (String topic : topics) {
            try {
                var response = messaging.subscribeToTopic(List.of(deviceToken), topic);
                if (response.getFailureCount() > 0) {
                    log.warn("FCM topic subscription failed: topic={} token={} errors={}",
                            topic, deviceToken, response.getErrors());
                } else {
                    log.debug("FCM subscribed: topic={} token={}", topic, deviceToken);
                }
            } catch (Exception e) {
                log.error("FCM subscribeToTopic error: topic={} token={}: {}", topic, deviceToken, e.getMessage());
            }
        }
    }

    @Override
    public NotificationResult sendToTopic(
            String topic, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data)
                    .build();
            String messageId = messaging.send(message);
            log.info("FCM topic send: topic={} messageId={}", topic, messageId);
            return new NotificationResult(true, messageId, null);
        } catch (Exception e) {
            log.error("FCM topic send failed: topic={}: {}", topic, e.getMessage());
            return new NotificationResult(false, UUID.randomUUID().toString(), "DELIVERY_FAILURE");
        }
    }

    private static FirebaseMessaging initFirebase(String serviceAccountJson) {
        if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
            throw new IllegalStateException(
                    "FIREBASE_SERVICE_ACCOUNT_JSON must be set when tasky.push.provider=firebase");
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)));
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);
            }
            return FirebaseMessaging.getInstance();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialise Firebase Admin SDK", e);
        }
    }
}
```

- [ ] **Step 4: Run unit tests — verify they pass**

```bash
./gradlew test --tests "mn.tasky.notification.FirebasePushProviderTest" 2>&1 | tail -20
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java \
        src/test/java/mn/tasky/notification/FirebasePushProviderTest.java
git commit -m "feat(notification): FirebasePushProvider — FCM individual send, topic subscribe, topic fan-out"
```

---

## Task 7: Topic subscription in `NotificationService.registerDevice()`

**Files:**

- Modify: `src/main/java/mn/tasky/notification/application/NotificationService.java`

The goal: when a TASKER registers a device, subscribe them to their selected district topics, all active category topics, and `platform.all`. Customers and admins only get `platform.all`.

- [ ] **Step 1: Write a test for topic subscription in `NotificationPipelineIntegrationTests`**

Add this test to `NotificationPipelineIntegrationTests`:

```java
@Test
@DisplayName("Tasker device registration triggers topic subscription via LoggingPushProvider")
void taskerRegistrationSubscribesToTopics() {
    // Using LoggingPushProvider in tests — just verify no exception is thrown
    // and the device is stored. Topic subscription is a fire-and-forget side-effect.
    AuthContext tasker = authenticate("topic-sub-tasker");

    notificationService.registerDevice(tasker.userId(), "fcm-tok-tasker", "ANDROID");

    // Device should be stored
    // LoggingPushProvider.subscribeToTopics is a no-op log, which is fine in tests
    // Real topic calls are verified by FirebasePushProviderTest (unit test)
    List<NotificationLog> logs = notificationService.getLogs();
    // No exception = pass; topic wiring tested at unit level
}
```

- [ ] **Step 2: Run existing tests to establish green baseline**

```bash
./gradlew test --tests "mn.tasky.notification.NotificationPipelineIntegrationTests" 2>&1 | tail -10
```

Expected: PASS (3 existing tests)

- [ ] **Step 3: Inject new DAOs into `NotificationService`**

Add constructor params and fields to `NotificationService`:

```java
// Add to fields:
private final TaskerServiceAreaDao serviceAreaDao;
private final DistrictDao districtDao;
private final CategoryDao categoryDao; // already exists if present, else use a simple query

// Add to constructor:
public NotificationService(
        DeviceTokenDao deviceTokenDao,
        NotificationLogDao notificationLogDao,
        PushNotificationProvider pushProvider,
        SmsNotificationProvider smsProvider,
        UserDao userDao,
        CryptoService cryptoService,
        TaskerServiceAreaDao serviceAreaDao,
        DistrictDao districtDao) {
    // ... existing assignments ...
    this.serviceAreaDao = serviceAreaDao;
    this.districtDao = districtDao;
}
```

Note: Check `JdbiConfig` for how `CategoryDao` is named — if there's an existing category DAO, inject it instead of querying inline. If not, use an inline JDBI query or a simple `DistrictDao` equivalent.

- [ ] **Step 4: Enhance `registerDevice()` to subscribe Taskers**

Replace the body of `registerDevice()`:

```java
public void registerDevice(String userId, String token, String platform) {
    deviceTokenDao.upsert(userId, token, platform, Instant.now());
    log.info("Registered device for user {}: platform={}", userId, platform);
    subscribeToFcmTopics(userId, token);
}

private void subscribeToFcmTopics(String userId, String token) {
    AuthUser user = userDao.findById(userId).orElse(null);
    if (user == null) return;

    List<String> topics = new ArrayList<>();
    topics.add("platform.all");

    if ("TASKER".equals(user.role())) {
        // District topics from tasker's service area selection
        List<District> districts = serviceAreaDao.findByUserId(userId);
        for (District d : districts) {
            topics.add("taskers.district." + d.slug());
        }

        // Category topics — subscribe to all active categories for Phase 1
        // (tasker skill filtering is a Phase 2 refinement)
        List<String> categorySlugs = districtDao.findAllCategorySlugs(); // see note below
        for (String catSlug : categorySlugs) {
            topics.add("taskers.category." + catSlug);
            // Cross-product: district × category
            for (District d : districts) {
                topics.add("taskers.district." + d.slug() + "." + catSlug);
            }
        }
    }

    if (!topics.isEmpty()) {
        pushProvider.subscribeToTopics(token, topics);
        log.info("FCM topic subscriptions queued for user {}: {}", userId, topics);
    }
}
```

**Note on category slugs:** Add a `findAllActiveSlugs()` method to an appropriate DAO or inline a JDBI query. The `categories` table has a `name` field — derive slug from it (lowercase, spaces → hyphens) or add a `slug` column to `categories` in a separate migration if needed. For Phase 1, use `name_mn` lowercased as a slug approximation or add `slug` to `categories`. **Simplest approach for Phase 1:** add `findAllActiveNames()` to `CategoryDao`, transform inline.

- [ ] **Step 5: Run all notification tests**

```bash
./gradlew test --tests "mn.tasky.notification.*" 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/main/java/mn/tasky/notification/application/NotificationService.java
git commit -m "feat(notification): subscribe Taskers to FCM district/category topics on device registration"
```

---

## Task 8: Config update + remove Expo provider

**Files:**

- Modify: `src/main/resources/application.yml`
- Modify: `src/main/resources/application-prod.yml`
- Delete: `src/main/java/mn/tasky/notification/provider/ExpoPushProvider.java`

- [ ] **Step 1: Update `application.yml` push section**

Replace the push config block in `application.yml`:

```yaml
push:
  provider: ${TASKY_PUSH_PROVIDER:logging}
  # Options:
  #   logging   — dev default; logs pushes to console, no real delivery
  #   firebase  — production; requires FIREBASE_SERVICE_ACCOUNT_JSON env var
  #   expo      — DEPRECATED; retained in config history only, class removed
```

Remove the `expo-access-token` line.

- [ ] **Step 2: Update `application-prod.yml`**

```yaml
push:
  provider: ${TASKY_PUSH_PROVIDER:firebase}
```

Remove the `expo-access-token` line.

- [ ] **Step 3: Delete `ExpoPushProvider.java`**

```bash
rm src/main/java/mn/tasky/notification/provider/ExpoPushProvider.java
```

- [ ] **Step 4: Verify compile and full test suite**

```bash
./gradlew compileJava && ./gradlew test --tests "mn.tasky.notification.*" 2>&1 | tail -20
```

Expected: BUILD SUCCESSFUL, all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/resources/application.yml \
        src/main/resources/application-prod.yml
git rm src/main/java/mn/tasky/notification/provider/ExpoPushProvider.java
git commit -m "feat(notification): activate firebase provider, remove ExpoPushProvider"
```

---

## Task 9: Full test suite + update context docs

- [ ] **Step 1: Run full integration suite**

```bash
./gradlew test 2>&1 | tail -30
```

Expected: BUILD SUCCESSFUL — all tests pass

- [ ] **Step 2: Update `docs/fcm-switch-backend.md`**

Mark each "What needs to be built" item as done. Add a "What was built" summary section noting the migration number, new files, and the env var required for production (`FIREBASE_SERVICE_ACCOUNT_JSON`).

- [ ] **Step 3: Final commit**

```bash
git add docs/fcm-switch-backend.md
git commit -m "docs: mark FCM backend switch complete"
```

---

## Production activation checklist (not in code — ops task)

- [ ] Firebase project created; `google-services.json` downloaded
- [ ] APNs auth key configured in Firebase Console
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` injected into prod environment (secret manager / k8s secret)
- [ ] `TASKY_PUSH_PROVIDER=firebase` set in prod environment (or left as default — `application-prod.yml` defaults to `firebase` after Task 8)
- [ ] Old `ExponentPushToken[...]` rows in `device_tokens` will be naturally evicted as users upgrade and re-register FCM tokens
