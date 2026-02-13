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
import mn.tasky.booking.BookingService;
import mn.tasky.wallet.WalletService;
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
class DisputeIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private WalletService walletService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-041-API-DISPUTE-RAISE and HOLD funds")
    void disputeLifecycle() {
        AuthContext customer = authenticate("cust-disp");
        AuthContext tasker = authenticate("tasker-disp");
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");

        BookingService.BookingState booking = bookingService.createBooking("task-d", tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        
        // Complete via API to trigger wallet credit
        postWithAuth("/api/v1/bookings/" + booking.id() + "/complete", customer.accessToken(), null);

        // Verify funds credited initially
        long balanceBefore = walletService.getBalance(tasker.userId()).balance();
        assertThat(balanceBefore).isEqualTo(9000); // 10000 - 10%

        // Raise Dispute
        ResponseEntity<Map> response = postWithAuth("/api/v1/disputes", customer.accessToken(), Map.of(
            "booking_id", booking.id(),
            "reason", "Incomplete work"
        ));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String disputeId = (String) response.getBody().get("id");

        // Verify funds held (balance reduced)
        long balanceHeld = walletService.getBalance(tasker.userId()).balance();
        assertThat(balanceHeld).isEqualTo(0); // 9000 - 9000 (hold)

        // Admin list
        ResponseEntity<Map> listRes = getWithAuth("/api/v1/admin/disputes/pending", adminToken);
        List<Map> pending = (List<Map>) listRes.getBody().get("data");
        assertThat(pending).hasSize(1);
        assertThat(pending.get(0).get("id")).isEqualTo(disputeId);

        // Resolve (Release)
        ResponseEntity<Map> resolveRes = postWithAuth("/api/v1/admin/disputes/" + disputeId + "/resolve", adminToken, Map.of(
            "outcome", "RELEASE_FUNDS",
            "notes", "Work verified"
        ));
        assertThat(resolveRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify funds released
        long balanceReleased = walletService.getBalance(tasker.userId()).balance();
        assertThat(balanceReleased).isEqualTo(9000);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String tokenFor(String role, String status, String userId) {
        return Jwts.builder()
            .subject(userId)
            .claim("role", role)
            .claim("status", status)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
            .compact();
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
