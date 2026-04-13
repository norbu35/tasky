package mn.tasky.payment.application;

import java.util.Map;
import java.util.Optional;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.payment.dao.PaymentIntentDao;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.provider.PaymentProvider;
import mn.tasky.task.application.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for payment intent lifecycle and verified gateway callbacks.
 * Delegates gateway-specific operations (intent creation, signature validation)
 * to the active {@link PaymentProvider}, and owns all domain orchestration
 * (booking transitions, task assignment, outbox event publishing).
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentProvider paymentProvider;
    private final BookingService bookingService;
    private final TaskService taskService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final AnalyticsService analyticsService;
    private final PaymentIntentDao paymentIntentDao;
    private final FeatureToggleService featureToggleService;

    public PaymentService(
            PaymentProvider paymentProvider,
            BookingService bookingService,
            TaskService taskService,
            DomainEventOutboxService domainEventOutboxService,
            AnalyticsService analyticsService,
            PaymentIntentDao paymentIntentDao,
            FeatureToggleService featureToggleService) {
        this.paymentProvider = paymentProvider;
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.analyticsService = analyticsService;
        this.paymentIntentDao = paymentIntentDao;
        this.featureToggleService = featureToggleService;
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
        PaymentIntent intent = paymentProvider.createIntent(bookingId);

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
                        intent.paymentId())));

        return intent;
    }

    private void ensureMonetizationEnabled() {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
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
        return Optional.ofNullable(paymentProvider.resolvePaymentIntent(paymentId));
    }

    /**
     * Processes a signed payment callback from the gateway.
     * Validates the signature via the provider, then orchestrates booking/task
     * transitions and publishes post-payment side effects through the domain outbox.
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
    @Transactional
    public boolean processCallback(String paymentId, String status, long timestamp, String signature) {
        ensureMonetizationEnabled();
        if (!paymentProvider.isValidSignature(paymentId, status, timestamp, signature)) {
            log.warn("Rejected gateway callback due to invalid signature for payment {}", paymentId);
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
            if (taskService.transitionToAssigned(booking.taskId()).isEmpty()) {
                log.warn(
                        "Task not found when assigning after payment: bookingId={} taskId={}",
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
                            booking.taskerId()));
        }

        return true;
    }
}
