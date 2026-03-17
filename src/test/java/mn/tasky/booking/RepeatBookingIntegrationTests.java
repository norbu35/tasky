package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
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
class RepeatBookingIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private TaskService taskService;

    @Test
    @DisplayName("TIERS-007: Rebook completed booking returns 201 with new OPEN task")
    void rebookCompletedBooking() {
        AuthContext customer = authenticate("rebook-cust");
        AuthContext tasker = authenticate("rebook-task");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // Complete the booking
        BookingTransitionResult completeResult = bookingService.completeBooking(customer.userId(), booking.id());
        assertThat(completeResult.isSuccess()).isTrue();

        // Rebook
        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/rebook", customer.accessToken(), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("id")).isNotNull();
        assertThat(body.get("id")).isNotEqualTo(taskId);
        assertThat(body.get("status")).isEqualTo("OPEN");
        assertThat(body.get("customer_id")).isEqualTo(customer.userId());

        // Verify task properties match original
        Map<String, Object> originalTask =
                getWithAuth("/api/v1/tasks/" + taskId, customer.accessToken()).getBody();
        assertThat(body.get("category_id")).isEqualTo(originalTask.get("category_id"));
        assertThat(body.get("budget")).isEqualTo(originalTask.get("budget"));
        assertThat(body.get("location_text")).isEqualTo(originalTask.get("location_text"));
    }

    @Test
    @DisplayName("TIERS-007: Rebook non-completed booking returns 409")
    void rebookNonCompletedBooking() {
        AuthContext customer = authenticate("rebook-nc-cust");
        AuthContext tasker = authenticate("rebook-nc-task");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // Try rebook on ASSIGNED booking (not completed)
        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/rebook", customer.accessToken(), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("code")).isEqualTo("NOT_COMPLETED");
    }

    @Test
    @DisplayName("TIERS-007: Rebook by non-customer returns 403")
    void rebookForbiddenForNonCustomer() {
        AuthContext customer = authenticate("rebook-fb-cust");
        AuthContext tasker = authenticate("rebook-fb-task");

        String taskId = createTask(customer.accessToken());
        BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);
        bookingService.completeBooking(customer.userId(), booking.id());

        // Try rebook as tasker (not customer)
        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/rebook", tasker.accessToken(), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9768811" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String createTask(String token) {
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
                        "Rebook integration test task",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Ulaanbaatar",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));
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
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
