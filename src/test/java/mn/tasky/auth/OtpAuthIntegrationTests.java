package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.auth.application.AuthService;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

class OtpAuthIntegrationTests extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private AuthService authService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-010-API-OTP-REQUEST OTP request flow accepts valid phones and rejects malformed input")
    void otpRequestFlowValidatesInputAndIssuesChallenge() {
        String phone = uniquePhone("99");

        ResponseEntity<Map> okResponse = post(
            "/api/v1/auth/otp/request",
            Map.of("phone", phone)
        );

        assertThat(okResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(okResponse.getBody()).containsKey("message");

        ResponseEntity<Map> badResponse = post(
            "/api/v1/auth/otp/request",
            Map.of("phone", "99001122")
        );

        assertThat(badResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-010-API-OTP-VERIFY-SUCCESS OTP verify returns authenticated session")
    void otpVerifyReturnsAuthenticatedSession() {
        String phone = uniquePhone("88");

        ResponseEntity<Map> requestResponse = post(
            "/api/v1/auth/otp/request",
            Map.of("phone", phone)
        );
        assertThat(requestResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> verifyResponse = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(verifyResponse.getBody()).containsKeys("access_token", "refresh_token", "user");

        Map<String, Object> user = (Map<String, Object>) verifyResponse.getBody().get("user");
        assertThat(user.get("phone")).isEqualTo(phone);
        assertThat(user.get("role")).isEqualTo("CUSTOMER");
        assertThat(user.get("created_at")).isNotNull();
    }

    @Test
    @DisplayName("TID-TASK-010-API-PHONE-UNIQUE duplicate phone verification keeps a single user identity")
    void duplicatePhoneDoesNotCreateDuplicateUsers() {
        String phone = uniquePhone("77");

        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> firstVerify = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> secondVerify = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        Map<String, Object> firstUser = (Map<String, Object>) firstVerify.getBody().get("user");
        Map<String, Object> secondUser = (Map<String, Object>) secondVerify.getBody().get("user");

        assertThat(firstVerify.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondVerify.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondUser.get("id")).isEqualTo(firstUser.get("id"));
    }

    @Test
    @DisplayName("TID-TASK-010-API-TOKEN-REFRESH refresh endpoint rotates and validates token lifecycle")
    void refreshEndpointRotatesAndValidatesTokens() {
        String phone = uniquePhone("66");

        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> verify = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        String firstRefreshToken = String.valueOf(verify.getBody().get("refresh_token"));
        ResponseEntity<Map> firstRefreshResponse = post(
            "/api/v1/auth/token/refresh",
            Map.of("refresh_token", firstRefreshToken)
        );

        assertThat(firstRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstRefreshResponse.getBody()).containsKeys("access_token", "refresh_token");
        String secondRefreshToken = String.valueOf(firstRefreshResponse.getBody().get("refresh_token"));
        assertThat(secondRefreshToken).isNotEqualTo(firstRefreshToken);

        ResponseEntity<Map> staleRefreshResponse = post(
            "/api/v1/auth/token/refresh",
            Map.of("refresh_token", firstRefreshToken)
        );
        assertThat(staleRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> rotatedRefreshResponse = post(
            "/api/v1/auth/token/refresh",
            Map.of("refresh_token", secondRefreshToken)
        );
        assertThat(rotatedRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-010-API-OTP-VERIFY-ATTEMPTS challenge invalidates after 3 failed attempts")
    void otpChallengeInvalidatesAfterFailedAttempts() {
        String phone = uniquePhone("65");
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        for (int i = 0; i < 3; i++) {
            ResponseEntity<Map> failed = post(
                "/api/v1/auth/otp/verify",
                Map.of("phone", phone, "code", "000000")
            );
            assertThat(failed.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        ResponseEntity<Map> rejectedCorrectCode = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );
        assertThat(rejectedCorrectCode.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("TID-TASK-010-API-TOKEN-REFRESH-BANNED banned user cannot refresh")
    void bannedUserCannotRefreshToken() {
        String phone = uniquePhone("64");

        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> verify = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );
        String refreshToken = String.valueOf(verify.getBody().get("refresh_token"));
        Map<String, Object> user = (Map<String, Object>) verify.getBody().get("user");
        String userId = String.valueOf(user.get("id"));

        authService.banUser("admin-test", userId, "security-test");

        ResponseEntity<Map> refreshResponse = post(
            "/api/v1/auth/token/refresh",
            Map.of("refresh_token", refreshToken)
        );
        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
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

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private String uniquePhone(String prefix) {
        String digits = UUID.randomUUID().toString().replaceAll("[^0-9]", "") + "0123456789";
        return "+976" + prefix + digits.substring(0, 6);
    }
}
