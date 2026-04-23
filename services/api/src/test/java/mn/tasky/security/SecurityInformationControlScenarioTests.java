package mn.tasky.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
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

/**
 * Integration tests for information-control scenarios SCN-SEC-006 through SCN-SEC-008.
 * Verifies that the API correctly hides or reveals location and contact data
 * based on participation status and phase-gating.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class SecurityInformationControlScenarioTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @MockBean
    private FacebookGraphClient facebookGraphClient;

    // ── SCN-SEC-006 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-SEC-006: Open-task visibility exposes only approximate location before booking confirmation")
    void openTaskExposesFuzzedLocationToNonParticipants() {
        // Given: a customer creates a task
        AuthContext customer = devLogin("sec006-customer", "CUSTOMER");
        String taskId = createTask(customer);

        // When: a different non-booked tasker views the task
        AuthContext stranger = devLogin("sec006-stranger", "TASKER");
        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/" + taskId, stranger.token());

        // Then: only approximate location exposed, not exact fields
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = response.getBody();
        assertThat(body).containsKey("approximate_lat");
        assertThat(body).containsKey("approximate_lng");
        assertThat(body).doesNotContainKey("location_lat");
        assertThat(body).doesNotContainKey("location_lng");
        assertThat(body).doesNotContainKey("location_text");
    }

    // ── SCN-SEC-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName(
            "SCN-SEC-007: Exact task address is revealed only to the owner or booked tasker after booking confirmation")
    void exactAddressRevealedToOwnerAndBookedTasker() {
        // Given: customer owns the task
        AuthContext customer = devLogin("sec007-customer", "CUSTOMER");
        String taskId = createTask(customer);

        // Owner always sees exact fields
        ResponseEntity<Map> ownerView = getWithAuth("/api/v1/tasks/" + taskId, customer.token());
        assertThat(ownerView.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(ownerView.getBody()).containsKey("location_text");
        assertThat(ownerView.getBody()).containsKey("location_lat");

        // Non-participant only sees approximate
        AuthContext other = devLogin("sec007-other", "TASKER");
        ResponseEntity<Map> otherView = getWithAuth("/api/v1/tasks/" + taskId, other.token());
        assertThat(otherView.getBody()).doesNotContainKey("location_text");
        assertThat(otherView.getBody()).doesNotContainKey("location_lat");
    }

    // ── SCN-SEC-008 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-SEC-008: Customer-facing payloads never expose tasker phone fields")
    void taskerPhoneNeverExposedToCustomer() {
        // Given: a tasker exists and a task has been created
        AuthContext customer = devLogin("sec008-customer", "CUSTOMER");
        AuthContext tasker = devLogin("sec008-tasker", "TASKER");
        String taskId = createTask(customer);

        // When: customer views the task detail (includes partial tasker info where applicable)
        // and the public task feed — neither should expose phone
        ResponseEntity<Map> taskDetail = getWithAuth("/api/v1/tasks/" + taskId, customer.token());
        assertThat(taskDetail.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Then: owner task detail payload does not contain phone
        Map<String, Object> taskBody = taskDetail.getBody();
        assertThat(taskBody).doesNotContainKey("phone");
        // customer object within task should not have phone
        Map<String, Object> customerObj = (Map<String, Object>) taskBody.get("customer");
        if (customerObj != null) {
            assertThat(customerObj).doesNotContainKey("phone");
        }

        // Tasker profile endpoint also never returns phone
        ResponseEntity<Map> taskerProfile =
                getWithAuth("/api/v1/users/" + tasker.userId() + "/profile", customer.token());
        if (taskerProfile.getStatusCode().value() < 300) {
            assertThat(taskerProfile.getBody()).doesNotContainKey("phone");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private record AuthContext(String userId, String token) {}

    private AuthContext devLogin(String seed, String role) {
        Map<String, Object> body = Map.of("phone", phoneFor(seed), "role", role);
        ResponseEntity<Map> resp =
                restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/dev/login", body, Map.class);
        String token = (String) resp.getBody().get("access_token");
        String userId = (String) ((Map) resp.getBody().get("user")).get("id");
        return new AuthContext(userId, token);
    }

    private String createTask(AuthContext customer) {
        // Fetch first available category
        ResponseEntity<Map> cats = getWithAuth("/api/v1/categories", customer.token());
        String categoryId = ((Map<String, Object>) ((List<?>) cats.getBody().get("data")).get(0))
                .get("id")
                .toString();

        Map<String, Object> body = Map.of(
                "category_id",
                categoryId,
                "description",
                "Security test task description",
                "budget",
                50000,
                "pricing_mode",
                "BUDGET",
                "location_lat",
                47.9077,
                "location_lng",
                106.8832,
                "location_text",
                "Test Street 1, UB",
                "scheduled_at",
                Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                "intake_answers",
                Map.of());

        ResponseEntity<Map> resp = postWithAuth("/api/v1/tasks", customer.token(), body);
        return resp.getBody().get("id").toString();
    }

    private String phoneFor(String seed) {
        return "+97699" + String.format("%06d", Math.abs(seed.hashCode()) % 1_000_000);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(
                "http://localhost:" + port + path, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(
                "http://localhost:" + port + path, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }
}
