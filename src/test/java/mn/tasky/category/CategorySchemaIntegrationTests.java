package mn.tasky.category;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class CategorySchemaIntegrationTests extends IntegrationTestBase {

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
    @DisplayName("create schema version returns 201 with version 1 and DRAFT status")
    void createSchemaVersion() {
        String adminToken = adminToken();
        String categoryId = createCategory(adminToken);

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas", adminToken, Map.of("schema_json", VALID_SCHEMA));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsEntry("version", 1);
        assertThat(response.getBody()).containsEntry("status", "DRAFT");
        assertThat(response.getBody()).containsEntry("category_id", categoryId);
    }

    @Test
    @DisplayName("schema validation rejects schema with fewer than 3 fields")
    void schemaValidationRejectsTooFewFields() {
        String adminToken = adminToken();
        String categoryId = createCategory(adminToken);

        String twoFieldSchema =
                """
            [
              {"key":"a","label":"A","type":"yes_no","required":true},
              {"key":"b","label":"B","type":"yes_no","required":false}
            ]
            """;

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas",
                adminToken,
                Map.of("schema_json", twoFieldSchema));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "INVALID_SCHEMA");
    }

    @Test
    @DisplayName("schema validation rejects unsupported field type")
    void schemaValidationRejectsUnsupportedType() {
        String adminToken = adminToken();
        String categoryId = createCategory(adminToken);

        String badTypeSchema =
                """
            [
              {"key":"a","label":"A","type":"text_input","required":true},
              {"key":"b","label":"B","type":"yes_no","required":false},
              {"key":"c","label":"C","type":"yes_no","required":false}
            ]
            """;

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas",
                adminToken,
                Map.of("schema_json", badTypeSchema));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "INVALID_SCHEMA");
    }

    @Test
    @DisplayName("activate draft version transitions to ACTIVE and updates category")
    void activateDraftVersion() {
        String adminToken = adminToken();
        String categoryId = createCategory(adminToken);

        // Create a draft
        ResponseEntity<Map> createRes = postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas", adminToken, Map.of("schema_json", VALID_SCHEMA));
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        int version = (int) createRes.getBody().get("version");

        // Activate
        ResponseEntity<Map> activateRes = postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas/" + version + "/activate", adminToken, Map.of());
        assertThat(activateRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activateRes.getBody()).containsEntry("status", "ACTIVE");
        assertThat(activateRes.getBody()).containsEntry("is_last_known_good", true);
        assertThat(activateRes.getBody().get("activated_at")).isNotNull();

        // Verify schema list shows the version
        ResponseEntity<List> listRes =
                getWithAuthList("/api/v1/admin/categories/" + categoryId + "/schemas", adminToken);
        assertThat(listRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listRes.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("activate already-active version returns 409 conflict")
    void activateAlreadyActiveVersionReturnsConflict() {
        String adminToken = adminToken();
        String categoryId = createCategory(adminToken);

        // Create and activate
        postWithAuth(
                "/api/v1/admin/categories/" + categoryId + "/schemas", adminToken, Map.of("schema_json", VALID_SCHEMA));

        postWithAuth("/api/v1/admin/categories/" + categoryId + "/schemas/1/activate", adminToken, Map.of());

        // Try to activate again
        ResponseEntity<Map> response =
                postWithAuth("/api/v1/admin/categories/" + categoryId + "/schemas/1/activate", adminToken, Map.of());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("code", "SCHEMA_ACTIVATION_CONFLICT");
    }

    // --- helpers ---

    private String createCategory(String adminToken) {
        ResponseEntity<Map> res = postWithAuth(
                "/api/v1/admin/categories",
                adminToken,
                Map.of(
                        "name",
                        "Schema Test " + UUID.randomUUID().toString().substring(0, 8),
                        "name_mn",
                        "Схем Тест",
                        "icon_url",
                        "https://cdn.tasky.local/icons/test.png",
                        "sort_order",
                        900));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return String.valueOf(res.getBody().get("id"));
    }

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

    private ResponseEntity<List> getWithAuthList(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), List.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
