package mn.tasky.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import mn.tasky.analytics.AnalyticsService;
import mn.tasky.booking.BookingService;
import mn.tasky.notification.NotificationService;
import mn.tasky.task.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final BookingService bookingService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final byte[] qpayWebhookSecretBytes;

    // Maps payment_id to booking_id
    private final ConcurrentHashMap<String, String> bookingByPaymentId = new ConcurrentHashMap<>();
    private final Set<String> processedPaymentIds = ConcurrentHashMap.newKeySet();

    public PaymentService(
        BookingService bookingService,
        TaskService taskService,
        NotificationService notificationService,
        AnalyticsService analyticsService,
        @Value("${tasky.qpay.webhook-secret}") String qpayWebhookSecret
    ) {
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        if (!StringUtils.hasText(qpayWebhookSecret)) {
            throw new IllegalStateException("tasky.qpay.webhook-secret must be configured.");
        }
        this.qpayWebhookSecretBytes = qpayWebhookSecret.getBytes(StandardCharsets.UTF_8);
    }

    public PaymentIntent initiatePayment(String bookingId) {
        String paymentId = UUID.randomUUID().toString();
        bookingByPaymentId.put(paymentId, bookingId);
        
        Optional<BookingService.BookingState> booking = bookingService.getBooking(bookingId);
        booking.ifPresent(b -> analyticsService.track(
            AnalyticsService.EVENT_PAYMENT_INITIATED,
            b.customerId(),
            Map.of(
                AnalyticsService.PROPERTY_BOOKING_ID, bookingId,
                AnalyticsService.PROPERTY_TASK_ID, b.taskId(),
                "payment_id", paymentId
            )
        ));

        return new PaymentIntent(
            paymentId,
            "https://qpay.mn/pay/" + paymentId,
            "BASE64_QR_CODE_" + paymentId
        );
    }

    public boolean processCallback(String paymentId, String status, String signature) {
        if (!isValidSignature(paymentId, status, signature)) {
            log.warn("Rejected QPay callback due to invalid signature for payment {}", paymentId);
            return false;
        }

        if (!"PAID".equalsIgnoreCase(status)) {
            return false;
        }

        String bookingId = bookingByPaymentId.get(paymentId);
        if (bookingId == null) {
            return false;
        }

        Optional<BookingService.BookingState> bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return false;
        }

        if (!processedPaymentIds.add(paymentId)) {
            return true;
        }

        BookingService.BookingState booking = bookingOpt.get();
        if ("PENDING_PAYMENT".equals(booking.status())) {
            bookingService.transitionToPaid(bookingId);
            taskService.transitionToAssigned(booking.taskId());
            
            notificationService.sendPush(booking.taskerId(), "Booking Confirmed", "Payment received for booking #" + bookingId, "BOOKING_CONFIRMED");
            notificationService.sendPush(booking.customerId(), "Booking Confirmed", "Your payment for booking #" + bookingId + " was successful.", "BOOKING_CONFIRMED");
            analyticsService.track(
                AnalyticsService.EVENT_PAYMENT_CONFIRMED,
                booking.customerId(),
                Map.of(
                    AnalyticsService.PROPERTY_BOOKING_ID, bookingId,
                    AnalyticsService.PROPERTY_TASK_ID, booking.taskId(),
                    "payment_id", paymentId
                )
            );
        }

        return true;
    }

    private boolean isValidSignature(String paymentId, String status, String providedSignature) {
        if (!StringUtils.hasText(paymentId) || !StringUtils.hasText(status) || !StringUtils.hasText(providedSignature)) {
            return false;
        }
        String expected = computeSignature(paymentId + "|" + status);
        String normalizedProvided = providedSignature.trim().toLowerCase(Locale.ROOT);
        return MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            normalizedProvided.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String computeSignature(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(qpayWebhookSecretBytes, HMAC_ALGORITHM));
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

    public record PaymentIntent(String paymentId, String paymentUrl, String qrCode) {
    }
}
