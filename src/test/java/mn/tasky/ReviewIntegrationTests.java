package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.review.application.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
class ReviewIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AuthService authService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-040-API-REVIEW-SUBMIT reviews allowed only on completed bookings")
    void reviewsAllowedOnlyOnCompleted() {
        AuthContext customer = authenticate("customer-1");
        AuthContext tasker = authenticate("tasker-1");

        BookingService.BookingState booking = bookingService.createBooking("task-1", tasker.userId(), customer.userId(), 10000);
        
        // Try reviewing PENDING booking
        ResponseEntity<Map> failResponse = postWithAuth("/api/v1/reviews", customer.accessToken(), Map.of(
            "booking_id", booking.id(),
            "rating", 5,
            "comment", "Great!"
        ));
        assertThat(failResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(failResponse.getBody().get("error")).isEqualTo("Reviews allowed only on completed bookings");

        // Complete booking
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Review success
        ResponseEntity<Map> successResponse = postWithAuth("/api/v1/reviews", customer.accessToken(), Map.of(
            "booking_id", booking.id(),
            "rating", 5,
            "comment", "Great!"
        ));
        assertThat(successResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("TID-TASK-040-API-REVIEW-LIST list reviews paginated")
    void listReviews() {
        AuthContext customer = authenticate("customer-2");
        AuthContext tasker = authenticate("tasker-2");

        for (int i = 0; i < 3; i++) {
            BookingService.BookingState booking = bookingService.createBooking("task-" + i, tasker.userId(), customer.userId(), 10000);
            bookingService.transitionToPaid(booking.id());
            bookingService.completeBooking(customer.userId(), booking.id());

            postWithAuth("/api/v1/reviews", customer.accessToken(), Map.of(
                "booking_id", booking.id(),
                "rating", 5,
                "comment", "Comment " + i
            ));
        }

        // List with limit 2
        ResponseEntity<Map> listResponse1 = getWithAuth("/api/v1/reviews?user_id=" + tasker.userId() + "&limit=2", customer.accessToken());
        assertThat(listResponse1.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data1 = (List<Map>) listResponse1.getBody().get("data");
        assertThat(data1).hasSize(2);
        
        Map pagination = (Map) listResponse1.getBody().get("cursor");
        String nextCursor = (String) pagination.get("next");
        assertThat(nextCursor).isNotNull();
        assertThat((Boolean) pagination.get("has_more")).isEqualTo(true);

        // List next page
        ResponseEntity<Map> listResponse2 = getWithAuth("/api/v1/reviews?user_id=" + tasker.userId() + "&limit=2&cursor=" + nextCursor, customer.accessToken());
        assertThat(listResponse2.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data2 = (List<Map>) listResponse2.getBody().get("data");
        assertThat(data2).hasSize(1);
        assertThat(((Map) listResponse2.getBody().get("cursor")).get("has_more")).isEqualTo(false);
    }

    @Test
    @DisplayName("TID-TASK-040-DOMAIN-PRO-BADGE pro badge follows thresholds")
    void proBadgeThresholds() {
        AuthContext customer = authenticate("customer-3");
        AuthContext tasker = authenticate("tasker-3");

        // Pre-condition: Not Pro
        assertThat(authService.getProfile(tasker.userId()).get().isPro()).isFalse();

        // 6 Completed Tasks + 5 Star Average
        for (int i = 0; i < 6; i++) {
            BookingService.BookingState booking = bookingService.createBooking("task-" + i, tasker.userId(), customer.userId(), 10000);
            bookingService.transitionToPaid(booking.id());
            bookingService.completeBooking(customer.userId(), booking.id());
            
            postWithAuth("/api/v1/reviews", customer.accessToken(), Map.of(
                "booking_id", booking.id(),
                "rating", 5,
                "comment", "Good job " + i
            ));
        }

        AuthService.UserProfile profile = authService.getProfile(tasker.userId()).get();
        assertThat(profile.completedTasks()).isEqualTo(6);
        assertThat(profile.ratingAvg()).isEqualTo(5.0);
        assertThat(profile.isPro()).isTrue();
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}

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
}
