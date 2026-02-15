package mn.tasky.notification.application;

import mn.tasky.notification.dto.DeviceToken;
import mn.tasky.notification.dto.NotificationLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final ConcurrentHashMap<String, List<DeviceToken>> tokensByUserId = new ConcurrentHashMap<>();
    private final List<NotificationLog> notificationLogs = new ArrayList<>();

    public void registerDevice(String userId, String token, String platform) {
        tokensByUserId.compute(userId, (id, current) -> {
            List<DeviceToken> list = current != null ? new ArrayList<>(current) : new ArrayList<>();
            list.removeIf(t -> t.token().equals(token));
            list.add(new DeviceToken(token, platform, Instant.now()));
            return list;
        });
        log.info("Registered device for user {}: platform={}", userId, platform);
    }

    public void unregisterDevice(String userId, String token) {
        tokensByUserId.computeIfPresent(userId, (id, current) -> {
            List<DeviceToken> list = new ArrayList<>(current);
            list.removeIf(t -> t.token().equals(token));
            return list;
        });
        log.info("Unregistered device for user {}: token={}", userId, token);
    }

    public void sendPush(String userId, String title, String body, String type) {
        List<DeviceToken> tokens = tokensByUserId.getOrDefault(userId, List.of());
        
        if (tokens.isEmpty()) {
            log.warn("No device tokens for user {}, push not sent: title={}", userId, title);
            if ("HIRED".equals(type) || "BOOKING_CONFIRMED".equals(type)) {
                sendSmsFallback(userId, body);
            }
            return;
        }

        for (DeviceToken t : tokens) {
            log.info("Sending push to user {} ({}): {} - {}", userId, t.platform(), title, body);
            notificationLogs.add(new NotificationLog(
                UUID.randomUUID().toString(), userId, type, "PUSH", "SENT", Instant.now()
            ));
        }
    }

    public void sendSmsFallback(String userId, String body) {
        log.info("Sending SMS fallback to user {}: {}", userId, body);
        notificationLogs.add(new NotificationLog(
            UUID.randomUUID().toString(), userId, "FALLBACK", "SMS", "SENT", Instant.now()
        ));
    }

    public List<NotificationLog> getLogs() {
        return List.copyOf(notificationLogs);
    }

}
