package mn.tasky.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

class UserProfileIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TID-TASK-011-API-PROFILE-GET-PUT GET/PUT /users/me supports profile " + "retrieval/update")
    void profileGetAndPutSupportsRetrievalAndUpdate() {
        AuthContext auth = authenticate("55");

        ResponseEntity<Map> firstGet = getWithAuth("/api/v1/users/me", auth.accessToken());
        assertThat(firstGet.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstGet.getBody())
                .containsKeys(
                        "id",
                        "phone",
                        "role",
                        "status",
                        "full_name",
                        "avatar_url",
                        "rating_avg",
                        "completed_tasks",
                        "is_pro",
                        "created_at");
        assertThat(firstGet.getBody().get("full_name")).isEqualTo("Tasky User");

        ResponseEntity<Map> updated = putWithAuth(
                "/api/v1/users/me",
                auth.accessToken(),
                Map.of("full_name", "Bat-Erdene", "avatar_url", "uploads/avatars/custom-profile.png"));

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody()).containsEntry("full_name", "Bat-Erdene");
        assertThat(updated.getBody()).containsEntry("avatar_url", "uploads/avatars/custom-profile.png");

        ResponseEntity<Map> secondGet = getWithAuth("/api/v1/users/me", auth.accessToken());
        assertThat(secondGet.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondGet.getBody()).containsEntry("full_name", "Bat-Erdene");
        assertThat(secondGet.getBody()).containsEntry("avatar_url", "uploads/avatars/custom-profile.png");
    }

    private AuthContext authenticate(String prefix) {
        String phone = uniquePhone(prefix);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> user =
                (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
                String.valueOf(verifyResponse.getBody().get("access_token")), String.valueOf(user.get("id")));
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private ResponseEntity<Map> putWithAuth(String path, String bearerToken, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(url(path), HttpMethod.PUT, new HttpEntity<>(body, headers), Map.class);
    }

    private String uniquePhone(String prefix) {
        String digits = UUID.randomUUID().toString().replaceAll("[^0-9]", "") + "0123456789";
        return "+976" + prefix + digits.substring(0, 6);
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-011-API-AVATAR-UPLOAD-URL avatar upload-url endpoint returns "
            + "constrained upload URL and storage key")
    void avatarUploadUrlEndpointReturnsConstrainedUploadInstruction() {
        AuthContext auth = authenticate("44");

        ResponseEntity<Map> uploadUrlResponse = postWithAuth(
                "/api/v1/users/me/avatar/upload-url", auth.accessToken(), Map.of("content_type", "image/png"));

        assertThat(uploadUrlResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String uploadUrl = String.valueOf(uploadUrlResponse.getBody().get("upload_url"));
        String storageKey = String.valueOf(uploadUrlResponse.getBody().get("storage_key"));

        assertThat(storageKey).startsWith("uploads/avatars/" + auth.userId() + "/");
        assertThat(storageKey).endsWith(".png");
        assertThat(uploadUrl).contains("content_type=image%2Fpng");
        assertThat(uploadUrl).contains("max_bytes=5242880");
        assertThat(uploadUrl).contains("expires_in=900");
        assertThat(uploadUrl).contains("expires_at=");
        assertThat(uploadUrl).contains("signature=");

        ResponseEntity<Map> badContentTypeResponse = postWithAuth(
                "/api/v1/users/me/avatar/upload-url", auth.accessToken(), Map.of("content_type", "application/pdf"));

        assertThat(badContentTypeResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private record AuthContext(String accessToken, String userId) {}
}
