package mn.tasky.payment.application;

import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.notification.application.NotificationService;
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
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final BookingService bookingService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final PaymentIntentDao paymentIntentDao;
    private final boolean monetizationEnabled;
    private final byte[] qpayWebhookSecretBytes;

    public PaymentService(
            BookingService bookingService,
            TaskService taskService,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            PaymentIntentDao paymentIntentDao,
            @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled,
            @Value("${tasky.qpay.webhook-secret}") String qpayWebhookSecret
    ) {
        this.bookingService      = bookingService;
        this.taskService         = taskService;
        this.notificationService = notificationService;
        this.analyticsService    = analyticsService;
        this.paymentIntentDao    = paymentIntentDao;
        this.monetizationEnabled = monetizationEnabled;
        if (monetizationEnabled && !StringUtils.hasText(qpayWebhookSecret)) {
            throw new IllegalStateException("tasky.qpay.webhook-secret must be configured.");
        }
        this.qpayWebhookSecretBytes = StringUtils.hasText(qpayWebhookSecret)
                ? qpayWebhookSecret.getBytes(StandardCharsets.UTF_8)
                : new byte[0];
    }

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

    public Optional<PaymentIntent> findPaymentIntent(String paymentId) {
        return paymentIntentDao.findBookingIdByPaymentId(paymentId)
                .map(ignored -> new PaymentIntent(
                        paymentId,
                        "https://qpay.mn/pay/" + paymentId,
                        "BASE64_QR_CODE_" + paymentId
                ));
    }

    public boolean processCallback(String paymentId,
                                   String status,
                                   String signature) {
        ensureMonetizationEnabled();
        if (!isValidSignature(paymentId,
                              status,
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

            notificationService.sendPush(booking.taskerId(),
                                         "Booking Confirmed",
                                         "Payment received for booking #" + bookingId,
                                         "BOOKING_CONFIRMED");
            notificationService.sendPush(booking.customerId(),
                                         "Booking Confirmed",
                                         "Your payment for booking #" + bookingId +
                                                 " was successful.",
                                         "BOOKING_CONFIRMED");
            analyticsService.track(
                    AnalyticsService.EVENT_PAYMENT_CONFIRMED,
                    booking.customerId(),
                    Map.of(
                            AnalyticsService.PROPERTY_BOOKING_ID,
                            bookingId,
                            AnalyticsService.PROPERTY_TASK_ID,
                            booking.taskId(),
                            "payment_id",
                            paymentId
                    )
            );
        }

        return true;
    }

    private boolean isValidSignature(String paymentId,
                                     String status,
                                     String providedSignature) {
        if (!StringUtils.hasText(paymentId) || !StringUtils.hasText(status) ||
                !StringUtils.hasText(providedSignature)) {
            return false;
        }
        String expected = computeSignature(paymentId + "|" + status);
        String normalizedProvided = providedSignature.trim()
                .toLowerCase(Locale.ROOT);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                normalizedProvided.getBytes(StandardCharsets.UTF_8)
        );
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
