package mn.tasky.verification;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.sql.Timestamp;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext
class VerificationIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @org.springframework.beans.factory.annotation.Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("TID-TASK-012-API-TASKER-ACTIVATE CUSTOMER can activate TASKER role and receives" + " new tokens")
    void customerCanActivateTaskerRole() {
        AuthContext auth = authenticate("70");

        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        assertThat(activateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activateResponse.getBody()).containsKeys("access_token", "refresh_token", "user");

        Map<String, Object> user =
                (Map<String, Object>) activateResponse.getBody().get("user");
        assertThat(user.get("role")).isEqualTo("TASKER");
        assertThat(user.get("status")).isEqualTo("PENDING");

        // New tokens should work and reflect TASKER role
        String newAccessToken = String.valueOf(activateResponse.getBody().get("access_token"));
        ResponseEntity<Map> profileResponse = getWithAuth("/api/v1/users/me", newAccessToken);
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileResponse.getBody().get("role")).isEqualTo("TASKER");

        // Second activation should return 409
        ResponseEntity<Map> duplicateResponse = postWithAuth("/api/v1/users/me/role/tasker", newAccessToken, null);
        assertThat(duplicateResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    private AuthContext authenticate(String prefix) {
        String phone = uniquePhone(prefix);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        @SuppressWarnings("unchecked")
        Map<String, Object> user =
                (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
                String.valueOf(verifyResponse.getBody().get("access_token")), String.valueOf(user.get("id")));
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Map<String, ?> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
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

    // --- Helpers ---

    @Test
    @DisplayName("TID-TASK-012-API-VERIFICATION-SUBMIT tasker can get upload URLs and submit " + "verification")
    void taskerCanSubmitVerification() {
        AuthContext auth = authenticate("71");

        // Activate tasker role first
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        // Get upload URL for front
        ResponseEntity<Map> frontUploadResponse =
                postWithAuth("/api/v1/verification/upload-url", taskerToken, Map.of("content_type", "image/jpeg"));
        assertThat(frontUploadResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(frontUploadResponse.getBody()).containsKeys("upload_url", "storage_key");
        String frontKey = String.valueOf(frontUploadResponse.getBody().get("storage_key"));
        assertThat(frontKey).startsWith("uploads/verification/");
        assertThat(frontKey).endsWith(".jpg");

        // Get upload URL for back
        ResponseEntity<Map> backUploadResponse =
                postWithAuth("/api/v1/verification/upload-url", taskerToken, Map.of("content_type", "image/png"));
        assertThat(backUploadResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String backKey = String.valueOf(backUploadResponse.getBody().get("storage_key"));

        // Submit verification
        ResponseEntity<Map> submitResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        frontKey,
                        "id_card_back_key",
                        backKey,
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(submitResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(submitResponse.getBody().get("status")).isEqualTo("PENDING");

        // Duplicate submit should return 409
        ResponseEntity<Map> duplicateSubmit = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        frontKey,
                        "id_card_back_key",
                        backKey,
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(duplicateSubmit.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName(
            "TID-TASK-012-API-VERIFICATION-SUBMIT "
                    + "verification submission rejects keys outside the caller namespace")
    void verificationSubmissionRejectsForeignOrWrongNamespaceKeys() {
        AuthContext auth = authenticate("73");

        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        ResponseEntity<Map> wrongOwnerResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/other-user/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/other-user/back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));

        assertThat(wrongOwnerResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(wrongOwnerResponse.getBody()).containsEntry("code", "INVALID_VERIFICATION_KEY");

        ResponseEntity<Map> wrongNamespaceResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/tasks/" + auth.userId() + "/photo.jpg",
                        "id_card_back_key",
                        "uploads/tasks/" + auth.userId() + "/photo-2.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));

        assertThat(wrongNamespaceResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(wrongNamespaceResponse.getBody()).containsEntry("code", "INVALID_VERIFICATION_KEY");
    }

    @Test
    @DisplayName("TID-TASK-012-API-VERIFICATION-STATUS TID-TASK-013-API-ADMIN-VERIFICATION-LIST "
            + "TID-TASK-013-API-ADMIN-VERIFICATION-APPROVE verification status reflects full "
            + "lifecycle")
    @SuppressWarnings("unchecked")
    void verificationStatusReflectsFullLifecycle() {
        AuthContext auth = authenticate("72");

        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        // Before submit: NOT_SUBMITTED
        ResponseEntity<Map> statusBefore = getWithAuth("/api/v1/verification/status", taskerToken);
        assertThat(statusBefore.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(statusBefore.getBody().get("status")).isEqualTo("NOT_SUBMITTED");

        // Submit verification
        postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));

        // After submit: PENDING
        ResponseEntity<Map> statusPending = getWithAuth("/api/v1/verification/status", taskerToken);
        assertThat(statusPending.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(statusPending.getBody().get("status")).isEqualTo("PENDING");
        assertThat(statusPending.getBody()).containsKey("submitted_at");

        // Admin lists pending verifications
        String adminToken = adminToken();
        ResponseEntity<Map> pendingList = getWithAuth("/api/v1/admin/verifications/pending", adminToken);
        assertThat(pendingList.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) pendingList.getBody().get("data");
        assertThat(data).isNotEmpty();

        // Find this user's verification
        Map<String, Object> verification = data.stream()
                .filter(v -> auth.userId().equals(v.get("user_id")))
                .findFirst()
                .orElseThrow();
        String verificationId = String.valueOf(verification.get("id"));
        assertThat(verification.get("status")).isEqualTo("PENDING");
        assertThat(verification).containsKeys("id_card_front_url", "id_card_back_url", "submitted_at");

        // Admin approves
        ResponseEntity<Map> approveResponse =
                postWithAuth("/api/v1/admin/verifications/" + verificationId + "/approve", adminToken, null);
        assertThat(approveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(approveResponse.getBody().get("status")).isEqualTo("APPROVED");
        assertThat(approveResponse.getBody()).containsKey("reviewed_at");

        // After approval: APPROVED
        ResponseEntity<Map> statusApproved = getWithAuth("/api/v1/verification/status", taskerToken);
        assertThat(statusApproved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(statusApproved.getBody().get("status")).isEqualTo("APPROVED");

        // User status should be VERIFIED
        ResponseEntity<Map> profile = getWithAuth("/api/v1/users/me", taskerToken);
        assertThat(profile.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profile.getBody().get("status")).isEqualTo("VERIFIED");
    }

    @Test
    @DisplayName("TID-TASK-013-API-ADMIN-VERIFICATION-LIST legacy invalid verification media keys do not break admin review")
    @SuppressWarnings("unchecked")
    void adminVerificationEndpointsTolerateLegacyInvalidMediaKeys() {
        AuthContext auth = authenticate("741");
        String verificationId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        jdbcTemplate.update(
                "INSERT INTO verifications (id, user_id, id_card_front_key, id_card_back_key, status, submitted_at,"
                        + " admin_notes, reviewed_at, consent_policy_version, consent_accepted_at, dan_reference)"
                        + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.fromString(verificationId),
                UUID.fromString(auth.userId()),
                "uploads/tasks/" + auth.userId() + "/foreign-photo.jpg",
                "not-a-managed-key",
                "PENDING",
                Timestamp.from(now),
                null,
                null,
                "1.0",
                Timestamp.from(now),
                null);

        String adminToken = adminToken();
        ResponseEntity<Map> pendingResponse = getWithAuth("/api/v1/admin/verifications/pending", adminToken);

        assertThat(pendingResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) pendingResponse.getBody().get("data");
        Map<String, Object> verification = data.stream()
                .filter(row -> verificationId.equals(row.get("id")))
                .findFirst()
                .orElseThrow();
        assertThat(verification.get("id_card_front_url")).isNull();
        assertThat(verification.get("id_card_back_url")).isNull();

        ResponseEntity<Map> detailResponse =
                getWithAuth("/api/v1/admin/verifications/" + verificationId, adminToken);

        assertThat(detailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detailResponse.getBody().get("id_card_front_url")).isNull();
        assertThat(detailResponse.getBody().get("id_card_back_url")).isNull();
    }

    private String adminToken() {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("role", "ADMIN")
                .claim("status", "ACTIVE")
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }

    @Test
    @DisplayName("TID-TASK-012-API-VERIFICATION-STATUS TID-TASK-013-API-ADMIN-VERIFICATION-REJECT"
            + " admin can reject and user can resubmit")
    void adminCanRejectAndUserCanResubmit() {
        AuthContext auth = authenticate("73");

        // Activate and submit
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));

        // Admin rejects
        String adminToken = adminToken();
        ResponseEntity<Map> pendingList = getWithAuth("/api/v1/admin/verifications/pending", adminToken);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) pendingList.getBody().get("data");
        Map<String, Object> verification = data.stream()
                .filter(v -> auth.userId().equals(v.get("user_id")))
                .findFirst()
                .orElseThrow();
        String verificationId = String.valueOf(verification.get("id"));

        ResponseEntity<Map> rejectResponse = postWithAuth(
                "/api/v1/admin/verifications/" + verificationId + "/reject",
                adminToken,
                Map.of("reason", "Photo is blurry"));
        assertThat(rejectResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rejectResponse.getBody().get("status")).isEqualTo("REJECTED");
        assertThat(rejectResponse.getBody().get("admin_notes")).isEqualTo("Photo is blurry");

        // User sees REJECTED with admin_notes
        ResponseEntity<Map> statusRejected = getWithAuth("/api/v1/verification/status", taskerToken);
        assertThat(statusRejected.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(statusRejected.getBody().get("status")).isEqualTo("REJECTED");
        assertThat(statusRejected.getBody().get("admin_notes")).isEqualTo("Photo is blurry");

        // User can resubmit after rejection
        ResponseEntity<Map> resubmit = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front2.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back2.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(resubmit.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resubmit.getBody().get("status")).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("Security: unauthenticated and unauthorized access is rejected")
    void securityChecks() {
        // Unauthenticated access to verification endpoints returns 401
        ResponseEntity<Map> noAuth = getWithAuth("/api/v1/verification/status", null);
        assertThat(noAuth.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Non-admin accessing admin endpoints returns 403
        AuthContext auth = authenticate("74");
        ResponseEntity<Map> forbidden = getWithAuth("/api/v1/admin/verifications/pending", auth.accessToken());
        assertThat(forbidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // CUSTOMER submitting verification returns error (not TASKER)
        ResponseEntity<Map> notTasker = postWithAuth(
                "/api/v1/verification/submit",
                auth.accessToken(),
                Map.of(
                        "id_card_front_key",
                        "front.jpg",
                        "id_card_back_key",
                        "back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(notTasker.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verification upload-url rejects unsupported content types")
    void uploadUrlRejectsUnsupportedContentTypes() {
        AuthContext auth = authenticate("75");
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        // webp should be rejected for verification (allowed for avatars but not government IDs)
        ResponseEntity<Map> webpResponse =
                postWithAuth("/api/v1/verification/upload-url", taskerToken, Map.of("content_type", "image/webp"));
        assertThat(webpResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // pdf should be rejected
        ResponseEntity<Map> pdfResponse =
                postWithAuth("/api/v1/verification/upload-url", taskerToken, Map.of("content_type", "application/pdf"));
        assertThat(pdfResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verification submit without consent returns 400")
    void submitWithoutConsentReturns400() {
        AuthContext auth = authenticate("76");

        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        // Submit without consent fields at all — should get 400 from validation
        ResponseEntity<Map> noConsentResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back.jpg"));
        assertThat(noConsentResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Submit with consent_accepted = false — should get 400
        ResponseEntity<Map> consentFalseResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        false));
        assertThat(consentFalseResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verification submit with consent succeeds")
    void submitWithConsentSucceeds() {
        AuthContext auth = authenticate("77");

        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", auth.accessToken(), null);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        // Submit with valid consent
        ResponseEntity<Map> submitResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/" + auth.userId() + "/front.jpg",
                        "id_card_back_key",
                        "uploads/verification/" + auth.userId() + "/back.jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(submitResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(submitResponse.getBody().get("status")).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("Admin approve/reject returns 404 for non-existent verification")
    void adminReturns404ForNonExistent() {
        String adminToken = adminToken();
        String fakeId = UUID.randomUUID().toString();

        ResponseEntity<Map> approveResponse =
                postWithAuth("/api/v1/admin/verifications/" + fakeId + "/approve", adminToken, null);
        assertThat(approveResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<Map> rejectResponse =
                postWithAuth("/api/v1/admin/verifications/" + fakeId + "/reject", adminToken, Map.of("reason", "test"));
        assertThat(rejectResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private record AuthContext(String accessToken, String userId) {}
}
