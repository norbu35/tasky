package mn.tasky.notification.provider;

import org.springframework.lang.Nullable;

/**
 * Outcome of a push or SMS delivery attempt.
 *
 * @param success           {@code true} when the provider accepted the message.
 * @param providerMessageId Provider-assigned message identifier (may be synthetic for logging stubs).
 * @param errorCode         Provider error code when {@code success} is {@code false}; {@code null} otherwise.
 */
public record NotificationResult(boolean success, @Nullable String providerMessageId, @Nullable String errorCode) {}
