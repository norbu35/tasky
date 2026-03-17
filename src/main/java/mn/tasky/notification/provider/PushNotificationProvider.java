package mn.tasky.notification.provider;

import java.util.Map;

/**
 * Contract for push notification providers (FCM, APNs, etc.).
 * Implementations are swapped via Spring profiles or {@code @Primary} annotation.
 */
public interface PushNotificationProvider {

    /**
     * Sends a push notification to a single device.
     *
     * @param deviceToken Platform-specific device token.
     * @param platform    Target platform (e.g. "IOS", "ANDROID").
     * @param title       Notification title.
     * @param body        Notification body text.
     * @param data        Arbitrary key-value data payload.
     * @return Result indicating success/failure and provider message ID.
     */
    NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data);
}
