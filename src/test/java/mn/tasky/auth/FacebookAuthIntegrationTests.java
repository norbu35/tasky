package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import java.util.concurrent.atomic.AtomicInteger;

class FacebookAuthIntegrationTests
        extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();
    private final AtomicInteger ipSuffix = new AtomicInteger(10);
    @LocalServerPort
    private int port;
    @Autowired
    private AuthService authService;
    @MockBean
    private FacebookGraphClient facebookGraphClient;

    @Test
    @DisplayName("TID-TASK-010-API-FACEBOOK-AUTH Facebook login creates or authenticates user")
    void facebookLoginCreatesOrAuthenticatesUser() {
        String accessToken = "facebook-token-auth";
        stubFacebookToken(accessToken,
                          "fb-user-auth");

        ResponseEntity<Map> response = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       accessToken)
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("access_token",
                                                    "refresh_token",
                                                    "user");
        Map<String, Object> user = (Map<String, Object>) response.getBody()
                .get("user");
        assertThat(user.get("facebook_id")).isEqualTo("fb-user-auth");
        assertThat(user.get("role")).isEqualTo("CUSTOMER");
    }

    private void stubFacebookToken(String accessToken,
                                   String facebookId) {
        doNothing().when(facebookGraphClient)
                .debugToken(accessToken);
        when(facebookGraphClient.fetchProfile(accessToken)).thenReturn(
                new FacebookGraphClient.FacebookProfile(
                        facebookId,
                        "Facebook User " + UUID.randomUUID(),
                        "https://graph.facebook.com/" + facebookId + "/picture"
                )
        );
    }

    private ResponseEntity<Map> post(String path,
                                     Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.set("X-Forwarded-For",
                    nextClientIp());

        return restTemplate.exchange(
                url(path),
                HttpMethod.POST,
                new HttpEntity<>(body,
                                 headers),
                Map.class
        );
    }

    private String nextClientIp() {
        return "198.51.100." + ipSuffix.getAndIncrement();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-010-API-FACEBOOK-DEDUP same facebook_id does not create duplicates")
    void facebookDeduplicatesByFacebookId() {
        String firstAccessToken = "facebook-token-dedup-1";
        String secondAccessToken = "facebook-token-dedup-2";
        String facebookId = "fb-user-dedup";

        stubFacebookToken(firstAccessToken,
                          facebookId);
        stubFacebookToken(secondAccessToken,
                          facebookId);

        ResponseEntity<Map> first = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       firstAccessToken)
        );
        ResponseEntity<Map> second = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       secondAccessToken)
        );

        Map<String, Object> firstUser = (Map<String, Object>) first.getBody()
                .get("user");
        Map<String, Object> secondUser = (Map<String, Object>) second.getBody()
                .get("user");

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstUser.get("id")).isEqualTo(secondUser.get("id"));
    }

    @Test
    @DisplayName("TID-TASK-010-API-TOKEN-REFRESH refresh endpoint rotates and validates token " +
            "lifecycle")
    void refreshEndpointRotatesAndValidatesTokens() {
        String accessToken = "facebook-token-refresh";
        stubFacebookToken(accessToken,
                          "fb-user-refresh");

        ResponseEntity<Map> login = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       accessToken)
        );
        String firstRefreshToken = String.valueOf(login.getBody()
                                                          .get("refresh_token"));

        ResponseEntity<Map> firstRefreshResponse = post(
                "/api/v1/auth/token/refresh",
                Map.of("refresh_token",
                       firstRefreshToken)
        );

        assertThat(firstRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstRefreshResponse.getBody()).containsKeys("access_token",
                                                                "refresh_token");
        String secondRefreshToken = String.valueOf(firstRefreshResponse.getBody()
                                                           .get("refresh_token"));
        assertThat(secondRefreshToken).isNotEqualTo(firstRefreshToken);

        ResponseEntity<Map> staleRefreshResponse = post(
                "/api/v1/auth/token/refresh",
                Map.of("refresh_token",
                       firstRefreshToken)
        );
        assertThat(staleRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> rotatedRefreshResponse = post(
                "/api/v1/auth/token/refresh",
                Map.of("refresh_token",
                       secondRefreshToken)
        );
        assertThat(rotatedRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-010-API-FACEBOOK-AUTH-BANNED banned user is rejected at Facebook login")
    void bannedUserCannotLoginWithFacebook() {
        String accessToken = "facebook-token-banned";
        String facebookId = "fb-user-banned";
        stubFacebookToken(accessToken,
                          facebookId);

        ResponseEntity<Map> initialLogin = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       accessToken)
        );
        Map<String, Object> user = (Map<String, Object>) initialLogin.getBody()
                .get("user");
        String userId = String.valueOf(user.get("id"));

        authService.banUser(ADMIN_ID,
                            userId,
                            "security-test");

        ResponseEntity<Map> bannedResponse = post(
                "/api/v1/auth/facebook",
                Map.of("access_token",
                       accessToken)
        );

        assertThat(bannedResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
