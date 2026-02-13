package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.BookingService;
import mn.tasky.task.TaskService;
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
class PaymentIntegrationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private TaskService taskService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-031-API-QPAY-INITIATE initiation returns traceable reference")
    void initiateQpay() {
        AuthContext customer = authenticate("132");
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", customer.userId(), 50000);

        ResponseEntity<Map> response = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted", true)
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("payment_url").toString()).contains("qpay.mn");
    }

    @Test
    @DisplayName("TID-TASK-031-RELI-CALLBACK-IDEMPOTENT successful callback updates booking and task exactly once")
    void qpayCallbackLifecycle() {
        AuthContext customer = authenticate("133");
        
        // Fetch real category ID
        String categoryId = getFirstCategoryId(customer.accessToken());
        
        // Create task and booking
        TaskService.TaskState task = taskService.createTask(customer.userId(), new TaskService.CreateTask(
            categoryId, "description", 50000, 47.0, 106.0, "text", 
            Instant.now().plus(1, ChronoUnit.DAYS).toString(), List.of()
        )).task();
        
        BookingService.BookingState booking = bookingService.createBooking(task.id(), "tasker-1", customer.userId(), 50000);

        // Initiate to get paymentId (hidden in implementation but we can simulate)
        ResponseEntity<Map> initResponse = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted", true)
        );
        String paymentUrl = initResponse.getBody().get("payment_url").toString();
        String paymentId = paymentUrl.substring(paymentUrl.lastIndexOf("/") + 1);

        // Callback
        Map<String, String> callbackBody = Map.of(
            "payment_id", paymentId,
            "status", "PAID",
            "signature", "VALID_SIG"
        );
        ResponseEntity<Map> callbackResponse = post("/api/v1/payments/qpay/callback", callbackBody);
        assertThat(callbackResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify statuses
        assertThat(bookingService.getBooking(booking.id()).get().status()).isEqualTo("PAID");
        assertThat(taskService.getTask(task.id()).get().status()).isEqualTo("ASSIGNED");

        // Duplicate callback (Idempotency)
        ResponseEntity<Map> secondCallback = post("/api/v1/payments/qpay/callback", callbackBody);
        assertThat(secondCallback.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // --- Helpers ---

    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", token);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
        return data.get(0).get("id").toString();
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private AuthContext authenticate(String prefix) {
        String phone = "+976" + prefix + "000000";
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone", phone, "code", "123456")
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
            String.valueOf(verifyResponse.getBody().get("access_token")),
            String.valueOf(user.get("id"))
        );
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private record AuthContext(String accessToken, String userId) {
    }
}
