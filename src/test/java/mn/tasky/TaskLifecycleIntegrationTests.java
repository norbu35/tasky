package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
@DirtiesContext
class TaskLifecycleIntegrationTests {

    @LocalServerPort
    private int port;

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

    // --- Helpers ---

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
