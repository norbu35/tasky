package mn.tasky.notification.provider;

import mn.tasky.automation.provider.ProviderHealth;

/**
 * Contract for SMS notification providers used by the notification pipeline.
 * Distinct from {@link mn.tasky.auth.application.SmsService} which handles OTP delivery only.
 */
public interface SmsNotificationProvider {

    /**
     * Sends an SMS message to a phone number.
     *
     * @param phoneNumber Normalized destination phone number.
     * @param message     Message body.
     * @return Result indicating success/failure and provider message ID.
     */
    NotificationResult sendSms(String phoneNumber, String message);

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "twilio", "logging").
     */
    String providerName();
}
