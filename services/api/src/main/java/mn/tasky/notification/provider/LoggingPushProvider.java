package mn.tasky.notification.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.automation.provider.ProviderHealth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development push provider that logs notification payloads instead of calling a real service.
 * Activated when tasky.push.provider=logging (default).
 */
@Component
@ConditionalOnProperty(name = "tasky.push.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingPushProvider implements PushNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingPushProvider.class);

    private static String maskToken(String token) {
        if (token == null || token.length() <= 8) return "***";
        return token.substring(0, 8) + "...";
    }

    @Override
    public NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data) {
        String messageId = "LOG-" + UUID.randomUUID();
        log.info("PUSH [{}] token={} title={} body={} data={}", platform, maskToken(deviceToken), title, body, data);
        return new NotificationResult(true, messageId, null);
    }

    @Override
    public void subscribeToTopics(String deviceToken, List<String> topics) {
        log.info("TOPIC-SUBSCRIBE token={} topics={}", maskToken(deviceToken), topics);
    }

    @Override
    public NotificationResult sendToTopic(String topic, String title, String body, Map<String, String> data) {
        String messageId = "LOG-TOPIC-" + UUID.randomUUID();
        log.info("TOPIC-SEND [{}] title={} body={} data={}", topic, title, body, data);
        return new NotificationResult(true, messageId, null);
    }

    @Override
    public ProviderHealth health() {
        return ProviderHealth.healthy(providerName());
    }

    @Override
    public String providerName() {
        return "logging";
    }
}
