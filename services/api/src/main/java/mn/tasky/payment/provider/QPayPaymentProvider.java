package mn.tasky.payment.provider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import mn.tasky.automation.provider.ProviderHealth;
import mn.tasky.payment.dao.PaymentIntentDao;
import mn.tasky.payment.dto.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * QPay gateway adapter: creates payment intents and validates callback signatures.
 * Domain orchestration (booking transitions, task assignment, outbox publishing)
 * remains in {@code PaymentService}.
 */
@Component
@ConditionalOnProperty(name = "tasky.payment.provider", havingValue = "qpay", matchIfMissing = true)
public class QPayPaymentProvider implements PaymentProvider {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final PaymentIntentDao paymentIntentDao;
    private final String qpayWebhookSecret;
    private final long maxCallbackAgeSeconds;
    private final AtomicReference<byte[]> qpayWebhookSecretBytes = new AtomicReference<>();

    public QPayPaymentProvider(
            PaymentIntentDao paymentIntentDao,
            @Value("${tasky.qpay.webhook-secret:}") String qpayWebhookSecret,
            @Value("${tasky.qpay.max-callback-age-seconds:300}") long maxCallbackAgeSeconds) {
        this.paymentIntentDao = paymentIntentDao;
        this.qpayWebhookSecret = qpayWebhookSecret;
        this.maxCallbackAgeSeconds = maxCallbackAgeSeconds;
    }

    @Override
    public PaymentIntent createIntent(String bookingId) {
        String paymentId = UUID.randomUUID().toString();
        paymentIntentDao.insert(paymentId, bookingId);
        return new PaymentIntent(paymentId, "https://qpay.mn/pay/" + paymentId, "BASE64_QR_CODE_" + paymentId);
    }

    @Override
    public boolean isValidSignature(String paymentId, String status, long timestamp, String providedSignature) {
        if (!StringUtils.hasText(paymentId)
                || !StringUtils.hasText(status)
                || !StringUtils.hasText(providedSignature)
                || timestamp <= 0) {
            return false;
        }
        if (!isRecentTimestamp(timestamp)) {
            return false;
        }
        String expected = computeSignature(paymentId + "|" + status + "|" + timestamp);
        String normalizedProvided = providedSignature.trim().toLowerCase(Locale.ROOT);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), normalizedProvided.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public ProviderHealth health() {
        if (!StringUtils.hasText(qpayWebhookSecret)) {
            return ProviderHealth.unhealthy(providerName(), "Webhook secret not configured");
        }
        return ProviderHealth.healthy(providerName());
    }

    @Override
    public String providerName() {
        return "qpay";
    }

    private boolean isRecentTimestamp(long epochSeconds) {
        long now = Instant.now().getEpochSecond();
        return Math.abs(now - epochSeconds) <= maxCallbackAgeSeconds;
    }

    private String computeSignature(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(getWebhookSecretBytes(), HMAC_ALGORITHM));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(signature.length * 2);
            for (byte b : signature) {
                builder.append(String.format(Locale.ROOT, "%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to calculate QPay signature", ex);
        }
    }

    private byte[] getWebhookSecretBytes() {
        byte[] bytes = this.qpayWebhookSecretBytes.get();
        if (bytes == null) {
            if (!StringUtils.hasText(qpayWebhookSecret)) {
                throw new IllegalStateException("tasky.qpay.webhook-secret must be configured when escrow is enabled.");
            }
            bytes = qpayWebhookSecret.getBytes(StandardCharsets.UTF_8);
            this.qpayWebhookSecretBytes.set(bytes);
        }
        return bytes;
    }
}
