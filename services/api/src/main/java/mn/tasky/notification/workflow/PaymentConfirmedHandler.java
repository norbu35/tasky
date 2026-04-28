package mn.tasky.notification.workflow;

import java.util.Map;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.common.i18n.BackendMessageResolver;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class PaymentConfirmedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PaymentConfirmedHandler.class);

    private final NotificationCommandPort notificationCommandPort;
    private final AnalyticsCommandPort analyticsCommandPort;
    private final BackendMessageResolver messages;

    public PaymentConfirmedHandler(
            NotificationCommandPort notificationCommandPort,
            AnalyticsCommandPort analyticsCommandPort,
            BackendMessageResolver messages) {
        this.notificationCommandPort = notificationCommandPort;
        this.analyticsCommandPort = analyticsCommandPort;
        this.messages = messages;
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

        notificationCommandPort.sendPushWithEventKey(
                taskerId,
                messages.messageForLocale(
                        envelope.locale(), "notification.paymentConfirmed.tasker.title", "Booking Confirmed"),
                messages.messageForLocale(
                        envelope.locale(),
                        "notification.paymentConfirmed.tasker.body",
                        "Payment received for booking #" + bookingId,
                        bookingId),
                "BOOKING_CONFIRMED",
                "BOOKING_CONFIRMED_TASKER_" + bookingId);
        notificationCommandPort.sendPushWithEventKey(
                customerId,
                messages.messageForLocale(
                        envelope.locale(), "notification.paymentConfirmed.customer.title", "Booking Confirmed"),
                messages.messageForLocale(
                        envelope.locale(),
                        "notification.paymentConfirmed.customer.body",
                        "Your payment for booking #" + bookingId + " was successful.",
                        bookingId),
                "BOOKING_CONFIRMED",
                "BOOKING_CONFIRMED_CUSTOMER_" + bookingId);

        analyticsCommandPort.track(
                "PAYMENT_CONFIRMED",
                customerId,
                withObservability(
                        payload, Map.of("booking_id", bookingId, "task_id", taskId, "payment_id", paymentId)));

        tryClaimEventComplete(envelope);

        log.info("Payment confirmed aftermath completed: paymentId={} bookingId={}", paymentId, bookingId);
    }
}
