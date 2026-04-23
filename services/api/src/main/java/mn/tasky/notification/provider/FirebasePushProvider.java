package mn.tasky.notification.provider;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.automation.provider.ProviderHealth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Production push provider using Firebase Cloud Messaging (FCM) directly.
 *
 * <p>Activated when {@code tasky.push.provider=firebase}.
 * Reads {@code FIREBASE_SERVICE_ACCOUNT_JSON} (full service-account JSON string) to initialise
 * the Firebase Admin SDK. Delivers individual pushes and supports topic fan-out.
 */
@Component
@ConditionalOnProperty(name = "tasky.push.provider", havingValue = "firebase")
public class FirebasePushProvider implements PushNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(FirebasePushProvider.class);

    private final FirebaseMessaging messaging;

    @Autowired
    public FirebasePushProvider(@Value("${FIREBASE_SERVICE_ACCOUNT_JSON:}") String serviceAccountJson) {
        this.messaging = initFirebase(serviceAccountJson);
    }

    /** Test constructor — accepts a pre-built FirebaseMessaging mock. */
    public FirebasePushProvider(FirebaseMessaging messaging) {
        this.messaging = messaging;
    }

    private static String maskToken(String token) {
        if (token == null || token.length() <= 8) {
            return "***";
        }
        return token.substring(0, 8) + "...";
    }

    @Override
    public NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data) {
        try {
            Message.Builder builder = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(
                            Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data);

            if ("ANDROID".equalsIgnoreCase(platform)) {
                builder.setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .setNotification(AndroidNotification.builder()
                                .setSound("default")
                                .build())
                        .build());
            } else if ("IOS".equalsIgnoreCase(platform)) {
                builder.setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder().setSound("default").build())
                        .build());
            }

            String messageId = messaging.send(builder.build());
            log.debug("FCM push delivered: messageId={} token={}", messageId, maskToken(deviceToken));
            return new NotificationResult(true, messageId, null);

        } catch (Exception e) {
            log.error("FCM push failed for token={}: {}", maskToken(deviceToken), e.getMessage());
            return new NotificationResult(false, UUID.randomUUID().toString(), "DELIVERY_FAILURE");
        }
    }

    @Override
    public void subscribeToTopics(String deviceToken, List<String> topics) {
        for (String topic : topics) {
            try {
                var response = messaging.subscribeToTopic(List.of(deviceToken), topic);
                if (response.getFailureCount() > 0) {
                    log.warn(
                            "FCM topic subscription failed: topic={} token={} errors={}",
                            topic,
                            maskToken(deviceToken),
                            response.getErrors());
                } else {
                    log.debug("FCM subscribed: topic={} token={}", topic, maskToken(deviceToken));
                }
            } catch (Exception e) {
                log.error(
                        "FCM subscribeToTopic error: topic={} token={}: {}",
                        topic,
                        maskToken(deviceToken),
                        e.getMessage());
            }
        }
    }

    @Override
    public NotificationResult sendToTopic(String topic, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(
                            Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data)
                    .build();
            String messageId = messaging.send(message);
            log.info("FCM topic send: topic={} messageId={}", topic, messageId);
            return new NotificationResult(true, messageId, null);
        } catch (Exception e) {
            log.error("FCM topic send failed: topic={}: {}", topic, e.getMessage());
            return new NotificationResult(false, UUID.randomUUID().toString(), "DELIVERY_FAILURE");
        }
    }

    private static FirebaseMessaging initFirebase(String serviceAccountJson) {
        if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
            throw new IllegalStateException(
                    "FIREBASE_SERVICE_ACCOUNT_JSON must be set when tasky.push.provider=firebase");
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)));
                FirebaseOptions options =
                        FirebaseOptions.builder().setCredentials(credentials).build();
                FirebaseApp.initializeApp(options);
            }
            return FirebaseMessaging.getInstance();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialise Firebase Admin SDK", e);
        }
    }

    @Override
    public ProviderHealth health() {
        try {
            // FirebaseMessaging doesn't expose a lightweight health check;
            // check that the instance was initialized without error.
            if (messaging == null) {
                return ProviderHealth.unhealthy(providerName(), "FirebaseMessaging not initialized");
            }
            return ProviderHealth.healthy(providerName());
        } catch (Exception exception) {
            return ProviderHealth.unhealthy(providerName(), exception.getMessage());
        }
    }

    @Override
    public String providerName() {
        return "firebase";
    }
}
