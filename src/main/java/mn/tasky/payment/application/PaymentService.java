package mn.tasky.payment.application;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.payment.dao.PaymentIntentDao;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.task.application.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service responsible for payment intent lifecycle and verified gateway callbacks.
 * Integrates booking/task transitions and emits post-payment side effects via domain outbox.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final BookingService bookingService;
    private final TaskService taskService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final AnalyticsService analyticsService;
    private final PaymentIntentDao paymentIntentDao;
    private final boolean monetizationEnabled;
    private final byte[] qpayWebhookSecretBytes;
    private final long maxCallbackAgeSeconds;

    @SuppressFBWarnings(
        value = "CT_CONSTRUCTOR_THROW",
        justification = "Payment integration must fail fast when monetization is enabled without webhook secret."
    )
    public PaymentService(
        BookingService bookingService,
        TaskService taskService,
        DomainEventOutboxService domainEventOutboxService,
        AnalyticsService analyticsService,
        PaymentIntentDao paymentIntentDao,
        @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled,
        @Value("${tasky.qpay.webhook-secret}") String qpayWebhookSecret,
        @Value("${tasky.qpay.max-callback-age-seconds:300}") long maxCallbackAgeSeconds
    ) {
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.analyticsService = analyticsService;
        this.paymentIntentDao = paymentIntentDao;
        this.monetizationEnabled = monetizationEnabled;
        this.maxCallbackAgeSeconds = maxCallbackAgeSeconds;
        if (monetizationEnabled && !StringUtils.hasText(qpayWebhookSecret)) {
            throw new IllegalStateException("tasky.qpay.webhook-secret must be configured.");
        }
        this.qpayWebhookSecretBytes = StringUtils.hasText(qpayWebhookSecret)
            ? qpayWebhookSecret.getBytes(StandardCharsets.UTF_8)
            : new byte[0];
    }

    /**
     * Creates a new payment intent for a booking and emits a payment-initiated analytics event.
     *
     * @param bookingId The booking identifier.
     * @return The created {@link PaymentIntent}.
     * @throws IllegalStateException if monetization is disabled.
     */
    public PaymentIntent initiatePayment(String bookingId) {
        ensureMonetizationEnabled();
        String paymentId = UUID.randomUUID()
            .toString();
        paymentIntentDao.insert(paymentId,
            bookingId);

        Optional<BookingState> booking = bookingService.getBooking(bookingId);
        booking.ifPresent(b -> analyticsService.track(
            AnalyticsService.EVENT_PAYMENT_INITIATED,
            b.customerId(),
            Map.of(
                AnalyticsService.PROPERTY_BOOKING_ID,
                bookingId,
                AnalyticsService.PROPERTY_TASK_ID,
                b.taskId(),
                "payment_id",
                paymentId
            )
        ));

        return new PaymentIntent(
            paymentId,
            "https://qpay.mn/pay/" + paymentId,
            "BASE64_QR_CODE_" + paymentId
        );
    }

    private void ensureMonetizationEnabled() {
        if (!monetizationEnabled) {
            throw new IllegalStateException("Monetization is deferred.");
        }
    }

    /**
     * Retrieves a payment intent by payment identifier.
     *
     * @param paymentId The payment identifier.
     * @return The matching {@link PaymentIntent}, if one exists.
     */
    public Optional<PaymentIntent> findPaymentIntent(String paymentId) {
        return paymentIntentDao.findBookingIdByPaymentId(paymentId)
            .map(ignored -> new PaymentIntent(
                paymentId,
                "https://qpay.mn/pay/" + paymentId,
                "BASE64_QR_CODE_" + paymentId
            ));
    }

    /**
     * Processes a signed payment callback from QPay.
     * Accepts callbacks only when signature and timestamp are valid and status is {@code PAID}.
     * On first successful processing, transitions the booking/task state and enqueues
     * post-payment side effects through the domain outbox.
     *
     * @param paymentId The payment identifier.
     * @param status    The callback payment status.
     * @param timestamp Callback timestamp in epoch seconds.
     * @param signature Callback HMAC signature.
     * @return {@code true} when the callback is accepted (including already-processed idempotent
     * callbacks),
     * {@code false} when rejected or not applicable.
     * @throws IllegalStateException if monetization is disabled.
     */
    public boolean processCallback(String paymentId,
                                   String status,
                                   long timestamp,
                                   String signature) {
        ensureMonetizationEnabled();
        if (!isValidSignature(paymentId,
            status,
            timestamp,
            signature)) {
            log.warn("Rejected QPay callback due to invalid signature for payment {}",
                paymentId);
            return false;
        }

        if (!"PAID".equalsIgnoreCase(status)) {
            return false;
        }

        Optional<String> bookingIdOpt = paymentIntentDao.findBookingIdByPaymentId(paymentId);
        if (bookingIdOpt.isEmpty()) {
            return false;
        }
        String bookingId = bookingIdOpt.get();

        Optional<BookingState> bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return false;
        }

        int rowsUpdated = paymentIntentDao.markProcessed(paymentId);
        if (rowsUpdated == 0) {
            return true; // already processed
        }

        BookingState booking = bookingOpt.get();
        if ("ASSIGNED".equals(booking.status())) {
            bookingService.transitionToPaid(bookingId);
            if (taskService.transitionToAssigned(booking.taskId())
                .isEmpty()) {
                log.warn("Task not found when assigning after payment: bookingId={} taskId={}",
                    bookingId,
                    booking.taskId());
            }

            domainEventOutboxService.publish(
                OutboxEventTypes.PAYMENT_CONFIRMED,
                "PAYMENT",
                paymentId,
                Map.of(
                    "payment_id",
                    paymentId,
                    "booking_id",
                    bookingId,
                    "task_id",
                    booking.taskId(),
                    "customer_id",
                    booking.customerId(),
                    "tasker_id",
                    booking.taskerId()
                )
            );
        }

        return true;
    }

    private boolean isValidSignature(String paymentId,
                                     String status,
                                     long timestamp,
                                     String providedSignature) {
        if (!StringUtils.hasText(paymentId) || !StringUtils.hasText(status) ||
            !StringUtils.hasText(providedSignature) || timestamp <= 0) {
            return false;
        }
        if (!isRecentTimestamp(timestamp)) {
            return false;
        }
        String expected = computeSignature(paymentId + "|" + status + "|" + timestamp);
        String normalizedProvided = providedSignature.trim()
            .toLowerCase(Locale.ROOT);
        return MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            normalizedProvided.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean isRecentTimestamp(long epochSeconds) {
        long now = Instant.now()
            .getEpochSecond();
        return Math.abs(now - epochSeconds) <= maxCallbackAgeSeconds;
    }

    private String computeSignature(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(qpayWebhookSecretBytes,
                HMAC_ALGORITHM));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(signature.length * 2);
            for (byte b : signature) {
                builder.append(String.format(Locale.ROOT,
                    "%02x",
                    b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to calculate QPay signature",
                ex);
        }
    }

}
