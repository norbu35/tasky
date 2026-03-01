package mn.tasky.notification;

import mn.tasky.common.IntegrationTestBase;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dto.NotificationLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class NotificationIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private NotificationService notificationService;

    @Test
    @DisplayName("TID-TASK-044-API-DEVICE-REGISTER register and unregister device")
    void deviceManagement() {
        AuthContext user = authenticate("user-notif");

        // 1. Register
        ResponseEntity<Map> regRes = postWithAuth(
            "/api/v1/notifications/devices", user.accessToken(), Map.of("token", "token-1", "platform", "IOS"));
        assertThat(regRes.getStatusCode().value()).isEqualTo(200);

        // 2. Unregister
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(user.accessToken());
        ResponseEntity<Map> unregRes = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/notifications/devices/token-1",
            HttpMethod.DELETE,
            new HttpEntity<>(headers),
            Map.class);
        assertThat(unregRes.getStatusCode().value()).isEqualTo(204);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767711" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
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
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    @Test
    @DisplayName("TID-TASK-044-DOMAIN-PUSH-EVENTS push and SMS fallback " + "(TID-TASK-044-DOMAIN-SMS-FALLBACK)")
    void notificationDelivery() {
        AuthContext customer = authenticate("cust-notif");
        AuthContext tasker = authenticate("tasker-notif");

        // No devices registered for tasker initially
        notificationService.sendPush(tasker.userId(), "Test", "Test Body", "HIRED");

        // Should trigger SMS fallback
        List<NotificationLog> logs = notificationService.getLogs();
        assertThat(logs).anySatisfy(l -> {
            assertThat(l.userId()).isEqualTo(tasker.userId());
            assertThat(l.channel()).isEqualTo("SMS");
            assertThat(l.type()).isEqualTo("FALLBACK");
        });

        // Register device for customer
        notificationService.registerDevice(customer.userId(), "cust-token", "ANDROID");
        notificationService.sendPush(customer.userId(), "Job Started", "Job is starting", "JOB_STARTED");

        // Should be PUSH
        List<NotificationLog> logs2 = notificationService.getLogs();
        assertThat(logs2).anySatisfy(l -> {
            assertThat(l.userId()).isEqualTo(customer.userId());
            assertThat(l.channel()).isEqualTo("PUSH");
        });
    }

    record AuthContext(String userId, String accessToken) {
    }
}
