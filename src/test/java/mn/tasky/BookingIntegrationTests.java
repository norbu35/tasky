package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import mn.tasky.booking.BookingService;
import mn.tasky.task.TaskService;
import mn.tasky.wallet.WalletService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class BookingIntegrationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private TaskService taskService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-030-API-BOOKING-READS booking retrieval and filtering")
    void bookingRetrieval() {
        AuthContext customer = authenticate("b1");
        AuthContext tasker = authenticate("b2");
        AuthContext stranger = authenticate("b3");

        String taskId = createTask(customer.accessToken());
        BookingService.BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // 1. Get success (customer)
        ResponseEntity<Map> resCust = getWithAuth("/api/v1/bookings/" + booking.id(), customer.accessToken());
        assertThat(resCust.getStatusCode().value()).isEqualTo(200);

        // 2. Get success (tasker)
        ResponseEntity<Map> resTasker = getWithAuth("/api/v1/bookings/" + booking.id(), tasker.accessToken());
        assertThat(resTasker.getStatusCode().value()).isEqualTo(200);

        // 3. Get forbidden (stranger)
        ResponseEntity<Map> resStranger = getWithAuth("/api/v1/bookings/" + booking.id(), stranger.accessToken());
        assertThat(resStranger.getStatusCode().value()).isEqualTo(404); // Filtered out

        // 4. Get not found
        ResponseEntity<Map> resMissing = getWithAuth("/api/v1/bookings/missing", customer.accessToken());
        assertThat(resMissing.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE complete booking flow errors")
    void completeBookingFlow() {
        AuthContext customer = authenticate("c1");
        AuthContext tasker = authenticate("c2");
        
        String taskId = createTask(customer.accessToken());
        BookingService.BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // 1. Complete fails: Not Paid
        ResponseEntity<Map> resInvalid = postWithAuth("/api/v1/bookings/" + booking.id() + "/complete", customer.accessToken(), null);
        assertThat(resInvalid.getStatusCode().value()).isEqualTo(409);

        bookingService.transitionToPaid(booking.id());

        // 2. Complete fails: Forbidden (not customer)
        ResponseEntity<Map> resForbidden = postWithAuth("/api/v1/bookings/" + booking.id() + "/complete", tasker.accessToken(), null);
        assertThat(resForbidden.getStatusCode().value()).isEqualTo(403);

        // 3. Complete success
        ResponseEntity<Map> resSuccess = postWithAuth("/api/v1/bookings/" + booking.id() + "/complete", customer.accessToken(), null);
        assertThat(resSuccess.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE cancellation error paths")
    void cancellationErrors() {
        AuthContext customer = authenticate("ca1");
        AuthContext tasker = authenticate("ca2");
        AuthContext stranger = authenticate("ca3");

        String taskId = createTask(customer.accessToken());
        BookingService.BookingState booking = bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 50000);

        // 1. Cancel fails: Not found
        assertThat(postWithAuth("/api/v1/bookings/missing/cancel", customer.accessToken(), null).getStatusCode().value()).isEqualTo(404);

        // 2. Cancel fails: Forbidden
        assertThat(postWithAuth("/api/v1/bookings/" + booking.id() + "/cancel", stranger.accessToken(), null).getStatusCode().value()).isEqualTo(403);
    }

    private String createTask(String token) {
        String catId = ((List<Map>) getWithAuth("/api/v1/categories", token).getBody().get("data")).get(0).get("id").toString();
        ResponseEntity<Map> res = postWithAuth("/api/v1/tasks", token, Map.of(
            "category_id", catId,
            "description", "Integration test task description",
            "budget", 50000,
            "location_lat", 47.9, "location_lng", 106.9,
            "location_text", "Ulaanbaatar",
            "scheduled_at", java.time.Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS).toString()
        ));
        return res.getBody().get("id").toString();
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9768811" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
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

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
