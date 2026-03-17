package mn.tasky.notification.provider;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Development SMS notification provider that logs messages instead of sending real SMS.
 * Marked {@code @Primary} so it is selected by default; production providers override via profile.
 */
@Component
@Primary
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
}
