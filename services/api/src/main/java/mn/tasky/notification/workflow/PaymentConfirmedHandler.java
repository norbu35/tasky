package mn.tasky.notification.workflow;

import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Handles the PAYMENT_CONFIRMED event aftermath:
 * sends push notifications to both tasker and customer, and tracks analytics.
 *
 * Migrated from {@code DomainEventOutboxProcessor.handlePaymentConfirmed}.
 * Idempotent: duplicate event delivery will not duplicate side effects.
 */
@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class PaymentConfirmedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PaymentConfirmedHandler.class);

    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    public PaymentConfirmedHandler(NotificationService notificationService, AnalyticsService analyticsService) {
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
    }

    @Override
    public String eventType() {
        return AutomationEventTypes.PAYMENT_CONFIRMED;
    }

    @Override
    public void handle(AutomationEventEnvelope envelope) {
        if (!tryClaimEvent(envelope)) {
            log.info("Skipping duplicate event: eventId={}", envelope.eventId());
            return;
        }

        Map<String, Object> payload = envelope.payload();
        String paymentId = requiredString(payload, "payment_id");
        String bookingId = requiredString(payload, "booking_id");
        String taskId = requiredString(payload, "task_id");
        String customerId = requiredString(payload, "customer_id");
        String taskerId = requiredString(payload, "tasker_id");

        notificationService.sendPushWithEventKey(
                taskerId,
                "Booking Confirmed",
                "Payment received for booking #" + bookingId,
                "BOOKING_CONFIRMED",
                "BOOKING_CONFIRMED_TASKER_" + bookingId);
        notificationService.sendPushWithEventKey(
                customerId,
                "Booking Confirmed",
                "Your payment for booking #" + bookingId + " was successful.",
                "BOOKING_CONFIRMED",
                "BOOKING_CONFIRMED_CUSTOMER_" + bookingId);

        analyticsService.track(
                AnalyticsService.EVENT_PAYMENT_CONFIRMED,
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                AnalyticsService.PROPERTY_BOOKING_ID,
                                bookingId,
                                AnalyticsService.PROPERTY_TASK_ID,
                                taskId,
                                "payment_id",
                                paymentId)));

        tryClaimEventComplete(envelope);

        log.info("Payment confirmed aftermath completed: paymentId={} bookingId={}", paymentId, bookingId);
    }
}
