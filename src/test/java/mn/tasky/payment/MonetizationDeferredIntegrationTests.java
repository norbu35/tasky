package mn.tasky.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class MonetizationDeferredIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TID-TASK-031-API-MONETIZATION-DEFERRED payment initiation is disabled by default")
    void paymentInitiationDeferred() {
        AuthContext customer = authenticate("deferred-pay-1");
        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/payments/bookings/00000000-0000-0000-0000-000000000000/initiate",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody().get("code")).isEqualTo("FEATURE_DEFERRED");
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767712" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key", UUID.randomUUID().toString());
        }
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/payments/bookings/[^/]+/initiate$")
                || path.matches("^/api/v1/wallet/payouts$")
                || path.matches("^/api/v1/admin/payouts/[^/]+/process$");
    }

    @Test
    @DisplayName("TID-TASK-034-API-MONETIZATION-DEFERRED wallet is disabled by default")
    void walletDeferred() {
        AuthContext tasker = authenticate("deferred-wallet-1");
        ResponseEntity<Map> response = getWithAuth("/api/v1/wallet", tasker.accessToken());
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody().get("code")).isEqualTo("FEATURE_DEFERRED");
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
