package mn.tasky.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Authorization matrix test — verifies every guarded endpoint returns the correct HTTP
 * status for each of the four authentication states:
 * UNAUTHENTICATED, CUSTOMER, TASKER, ADMIN.
 *
 * <p>These tests exercise the Spring Security filter chain (SecurityConfig) only. Business-logic
 * authorization enforced at the service layer is out of scope here.
 */
@DisplayName("Authorization Matrix")
class AuthorizationMatrixTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @MockBean
    private FacebookGraphClient facebookGraphClient;

    // -----------------------------------------------------------------------
    // Public endpoints — no JWT required
    // -----------------------------------------------------------------------

    static Stream<Arguments> publicGetEndpoints() {
        return Stream.of(Arguments.of("/actuator/health"), Arguments.of("/api/v1/system/version"));
    }

    @ParameterizedTest(name = "GET {0} is accessible without auth")
    @MethodSource("publicGetEndpoints")
    @DisplayName("SCN-SEC-001: Protected endpoints reject requests without a bearer JWT")
    void publicEndpointsAccessibleWithoutAuth(String path) {
        ResponseEntity<Map> response = exchange(path, HttpMethod.GET, null);
        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("Expected 2xx for public endpoint %s but got %s", path, response.getStatusCode())
                .isTrue();
    }

    // -----------------------------------------------------------------------
    // Unauthenticated access to protected endpoints returns 401
    // -----------------------------------------------------------------------

    static Stream<Arguments> protectedEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/tasks", HttpMethod.GET),
                Arguments.of("/api/v1/bookings", HttpMethod.GET),
                Arguments.of("/api/v1/security/customer/ping", HttpMethod.GET),
                Arguments.of("/api/v1/security/tasker/ping", HttpMethod.GET),
                Arguments.of("/api/v1/security/admin/ping", HttpMethod.GET),
                Arguments.of("/api/v1/admin/categories", HttpMethod.GET));
    }

    @ParameterizedTest(name = "{1} {0} returns 401 without auth")
    @MethodSource("protectedEndpoints")
    @DisplayName("SCN-SEC-001: Protected endpoints reject requests without a bearer JWT")
    void protectedEndpointsReturn401WithoutAuth(String path, HttpMethod method) {
        ResponseEntity<Map> response = exchange(path, method, null);
        assertThat(response.getStatusCode())
                .as("%s %s without auth", method, path)
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // -----------------------------------------------------------------------
    // CUSTOMER role — allowed on customer endpoints, forbidden on admin/tasker
    // -----------------------------------------------------------------------

    static Stream<Arguments> customerAllowedEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/tasks", HttpMethod.GET),
                Arguments.of("/api/v1/bookings", HttpMethod.GET),
                Arguments.of("/api/v1/security/customer/ping", HttpMethod.GET));
    }

    @ParameterizedTest(name = "CUSTOMER: {1} {0} is allowed")
    @MethodSource("customerAllowedEndpoints")
    @DisplayName("SCN-SEC-002: CUSTOMER role cannot access tasker-only or admin-only routes")
    void customerCanAccessAllowedEndpoints(String path, HttpMethod method) {
        String token = tokenFor("CUSTOMER");
        ResponseEntity<Map> response = exchange(path, method, token);
        assertThat(response.getStatusCode())
                .as("CUSTOMER %s %s", method, path)
                .isNotEqualTo(HttpStatus.UNAUTHORIZED)
                .isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    static Stream<Arguments> customerForbiddenEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/security/tasker/ping", HttpMethod.GET),
                Arguments.of("/api/v1/security/admin/ping", HttpMethod.GET),
                Arguments.of("/api/v1/admin/categories", HttpMethod.GET));
    }

    @ParameterizedTest(name = "CUSTOMER: {1} {0} is forbidden")
    @MethodSource("customerForbiddenEndpoints")
    @DisplayName("SCN-SEC-002: CUSTOMER role cannot access tasker-only or admin-only routes")
    void customerForbiddenFromRestrictedEndpoints(String path, HttpMethod method) {
        String token = tokenFor("CUSTOMER");
        ResponseEntity<Map> response = exchange(path, method, token);
        assertThat(response.getStatusCode()).as("CUSTOMER %s %s", method, path).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // -----------------------------------------------------------------------
    // TASKER role — allowed on tasker endpoints, forbidden on customer/admin
    // -----------------------------------------------------------------------

    static Stream<Arguments> taskerAllowedEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/tasks", HttpMethod.GET),
                Arguments.of("/api/v1/bookings", HttpMethod.GET),
                Arguments.of("/api/v1/security/tasker/ping", HttpMethod.GET));
    }

    @ParameterizedTest(name = "TASKER: {1} {0} is allowed")
    @MethodSource("taskerAllowedEndpoints")
    @DisplayName("SCN-SEC-003: TASKER role cannot access customer-only or admin-only routes")
    void taskerCanAccessAllowedEndpoints(String path, HttpMethod method) {
        String token = tokenFor("TASKER");
        ResponseEntity<Map> response = exchange(path, method, token);
        assertThat(response.getStatusCode())
                .as("TASKER %s %s", method, path)
                .isNotEqualTo(HttpStatus.UNAUTHORIZED)
                .isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    static Stream<Arguments> taskerForbiddenEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/security/customer/ping", HttpMethod.GET),
                Arguments.of("/api/v1/security/admin/ping", HttpMethod.GET),
                Arguments.of("/api/v1/admin/categories", HttpMethod.GET));
    }

    @ParameterizedTest(name = "TASKER: {1} {0} is forbidden")
    @MethodSource("taskerForbiddenEndpoints")
    @DisplayName("SCN-SEC-003: TASKER role cannot access customer-only or admin-only routes")
    void taskerForbiddenFromRestrictedEndpoints(String path, HttpMethod method) {
        String token = tokenFor("TASKER");
        ResponseEntity<Map> response = exchange(path, method, token);
        assertThat(response.getStatusCode()).as("TASKER %s %s", method, path).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // -----------------------------------------------------------------------
    // ADMIN role — allowed everywhere including admin endpoints
    // -----------------------------------------------------------------------

    static Stream<Arguments> adminAllowedEndpoints() {
        return Stream.of(
                Arguments.of("/api/v1/tasks", HttpMethod.GET),
                Arguments.of("/api/v1/bookings", HttpMethod.GET),
                Arguments.of("/api/v1/security/admin/ping", HttpMethod.GET),
                Arguments.of("/api/v1/admin/categories", HttpMethod.GET));
    }

    @ParameterizedTest(name = "ADMIN: {1} {0} is allowed")
    @MethodSource("adminAllowedEndpoints")
    @DisplayName("SCN-SEC-004: ADMIN-only routes are accessible to ADMIN and forbidden to non-admin roles")
    void adminCanAccessAllEndpoints(String path, HttpMethod method) {
        String token = tokenFor("ADMIN");
        ResponseEntity<Map> response = exchange(path, method, token);
        assertThat(response.getStatusCode())
                .as("ADMIN %s %s", method, path)
                .isNotEqualTo(HttpStatus.UNAUTHORIZED)
                .isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/tasks — CUSTOMER only at SecurityConfig level
    // -----------------------------------------------------------------------

    @ParameterizedTest(name = "POST /api/v1/tasks with role={0}: expected={1}")
    @MethodSource("createTaskMatrix")
    @DisplayName("SCN-SEC-005: Task creation endpoint allows CUSTOMER and rejects TASKER or ADMIN at the security layer")
    void createTaskEnforcesCustomerRole(String role, HttpStatus expected) {
        String token = role != null ? tokenFor(role) : null;
        ResponseEntity<Map> response = exchange("/api/v1/tasks", HttpMethod.POST, token);
        if (expected == HttpStatus.FORBIDDEN || expected == HttpStatus.UNAUTHORIZED) {
            assertThat(response.getStatusCode()).isEqualTo(expected);
        } else {
            // CUSTOMER: any non-403/401 response (4xx from validation, 200, etc.)
            assertThat(response.getStatusCode())
                    .isNotEqualTo(HttpStatus.FORBIDDEN)
                    .isNotEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    static Stream<Arguments> createTaskMatrix() {
        return Stream.of(
                Arguments.of(null, HttpStatus.UNAUTHORIZED), // unauthenticated
                Arguments.of("CUSTOMER", HttpStatus.OK), // allowed (may 422 from missing body)
                Arguments.of("TASKER", HttpStatus.FORBIDDEN), // role mismatch
                Arguments.of("ADMIN", HttpStatus.FORBIDDEN) // admin cannot create tasks
                );
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private String tokenFor(String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", role)
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> exchange(String path, HttpMethod method, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }
        return restTemplate.exchange("http://localhost:" + port + path, method, new HttpEntity<>(headers), Map.class);
    }
}
