package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminFeatureToggleIntegrationTests extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private Jdbi jdbi;

    @Test
    @DisplayName("LAUNCH-013-GET returns all seeded toggles (4 items, all disabled)")
    void listTogglesReturnsSeededData() {
        // Reset all toggles to disabled in case previous test runs left state behind
        jdbi.useHandle(handle -> handle.execute("UPDATE feature_toggles SET is_enabled = false"));

        String token = adminToken();

        ResponseEntity<Map> response = getWithAuth("/api/v1/admin/features/toggles", token);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<Map> data = (List<Map>) response.getBody().get("data");
        assertThat(data).hasSize(4);
        assertThat(data)
                .allSatisfy(toggle -> assertThat(toggle.get("isEnabled")).isEqualTo(false));
    }

    @Test
    @DisplayName("LAUNCH-013-PUT-ENABLE enables a toggle and returns updated state")
    void enableToggle() {
        String token = adminToken();

        ResponseEntity<Map> response = putWithAuth(
                "/api/v1/admin/features/toggles",
                token,
                Map.of("feature_name", "lead_fee_enabled", "is_enabled", true));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().get("isEnabled")).isEqualTo(true);
        assertThat(response.getBody().get("featureName")).isEqualTo("lead_fee_enabled");
    }

    @Test
    @DisplayName("LAUNCH-013-PUT-DISABLE disables a toggle and returns updated state")
    void disableToggle() {
        String token = adminToken();

        // First enable it
        putWithAuth(
                "/api/v1/admin/features/toggles", token, Map.of("feature_name", "escrow_enabled", "is_enabled", true));

        // Then disable it
        ResponseEntity<Map> response = putWithAuth(
                "/api/v1/admin/features/toggles", token, Map.of("feature_name", "escrow_enabled", "is_enabled", false));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().get("isEnabled")).isEqualTo(false);
        assertThat(response.getBody().get("featureName")).isEqualTo("escrow_enabled");
    }

    @Test
    @DisplayName("LAUNCH-013-AUDIT audit event is written after toggle update")
    void auditEventWrittenOnUpdate() {
        String token = adminToken();

        putWithAuth(
                "/api/v1/admin/features/toggles",
                token,
                Map.of("feature_name", "subscription_enabled", "is_enabled", true));

        int count = jdbi.withHandle(handle -> handle.createQuery("SELECT count(*) FROM audit_events "
                        + "WHERE action = 'FEATURE_TOGGLE_UPDATED' "
                        + "AND resource_type = 'FEATURE_TOGGLE'")
                .mapTo(Integer.class)
                .one());
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    private String adminToken() {
        return Jwts.builder()
                .subject(ADMIN_ID)
                .claim("role", "ADMIN")
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    private ResponseEntity<Map> putWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.PUT, entity, Map.class);
    }
}
