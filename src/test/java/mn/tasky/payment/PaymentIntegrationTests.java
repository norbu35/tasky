package mn.tasky.payment;

import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskState;
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
import org.springframework.test.context.TestPropertySource;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@TestPropertySource(properties = "tasky.features.monetization-enabled=true")
class PaymentIntegrationTests
    extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Value("${tasky.qpay.webhook-secret}")
    private String qpayWebhookSecret;
    @Autowired
    private BookingService bookingService;
    @Autowired
    private TaskService taskService;

    @Test
    @DisplayName("TID-TASK-031-API-QPAY-INITIATE initiation returns traceable reference")
    void initiateQpay() {
        AuthContext customer = authenticate("132");
        AuthContext tasker = authenticate("232");
        TaskState task = createTaskForCustomer(customer,
            "payment-initiate");
        BookingState booking = bookingService.createBooking(task.id(),
            tasker.userId(),
            customer.userId(),
            50000);

        ResponseEntity<Map> response = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()
            .get("payment_url")
            .toString()).contains("qpay.mn");
    }

    private AuthContext authenticate(String prefix) {
        String phone = "+976" + prefix + "000000";
        post("/api/v1/auth/otp/request",
            Map.of("phone",
                phone));

        ResponseEntity<Map> verifyResponse = post(
            "/api/v1/auth/otp/verify",
            Map.of("phone",
                phone,
                "code",
                "123456")
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) verifyResponse.getBody()
            .get("user");
        return new AuthContext(
            String.valueOf(verifyResponse.getBody()
                .get("access_token")),
            String.valueOf(user.get("id"))
        );
    }

    private TaskState createTaskForCustomer(AuthContext customer,
                                            String descriptionSeed) {
        String categoryId = getFirstCategoryId(customer.accessToken());
        return taskService.createTask(customer.userId(),
                new CreateTask(
                    categoryId,
                    "description-" + descriptionSeed,
                    50000,
                    47.0,
                    106.0,
                    "text",
                    Instant.now()
                        .plus(1,
                            ChronoUnit.DAYS)
                        .toString(),
                    List.of()
                ))
            .task();
    }

    // --- Helpers ---

    private ResponseEntity<Map> postWithAuth(String path,
                                             String bearerToken,
                                             Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bearerToken);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key",
                UUID.randomUUID()
                    .toString());
        }
        return restTemplate.exchange(url(path),
            HttpMethod.POST,
            new HttpEntity<>(body,
                headers),
            Map.class);
    }

    private ResponseEntity<Map> post(String path,
                                     Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(url(path),
            HttpMethod.POST,
            new HttpEntity<>(body,
                headers),
            Map.class);
    }

    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories",
            token);
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody()
            .get("data");
        return data.get(0)
            .get("id")
            .toString();
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/payments/bookings/[^/]+/initiate$");
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private ResponseEntity<Map> getWithAuth(String path,
                                            String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class);
    }

    @Test
    @DisplayName("TID-TASK-031-RELI-CALLBACK-IDEMPOTENT successful callback updates booking and " +
        "task exactly once")
    void qpayCallbackLifecycle() {
        AuthContext customer = authenticate("133");
        AuthContext tasker = authenticate("233");
        TaskState task = createTaskForCustomer(customer,
            "payment-callback");
        BookingState booking = bookingService.createBooking(task.id(),
            tasker.userId(),
            customer.userId(),
            50000);

        // Initiate to get paymentId (hidden in implementation but we can simulate)
        ResponseEntity<Map> initResponse = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        );
        String paymentUrl = initResponse.getBody()
            .get("payment_url")
            .toString();
        String paymentId = paymentUrl.substring(paymentUrl.lastIndexOf("/") + 1);
        long timestamp = Instant.now()
            .getEpochSecond();

        // Callback
        Map<String, Object> callbackBody = Map.of(
            "payment_id",
            paymentId,
            "status",
            "PAID",
            "timestamp",
            timestamp,
            "signature",
            signatureFor(paymentId,
                "PAID",
                timestamp)
        );
        ResponseEntity<Map> callbackResponse = post("/api/v1/payments/qpay/callback",
            callbackBody);
        assertThat(callbackResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify statuses
        Optional<BookingState> bookingOpt = bookingService.getBooking(booking.id());
        assertThat(bookingOpt).isPresent();
        assertThat(bookingOpt.orElseThrow()
            .status()).isEqualTo("PAID");
        Optional<TaskState> taskOpt = taskService.getTask(task.id());
        assertThat(taskOpt).isPresent();
        assertThat(taskOpt.orElseThrow()
            .status()).isEqualTo("ASSIGNED");

        // Duplicate callback (Idempotency)
        ResponseEntity<Map> secondCallback = post("/api/v1/payments/qpay/callback",
            callbackBody);
        assertThat(secondCallback.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-031-SEC-QPAY-SIGNATURE invalid callback signature is rejected")
    void qpayCallbackRejectsInvalidSignature() {
        AuthContext customer = authenticate("134");
        AuthContext tasker = authenticate("234");
        TaskState task = createTaskForCustomer(customer,
            "payment-invalid-signature");
        BookingState booking = bookingService.createBooking(task.id(),
            tasker.userId(),
            customer.userId(),
            50000);
        ResponseEntity<Map> initResponse = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        );
        String paymentUrl = initResponse.getBody()
            .get("payment_url")
            .toString();
        String paymentId = paymentUrl.substring(paymentUrl.lastIndexOf("/") + 1);

        ResponseEntity<Map> callbackResponse = post(
            "/api/v1/payments/qpay/callback",
            Map.of("payment_id",
                paymentId,
                "status",
                "PAID",
                "timestamp",
                Instant.now()
                    .getEpochSecond(),
                "signature",
                "invalid")
        );
        assertThat(callbackResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-031-SEC-QPAY-REPLAY stale callback timestamps are rejected")
    void qpayCallbackRejectsStaleTimestamp() {
        AuthContext customer = authenticate("135");
        AuthContext tasker = authenticate("235");
        TaskState task = createTaskForCustomer(customer,
            "payment-stale-callback");
        BookingState booking = bookingService.createBooking(task.id(),
            tasker.userId(),
            customer.userId(),
            50000);
        ResponseEntity<Map> initResponse = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        );
        String paymentUrl = initResponse.getBody()
            .get("payment_url")
            .toString();
        String paymentId = paymentUrl.substring(paymentUrl.lastIndexOf("/") + 1);
        long staleTimestamp = Instant.now()
            .minus(10,
                ChronoUnit.MINUTES)
            .getEpochSecond();

        ResponseEntity<Map> callbackResponse = post(
            "/api/v1/payments/qpay/callback",
            Map.of(
                "payment_id",
                paymentId,
                "status",
                "PAID",
                "timestamp",
                staleTimestamp,
                "signature",
                signatureFor(paymentId,
                    "PAID",
                    staleTimestamp)
            )
        );

        assertThat(callbackResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private String signatureFor(String paymentId,
                                String status,
                                long timestamp) {
        String payload = paymentId + "|" + status + "|" + timestamp;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(qpayWebhookSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(signature.length * 2);
            for (byte b : signature) {
                builder.append(String.format("%02x",
                    b));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private record AuthContext(String accessToken, String userId) {

    }
}
