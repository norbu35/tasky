package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.TaskState;
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
class NoShowIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingDao bookingDao;

    @Autowired
    private TaskService taskService;

    @Autowired
    private StrikeDao strikeDao;

    @Autowired
    private MessagingService messagingService;

    @Test
    @DisplayName("TIERS-005-NOSHOW-FLAG eligible no-show transitions booking and task to NO_SHOW")
    void flagEligibleNoShow() {
        AuthContext customer = authenticate("ns1");
        AuthContext tasker = authenticate("ns2");

        String taskId = createTask(customer.accessToken());
        Instant pastSchedule = Instant.now().minus(20, ChronoUnit.MINUTES);
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000, false, pastSchedule);

        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("NO_SHOW");

        // Verify task status
        TaskState task = taskService.getTask(taskId).orElseThrow();
        assertThat(task.status()).isEqualTo("NO_SHOW");
    }

    @Test
    @DisplayName("TIERS-005-NOSHOW-TOO-EARLY flag before 15 minutes returns 409")
    void flagTooEarly() {
        AuthContext customer = authenticate("ns3");
        AuthContext tasker = authenticate("ns4");

        String taskId = createTask(customer.accessToken());
        Instant recentSchedule = Instant.now().minus(10, ChronoUnit.MINUTES);
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000, false, recentSchedule);

        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("code")).isEqualTo("TOO_EARLY");
    }

    @Test
    @DisplayName("TIERS-005-NOSHOW-ACTIVITY recent message activity blocks no-show flag")
    void flagWithRecentMessageActivity() {
        AuthContext customer = authenticate("ns5");
        AuthContext tasker = authenticate("ns6");

        String taskId = createTask(customer.accessToken());
        Instant pastSchedule = Instant.now().minus(20, ChronoUnit.MINUTES);
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000, false, pastSchedule);

        // Send a message to create recent activity
        String conversationId =
                messagingService.startConversation(taskId, tasker.userId(), customer.userId());
        messagingService.sendMessage(customer.userId(), conversationId, "Are you on the way?");

        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("code")).isEqualTo("ACTIVITY_DETECTED");
    }

    @Test
    @DisplayName("TIERS-005-NOSHOW-IDEMPOTENT duplicate flag returns existing state")
    void flagIdempotent() {
        AuthContext customer = authenticate("ns7");
        AuthContext tasker = authenticate("ns8");

        String taskId = createTask(customer.accessToken());
        Instant pastSchedule = Instant.now().minus(20, ChronoUnit.MINUTES);
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000, false, pastSchedule);

        String idempotencyKey = UUID.randomUUID().toString();

        ResponseEntity<Map> first = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                idempotencyKey);

        ResponseEntity<Map> replay = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                idempotencyKey);

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replay.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replay.getBody().get("id")).isEqualTo(booking.id());
        assertThat(replay.getBody().get("status")).isEqualTo("NO_SHOW");
    }

    @Test
    @DisplayName("TIERS-005-NOSHOW-STRIKE tasker no-show records strike")
    void taskerNoShowRecordsStrike() {
        AuthContext customer = authenticate("ns9");
        AuthContext tasker = authenticate("ns10");

        String taskId = createTask(customer.accessToken());
        Instant pastSchedule = Instant.now().minus(20, ChronoUnit.MINUTES);
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000, false, pastSchedule);

        // Customer flags no-show -> tasker is the no-show party
        ResponseEntity<Map> response = postWithAuthAndIdempotency(
                "/api/v1/bookings/" + booking.id() + "/no-show/flag",
                customer.accessToken(),
                null,
                UUID.randomUUID().toString());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify strike was recorded for tasker
        Instant windowStart = Instant.now().minus(1, ChronoUnit.HOURS);
        long strikes = strikeDao.countSince(tasker.userId(), windowStart);
        assertThat(strikes).isGreaterThanOrEqualTo(1);
    }

    // --- helpers ---

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
                        "category_id", catId,
                        "description", "No-show integration test task",
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
        return path.matches("^/api/v1/bookings/[^/]+/(cancel|complete|mark-done|no-show/flag)$");
    }

    record AuthContext(String userId, String accessToken) {}
}
