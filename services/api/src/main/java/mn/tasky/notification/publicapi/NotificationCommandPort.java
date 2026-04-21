package mn.tasky.notification.publicapi;

import java.util.List;
import mn.tasky.notification.dto.District;

public interface NotificationCommandPort {
    /**
     * Register a device token for push notifications.
     */
    void registerDevice(String userId, String token, String platform);

    /**
     * Unregister a device token.
     */
    void unregisterDevice(String userId, String token);

    /**
     * Send a push notification to a user.
     */
    void sendPush(String userId, String title, String body, String type);

    /**
     * Get service areas for a tasker.
     */
    List<District> getServiceAreas(String userId);

    /**
     * Replace service areas for a tasker.
     */
    void setServiceAreas(String userId, List<String> districtSlugs);

    /**
     * Send a push notification with an event deduplication key.
     * If the event key was already processed, the notification is silently skipped.
     */
    void sendPushWithEventKey(String userId, String title, String body, String type, String eventKey);
}
