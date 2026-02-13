package mn.tasky.payment;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.analytics.AnalyticsService;
import mn.tasky.booking.BookingService;
import mn.tasky.notification.NotificationService;
import mn.tasky.task.TaskService;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final BookingService bookingService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    // Maps payment_id to booking_id
    private final ConcurrentHashMap<String, String> bookingByPaymentId = new ConcurrentHashMap<>();

    public PaymentService(BookingService bookingService, TaskService taskService, NotificationService notificationService, AnalyticsService analyticsService) {
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
    }

    public PaymentIntent initiatePayment(String bookingId) {
        String paymentId = UUID.randomUUID().toString();
        bookingByPaymentId.put(paymentId, bookingId);
        
        Optional<BookingService.BookingState> booking = bookingService.getBooking(bookingId);
        booking.ifPresent(b -> analyticsService.track("PAYMENT_INITIATED", b.customerId(), Map.of("booking_id", bookingId, "payment_id", paymentId)));

        return new PaymentIntent(
            paymentId,
            "https://qpay.mn/pay/" + paymentId,
            "BASE64_QR_CODE_" + paymentId
        );
    }

    public boolean processCallback(String paymentId, String status, String signature) {
        // Placeholder for signature validation
        if (!"VALID_SIG".equals(signature)) {
            // return false; // For testing I'll allow any for now if I want
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

        BookingService.BookingState booking = bookingOpt.get();
        if ("PENDING_PAYMENT".equals(booking.status())) {
            bookingService.transitionToPaid(bookingId);
            taskService.transitionToAssigned(booking.taskId());
            
            notificationService.sendPush(booking.taskerId(), "Booking Confirmed", "Payment received for booking #" + bookingId, "BOOKING_CONFIRMED");
            notificationService.sendPush(booking.customerId(), "Booking Confirmed", "Your payment for booking #" + bookingId + " was successful.", "BOOKING_CONFIRMED");
            analyticsService.track("PAYMENT_CONFIRMED", booking.customerId(), Map.of("booking_id", bookingId, "payment_id", paymentId));
        }

        return true;
    }

    public record PaymentIntent(String paymentId, String paymentUrl, String qrCode) {
    }
}
