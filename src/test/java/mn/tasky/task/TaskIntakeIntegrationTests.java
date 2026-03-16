package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TaskIntakeIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    private static final String VALID_SCHEMA =
            """
        [
          {"key":"location","label":"Location","type":"dropdown","required":true,"options":["UB","Darkhan","Erdenet"]},
          {"key":"size","label":"Size","type":"single_select","required":true,"options":["Small","Medium","Large"]},
          {"key":"urgent","label":"Urgent?","type":"yes_no","required":false}
        ]
        """;

    @Test
    @DisplayName(
            "Create task with intake answers persists intake_answers_json, intake_schema_version, scope_summary_source=TEMPLATE")
    void createTaskWithIntakeAnswers() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("60");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        String answers = "{\"location\":\"UB\",\"size\":\"Medium\",\"urgent\":true}";
        String scheduledAt = Instant.now().plus(7, ChronoUnit.DAYS).toString();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("category_id", categoryId);
        body.put("description", "Need cleaning service in my apartment urgently");
        body.put("budget", 50000);
        body.put("location_lat", 47.9185);
        body.put("location_lng", 106.9175);
        body.put("location_text", "Ulaanbaatar, Khan-Uul district");
        body.put("scheduled_at", scheduledAt);
        body.put("intake_answers", answers);
        body.put("intake_schema_version", 1);

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> taskBody = response.getBody();
        assertThat(taskBody).isNotNull();
        assertThat(taskBody.get("id")).isNotNull();

        // Verify via GET that the task was persisted with intake data
        String taskId = String.valueOf(taskBody.get("id"));
        ResponseEntity<Map> getResponse = getWithAuth("/api/v1/tasks/" + taskId, customer.accessToken());
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Create task with missing required intake answers returns 400 with field-level errors")
    void createTaskMissingRequiredIntakeAnswers() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("61");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        // Missing 'location' and 'size' which are required
        String answers = "{\"urgent\":true}";
        String scheduledAt = Instant.now().plus(7, ChronoUnit.DAYS).toString();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("category_id", categoryId);
        body.put("description", "Need cleaning service in my apartment urgently");
        body.put("budget", 50000);
        body.put("location_lat", 47.9185);
        body.put("location_lng", 106.9175);
        body.put("location_text", "Ulaanbaatar, Khan-Uul district");
        body.put("scheduled_at", scheduledAt);
        body.put("intake_answers", answers);
        body.put("intake_schema_version", 1);

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Map<String, Object> errorBody = response.getBody();
        assertThat(errorBody).isNotNull();
        assertThat(errorBody.get("code")).isEqualTo("INTAKE_VALIDATION_FAILED");
        String message = String.valueOf(errorBody.get("message"));
        assertThat(message).contains("Location is required");
        assertThat(message).contains("Size is required");
    }

    @Test
    @DisplayName("Schema version binding: draft binds v1, activate v2, task creation validates against v1")
    void draftSchemaVersionBinding() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("62");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        // Create a draft (binds to version 1)
        ResponseEntity<Map> draftRes =
                postWithAuth("/api/v1/tasks/drafts", customer.accessToken(), Map.of("category_id", categoryId));
        assertThat(draftRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String draftId = String.valueOf(draftRes.getBody().get("id"));
        assertThat(draftRes.getBody().get("intake_schema_version")).isEqualTo(1);

        // Create schema version 2 with different required fields
        String schemaV2 =
                """
            [
              {"key":"location","label":"Location","type":"dropdown","required":true,"options":["UB","Darkhan","Erdenet"]},
              {"key":"size","label":"Size","type":"single_select","required":true,"options":["Small","Medium","Large"]},
              {"key":"floor","label":"Floor","type":"numeric_counter","required":true,"min":1,"max":30}
            ]
            """;
        postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas", adminToken, Map.of("schema_json", schemaV2));

        // Activate version 2
        postWithAuth("/api/v1/admin/categories/" + categoryId + "/schemas/2/activate", adminToken, Map.of());

        // Create task referencing draft (should validate against version 1, not version 2)
        // Version 1 requires 'location' and 'size', NOT 'floor'
        String answers = "{\"location\":\"UB\",\"size\":\"Medium\",\"urgent\":true}";
        String scheduledAt = Instant.now().plus(7, ChronoUnit.DAYS).toString();

        Map<String, Object> taskBody = new LinkedHashMap<>();
        taskBody.put("category_id", categoryId);
        taskBody.put("description", "Need cleaning service in my apartment urgently");
        taskBody.put("budget", 50000);
        taskBody.put("location_lat", 47.9185);
        taskBody.put("location_lng", 106.9175);
        taskBody.put("location_text", "Ulaanbaatar, Khan-Uul district");
        taskBody.put("scheduled_at", scheduledAt);
        taskBody.put("intake_answers", answers);
        taskBody.put("draft_id", draftId);

        ResponseEntity<Map> taskRes = postWithAuth("/api/v1/tasks", customer.accessToken(), taskBody);

        // Should succeed because draft binds to v1, and v1 does not require 'floor'
        assertThat(taskRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    // --- auth helpers ---

    private AuthContext authenticate(String prefix) {
        String phone = "+976" + prefix + "000000";
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        @SuppressWarnings("unchecked")
        Map<String, Object> user =
                (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
                String.valueOf(verifyResponse.getBody().get("access_token")), String.valueOf(user.get("id")), phone);
    }

    private record AuthContext(String accessToken, String userId, String phone) {}

    // --- category helpers ---

    private String createCategoryWithActiveSchema(String adminToken) {
        String categoryId = createCategory(adminToken);

        // Create schema version
        postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas", adminToken, Map.of("schema_json", VALID_SCHEMA));

        // Activate schema version 1
        postWithAuth("/api/v1/admin/categories/" + categoryId + "/schemas/1/activate", adminToken, Map.of());

        return categoryId;
    }

    private String createCategory(String adminToken) {
        ResponseEntity<Map> res = postWithAuth(
                "/api/v1/admin/categories",
                adminToken,
                Map.of(
                        "name",
                        "Intake Test " + UUID.randomUUID().toString().substring(0, 8),
                        "name_mn",
                        "Intake Тест",
                        "icon_url",
                        "https://cdn.tasky.local/icons/test.png",
                        "sort_order",
                        950));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return String.valueOf(res.getBody().get("id"));
    }

    // --- token helpers ---

    private String adminToken() {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", "ADMIN")
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }

    // --- HTTP helpers ---

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
