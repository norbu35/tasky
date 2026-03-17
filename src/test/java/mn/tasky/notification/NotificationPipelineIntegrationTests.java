package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dto.NotificationLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class NotificationPipelineIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private NotificationService notificationService;

    @Test
    @DisplayName("Push notification creates log entry with event_key and provider_message_id")
    void pushNotificationPopulatesEventKeyAndProviderMessageId() {
        AuthContext user = authenticate("push-pipeline");

        // Register a device so push path is taken
        notificationService.registerDevice(user.userId(), "fcm-token-1", "ANDROID");

        // Send push with deterministic event key
        notificationService.sendPushWithEventKey(
                user.userId(), "Test Title", "Test Body", "HIRED", "HIRED_booking-123");

        List<NotificationLog> logs = notificationService.getLogs();
        assertThat(logs).anySatisfy(l -> {
            assertThat(l.userId()).isEqualTo(user.userId());
            assertThat(l.channel()).isEqualTo("PUSH");
            assertThat(l.eventKey()).isEqualTo("HIRED_booking-123");
            assertThat(l.providerMessageId()).isNotNull();
            assertThat(l.providerMessageId()).startsWith("LOG-");
            assertThat(l.status()).isEqualTo("SENT");
        });
    }

    @Test
    @DisplayName("SMS fallback for zero-device user creates log entry with channel=SMS")
    void smsFallbackForZeroDeviceUser() {
        AuthContext user = authenticate("sms-fallback");

        // No devices registered — HIRED type triggers SMS fallback
        notificationService.sendPushWithEventKey(
                user.userId(), "You are hired!", "Your application has been accepted.", "HIRED", "HIRED_booking-456");

        List<NotificationLog> logs = notificationService.getLogs();
        assertThat(logs).anySatisfy(l -> {
            assertThat(l.userId()).isEqualTo(user.userId());
            assertThat(l.channel()).isEqualTo("SMS");
            assertThat(l.eventKey()).isEqualTo("HIRED_booking-456_SMS_FALLBACK");
            assertThat(l.providerMessageId()).isNotNull();
            assertThat(l.providerMessageId()).startsWith("LOG-");
        });
    }

    @Test
    @DisplayName("Duplicate event_key does not create duplicate notification (idempotency)")
    void duplicateEventKeyIdempotency() {
        AuthContext user = authenticate("idempotent");

        // Register a device
        notificationService.registerDevice(user.userId(), "fcm-token-2", "IOS");

        String eventKey = "HIRED_booking-789";

        // First send — should succeed
        notificationService.sendPushWithEventKey(user.userId(), "Hired", "Accepted", "HIRED", eventKey);
        long countAfterFirst = notificationService.getLogs().stream()
                .filter(l -> eventKey.equals(l.eventKey()))
                .count();
        assertThat(countAfterFirst).isEqualTo(1);

        // Second send with same event_key — should be skipped
        notificationService.sendPushWithEventKey(user.userId(), "Hired", "Accepted", "HIRED", eventKey);
        long countAfterSecond = notificationService.getLogs().stream()
                .filter(l -> eventKey.equals(l.eventKey()))
                .count();
        assertThat(countAfterSecond).isEqualTo(1);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767711" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
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
}
