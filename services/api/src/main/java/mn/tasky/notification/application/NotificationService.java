package mn.tasky.notification.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.common.security.CryptoService;
import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.DistrictDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.DeviceToken;
import mn.tasky.notification.dto.District;
import mn.tasky.notification.dto.NotificationLog;
import mn.tasky.notification.provider.NotificationResult;
import mn.tasky.notification.provider.PushNotificationProvider;
import mn.tasky.notification.provider.SmsNotificationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Service responsible for managing user device tokens and sending push notifications.
 * Delegates actual delivery to {@link PushNotificationProvider} and {@link SmsNotificationProvider}
 * implementations and records every attempt in the notification log with an idempotent event_key.
 */
@Service
public class NotificationService {

    private static final int DEFAULT_LOG_READ_LIMIT = 1000;
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final DeviceTokenDao deviceTokenDao;
    private final NotificationLogDao notificationLogDao;
    private final PushNotificationProvider pushProvider;
    private final SmsNotificationProvider smsProvider;
    private final UserDao userDao;
    private final CryptoService cryptoService;
    private final TaskerServiceAreaDao serviceAreaDao;
    private final DistrictDao districtDao;

    public NotificationService(
            DeviceTokenDao deviceTokenDao,
            NotificationLogDao notificationLogDao,
            PushNotificationProvider pushProvider,
            SmsNotificationProvider smsProvider,
            UserDao userDao,
            CryptoService cryptoService,
            TaskerServiceAreaDao serviceAreaDao,
            DistrictDao districtDao) {
        this.deviceTokenDao = deviceTokenDao;
        this.notificationLogDao = notificationLogDao;
        this.pushProvider = pushProvider;
        this.smsProvider = smsProvider;
        this.userDao = userDao;
        this.cryptoService = cryptoService;
        this.serviceAreaDao = serviceAreaDao;
        this.districtDao = districtDao;
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
        deviceTokenDao.upsert(userId, token, platform, Instant.now());
        log.info("Registered device for user {}: platform={}", userId, platform);
        subscribeToFcmTopics(userId, token);
    }

    /**
     * Unregisters a device token for a user, ceasing push notifications to that device.
     *
     * @param userId The ID of the user.
     * @param token  The device token to remove.
     */
    public void unregisterDevice(String userId, String token) {
        deviceTokenDao.delete(userId, token);
        log.info("Unregistered device for user {}", userId);
    }

    /**
     * Sends a push notification to all registered devices for a given user.
     * Uses a non-deterministic event_key when no contextual booking ID is available.
     * If the user has no registered devices and the notification is critical
     * (e.g., "HIRED", "BOOKING_CONFIRMED"), it triggers an SMS fallback.
     *
     * @param userId The ID of the user.
     * @param title  The notification title.
     * @param body   The notification body/message.
     * @param type   The type/category of the notification.
     */
    public void sendPush(String userId, String title, String body, String type) {
        String eventKey = type + "_" + userId + "_" + UUID.randomUUID();
        sendPushWithEventKey(userId, title, body, type, eventKey);
    }

    /**
     * Sends a push notification with a deterministic event_key for idempotency.
     * Duplicate event_keys are silently skipped to prevent duplicate notifications.
     *
     * @param userId   The ID of the user.
     * @param title    The notification title.
     * @param body     The notification body/message.
     * @param type     The type/category of the notification.
     * @param eventKey Deterministic key used for idempotency checks.
     */
    public void sendPushWithEventKey(String userId, String title, String body, String type, String eventKey) {
        if (notificationLogDao.existsByEventKey(eventKey)) {
            log.info("Duplicate event_key={} for user {}, skipping notification", eventKey, userId);
            return;
        }

        List<DeviceToken> tokens = deviceTokenDao.findByUserId(userId);

        if (tokens.isEmpty()) {
            log.warn("No device tokens for user {}, push not sent: type={}", userId, type);
            if ("HIRED".equals(type) || "BOOKING_CONFIRMED".equals(type)) {
                sendSmsFallback(userId, type, title, body, eventKey);
            }
            return;
        }

        Map<String, String> data = Map.of("type", type);
        for (DeviceToken t : tokens) {
            NotificationResult result = pushProvider.sendPush(t.token(), t.platform(), title, body, data);
            String status = result.success() ? "SENT" : "FAILED";
            notificationLogDao.insert(
                    UUID.randomUUID().toString(),
                    userId,
                    type,
                    "PUSH",
                    status,
                    eventKey,
                    result.providerMessageId(),
                    result.errorCode(),
                    Instant.now());
        }
    }

