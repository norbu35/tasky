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

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final DeviceTokenDao deviceTokenDao;
    private final NotificationLogDao notificationLogDao;

    public NotificationService(DeviceTokenDao deviceTokenDao, NotificationLogDao notificationLogDao) {
        this.deviceTokenDao = deviceTokenDao;
        this.notificationLogDao = notificationLogDao;
    }

    public void registerDevice(String userId, String token, String platform) {
        deviceTokenDao.upsert(userId, token, platform, Instant.now());
        log.info("Registered device for user {}: platform={}", userId, platform);
    }

    public void unregisterDevice(String userId, String token) {
        deviceTokenDao.delete(userId, token);
        log.info("Unregistered device for user {}", userId);
    }

    public void sendPush(String userId, String title, String body, String type) {
        List<DeviceToken> tokens = deviceTokenDao.findByUserId(userId);

        if (tokens.isEmpty()) {
            log.warn("No device tokens for user {}, push not sent: type={}", userId, type);
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
                body
            );
            notificationLogDao.insert(
                UUID.randomUUID().toString(), userId, type, "PUSH", "SENT", Instant.now()
            );
        }
    }

    public void sendSmsFallback(String userId) {
        log.info("Sending SMS fallback to user {}", userId);
        notificationLogDao.insert(
            UUID.randomUUID().toString(), userId, "FALLBACK", "SMS", "SENT", Instant.now()
        );
    }

    public List<NotificationLog> getLogs() {
        return notificationLogDao.findAll();
    }

}
