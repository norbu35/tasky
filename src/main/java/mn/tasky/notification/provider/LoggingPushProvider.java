package mn.tasky.notification.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Development push provider that logs notification payloads instead of calling a real service.
 * Marked {@code @Primary} so it is selected by default; production providers override via profile.
 */
@Component
@Primary
public class LoggingPushProvider implements PushNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingPushProvider.class);

    @Override
    public NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data) {
        String messageId = "LOG-" + UUID.randomUUID();
        log.info("PUSH [{}] token={} title={} body={} data={}", platform, deviceToken, title, body, data);
        return new NotificationResult(true, messageId, null);
    }

    @Override
    public void subscribeToTopics(String deviceToken, List<String> topics) {
        log.info("TOPIC-SUBSCRIBE token={} topics={}", deviceToken, topics);
    }

    @Override
    public NotificationResult sendToTopic(String topic, String title, String body, Map<String, String> data) {
        String messageId = "LOG-TOPIC-" + java.util.UUID.randomUUID();
        log.info("TOPIC-SEND [{}] title={} body={} data={}", topic, title, body, data);
        return new NotificationResult(true, messageId, null);
    }
}
