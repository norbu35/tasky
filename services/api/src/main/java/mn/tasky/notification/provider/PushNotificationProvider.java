package mn.tasky.notification.provider;

import java.util.List;
import java.util.Map;
import mn.tasky.automation.provider.ProviderHealth;

/**
 * Contract for push notification providers (FCM, etc.).
 *
 * <p>All providers must implement {@link #sendPush} and {@link #health}.
 * {@link #subscribeToTopics} and {@link #sendToTopic} default to no-ops so
 * non-FCM providers (e.g. LoggingPushProvider) need not implement topic functionality.
 */
public interface PushNotificationProvider {

    /**
     * Sends a push notification to a single device.
     *
     * @param deviceToken Platform-specific device token.
     * @param platform    Target platform ("IOS", "ANDROID").
     * @param title       Notification title.
     * @param body        Notification body text.
     * @param data        Arbitrary key-value data payload.
     */
    NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data);

    /**
     * Subscribes a device token to one or more FCM topics.
     * Default is a no-op for providers that don't support topics.
     *
     * @param deviceToken FCM registration token.
     * @param topics      Topic strings, e.g. "taskers.district.bayangol".
     */
    default void subscribeToTopics(String deviceToken, List<String> topics) {}

    /**
     * Sends a notification to all subscribers of an FCM topic (fan-out).
     * Default is a no-op for providers that don't support topics.
     *
     * @param topic Topic string, e.g. "taskers.district.bayangol.cleaning".
     * @param title Notification title.
     * @param body  Notification body.
     * @param data  Arbitrary key-value data payload.
     */
    default NotificationResult sendToTopic(String topic, String title, String body, Map<String, String> data) {
        return new NotificationResult(false, null, "TOPIC_NOT_SUPPORTED");
    }

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "firebase", "logging").
     */
    String providerName();
}
