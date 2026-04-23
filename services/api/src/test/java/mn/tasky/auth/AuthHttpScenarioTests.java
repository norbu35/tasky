package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * HTTP-layer integration tests for auth scenarios that require the full Spring Security
 * filter chain, OTP controller, or Facebook auth controller to be exercised.
 *
 * <p>SCN-AUTH-002/003 require OTP to be DISABLED (Phase 0-1 behaviour).
 * SCN-AUTH-007/012/013 run with OTP disabled (normal test profile).
 *
 * <p>Tests run against a real database (Testcontainers) via IntegrationTestBase.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "tasky.otp.enabled=false")
@SuppressWarnings({"rawtypes", "unchecked"})
class AuthHttpScenarioTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @MockBean
    private FacebookGraphClient facebookGraphClient;

    @Autowired
    private FacebookCircuitBreaker circuitBreaker;

    // ── SCN-AUTH-002 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-002: Phase 0-1 OTP request endpoint is disabled with 403 FEATURE_DISABLED")
    void otpRequestDisabledReturns403() {
        // Given: tasky.otp.enabled=false (default in test profile — Phase 0-1)
        ResponseEntity<Map> response = post("/api/v1/auth/otp/request", Map.of("phone", "+97699001122"));

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "FEATURE_DISABLED");
    }

    // ── SCN-AUTH-003 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-003: Phase 0-1 OTP verify endpoint is disabled with 403 FEATURE_DISABLED")
    void otpVerifyDisabledReturns403() {
        // Given: tasky.otp.enabled=false (default in test profile — Phase 0-1)
        ResponseEntity<Map> response =
                post("/api/v1/auth/otp/verify", Map.of("phone", "+97699001122", "code", "123456"));

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "FEATURE_DISABLED");
    }

    // ── SCN-AUTH-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-007: Invalid-signature or expired access token is rejected with 401")
    void invalidJwtRejectedWith401() {
        // Given: a token signed with a wrong key
        String badToken = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", "CUSTOMER")
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(
                        Keys.hmacShaKeyFor(
                                "wrong-secret-key-minimum-32-chars-long-xxx".getBytes(StandardCharsets.UTF_8)),
                        Jwts.SIG.HS256)
                .compact();

        // When: calling a protected endpoint
        ResponseEntity<Map> response = getWithAuth("/api/v1/bookings", badToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ── SCN-AUTH-012 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-012: Facebook OAuth outage fails closed with 503 AUTH_PROVIDER_UNAVAILABLE")
    void facebookOutageReturns503() {
        // Given: FacebookGraphClient throws provider-unavailable on every call
        when(facebookGraphClient.debugToken(anyString()))
                .thenThrow(new FacebookAuthException(
                        "AUTH_PROVIDER_UNAVAILABLE", "Facebook authentication is temporarily unavailable"));

        // When
        ResponseEntity<Map> response = post("/api/v1/auth/facebook", Map.of("access_token", "any-token"));

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).containsEntry("code", "AUTH_PROVIDER_UNAVAILABLE");
    }

    // ── SCN-AUTH-013 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-013 SCN-SMOKE-001: Existing valid session remains usable during Facebook OAuth outage")
    void existingSessionUsableDuringOutage() {
        // Given: a user is already authenticated (valid JWT issued with the real signing key)
        String validToken = validToken("CUSTOMER", "ACTIVE");

        // And: Facebook is unavailable for new logins
        when(facebookGraphClient.debugToken(anyString()))
                .thenThrow(new FacebookAuthException(
                        "AUTH_PROVIDER_UNAVAILABLE", "Facebook authentication is temporarily unavailable"));

        // When: the authenticated user calls a product endpoint with existing session
        ResponseEntity<Map> response = getWithAuth("/api/v1/bookings", validToken);

        // Then: the existing session is still authorized (not 401 or 403 from auth)
        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(
                "http://localhost:" + port + path, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private String validToken(String role, String status) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .issuer("tasky-server")
                .audience()
                .add("tasky-api")
                .and()
                .id(UUID.randomUUID().toString())
                .claim("role", role)
                .claim("status", status)
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }
}
