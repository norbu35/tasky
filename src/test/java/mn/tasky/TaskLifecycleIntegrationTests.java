package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TaskLifecycleIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CREATE customer can create a task with valid data")
    void customerCanCreateTask() {
        AuthContext customer = authenticate("90");
        String categoryId = getFirstCategoryId(customer.accessToken());

        String futureDate = Instant.now().plus(1, ChronoUnit.DAYS).toString();
        Map<String, Object> body = Map.of(
            "category_id", categoryId,
            "description", "This is a test task description with more than 10 characters.",
            "budget", 55000,
            "location_lat", 47.9188,
            "location_lng", 106.9176,
            "location_text", "Ulaanbaatar, Mongolia",
            "scheduled_at", futureDate,
            "photo_keys", List.of("uploads/tasks/photo1.jpg")
        );

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("OPEN");
        assertThat(response.getBody().get("description")).isEqualTo(body.get("description"));
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CREATE task creation fails with invalid data")
    void taskCreationFailsWithInvalidData() {
        AuthContext customer = authenticate("91");

        // Invalid budget (too low)
        Map<String, Object> body = Map.of(
            "category_id", UUID.randomUUID().toString(),
            "description", "Too short",
            "budget", 1000,
            "location_lat", 47.9188,
            "location_lng", 106.9176,
            "location_text", "UB",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        );

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-PHOTO-UPLOAD constrained signed URLs for task photos")
    void taskPhotoUploadUrls() {
        AuthContext customer = authenticate("92");

        // Pre-create upload URL
        ResponseEntity<Map> preResponse = postWithAuth(
            "/api/v1/tasks/photos/upload-url", customer.accessToken(),
            Map.of("content_type", "image/jpeg")
        );
        assertThat(preResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preResponse.getBody().get("upload_url").toString()).contains("presigned-upload");
        assertThat(preResponse.getBody().get("storage_key").toString()).startsWith("uploads/tasks/");

        // Post-create upload URL
        String categoryId = getFirstCategoryId(customer.accessToken());
        ResponseEntity<Map> taskResponse = postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", categoryId,
            "description", "Description for photo test task.",
            "budget", 60000,
            "location_lat", 47.9,
            "location_lng", 106.9,
            "location_text", "Some location",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString(),
            "photo_keys", List.of()
        ));
        String taskId = taskResponse.getBody().get("id").toString();

        ResponseEntity<Map> postResponse = postWithAuth(
            "/api/v1/tasks/" + taskId + "/photos/upload-url", customer.accessToken(),
            Map.of("content_type", "image/png")
        );
        assertThat(postResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CANCEL cancel endpoint transitions task to CANCELLED")
    void customerCanCancelTask() {
        AuthContext customer = authenticate("93");
        String categoryId = getFirstCategoryId(customer.accessToken());

        ResponseEntity<Map> taskResponse = postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", categoryId,
            "description", "Description for cancel test task.",
            "budget", 60000,
            "location_lat", 47.9,
            "location_lng", 106.9,
            "location_text", "Some location",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString(),
            "photo_keys", List.of()
        ));
        String taskId = taskResponse.getBody().get("id").toString();

        ResponseEntity<Map> cancelResponse = postWithAuth(
            "/api/v1/tasks/" + taskId + "/cancel", customer.accessToken(), null
        );
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cancelResponse.getBody().get("status")).isEqualTo("CANCELLED");

        // Second cancel should fail (conflict/invalid status)
        ResponseEntity<Map> cancelAgain = postWithAuth(
            "/api/v1/tasks/" + taskId + "/cancel", customer.accessToken(), null
        );
        assertThat(cancelAgain.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Security: TASKER cannot create a task")
    void taskerCannotCreateTask() {
        AuthContext tasker = authenticate("94");
        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", tasker.accessToken(), null);
        String taskerToken = activateResponse.getBody().get("access_token").toString();

        String categoryId = getFirstCategoryId(taskerToken);
        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", taskerToken, Map.of(
            "category_id", categoryId,
            "description", "Tasker trying to create a task.",
            "budget", 50000,
            "location_lat", 47.0,
            "location_lng", 106.0,
            "location_text", "Anywhere",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-OPEN public feed returns only OPEN tasks")
    void publicFeedReturnsOnlyOpenTasks() {
        AuthContext customer = authenticate("100");
        String categoryId = getFirstCategoryId(customer.accessToken());

        // Create one OPEN task
        postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", categoryId,
            "description", "Description for OPEN task.",
            "budget", 50000,
            "location_lat", 47.9, "location_lng", 106.9,
            "location_text", "Location",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));

        // Create and CANCEL another task
        ResponseEntity<Map> cancelledResponse = postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", categoryId,
            "description", "Description for CANCELLED task.",
            "budget", 50000,
            "location_lat", 47.9, "location_lng", 106.9,
            "location_text", "Location",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));
        postWithAuth("/api/v1/tasks/" + cancelledResponse.getBody().get("id") + "/cancel", customer.accessToken(), null);

        // Fetch feed
        ResponseEntity<Map> feed = getWithAuth("/api/v1/tasks", customer.accessToken());
        List<Map<String, Object>> data = (List<Map<String, Object>>) feed.getBody().get("data");

        assertThat(data).isNotEmpty();
        assertThat(data).allSatisfy(task -> assertThat(task.get("status")).isEqualTo("OPEN"));
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-FILTERS category and distance filters")
    void feedFilters() {
        AuthContext customer = authenticate("101");
        String category1 = getFirstCategoryId(customer.accessToken());
        
        // Task in Category 1 at Location A
        postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", category1,
            "description", "Task in category 1 at loc A.",
            "budget", 50000,
            "location_lat", 47.91, "location_lng", 106.91,
            "location_text", "Loc A",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));

        // Task in Category 1 far away (Location B)
        postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", category1,
            "description", "Task far away.",
            "budget", 50000,
            "location_lat", 48.5, "location_lng", 107.5,
            "location_text", "Loc B",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));

        // Filter by category
        ResponseEntity<Map> categoryFilter = getWithAuth("/api/v1/tasks?category=" + category1, customer.accessToken());
        List<Map<String, Object>> catData = (List<Map<String, Object>>) categoryFilter.getBody().get("data");
        assertThat(catData).allSatisfy(task -> assertThat(((Map)task.get("category")).get("id")).isEqualTo(category1));

        // Filter by distance (within 20km of Loc A)
        ResponseEntity<Map> distanceFilter = getWithAuth("/api/v1/tasks?lat=47.9&lng=106.9&radius_km=20", customer.accessToken());
        List<Map<String, Object>> distData = (List<Map<String, Object>>) distanceFilter.getBody().get("data");
        assertThat(distData).hasSize(1);
        assertThat(distData.get(0).get("description")).isEqualTo("Task in category 1 at loc A.");
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-PRIVACY exact address hidden")
    void feedPrivacy() {
        AuthContext customer = authenticate("102");
        String categoryId = getFirstCategoryId(customer.accessToken());

        postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", categoryId,
            "description", "Privacy test task.",
            "budget", 50000,
            "location_lat", 47.9, "location_lng", 106.9,
            "location_text", "Secret Address 123",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));

        ResponseEntity<Map> feed = getWithAuth("/api/v1/tasks", customer.accessToken());
        List<Map<String, Object>> data = (List<Map<String, Object>>) feed.getBody().get("data");

        Map<String, Object> task = data.get(0);
        assertThat(task).doesNotContainKey("location_text");
        assertThat(task).containsKey("approximate_location");
        assertThat(task).containsKeys("approximate_lat", "approximate_lng");
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLY-OPEN-TASK tasker can apply to an open task")
    void taskerCanApplyToTask() {
        AuthContext customer = authenticate("110");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("111");
        postWithAuth("/api/v1/users/me/role/tasker", tasker.accessToken(), null);
        // Refresh token to get TASKER role
        String taskerToken = tokenFor("TASKER", "ACTIVE", tasker.userId());

        ResponseEntity<Map> response = postWithAuth(
            "/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message", "I can do this job!")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("PENDING");
        assertThat(response.getBody().get("message")).isEqualTo("I can do this job!");
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLICANT-LIST customer can list applicants and accept one")
    void customerCanAcceptApplicant() {
        AuthContext customer = authenticate("112");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        // Tasker applies
        AuthContext tasker = authenticate("113");
        String taskerToken = tokenFor("TASKER", "ACTIVE", tasker.userId());
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Pick me!"));

        // Customer lists applicants
        ResponseEntity<Map> listResponse = getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken());
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> apps = (List<Map<String, Object>>) listResponse.getBody().get("data");
        assertThat(apps).hasSize(1);
        String appId = apps.get(0).get("id").toString();

        // Customer accepts
        ResponseEntity<Map> acceptResponse = postWithAuth(
            "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
            customer.accessToken(),
            null
        );
        assertThat(acceptResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(acceptResponse.getBody().get("status")).isEqualTo("PENDING_PAYMENT");
        assertThat(acceptResponse.getBody().get("tasker_id")).isEqualTo(tasker.userId());
    }

    // --- Helpers ---

    private String createTask(String token, String categoryId) {
        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", token, Map.of(
            "category_id", categoryId,
            "description", "Description for a task that will have applications.",
            "budget", 70000,
            "location_lat", 47.9, "location_lng", 106.9,
            "location_text", "Ulaanbaatar",
            "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()
        ));
        return response.getBody().get("id").toString();
    }

    private String tokenFor(String role, String status, String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .claim("role", role)
            .claim("status", status)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
            .compact();
    }

    private AuthContext authenticate(String prefix) {
        String phone = uniquePhone(prefix);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
            String.valueOf(verifyResponse.getBody().get("access_token")),
            String.valueOf(user.get("id")),
            phone
        );
    }

    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", token);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
        return data.get(0).get("id").toString();
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));

        return restTemplate.exchange(
            url(path),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(
            url(path),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(
            url(path),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private String uniquePhone(String prefix) {
        // Deterministic unique phone based on prefix for simplicity in this test
        return "+976" + prefix + "000000";
    }

    private record AuthContext(String accessToken, String userId, String phone) {
    }
}
