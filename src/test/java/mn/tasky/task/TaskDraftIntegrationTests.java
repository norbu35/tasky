package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TaskDraftIntegrationTests extends IntegrationTestBase {

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
    @DisplayName("POST /tasks/drafts creates draft with server-resolved intake_schema_version")
    void createDraftWithValidCategory() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("50");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/tasks/drafts", customer.accessToken(), Map.of("category_id", categoryId));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("id")).isNotNull();
        assertThat(body.get("category_id")).isEqualTo(categoryId);
        assertThat(body.get("intake_schema_version")).isEqualTo(1);
        assertThat(body.get("created_at")).isNotNull();
        assertThat(body.get("expires_at")).isNotNull();
    }

    @Test
    @DisplayName("POST /tasks/drafts with category missing active schema returns 409")
    void createDraftWithNoActiveSchema() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("51");

        // Create category but do NOT activate a schema
        String categoryId = createCategory(adminToken);

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/tasks/drafts", customer.accessToken(), Map.of("category_id", categoryId));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsKey("code");
    }

    @Test
    @DisplayName("GET /tasks/drafts/{id} returns 200 with correct fields")
    void getDraftById() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("52");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        // Create a draft
        ResponseEntity<Map> createRes =
                postWithAuth("/api/v1/tasks/drafts", customer.accessToken(), Map.of("category_id", categoryId));
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String draftId = String.valueOf(createRes.getBody().get("id"));

        // Get the draft
        ResponseEntity<Map> getRes = getWithAuth("/api/v1/tasks/drafts/" + draftId, customer.accessToken());

        assertThat(getRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = getRes.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("id")).isEqualTo(draftId);
        assertThat(body.get("category_id")).isEqualTo(categoryId);
        assertThat(body.get("intake_schema_version")).isEqualTo(1);
    }

    @Test
    @DisplayName("PUT /tasks/drafts/{id} updates intake_answers and summary_draft")
    void updateDraftAnswers() {
        String adminToken = adminToken();
        AuthContext customer = authenticate("53");
        String categoryId = createCategoryWithActiveSchema(adminToken);

        // Create a draft
        ResponseEntity<Map> createRes =
                postWithAuth("/api/v1/tasks/drafts", customer.accessToken(), Map.of("category_id", categoryId));
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String draftId = String.valueOf(createRes.getBody().get("id"));

        // Update the draft
        String answers = "{\"location\":\"UB\",\"size\":\"Medium\",\"urgent\":true}";
        String summary = "Cleaning needed in UB, medium size, urgent";
        ResponseEntity<Map> updateRes = putWithAuth(
                "/api/v1/tasks/drafts/" + draftId,
                customer.accessToken(),
                Map.of("intake_answers", answers, "summary_draft", summary));

        assertThat(updateRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = updateRes.getBody();
        assertThat(body).isNotNull();
        // PostgreSQL jsonb normalizes key order, so compare structurally
        String returnedAnswers = String.valueOf(body.get("intake_answers"));
        assertThat(returnedAnswers).contains("\"location\"");
        assertThat(returnedAnswers).contains("\"UB\"");
        assertThat(returnedAnswers).contains("\"size\"");
        assertThat(returnedAnswers).contains("\"Medium\"");
        assertThat(body.get("summary_draft")).isEqualTo(summary);
    }

    @Test
    @DisplayName("GET /tasks/drafts/{id} returns 404 for non-existent draft")
    void getNonExistentDraftReturns404() {
        AuthContext customer = authenticate("54");
        String fakeId = UUID.randomUUID().toString();

        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/drafts/" + fakeId, customer.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("code", "NOT_FOUND");
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
                        "Draft Test " + UUID.randomUUID().toString().substring(0, 8),
                        "name_mn",
                        "Драфт Тест",
                        "icon_url",
                        "https://cdn.tasky.local/icons/test.png",
                        "sort_order",
                        900));
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

    private ResponseEntity<Map> putWithAuth(String path, String bearerToken, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.PUT, new HttpEntity<>(body, headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
