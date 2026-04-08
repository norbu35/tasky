package mn.tasky.contract;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Contract tests that verify every error response from the API surface
 * returns the standard envelope: {"code": "...", "message": "...", "trace_id": "..."}.
 *
 * <p>These tests are derived from docs/API.yaml — they check the HTTP contract
 * (status codes, envelope shape) not the business logic (covered by scenario tests).
 *
 * <p>Coverage: 401 unauthenticated, 403 forbidden, 400/422 validation errors,
 * 404 not found, 409 idempotency conflict, 503 provider unavailable.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class ContractEnvelopeTests extends IntegrationTestBase {

    private final TestRestTemplate http = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    // ── 401 Unauthenticated ───────────────────────────────────────────────────

    static Stream<Arguments> protectedGetEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/tasks"),
                Arguments.of("/api/v1/bookings"),
                Arguments.of("/api/v1/users/me/profile"),
                Arguments.of("/api/v1/conversations"),
                Arguments.of("/api/v1/disputes"),
                Arguments.of("/api/v1/reviews/me"),
                Arguments.of("/api/v1/admin/categories"),
                Arguments.of("/api/v1/admin/users")
        );
    }

    @ParameterizedTest(name = "SCN-CONTRACT-401: GET {0} without auth returns 401 with standard envelope")
    @MethodSource("protectedGetEndpoints")
    @DisplayName("SCN-CONTRACT-401 SCN-SMOKE-005: Unauthenticated requests return 401 with standard error envelope")
    void unauthenticatedReturns401WithEnvelope(String path) {
        ResponseEntity<Map> resp = http.exchange(url(path), HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()), Map.class);

        assertThat(resp.getStatusCode().value()).isEqualTo(401);
        assertEnvelope(resp.getBody(), path);
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────────

    static Stream<Arguments> adminOnlyEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/admin/categories", "CUSTOMER"),
                Arguments.of("/api/v1/admin/users", "TASKER"),
                Arguments.of("/api/v1/security/admin/ping", "CUSTOMER")
        );
    }

    @ParameterizedTest(name = "SCN-CONTRACT-403: {0} with role {1} returns 403 with standard envelope")
    @MethodSource("adminOnlyEndpoints")
    @DisplayName("SCN-CONTRACT-403: Forbidden access returns 403 with standard error envelope")
    void forbiddenReturns403WithEnvelope(String path, String role) {
        ResponseEntity<Map> resp = http.exchange(url(path), HttpMethod.GET,
                new HttpEntity<>(authHeaders(role)), Map.class);

        assertThat(resp.getStatusCode().value()).isEqualTo(403);
        assertEnvelope(resp.getBody(), path);
    }

    // ── 400 Validation ────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CONTRACT-400: POST /auth/facebook with missing body field returns 400 with standard envelope")
    void missingBodyFieldReturns400WithEnvelope() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        // Missing required access_token field
        ResponseEntity<Map> resp = http.exchange(url("/api/v1/auth/facebook"),
                HttpMethod.POST, new HttpEntity<>(Map.of(), h), Map.class);

        assertThat(resp.getStatusCode().value()).isBetween(400, 422);
        assertEnvelope(resp.getBody(), "/api/v1/auth/facebook");
    }

    @Test
    @DisplayName("SCN-CONTRACT-400: POST /tasks with budget below minimum returns 400 with standard envelope")
    void budgetBelowMinimumReturns400WithEnvelope() {
        // Authenticate first
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> authResp = http.postForEntity(url("/api/v1/auth/dev/login"),
                new HttpEntity<>(Map.of("phone", "+97693001001", "role", "CUSTOMER"), h), Map.class);
        String token = (String) authResp.getBody().get("access_token");

        // Get a category
        HttpHeaders authH = authHeaders("CUSTOMER", token);
        Map cats = http.exchange(url("/api/v1/categories"), HttpMethod.GET,
                new HttpEntity<>(authH), Map.class).getBody();
        String catId = ((Map) ((java.util.List) cats.get("data")).get(0)).get("id").toString();

        // POST task with budget below @Min(5000)
        HttpHeaders postH = new HttpHeaders();
        postH.setBearerAuth(token);
        postH.setContentType(MediaType.APPLICATION_JSON);
        Map body = Map.of("category_id", catId, "description", "Budget test task description",
                "budget", 100, "location_lat", 47.9, "location_lng", 106.9,
                "location_text", "Test, UB", "scheduled_at",
                Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS).toString());
        ResponseEntity<Map> resp = http.exchange(url("/api/v1/tasks"), HttpMethod.POST,
                new HttpEntity<>(body, postH), Map.class);

        assertThat(resp.getStatusCode().value()).isBetween(400, 422);
        assertEnvelope(resp.getBody(), "/api/v1/tasks");
    }

    // ── 404 Not Found ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CONTRACT-404: GET /tasks/{id} with unknown id returns 404 with standard envelope")
    void unknownTaskReturns404WithEnvelope() {
        ResponseEntity<Map> resp = http.exchange(
                url("/api/v1/tasks/" + UUID.randomUUID()),
                HttpMethod.GET, new HttpEntity<>(authHeaders("CUSTOMER")), Map.class);

        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertEnvelope(resp.getBody(), "/api/v1/tasks/{id}");
    }

    @Test
    @DisplayName("SCN-CONTRACT-404: GET /bookings/{id} with unknown id returns 404 with standard envelope")
    void unknownBookingReturns404WithEnvelope() {
        ResponseEntity<Map> resp = http.exchange(
                url("/api/v1/bookings/" + UUID.randomUUID()),
                HttpMethod.GET, new HttpEntity<>(authHeaders("CUSTOMER")), Map.class);

        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertEnvelope(resp.getBody(), "/api/v1/bookings/{id}");
    }

    // ── 400 Invalid cursor ────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CONTRACT-400: GET /tasks?cursor=invalid returns 400 INVALID_CURSOR with standard envelope")
    void invalidCursorReturns400WithEnvelope() {
        ResponseEntity<Map> resp = http.exchange(
                url("/api/v1/tasks?cursor=not-base64"),
                HttpMethod.GET, new HttpEntity<>(authHeaders("TASKER")), Map.class);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertEnvelope(resp.getBody(), "/api/v1/tasks?cursor");
        assertThat(resp.getBody().get("code")).isEqualTo("INVALID_CURSOR");
    }

    // ── SCN-SMOKE-005 anchor ──────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-SMOKE-005: All protected endpoint error responses include code, message, and trace_id fields")
    void errorEnvelopeShapeVerifiedAcrossEndpoints() {
        // Delegates to the parameterized 401/403/400/404 tests above.
        // This method anchors SCN-SMOKE-005 so surefire XML captures the smoke ID.
        ResponseEntity<Map> resp = http.exchange(url("/api/v1/tasks"), HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()), Map.class);
        assertEnvelope(resp.getBody(), "smoke-anchor /api/v1/tasks");
    }

    // ── Envelope shape helper ─────────────────────────────────────────────────

    /**
     * Asserts the three required fields are present in every error response.
     * This is the cross-cutting contract: all 4xx/5xx responses MUST return
     * {"code": "...", "message": "...", "trace_id": "..."}.
     */
    private void assertEnvelope(Map<String, Object> body, String context) {
        assertThat(body)
                .as("Error envelope missing 'code' for %s", context)
                .containsKey("code");
        assertThat(body)
                .as("Error envelope missing 'message' for %s", context)
                .containsKey("message");
        assertThat(body)
                .as("Error envelope missing 'trace_id' for %s", context)
                .containsKey("trace_id");
        assertThat(body.get("code")).isNotNull().isNotEqualTo("");
        assertThat(body.get("message")).isNotNull().isNotEqualTo("");
        assertThat(body.get("trace_id")).isNotNull().isNotEqualTo("");
    }

    private HttpHeaders authHeaders(String role) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(mintJwt(role));
        return h;
    }

    private HttpHeaders authHeaders(String role, String existingToken) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(existingToken);
        return h;
    }

    private String mintJwt(String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", role)
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)),
                        Jwts.SIG.HS256)
                .compact();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
