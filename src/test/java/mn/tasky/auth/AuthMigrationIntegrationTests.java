package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(
        properties = {
            "tasky.auth.otp-migration-enforced=true",
            "tasky.auth.rate-limit.otp-request-per-phone=1",
            "tasky.auth.rate-limit.otp-request-per-ip=100",
            "tasky.auth.rate-limit.otp-verify-per-phone=5",
            "tasky.auth.rate-limit.otp-verify-per-ip=100"
        })
class AuthMigrationIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();
    private static final AtomicInteger IP_SUFFIX = new AtomicInteger(40);
    private static final AtomicInteger PHONE_SUFFIX = new AtomicInteger(200000);

    @LocalServerPort
    private int port;

    @MockBean
    private FacebookGraphClient facebookGraphClient;

    @Test
    @DisplayName("TID-TASK-091-API-OTP-RATE-LIMIT OTP request endpoint enforces configured per-phone limits")
    void otpRequestRateLimitEnforced() {
        String phone = nextPhone();
        String clientIp = nextClientIp();

        ResponseEntity<Map> first = post("/api/v1/auth/otp/request", Map.of("phone", phone), clientIp, null);
        ResponseEntity<Map> second = post("/api/v1/auth/otp/request", Map.of("phone", phone), clientIp, null);

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(second.getBody()).containsEntry("code", "OTP_REQUEST_RATE_LIMITED");
    }

    @Test
    @DisplayName("TID-TASK-091-API-MIGRATION-GATE Facebook-era users are gated until OTP migration is completed")
    void migrationGateBlocksThenAllowsAfterOtpLink() {
        String facebookToken = "facebook-migration-token";
        String facebookId = "fb-user-migration";
        stubFacebookToken(facebookToken, facebookId);

        ResponseEntity<Map> facebookLogin =
                post("/api/v1/auth/facebook", Map.of("access_token", facebookToken), nextClientIp(), null);

        assertThat(facebookLogin.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> facebookUser = userFromAuthResponse(facebookLogin);
        String facebookAccessToken = String.valueOf(facebookLogin.getBody().get("access_token"));
        String facebookUserId = String.valueOf(facebookUser.get("id"));

        ResponseEntity<Map> gatedProfile = get("/api/v1/users/me", facebookAccessToken);
        assertThat(gatedProfile.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(gatedProfile.getBody()).containsEntry("code", "OTP_MIGRATION_REQUIRED");

        String migratedPhone = nextPhone();
        post("/api/v1/auth/otp/request", Map.of("phone", migratedPhone), nextClientIp(), null);
        stubFacebookToken(facebookToken, facebookId);

        ResponseEntity<Map> migratedSession = post(
                "/api/v1/auth/otp/verify",
                Map.of("phone", migratedPhone, "code", "123456", "facebook_access_token", facebookToken),
                nextClientIp(),
                null);

        assertThat(migratedSession.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> migratedUser = userFromAuthResponse(migratedSession);
        assertThat(migratedUser.get("id")).isEqualTo(facebookUserId);
        assertThat(migratedUser.get("facebook_id")).isEqualTo(facebookId);

        String migratedAccessToken = String.valueOf(migratedSession.getBody().get("access_token"));
        ResponseEntity<Map> allowedProfile = get("/api/v1/users/me", migratedAccessToken);
        assertThat(allowedProfile.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-091-API-OTP-PRIMARY-AUTH OTP authentication works without Facebook linkage")
    void otpPrimaryAuthWorksWithoutFacebookToken() {
        String phone = nextPhone();

        ResponseEntity<Map> request = post("/api/v1/auth/otp/request", Map.of("phone", phone), nextClientIp(), null);
        ResponseEntity<Map> verify =
                post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"), nextClientIp(), null);

        assertThat(request.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(verify.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> user = userFromAuthResponse(verify);
        assertThat(user).containsKey("id");
        assertThat(user).doesNotContainKey("facebook_id");
    }

    @Test
    @DisplayName(
            "TID-TASK-091-RELI-OAUTH-OUTAGE-POSTURE OAuth outage fails closed while existing sessions remain usable")
    void oauthOutageFailsClosedAndExistingSessionsRemainUsable() {
        String phone = nextPhone();
        post("/api/v1/auth/otp/request", Map.of("phone", phone), nextClientIp(), null);
        ResponseEntity<Map> otpSession =
                post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"), nextClientIp(), null);
        String existingAccessToken = String.valueOf(otpSession.getBody().get("access_token"));

        String outageToken = "facebook-provider-outage-token";
        doThrow(new FacebookAuthException(
                        "AUTH_PROVIDER_UNAVAILABLE", "Facebook authentication provider is unavailable."))
                .when(facebookGraphClient)
                .debugToken(outageToken);

        ResponseEntity<Map> outageLogin =
                post("/api/v1/auth/facebook", Map.of("access_token", outageToken), nextClientIp(), null);
        assertThat(outageLogin.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(outageLogin.getBody()).containsEntry("code", "AUTH_PROVIDER_UNAVAILABLE");

        ResponseEntity<Map> sessionStillValid = get("/api/v1/users/me", existingAccessToken);
        assertThat(sessionStillValid.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private void stubFacebookToken(String accessToken, String facebookId) {
        doNothing().when(facebookGraphClient).debugToken(accessToken);
        when(facebookGraphClient.fetchProfile(accessToken))
                .thenReturn(new FacebookGraphClient.FacebookProfile(
                        facebookId,
                        "Facebook User " + UUID.randomUUID(),
                        "https://graph.facebook.com/" + facebookId + "/picture"));
    }

    private ResponseEntity<Map> post(String path, Map<String, ?> body, String clientIp, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (clientIp != null && !clientIp.isBlank()) {
            headers.set("X-Forwarded-For", clientIp);
        }
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> get(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.setBearerAuth(bearerToken);
        }
        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private Map<String, Object> userFromAuthResponse(ResponseEntity<Map> response) {
        return (Map<String, Object>) response.getBody().get("user");
    }

    private String nextClientIp() {
        return "198.51.100." + IP_SUFFIX.getAndIncrement();
    }

    private String nextPhone() {
        return "+9769" + PHONE_SUFFIX.getAndIncrement();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
