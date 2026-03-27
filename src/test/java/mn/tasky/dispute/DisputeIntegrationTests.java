package mn.tasky.dispute;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import org.jdbi.v3.core.Jdbi;
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
class DisputeIntegrationTests extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingDao bookingDao;

    @Autowired
    private Jdbi jdbi;

    @Test
    @DisplayName("TID-TASK-041-API-DISPUTE-RAISE and resolve lifecycle " + "(TID-TASK-041-API-ADMIN-DISPUTE-RESOLVE)")
    void disputeLifecycle() {
        AuthContext customer = authenticate("cust-disp");
        AuthContext tasker = authenticate("tasker-disp");
        String adminToken = tokenFor("ADMIN", "ACTIVE", ADMIN_ID);

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);

        // 1. Raise fails: Not found
        String missingBookingId = UUID.randomUUID().toString();
        ResponseEntity<Map> resNotFound = postWithAuth(
                "/api/v1/bookings/" + missingBookingId + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Missing booking reason"));
        assertThat(resNotFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        // 2. Raise fails: Forbidden (wrong user)
        AuthContext stranger = authenticate("stranger-d");
        ResponseEntity<Map> resForbidden = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                stranger.accessToken(),
                Map.of("reason", "Forbidden dispute reason"));
        assertThat(resForbidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 3. Raise fails: Invalid status (CANCELLED booking)
        postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel", customer.accessToken(), null);
        ResponseEntity<Map> resInvalidStatus = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Invalid status reason"));
        assertThat(resInvalidStatus.getStatusCode().value()).isEqualTo(400);
        assertThat(resInvalidStatus.getBody().get("message").toString()).contains("ASSIGNED or COMPLETED");

        BookingState activeBooking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);

        // 4. Raise success (tasker can now raise too)
        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + activeBooking.id() + "/disputes",
                tasker.accessToken(),
                Map.of("reason", "Incomplete work"));
        assertThat(response.getStatusCode().value()).isEqualTo(201);
        String disputeId = (String) response.getBody().get("id");

        // 5. Raise fails: Already exists
        ResponseEntity<Map> resExists = postWithAuth(
                "/api/v1/bookings/" + activeBooking.id() + "/disputes",
                tasker.accessToken(),
                Map.of("reason", "Duplicate dispute"));
        assertThat(resExists.getStatusCode().value()).isEqualTo(409);
        assertThat(resExists.getBody().get("message").toString()).contains("exists");

        // 6. Resolve fails: not found
        String missingDisputeId = UUID.randomUUID().toString();
        ResponseEntity<Map> resResolveNotFound = postWithAuth(
                "/api/v1/admin/disputes/" + missingDisputeId + "/resolve",
                adminToken,
                Map.of("outcome", "RESOLVE_TASKER"));
        assertThat(resResolveNotFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        // 7. Resolve fails: invalid outcome
        ResponseEntity<Map> resInvalidOutcome =
                postWithAuth("/api/v1/admin/disputes/" + disputeId + "/resolve", adminToken, Map.of("outcome", "NONE"));
        assertThat(resInvalidOutcome.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // 8. Admin list
        ResponseEntity<Map> listRes = getWithAuth("/api/v1/admin/disputes", adminToken);
        List<Map> pending = (List<Map>) listRes.getBody().get("data");
        assertThat(pending.stream().anyMatch(d -> d.get("id").equals(disputeId)))
                .isTrue();

        ResponseEntity<Map> disputeDetail = getWithAuth("/api/v1/admin/disputes/" + disputeId, adminToken);
        assertThat(disputeDetail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(disputeDetail.getBody()).containsKey("dispute");
        assertThat(disputeDetail.getBody()).containsKey("booking");

        // 9. Resolve success
        ResponseEntity<Map> resolveRes = postWithAuth(
                "/api/v1/admin/disputes/" + disputeId + "/resolve",
                adminToken,
                Map.of("outcome", "RESOLVE_TASKER", "notes", "Work verified"));
        assertThat(resolveRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 10. Resolve fails: not open
        ResponseEntity<Map> resNotOpen = postWithAuth(
                "/api/v1/admin/disputes/" + disputeId + "/resolve", adminToken, Map.of("outcome", "RESOLVE_TASKER"));
        assertThat(resNotOpen.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-041-DOMAIN-PAYOUT-HOLD active dispute blocks duplicate disputes")
    void disputePreventsDuplicateOpenCase() {
        AuthContext customer = authenticate("cust-p");
        AuthContext tasker = authenticate("task-p");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 100000);

        // Raise dispute
        postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "First dispute reason"));

        // Duplicate open dispute should fail
        ResponseEntity<Map> duplicate = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Second dispute reason"));
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("TID-TASK-041-DOMAIN-DISPUTE-WINDOW completed booking dispute expires after 24h")
    void disputeWindowExpiresAfterCompletion() {
        AuthContext customer = authenticate("cust-w1");
        AuthContext tasker = authenticate("task-w1");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 100000);

        bookingDao.update(
                booking.id(),
                "COMPLETED",
                null,
                booking.liabilityDisclaimerAccepted(),
                Instant.now().minus(25, ChronoUnit.HOURS));

        ResponseEntity<Map> expired = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Payment was refused after completion"));

        assertThat(expired.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(expired.getBody().get("code")).isEqualTo("DISPUTE_WINDOW_EXPIRED");
    }

    @Test
    @DisplayName("TID-TASK-041-RELI-IDEMPOTENT-ADMIN-RESOLVE replay binds to original dispute " + "resource")
    void adminResolveReplayBindsToOriginalResource() {
        AuthContext customer = authenticate("cust-idem-admin");
        AuthContext taskerA = authenticate("task-idem-admin-a");
        AuthContext taskerB = authenticate("task-idem-admin-b");
        String adminToken = tokenFor("ADMIN", "ACTIVE", ADMIN_ID);

        String taskId = createTask(customer.accessToken());
        BookingState bookingA = bookingService.createBooking(taskId, taskerA.userId(), customer.userId(), 12000);
        BookingState bookingB = bookingService.createBooking(taskId, taskerB.userId(), customer.userId(), 13000);

        ResponseEntity<Map> disputeAResponse = postWithAuth(
                "/api/v1/bookings/" + bookingA.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Tasker refused to complete agreed scope"));
        ResponseEntity<Map> disputeBResponse = postWithAuth(
                "/api/v1/bookings/" + bookingB.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Tasker did not show up"));
        String disputeAId = (String) disputeAResponse.getBody().get("id");
        String disputeBId = (String) disputeBResponse.getBody().get("id");
        String key = UUID.randomUUID().toString();

        ResponseEntity<Map> firstResolve = postWithAuthAndIdempotency(
                "/api/v1/admin/disputes/" + disputeAId + "/resolve",
                adminToken,
                Map.of("outcome", "RESOLVE_TASKER", "notes", "Verified by admin"),
                key);
        ResponseEntity<Map> replayOnDifferentPath = postWithAuthAndIdempotency(
                "/api/v1/admin/disputes/" + disputeBId + "/resolve",
                adminToken,
                Map.of("outcome", "RESOLVE_CUSTOMER", "notes", "Should replay previous"),
                key);
        ResponseEntity<Map> disputeBState = getWithAuth("/api/v1/disputes/" + disputeBId, adminToken);

        assertThat(firstResolve.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replayOnDifferentPath.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replayOnDifferentPath.getBody().get("id")).isEqualTo(disputeAId);
        assertThat(disputeBState.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(disputeBState.getBody().get("status")).isEqualTo("OPEN");
    }

    @Test
    @DisplayName("TID-TASK-041-AUDIT-DISPUTE-RESOLVE dispute resolution writes immutable audit event")
    void disputeResolutionWritesAuditEvent() {
        AuthContext customer = authenticate("cust-audit");
        AuthContext tasker = authenticate("task-audit");
        String adminToken = tokenFor("ADMIN", "ACTIVE", ADMIN_ID);

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);

        ResponseEntity<Map> disputeResponse = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/disputes",
                customer.accessToken(),
                Map.of("reason", "Audit trail should exist"));
        String disputeId = (String) disputeResponse.getBody().get("id");

        ResponseEntity<Map> resolveResponse = postWithAuth(
                "/api/v1/admin/disputes/" + disputeId + "/resolve",
                adminToken,
                Map.of("outcome", "RESOLVE_CUSTOMER", "notes", "Customer evidence accepted"));

        assertThat(resolveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, String> auditEvent = jdbi.withHandle(handle -> handle.createQuery(
                        "SELECT actor_user_id::text AS actor_user_id, "
                                + "metadata_json ->> 'booking_id' AS booking_id, "
                                + "metadata_json ->> 'old_status' AS old_status, "
                                + "metadata_json ->> 'new_status' AS new_status, "
                                + "metadata_json ->> 'resolution_action' AS resolution_action, "
                                + "metadata_json ->> 'resolution_notes' AS resolution_notes "
                                + "FROM audit_events WHERE action = 'DISPUTE_RESOLVED' "
                                + "AND resource_type = 'DISPUTE' AND resource_id = CAST(:disputeId AS uuid)")
                .bind("disputeId", disputeId)
                .map((rs, ctx) -> Map.of(
                        "actor_user_id", rs.getString("actor_user_id"),
                        "booking_id", rs.getString("booking_id"),
                        "old_status", rs.getString("old_status"),
                        "new_status", rs.getString("new_status"),
                        "resolution_action", rs.getString("resolution_action"),
                        "resolution_notes", rs.getString("resolution_notes")))
                .one());
        assertThat(auditEvent)
                .containsEntry("actor_user_id", ADMIN_ID)
                .containsEntry("booking_id", booking.id())
                .containsEntry("old_status", "OPEN")
                .containsEntry("new_status", "RESOLVED_CUSTOMER")
                .containsEntry("resolution_action", "RESOLVE_CUSTOMER")
                .containsEntry("resolution_notes", "Customer evidence accepted");
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
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
                        "category_id",
                        categoryId,
                        "description",
                        "Dispute integration task description",
                        "budget",
                        100000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Ulaanbaatar",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        return response.getBody().get("id").toString();
    }

    private String tokenFor(String role, String status, String userId) {
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("status", status)
                .claim("token_type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();
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

    private ResponseEntity<Map> postWithAuthAndIdempotency(
            String path, String token, Object body, String idempotencyKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        headers.set("Idempotency-Key", idempotencyKey);
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
