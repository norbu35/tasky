package mn.tasky.booking;

import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dto.NotificationLog;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@SuppressWarnings({"rawtypes", "unchecked", "ConstantConditions"})
class BookingIntegrationTests
    extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Autowired
    private BookingService bookingService;
    @Autowired
    private TaskService taskService;
    @Autowired
    private NotificationService notificationService;

    @Test
    @DisplayName("TID-TASK-030-API-BOOKING-READS booking retrieval and filtering")
    void bookingRetrieval() {
        AuthContext customer = authenticate("b1");
        AuthContext tasker = authenticate("b2");
        AuthContext stranger = authenticate("b3");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        // 1. Get success (customer)
        ResponseEntity<Map> resCust = getWithAuth("/api/v1/bookings/" + booking.id(),
            customer.accessToken());
        assertThat(resCust.getStatusCode()
            .value()).isEqualTo(200);

        // 2. Get success (tasker)
        ResponseEntity<Map> resTasker = getWithAuth("/api/v1/bookings/" + booking.id(),
            tasker.accessToken());
        assertThat(resTasker.getStatusCode()
            .value()).isEqualTo(200);

        // 3. Get forbidden (stranger)
        ResponseEntity<Map> resStranger = getWithAuth("/api/v1/bookings/" + booking.id(),
            stranger.accessToken());
        assertThat(resStranger.getStatusCode()
            .value()).isEqualTo(404); // Filtered out

        // 4. Get not found
        String missingBookingId = UUID.randomUUID()
            .toString();
        ResponseEntity<Map> resMissing = getWithAuth("/api/v1/bookings/" + missingBookingId,
            customer.accessToken());
        assertThat(resMissing.getStatusCode()
            .value()).isEqualTo(404);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9768811" + String.format("%04d",
            Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request",
            Map.of("phone",
                phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify",
            Map.of("phone",
                phone,
                "code",
                "123456"));
        String accessToken = (String) response.getBody()
            .get("access_token");
        String userId = (String) ((Map) response.getBody()
            .get("user")).get("id");
        return new AuthContext(userId,
            accessToken);
    }

    private String createTask(String token) {
        return createTaskAt(token,
            Instant.now()
                .plus(1,
                    ChronoUnit.DAYS));
    }

    private ResponseEntity<Map> getWithAuth(String path,
                                            String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.GET,
            entity,
            Map.class);
    }

    private ResponseEntity<Map> post(String path,
                                     Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path,
            body,
            Map.class);
    }

    private String createTaskAt(String token,
                                Instant scheduledAt) {
        String catId = ((List<Map>) getWithAuth("/api/v1/categories",
            token).getBody()
            .get("data")).getFirst()
            .get("id")
            .toString();
        ResponseEntity<Map> res = postWithAuth("/api/v1/tasks",
            token,
            Map.of(
                "category_id",
                catId,
                "description",
                "Integration test task description",
                "budget",
                50000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar",
                "scheduled_at",
                scheduledAt.toString()
            ));
        return res.getBody()
            .get("id")
            .toString();
    }

    private ResponseEntity<Map> postWithAuth(String path,
                                             String token,
                                             Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key",
                UUID.randomUUID()
                    .toString());
        }
        HttpEntity<Object> entity = new HttpEntity<>(body,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.POST,
            entity,
            Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/bookings/[^/]+/(cancel|complete|mark-done)$");
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE complete booking flow errors")
    void completeBookingFlow() {
        AuthContext customer = authenticate("c1");
        AuthContext tasker = authenticate("c2");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        // 1. Complete fails: Forbidden (not customer)
        ResponseEntity<Map> resForbidden =
            postWithAuth("/api/v1/bookings/" + booking.id() + "/complete",
                tasker.accessToken(),
                null);
        assertThat(resForbidden.getStatusCode()
            .value()).isEqualTo(403);

        // 2. Complete success
        ResponseEntity<Map> resSuccess =
            postWithAuth("/api/v1/bookings/" + booking.id() + "/complete",
                customer.accessToken(),
                null);
        assertThat(resSuccess.getStatusCode()
            .value()).isEqualTo(200);

        // 3. Complete fails: already completed
        ResponseEntity<Map> resInvalid =
            postWithAuth("/api/v1/bookings/" + booking.id() + "/complete",
                customer.accessToken(),
                null);
        assertThat(resInvalid.getStatusCode()
            .value()).isEqualTo(409);
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE cancellation error paths")
    void cancellationErrors() {
        AuthContext customer = authenticate("ca1");
        AuthContext tasker = authenticate("ca2");
        AuthContext stranger = authenticate("ca3");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        // 1. Cancel fails: Not found
        String missingBookingId = UUID.randomUUID()
            .toString();
        assertThat(postWithAuth("/api/v1/bookings/" + missingBookingId + "/cancel",
            customer.accessToken(),
            null).getStatusCode()
            .value()).isEqualTo(404);

        // 2. Cancel fails: Forbidden
        assertThat(postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel",
            stranger.accessToken(),
            null).getStatusCode()
            .value()).isEqualTo(403);
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-TASKER-CANCEL-STRIKE tasker cancellation reopens task")
    void taskerCancellationReopensTask() {
        AuthContext customer = authenticate("rc1");
        AuthContext tasker = authenticate("rc2");

        String taskId = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(1,
                    ChronoUnit.DAYS));
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        ResponseEntity<Map> cancelResponse =
            postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel",
                tasker.accessToken(),
                null);
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        Optional<TaskState> taskOpt = taskService.getTask(taskId);
        assertThat(taskOpt).isPresent();
        assertThat(taskOpt.orElseThrow()
            .status()).isEqualTo("OPEN");
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL late customer cancellation does not apply " +
        "fees")
    void customerLateCancellationNoFee() {
        AuthContext customer = authenticate("rc3");
        AuthContext tasker = authenticate("rc4");

        String taskId = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(1,
                    ChronoUnit.HOURS));
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        ResponseEntity<Map> cancelResponse =
            postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel",
                customer.accessToken(),
                null);
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cancelResponse.getBody()
            .get("cancellation_fee")).isNull();
    }

    @Test
    @DisplayName("TID-TASK-044-DOMAIN-TASKER-DONE-NOTIFY tasker mark-done notifies customer")
    void markDoneNotifiesCustomer() {
        AuthContext customer = authenticate("md1");
        AuthContext tasker = authenticate("md2");

        notificationService.registerDevice(customer.userId(),
            "cust-md-token",
            "ANDROID");

        String taskId = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(2,
                    ChronoUnit.HOURS));
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        ResponseEntity<Map> markDone = postWithAuth(
            "/api/v1/bookings/" + booking.id() + "/mark-done",
            tasker.accessToken(),
            null
        );
        assertThat(markDone.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(markDone.getBody()).containsKey("tasker_marked_done_at");

        List<NotificationLog> logs = notificationService.getLogs();
        assertThat(logs).anySatisfy(log -> {
            assertThat(log.userId()).isEqualTo(customer.userId());
            assertThat(log.type()).isEqualTo("TASKER_MARKED_COMPLETE");
            assertThat(log.channel()).isEqualTo("PUSH");
        });
    }

    @Test
    @DisplayName("TID-TASK-030-RELI-IDEMPOTENT-CANCEL same key replay returns current booking " +
        "state")
    void idempotentCancelReplayReturnsCurrentState() {
        AuthContext customer = authenticate("idem-cancel-customer");
        AuthContext tasker = authenticate("idem-cancel-tasker");

        String taskId = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(1,
                    ChronoUnit.DAYS));
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);
        String key = UUID.randomUUID()
            .toString();

        ResponseEntity<Map> first = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + booking.id() + "/cancel",
            customer.accessToken(),
            null,
            key
        );
        ResponseEntity<Map> replay = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + booking.id() + "/cancel",
            customer.accessToken(),
            null,
            key
        );

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replay.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replay.getBody()
            .get("id")).isEqualTo(booking.id());
        assertThat(replay.getBody()
            .get("status")).isEqualTo("CANCELLED");
    }

    private ResponseEntity<Map> postWithAuthAndIdempotency(String path,
                                                           String token,
                                                           Object body,
                                                           String idempotencyKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        headers.set("Idempotency-Key",
            idempotencyKey);
        HttpEntity<Object> entity = new HttpEntity<>(body,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.POST,
            entity,
            Map.class);
    }

    @Test
    @DisplayName("TID-TASK-041-RELI-IDEMPOTENT-DISPUTE same key replay returns original dispute " +
        "result")
    void idempotentDisputeReplayReturnsOriginalResult() {
        AuthContext customer = authenticate("disp-idem-cust");
        AuthContext tasker = authenticate("disp-idem-task");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);
        String key = UUID.randomUUID()
            .toString();
        Map<String, String> disputeBody = Map.of("reason",
            "The task was not completed as agreed upon.");

        ResponseEntity<Map> first = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + booking.id() + "/disputes",
            customer.accessToken(),
            disputeBody,
            key
        );
        ResponseEntity<Map> replay = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + booking.id() + "/disputes",
            customer.accessToken(),
            disputeBody,
            key
        );

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(replay.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replay.getBody()
            .get("id")).isEqualTo(first.getBody()
            .get("id"));
    }

    @Test
    @DisplayName("TID-TASK-030-RELI-IDEMPOTENT-CANCEL replay binds to original booking resource")
    void idempotentCancelReplayBindsToOriginalResource() {
        AuthContext customer = authenticate("idem-resource-customer");
        AuthContext taskerA = authenticate("idem-resource-tasker-a");
        AuthContext taskerB = authenticate("idem-resource-tasker-b");

        String taskA = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(1,
                    ChronoUnit.DAYS));
        String taskB = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(2,
                    ChronoUnit.DAYS));
        BookingState bookingA = bookingService.createBooking(taskA,
            taskerA.userId(),
            customer.userId(),
            50000);
        BookingState bookingB = bookingService.createBooking(taskB,
            taskerB.userId(),
            customer.userId(),
            60000);
        String key = UUID.randomUUID()
            .toString();

        ResponseEntity<Map> first = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + bookingA.id() + "/cancel",
            customer.accessToken(),
            null,
            key
        );
        ResponseEntity<Map> replayOnDifferentPath = postWithAuthAndIdempotency(
            "/api/v1/bookings/" + bookingB.id() + "/cancel",
            customer.accessToken(),
            null,
            key
        );
        ResponseEntity<Map> bookingBState = getWithAuth(
            "/api/v1/bookings/" + bookingB.id(),
            customer.accessToken()
        );

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replayOnDifferentPath.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(replayOnDifferentPath.getBody()
            .get("id")).isEqualTo(bookingA.id());
        assertThat(replayOnDifferentPath.getBody()
            .get("status")).isEqualTo("CANCELLED");
        assertThat(bookingBState.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(bookingBState.getBody()
            .get("status")).isEqualTo("ASSIGNED");
    }

    @Test
    @DisplayName("TID-TASK-030-RELI-IDEMPOTENT-HEADER missing Idempotency-Key is rejected")
    void missingIdempotencyHeaderRejected() {
        AuthContext customer = authenticate("idem-header-customer");
        AuthContext tasker = authenticate("idem-header-tasker");

        String taskId = createTaskAt(customer.accessToken(),
            Instant.now()
                .plus(1,
                    ChronoUnit.DAYS));
        BookingState booking = bookingService.createBooking(taskId,
            tasker.userId(),
            customer.userId(),
            50000);

        ResponseEntity<Map> response = postWithAuthWithoutIdempotency(
            "/api/v1/bookings/" + booking.id() + "/cancel",
            customer.accessToken()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()
            .get("code")).isEqualTo("IDEMPOTENCY_KEY_REQUIRED");
    }

    private ResponseEntity<Map> postWithAuthWithoutIdempotency(String path,
                                                               String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(null,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.POST,
            entity,
            Map.class);
    }

    record AuthContext(String userId, String accessToken) {

    }
}