    public void sendPushWithSmsFallback(String userId, String title, String body, String type, String eventKey) {
        sendPushWithEventKey(userId, title, body, type, eventKey);
        sendSmsFallback(userId, type, title, body, eventKey);
    }

    private void subscribeToFcmTopics(String userId, String token) {
        var user = userDao.findById(userId).orElse(null);
        if (user == null) {
            return;
        }

        List<String> topics = new ArrayList<>();
        topics.add("platform.all");

        if ("TASKER".equals(user.role())) {
            List<District> districts = serviceAreaDao.findByUserId(userId);
            for (District d : districts) {
                topics.add("taskers.district." + d.slug());
            }

            List<String> categorySlugs = districtDao.findAllActiveCategorySlugs();
            for (String catSlug : categorySlugs) {
                topics.add("taskers.category." + catSlug);
                for (District d : districts) {
                    topics.add("taskers.district." + d.slug() + "." + catSlug);
                }
            }
        }

        pushProvider.subscribeToTopics(token, topics);
        log.info("FCM topic subscriptions queued for user {}: {} topics", userId, topics.size());
    }

    /**
     * Sends an SMS fallback to a user for critical notifications when no device tokens exist.
     * Looks up the user's phone number via the user DAO and decrypts it before sending.
     *
     * @param userId   The ID of the user to receive the SMS.
     * @param type     The notification type that triggered the fallback.
     * @param title    The notification title.
     * @param body     The notification body.
     * @param eventKey The event key for idempotency.
     */
    private void sendSmsFallback(String userId, String type, String title, String body, String eventKey) {
        String smsEventKey = eventKey + "_SMS_FALLBACK";

        if (notificationLogDao.existsByEventKey(smsEventKey)) {
            log.info("Duplicate SMS fallback event_key={} for user {}, skipping", smsEventKey, userId);
            return;
        }

        Optional<AuthUser> userOpt = userDao.findById(userId);
        String phone = userOpt.map(u -> decryptPhone(u.phone())).orElse(null);

        if (!StringUtils.hasText(phone)) {
            log.warn("Cannot send SMS fallback for user {}: no phone number available", userId);
            notificationLogDao.insert(
                    UUID.randomUUID().toString(),
                    userId,
                    type,
                    "SMS",
                    "FAILED",
                    smsEventKey,
                    null,
                    "NO_PHONE",
                    Instant.now());
            return;
        }

        String formattedMessage = title + ": " + body;
        NotificationResult result = smsProvider.sendSms(phone, formattedMessage);
        String status = result.success() ? "SENT" : "FAILED";
        notificationLogDao.insert(
                UUID.randomUUID().toString(),
                userId,
                type,
                "SMS",
                status,
                smsEventKey,
                result.providerMessageId(),
                result.errorCode(),
                Instant.now());
        log.info("SMS fallback sent to user {}: type={} status={}", userId, type, status);
    }

    private String decryptPhone(String encryptedPhone) {
        if (!StringUtils.hasText(encryptedPhone)) {
            return null;
        }
        return cryptoService.decrypt(encryptedPhone);
    }

    /**
     * Retrieves all recorded notification logs.
     *
     * @return A list of {@link NotificationLog} entries.
     */
    public List<NotificationLog> getLogs() {
        return notificationLogDao.findLatest(DEFAULT_LOG_READ_LIMIT);
    }
}
