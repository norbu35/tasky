package mn.tasky.notification.application;

import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.notification.dto.DeviceToken;
import mn.tasky.notification.dto.NotificationLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for managing user device tokens and sending push notifications.
 * Includes fallback mechanisms for critical notifications.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final DeviceTokenDao deviceTokenDao;
    private final NotificationLogDao notificationLogDao;

    public NotificationService(DeviceTokenDao deviceTokenDao, NotificationLogDao notificationLogDao) {
        this.deviceTokenDao = deviceTokenDao;
        this.notificationLogDao = notificationLogDao;
    }

    /**
     * Registers a new device token for a user.
     * Upserts the token to ensure the latest token is stored for the platform.
     *
     * @param userId   The ID of the user.
     * @param token    The device token (e.g., FCM or APNs token).
     * @param platform The platform of the device (e.g., "IOS", "ANDROID").
     */
    public void registerDevice(String userId, String token, String platform) {
        deviceTokenDao.upsert(userId,
            token,
            platform,
            Instant.now());
        log.info("Registered device for user {}: platform={}",
            userId,
            platform);
    }

    /**
     * Unregisters a device token for a user, ceasing push notifications to that device.
     *
     * @param userId The ID of the user.
     * @param token  The device token to remove.
     */
    public void unregisterDevice(String userId, String token) {
        deviceTokenDao.delete(userId,
            token);
        log.info("Unregistered device for user {}",
            userId);
    }

    /**
     * Sends a push notification to all registered devices for a given user.
     * If the user has no registered devices and the notification is critical
     * (e.g., "HIRED", "BOOKING_CONFIRMED"), it triggers an SMS fallback.
     *
     * @param userId The ID of the user.
     * @param title  The notification title.
     * @param body   The notification body/message.
     * @param type   The type/category of the notification.
     */
    public void sendPush(String userId, String title, String body, String type) {
        List<DeviceToken> tokens = deviceTokenDao.findByUserId(userId);

        if (tokens.isEmpty()) {
            log.warn("No device tokens for user {}, push not sent: type={}",
                userId,
                type);
            if ("HIRED".equals(type) || "BOOKING_CONFIRMED".equals(type)) {
                sendSmsFallback(userId);
            }
            return;
        }

        for (DeviceToken t : tokens) {
            log.info(
                "Sending push to user {} on platform {}: notification_type={} title={} body={}",
                userId,
                t.platform(),
                type,
                title,
                body);
            notificationLogDao.insert(UUID.randomUUID()
                    .toString(),
                userId,
                type,
                "PUSH",
                "SENT",
                Instant.now());
        }
    }

    /**
     * Sends an SMS fallback to a user for critical notifications.
     *
     * @param userId The ID of the user to receive the SMS.
     */
    public void sendSmsFallback(String userId) {
        log.info("Sending SMS fallback to user {}",
            userId);
        notificationLogDao.insert(UUID.randomUUID()
                .toString(),
            userId,
            "FALLBACK",
            "SMS",
            "SENT",
            Instant.now());
    }

    /**
     * Retrieves all recorded notification logs.
     *
     * @return A list of {@link NotificationLog} entries.
     */
    public List<NotificationLog> getLogs() {
        return notificationLogDao.findAll();
    }
}
