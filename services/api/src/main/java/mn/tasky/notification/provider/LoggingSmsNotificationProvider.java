package mn.tasky.notification.provider;

import java.util.UUID;
import mn.tasky.automation.provider.ProviderHealth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development SMS notification provider that logs messages instead of sending real SMS.
 * Activated when tasky.notification.sms.provider=logging (default).
 */
@Component
@ConditionalOnProperty(name = "tasky.notification.sms.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingSmsNotificationProvider implements SmsNotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsNotificationProvider.class);

    @Override
    public NotificationResult sendSms(String phoneNumber, String message) {
        String messageId = "LOG-" + UUID.randomUUID();
        String suffix = phoneNumber != null && phoneNumber.length() >= 4
                ? phoneNumber.substring(phoneNumber.length() - 4)
                : phoneNumber;
        log.info("SMS to=****{} message={}", suffix, message);
        return new NotificationResult(true, messageId, null);
    }

    @Override
    public ProviderHealth health() {
        return ProviderHealth.healthy(providerName());
    }

    @Override
    public String providerName() {
        return "logging";
    }
}
