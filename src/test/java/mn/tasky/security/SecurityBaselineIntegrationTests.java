package mn.tasky.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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

class SecurityBaselineIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @MockBean
    private FacebookGraphClient facebookGraphClient;

    @Test
    @DisplayName("TID-TASK-004-SEC-RBAC-GUARD route-level RBAC enforces customer/tasker/admin " + "scopes")
    void routeLevelRbacGuardEnforced() {
        String customerToken = tokenFor("CUSTOMER", "ACTIVE");
        String taskerToken = tokenFor("TASKER", "ACTIVE");
        String adminToken = tokenFor("ADMIN", "ACTIVE");

        assertThat(get("/api/v1/security/customer/ping", customerToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(get("/api/v1/security/tasker/ping", customerToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThat(get("/api/v1/security/tasker/ping", taskerToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(get("/api/v1/security/admin/ping", taskerToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThat(get("/api/v1/security/admin/ping", adminToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private String tokenFor(String role, String status) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", role)
                .claim("status", status)
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }

    private ResponseEntity<Map> get(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-004-SEC-BANNED-USER-BLOCK banned users are denied despite valid JWT")
    void bannedUsersDeniedWithValidJwt() {
        String bannedAdminToken = tokenFor("ADMIN", "BANNED");

        ResponseEntity<Map> response = get("/api/v1/security/admin/ping", bannedAdminToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "USER_BANNED");
    }

    @Test
    @DisplayName("TID-TASK-004-SEC-SUSPENDED-USER-BLOCK suspended users are denied despite valid " + "JWT")
    void suspendedUsersDeniedWithValidJwt() {
        String suspendedToken = tokenFor("CUSTOMER", "SUSPENDED");

        ResponseEntity<Map> response = get("/api/v1/security/customer/ping", suspendedToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "USER_BANNED");
    }

    @Test
    @DisplayName("TID-TASK-004-SEC-OAUTH-RATE-LIMIT Facebook OAuth endpoint enforces IP rate limit")
    void facebookAuthRateLimited() {
        String accessToken = "facebook-security-token";
        String rateLimitIp = "203.0.113.42";
        when(facebookGraphClient.debugToken(accessToken)).thenReturn("fb-user-security");
        when(facebookGraphClient.fetchProfile(accessToken))
                .thenReturn(new FacebookGraphClient.FacebookProfile("fb-user-security", "Security Test", null));

        for (int index = 0; index < 10; index++) {
            ResponseEntity<Map> response =
                    post("/api/v1/auth/facebook", Map.of("access_token", accessToken), rateLimitIp);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        ResponseEntity<Map> blockedRequest =
                post("/api/v1/auth/facebook", Map.of("access_token", accessToken), rateLimitIp);
        assertThat(blockedRequest.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body, String clientIp) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (clientIp != null && !clientIp.isBlank()) {
            headers.set("X-Forwarded-For", clientIp);
        }

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        return post(path, body, null);
    }
}
