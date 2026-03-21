package mn.tasky.notification.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Production push provider that delivers notifications via the Expo Push API.
 *
 * <p>Activated when {@code tasky.push.provider=expo}. The mobile app uses Expo Push Tokens
 * ({@code ExponentPushToken[...]}) obtained via {@code expo-notifications}. This provider sends
 * a single-ticket request to {@code https://exp.host/--/api/v2/push/send} for each token.
 *
 * <p>No Expo access token is required for low-volume usage; set
 * {@code TASKY_EXPO_ACCESS_TOKEN} for higher priority delivery quotas.
 */
@Component
@ConditionalOnProperty(name = "tasky.push.provider", havingValue = "expo")
public class ExpoPushProvider implements PushNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushProvider.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient;

    public ExpoPushProvider(@Value("${tasky.push.expo-access-token:}") String expoAccessToken) {
        RestClient.Builder builder = RestClient.builder().baseUrl(EXPO_PUSH_URL);
        if (expoAccessToken != null && !expoAccessToken.isBlank()) {
            builder.defaultHeader("Authorization", "Bearer " + expoAccessToken);
        }
        this.restClient = builder.build();
    }

    @Override
    public NotificationResult sendPush(
            String deviceToken, String platform, String title, String body, Map<String, String> data) {
        String ticketId = UUID.randomUUID().toString();
        try {
            Map<String, Object> message = Map.of(
                    "to", deviceToken,
                    "title", title,
                    "body", body,
                    "data", data,
                    "sound", "default");

            ExpoResponse response = restClient
                    .post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(message))
                    .retrieve()
                    .body(ExpoResponse.class);

            if (response != null
                    && response.data() != null
                    && !response.data().isEmpty()) {
                ExpoTicket ticket = response.data().getFirst();
                if ("ok".equals(ticket.status())) {
                    log.debug("Expo push delivered: ticketId={} token={}", ticket.id(), deviceToken);
                    return new NotificationResult(true, ticket.id() != null ? ticket.id() : ticketId, null);
                } else {
                    String errorCode = ticket.details() != null ? ticket.details().get("error") : "UNKNOWN";
                    log.warn("Expo push rejected: error={} token={}", errorCode, deviceToken);
                    return new NotificationResult(false, ticketId, errorCode);
                }
            }

            log.warn("Expo push: empty response for token={}", deviceToken);
            return new NotificationResult(false, ticketId, "EMPTY_RESPONSE");

        } catch (Exception e) {
            log.error("Expo push failed for token={}: {}", deviceToken, e.getMessage());
            return new NotificationResult(false, ticketId, "DELIVERY_FAILURE");
        }
    }

    private record ExpoResponse(List<ExpoTicket> data) {}

    private record ExpoTicket(String id, String status, String message, Map<String, String> details) {}
}
