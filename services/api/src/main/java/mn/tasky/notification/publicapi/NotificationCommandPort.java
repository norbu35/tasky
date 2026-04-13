package mn.tasky.notification.publicapi;

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
}
