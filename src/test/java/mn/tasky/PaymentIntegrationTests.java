package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.BookingService;
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

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-064-API-DISCLAIMER-REQUIRED payment initiation fails without disclaimer")
    void disclaimerRequired() {
        AuthContext customer = authenticate("130");
        String bookingId = UUID.randomUUID().toString(); // Doesn't matter, validation happens first

        // Missing body
        ResponseEntity<Map> response = postWithAuth(
            "/api/v1/payments/bookings/" + bookingId + "/initiate",
            customer.accessToken(),
            Map.of()
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // disclaimer = false
        ResponseEntity<Map> falseResponse = postWithAuth(
            "/api/v1/payments/bookings/" + bookingId + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted", false)
        );
        assertThat(falseResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-064-AUDIT-DISCLAIMER-RECORDED acceptance is captured in booking metadata")
    void disclaimerRecorded() {
        AuthContext customer = authenticate("131");
        
        // Create a real booking via back-door or just service (since we have @Autowired)
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", customer.userId(), 50000);
        
        ResponseEntity<Map> response = postWithAuth(
            "/api/v1/payments/bookings/" + booking.id() + "/initiate",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted", true)
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify in metadata
        BookingService.BookingState updated = bookingService.getBooking(booking.id()).get();
        assertThat(updated.liabilityDisclaimerAccepted()).isTrue();
    }

    // --- Helpers ---

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
