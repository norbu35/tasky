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
class PayoutIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private WalletService walletService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-034-API-PAYOUT-REQUEST tasker can request payout up to available balance")
    void taskerCanRequestPayout() {
        String taskerId = UUID.randomUUID().toString();
        String taskerToken = tokenFor("TASKER", "ACTIVE", taskerId);

        // Credit wallet first
        walletService.creditTaskCompletion(taskerId, "booking-1", 10000, 0.1); // 9000 credit

        // Request payout
        ResponseEntity<Map> response = postWithAuth("/api/v1/wallet/payouts", taskerToken, Map.of("amount", 5000));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("PENDING");

        // Verify balance reflects pending
        ResponseEntity<Map> balanceResponse = getWithAuth("/api/v1/wallet", taskerToken);
        assertThat(((Number) balanceResponse.getBody().get("balance")).intValue()).isEqualTo(4000);
        assertThat(((Number) balanceResponse.getBody().get("pending_payout")).intValue()).isEqualTo(5000);
    }

    @Test
    @DisplayName("TID-TASK-034-API-PAYOUT-REQUEST payout fails if insufficient balance")
    void payoutFailsInsufficientBalance() {
        String taskerId = UUID.randomUUID().toString();
        String taskerToken = tokenFor("TASKER", "ACTIVE", taskerId);

        walletService.creditTaskCompletion(taskerId, "booking-1", 10000, 0.1); // 9000 credit

        ResponseEntity<Map> response = postWithAuth("/api/v1/wallet/payouts", taskerToken, Map.of("amount", 10000));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error")).isEqualTo("Insufficient balance");
    }

    @Test
    @DisplayName("TID-TASK-034-API-ADMIN-PAYOUT-PROCESS admin can list and processing is restricted by schedule")
    void adminPayoutFlow() {
        String taskerId = UUID.randomUUID().toString();
        String taskerToken = tokenFor("TASKER", "ACTIVE", taskerId);
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");

        walletService.creditTaskCompletion(taskerId, "booking-1", 10000, 0.1);
        String payoutId = (String) postWithAuth("/api/v1/wallet/payouts", taskerToken, Map.of("amount", 5000)).getBody().get("id");

        // Admin list
        ResponseEntity<Map> listResponse = getWithAuth("/api/v1/admin/payouts/pending", adminToken);
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data = (List<Map>) listResponse.getBody().get("data");
        assertThat(data).hasSize(1);
        assertThat(data.get(0).get("id")).isEqualTo(payoutId);

        // Process (should fail on Saturday, Feb 14, 2026)
        ResponseEntity<Map> processResponse = postWithAuth("/api/v1/admin/payouts/" + payoutId + "/process", adminToken, null);
        assertThat(processResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(processResponse.getBody().get("error").toString()).contains("Today is SATURDAY");
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
