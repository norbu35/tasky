package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTimelineEvent;
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
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@SuppressWarnings({"rawtypes", "unchecked", "ConstantConditions"})
class BookingTimelineIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingTimelineService timelineService;

    @Test
    @DisplayName("TIERS-004-TIMELINE-COMPLETE completing a booking records BOOKING_COMPLETED event")
    void completeBookingRecordsTimelineEvent() {
        AuthContext customer = authenticate("tl1");
        AuthContext tasker = authenticate("tl2");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/complete", customer.accessToken(), null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<BookingTimelineEvent> events = timelineService.getEvents(booking.id());
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().eventType()).isEqualTo(BookingTimelineService.BOOKING_COMPLETED);
        assertThat(events.getFirst().actorUserId()).isEqualTo(customer.userId());
        assertThat(events.getFirst().bookingId()).isEqualTo(booking.id());
    }

    @Test
    @DisplayName("TIERS-004-TIMELINE-CANCEL cancelling a booking records BOOKING_CANCELLED event")
    void cancelBookingRecordsTimelineEvent() {
        AuthContext customer = authenticate("tl3");
        AuthContext tasker = authenticate("tl4");

        String taskId = createTaskAt(customer.accessToken(), Instant.now().plus(1, ChronoUnit.DAYS));
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel", customer.accessToken(), null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<BookingTimelineEvent> events = timelineService.getEvents(booking.id());
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().eventType()).isEqualTo(BookingTimelineService.BOOKING_CANCELLED);
        assertThat(events.getFirst().actorUserId()).isEqualTo(customer.userId());
        assertThat(events.getFirst().bookingId()).isEqualTo(booking.id());
    }

    @Test
    @DisplayName("TIERS-004-TIMELINE-ORDER getEvents returns events ordered by created_at descending")
    void getEventsReturnsOrderedList() {
        AuthContext customer = authenticate("tl5");
        AuthContext tasker = authenticate("tl6");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // Record multiple events directly via the service
        timelineService.recordEvent(booking.id(), BookingTimelineService.RESCHEDULE_REQUESTED, customer.userId(), null);
        timelineService.recordEvent(booking.id(), BookingTimelineService.RESCHEDULE_ACCEPTED, tasker.userId(), null);
        timelineService.recordEvent(booking.id(), BookingTimelineService.BOOKING_COMPLETED, customer.userId(), null);

        List<BookingTimelineEvent> events = timelineService.getEvents(booking.id());
        assertThat(events).hasSize(3);

        // Descending order: most recent first
        assertThat(events.get(0).eventType()).isEqualTo(BookingTimelineService.BOOKING_COMPLETED);
        assertThat(events.get(1).eventType()).isEqualTo(BookingTimelineService.RESCHEDULE_ACCEPTED);
        assertThat(events.get(2).eventType()).isEqualTo(BookingTimelineService.RESCHEDULE_REQUESTED);

        // Verify descending timestamp order
        for (int i = 0; i < events.size() - 1; i++) {
            assertThat(events.get(i).createdAt())
                    .isAfterOrEqualTo(events.get(i + 1).createdAt());
        }
    }

    // --- helpers (mirrored from BookingIntegrationTests) ---

    private AuthContext authenticate(String seed) {
        String phone = "+9768811" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
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
                        "category_id",
                        catId,
                        "description",
                        "Timeline integration test task",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Ulaanbaatar",
                        "scheduled_at",
                        scheduledAt.toString()));
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

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/bookings/[^/]+/(cancel|complete|mark-done)$");
    }

    record AuthContext(String userId, String accessToken) {}
}
