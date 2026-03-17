package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import org.jdbi.v3.core.Jdbi;
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
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@SuppressWarnings({"rawtypes", "unchecked", "ConstantConditions"})
class RescheduleIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingScheduleService scheduleService;

    @Autowired
    private BookingDao bookingDao;

    @Autowired
    private Jdbi jdbi;

    @Test
    @DisplayName("TIERS-006-RESCHEDULE-REQUEST request reschedule returns 201 with REQUESTED event")
    void requestReschedule() {
        AuthContext customer = authenticate("rs1");
        AuthContext tasker = authenticate("rs2");

        String taskId = createTask(customer.accessToken());
        Instant futureSchedule = Instant.now().plus(2, ChronoUnit.DAYS);
        BookingState booking = bookingService.createBooking(
                taskId, tasker.userId(), customer.userId(), 50000, false, futureSchedule);

        Instant proposedAt = Instant.now().plus(3, ChronoUnit.DAYS);
        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule",
                customer.accessToken(),
                Map.of("proposed_scheduled_at", proposedAt.toString(), "reason", "Schedule conflict"),
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("event_type")).isEqualTo("REQUESTED");
        assertThat(response.getBody().get("booking_id")).isEqualTo(booking.id());
        assertThat(response.getBody().get("reason")).isEqualTo("Schedule conflict");
    }

    @Test
    @DisplayName("TIERS-006-RESCHEDULE-ACCEPT accept reschedule updates confirmed_scheduled_at")
    void acceptReschedule() {
        AuthContext customer = authenticate("rs3");
        AuthContext tasker = authenticate("rs4");

        String taskId = createTask(customer.accessToken());
        Instant futureSchedule = Instant.now().plus(2, ChronoUnit.DAYS);
        BookingState booking = bookingService.createBooking(
                taskId, tasker.userId(), customer.userId(), 50000, false, futureSchedule);

        Instant proposedAt = Instant.now().plus(3, ChronoUnit.DAYS);
        ResponseEntity<Map> requestResponse = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule",
                customer.accessToken(),
                Map.of("proposed_scheduled_at", proposedAt.toString(), "reason", "Need to change time"),
                UUID.randomUUID().toString());

        assertThat(requestResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String eventId = (String) requestResponse.getBody().get("id");

        // Tasker accepts
        ResponseEntity<Map> acceptResponse = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule/" + eventId + "/respond",
                tasker.accessToken(),
                Map.of("action", "ACCEPT"),
                UUID.randomUUID().toString());

        assertThat(acceptResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(acceptResponse.getBody().get("event_type")).isEqualTo("ACCEPTED");

        // Verify booking schedule was updated
        BookingState updated = bookingDao.findById(booking.id()).orElseThrow();
        assertThat(updated.confirmedScheduledAt()).isNotNull();
        // The updated time should be close to proposedAt (within 1 second tolerance for parsing)
        assertThat(updated.confirmedScheduledAt().truncatedTo(ChronoUnit.SECONDS))
                .isEqualTo(proposedAt.truncatedTo(ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("TIERS-006-RESCHEDULE-DECLINE decline reschedule preserves original schedule")
    void declineReschedule() {
        AuthContext customer = authenticate("rs5");
        AuthContext tasker = authenticate("rs6");

        String taskId = createTask(customer.accessToken());
        Instant futureSchedule = Instant.now().plus(2, ChronoUnit.DAYS);
        BookingState booking = bookingService.createBooking(
                taskId, tasker.userId(), customer.userId(), 50000, false, futureSchedule);

        Instant proposedAt = Instant.now().plus(3, ChronoUnit.DAYS);
        ResponseEntity<Map> requestResponse = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule",
                customer.accessToken(),
                Map.of("proposed_scheduled_at", proposedAt.toString(), "reason", "Want to change"),
                UUID.randomUUID().toString());

        String eventId = (String) requestResponse.getBody().get("id");

        // Tasker declines
        ResponseEntity<Map> declineResponse = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule/" + eventId + "/respond",
                tasker.accessToken(),
                Map.of("action", "DECLINE"),
                UUID.randomUUID().toString());

        assertThat(declineResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(declineResponse.getBody().get("event_type")).isEqualTo("DECLINED");

        // Verify original schedule preserved
        BookingState unchanged = bookingDao.findById(booking.id()).orElseThrow();
        assertThat(unchanged.confirmedScheduledAt().truncatedTo(ChronoUnit.SECONDS))
                .isEqualTo(futureSchedule.truncatedTo(ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("TIERS-006-RESCHEDULE-INVALID-STATUS request on non-ASSIGNED booking returns 409")
    void requestOnNonAssignedBooking() {
        AuthContext customer = authenticate("rs7");
        AuthContext tasker = authenticate("rs8");

        String taskId = createTask(customer.accessToken());
        Instant futureSchedule = Instant.now().plus(2, ChronoUnit.DAYS);
        BookingState booking = bookingService.createBooking(
                taskId, tasker.userId(), customer.userId(), 50000, false, futureSchedule);

        // Cancel the booking first
        postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/cancel",
                customer.accessToken(),
                null,
                UUID.randomUUID().toString());

        Instant proposedAt = Instant.now().plus(3, ChronoUnit.DAYS);
        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule",
                customer.accessToken(),
                Map.of("proposed_scheduled_at", proposedAt.toString(), "reason", "Too late"),
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("code")).isEqualTo("INVALID_STATUS");
    }

    @Test
    @DisplayName("TIERS-006-RESCHEDULE-EXPIRY auto-expiry expires stale requests")
    void autoExpiryExpiresStaleRequests() {
        AuthContext customer = authenticate("rs9");
        AuthContext tasker = authenticate("rs10");

        String taskId = createTask(customer.accessToken());
        Instant futureSchedule = Instant.now().plus(2, ChronoUnit.DAYS);
        BookingState booking = bookingService.createBooking(
                taskId, tasker.userId(), customer.userId(), 50000, false, futureSchedule);

        Instant proposedAt = Instant.now().plus(3, ChronoUnit.DAYS);
        ResponseEntity<Map> requestResponse = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/reschedule",
                customer.accessToken(),
                Map.of("proposed_scheduled_at", proposedAt.toString(), "reason", "Need to shift"),
                UUID.randomUUID().toString());

        assertThat(requestResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String eventId = (String) requestResponse.getBody().get("id");

        // Directly set created_at to >24h ago via SQL
        jdbi.useHandle(handle -> handle.execute(
                "UPDATE booking_schedule_events SET created_at = ? WHERE id = ?::uuid",
                Instant.now().minus(25, ChronoUnit.HOURS),
                eventId));

        // Trigger expiry
        scheduleService.expireStaleRequests();

        // Verify event is now EXPIRED
        ResponseEntity<Map> eventsResponse = getWithAuth(
                "/api/v1/bookings/" + booking.id() + "/schedule-events",
                customer.accessToken());

        assertThat(eventsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> events = (List<Map<String, Object>>) eventsResponse.getBody().get("data");
        assertThat(events).isNotEmpty();
        Map<String, Object> expiredEvent = events.stream()
                .filter(e -> eventId.equals(e.get("id")))
                .findFirst()
                .orElseThrow();
        assertThat(expiredEvent.get("event_type")).isEqualTo("EXPIRED");
    }

    // --- helpers ---

    private AuthContext authenticate(String seed) {
        String phone = "+9768822" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String createTask(String token) {
        return createTaskAt(token, Instant.now().plus(1, ChronoUnit.DAYS));
    }

    private String createTaskAt(String token, Instant scheduledAt) {
        String catId = ((List<Map>)
                        getWithAuth("/api/v1/categories", token).getBody().get("data"))
                .getFirst()
                .get("id")
                .toString();
        ResponseEntity<Map> res = postWithAuth(
                "/api/v1/tasks",
                token,
                Map.of(
                        "category_id", catId,
                        "description", "Reschedule integration test task",
                        "budget", 50000,
                        "location_lat", 47.9,
                        "location_lng", 106.9,
                        "location_text", "Ulaanbaatar",
                        "scheduled_at", scheduledAt.toString()));
        return res.getBody().get("id").toString();
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
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

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/bookings/[^/]+/(cancel|complete|mark-done|no-show/flag|reschedule)$");
    }

    record AuthContext(String userId, String accessToken) {}
}
