package mn.tasky.dispute;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class DisputeEvidenceIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private DisputeEvidenceDao disputeEvidenceDao;

    @Test
    @DisplayName("TIERS-009: Raise dispute with evidence — evidence persisted and retrievable")
    void raiseDisputeWithEvidence() {
        AuthContext customer = authenticate("cust-ev1");
        AuthContext tasker = authenticate("task-ev1");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);

        Map<String, Object> body = Map.of(
                "reason", "Work was not completed as agreed upon",
                "evidence", List.of(
                        Map.of("type", "PHOTO", "storageKey", "uploads/dispute/photo1.jpg"),
                        Map.of("type", "WRITTEN_TIMELINE", "textPayload",
                                "Day 1: Tasker arrived late. Day 2: Work incomplete.")));

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                body);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        String disputeId = (String) response.getBody().get("id");
        assertThat(disputeId).isNotNull();

        // Verify evidence persisted via DAO
        var evidenceList = disputeEvidenceDao.findByDisputeId(disputeId);
        assertThat(evidenceList).hasSize(2);

        var photoEvidence = evidenceList.stream()
                .filter(e -> "PHOTO".equals(e.type()))
                .findFirst()
                .orElseThrow();
        assertThat(photoEvidence.storageKey()).isEqualTo("uploads/dispute/photo1.jpg");
        assertThat(photoEvidence.textPayload()).isNull();

        var timelineEvidence = evidenceList.stream()
                .filter(e -> "WRITTEN_TIMELINE".equals(e.type()))
                .findFirst()
                .orElseThrow();
        assertThat(timelineEvidence.textPayload()).contains("Day 1");
        assertThat(timelineEvidence.storageKey()).isNull();

        // Verify evidence returned on GET dispute
        ResponseEntity<Map> detailResponse = getWithAuth(
                "/api/v1/disputes/" + disputeId, customer.accessToken());
        assertThat(detailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> returnedEvidence = (List<Map>) detailResponse.getBody().get("evidence");
        assertThat(returnedEvidence).hasSize(2);
    }

    @Test
    @DisplayName("TIERS-009: Raise dispute with zero evidence — dispute stays OPEN initially")
    void raiseDisputeWithZeroEvidence() {
        AuthContext customer = authenticate("cust-ev2");
        AuthContext tasker = authenticate("task-ev2");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "The tasker did not finish the work properly"));

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        String disputeId = (String) response.getBody().get("id");
        assertThat(response.getBody().get("status")).isEqualTo("OPEN");

        // Verify no evidence
        var evidenceList = disputeEvidenceDao.findByDisputeId(disputeId);
        assertThat(evidenceList).isEmpty();

        // Verify dispute is still OPEN (not immediately closed)
        ResponseEntity<Map> detailResponse = getWithAuth(
                "/api/v1/disputes/" + disputeId, customer.accessToken());
        assertThat(detailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detailResponse.getBody().get("status")).isEqualTo("OPEN");
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769922" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String createTask(String token) {
        String categoryId = ((List<Map>)
                        getWithAuth("/api/v1/categories", token).getBody().get("data"))
                .get(0)
                .get("id")
                .toString();

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/tasks",
                token,
                Map.of(
                        "category_id", categoryId,
                        "description", "Evidence integration task description",
                        "budget", 100000,
                        "location_lat", 47.9,
                        "location_lng", 106.9,
                        "location_text", "Ulaanbaatar",
                        "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        return response.getBody().get("id").toString();
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key", UUID.randomUUID().toString());
        }
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/bookings/[^/]+/(cancel|disputes)$")
                || path.matches("^/api/v1/admin/disputes/[^/]+/resolve$");
    }

    record AuthContext(String userId, String accessToken) {}
}
