package mn.tasky.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

class SecurityBaselineIntegrationTests extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-004-SEC-RBAC-GUARD route-level RBAC enforces customer/tasker/admin scopes")
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

    @Test
    @DisplayName("TID-TASK-004-SEC-BANNED-USER-BLOCK banned users are denied despite valid JWT")
    void bannedUsersDeniedWithValidJwt() {
        String bannedAdminToken = tokenFor("ADMIN", "BANNED");

        ResponseEntity<Map> response = get("/api/v1/security/admin/ping", bannedAdminToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("code", "USER_BANNED");
    }

    @Test
    @DisplayName("TID-TASK-004-SEC-OTP-RATE-LIMIT OTP endpoints enforce request and verify limits")
    void otpEndpointsRateLimitedAndBruteForceProtected() {
        String requestPhone = "+97699" + randomDigits(6);
        String verifyPhone = "+97688" + randomDigits(6);

        for (int index = 0; index < 3; index++) {
            ResponseEntity<Map> response = post(
                "/api/v1/auth/otp/request",
                Map.of("phone", requestPhone)
            );
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        ResponseEntity<Map> fourthRequest = post(
            "/api/v1/auth/otp/request",
            Map.of("phone", requestPhone)
        );
        assertThat(fourthRequest.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);

        for (int index = 0; index < 5; index++) {
            ResponseEntity<Map> verifyResponse = post(
                "/api/v1/auth/otp/verify",
                Map.of("phone", verifyPhone, "code", "000000")
            );
            assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        ResponseEntity<Map> blockedVerify = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", verifyPhone, "code", "000000")
        );
        assertThat(blockedVerify.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    private ResponseEntity<Map> get(String path, String bearerToken) {
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

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return restTemplate.exchange(
            url(path),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private String tokenFor(String role, String status) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(UUID.randomUUID().toString())
            .claim("role", role)
            .claim("status", status)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
            .compact();
    }

    private String randomDigits(int length) {
        String seed = UUID.randomUUID().toString().replaceAll("[^0-9]", "");
        if (seed.length() >= length) {
            return seed.substring(0, length);
        }
        return (seed + "0123456789").substring(0, length);
    }
}
