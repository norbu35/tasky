package mn.tasky.payment;

import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PaymentIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.qpay.webhook-secret}")
    private String qpayWebhookSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private TaskService taskService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-031-API-QPAY-INITIATE initiation returns traceable reference")
    void initiateQpay() {
        AuthContext customer = authenticate("132");
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", customer.userId(), 50000);

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
        TaskState task = taskService.createTask(customer.userId(), new CreateTask(
            categoryId, "description", 50000, 47.0, 106.0, "text", 
            Instant.now().plus(1, ChronoUnit.DAYS).toString(), List.of()
        )).task();
        
        BookingState booking = bookingService.createBooking(task.id(), "tasker-1", customer.userId(), 50000);

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
            "signature", signatureFor(paymentId, "PAID")
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

    @Test
    @DisplayName("TID-TASK-031-API-QPAY-CALLBACK-SIGNATURE invalid callback signature is rejected")
    void qpayCallbackRejectsInvalidSignature() {
        AuthContext customer = authenticate("134");
        BookingState booking = bookingService.createBooking("task-2", "tasker-2", customer.userId(), 50000);
        ResponseEntity<Map> initResponse = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted", true)
        );
        String paymentUrl = initResponse.getBody().get("payment_url").toString();
        String paymentId = paymentUrl.substring(paymentUrl.lastIndexOf("/") + 1);

        ResponseEntity<Map> callbackResponse = post(
            "/api/v1/payments/qpay/callback",
            Map.of("payment_id", paymentId, "status", "PAID", "signature", "invalid")
        );
        assertThat(callbackResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
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

    private String signatureFor(String paymentId, String status) {
        String payload = paymentId + "|" + status;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(qpayWebhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(signature.length * 2);
            for (byte b : signature) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private record AuthContext(String accessToken, String userId) {
    }
}
