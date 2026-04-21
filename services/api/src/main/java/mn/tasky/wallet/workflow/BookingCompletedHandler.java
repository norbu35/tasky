package mn.tasky.wallet.workflow;

import java.util.Map;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class BookingCompletedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(BookingCompletedHandler.class);

    private final WalletCommandPort walletCommandPort;
    private final NotificationCommandPort notificationCommandPort;
    private final AnalyticsCommandPort analyticsCommandPort;
    private final TrustCommandPort trustCommandPort;
    private final IdentityCommandPort identityCommandPort;
    private final int platformFeeBasisPoints;

    public BookingCompletedHandler(
            WalletCommandPort walletCommandPort,
            NotificationCommandPort notificationCommandPort,
            AnalyticsCommandPort analyticsCommandPort,
            TrustCommandPort trustCommandPort,
            IdentityCommandPort identityCommandPort,
            @Value("${tasky.wallet.platform-fee-basis-points:1500}") int platformFeeBasisPoints) {
        this.walletCommandPort = walletCommandPort;
        this.notificationCommandPort = notificationCommandPort;
        this.analyticsCommandPort = analyticsCommandPort;
        this.trustCommandPort = trustCommandPort;
        this.identityCommandPort = identityCommandPort;
        this.platformFeeBasisPoints = platformFeeBasisPoints;
    }

    @Override
    public String eventType() {
        return AutomationEventTypes.BOOKING_COMPLETED;
    }

    @Override
    public void handle(AutomationEventEnvelope envelope) {
        if (!tryClaimEvent(envelope)) {
            log.info("Skipping duplicate event: eventId={}", envelope.eventId());
            return;
        }

        Map<String, Object> payload = envelope.payload();
        String bookingId = requiredString(payload, "booking_id");
        String taskId = requiredString(payload, "task_id");
        String customerId = requiredString(payload, "customer_id");
        String taskerId = requiredString(payload, "tasker_id");
        int price = requiredInt(payload);

        walletCommandPort.creditTaskCompletion(taskerId, bookingId, price, platformFeeBasisPoints);
        notificationCommandPort.sendPushWithEventKey(
                taskerId,
                "Job Complete",
                "The customer has marked the job as complete.",
                "JOB_COMPLETED",
                "BOOKING_COMPLETED_" + bookingId);

        analyticsCommandPort.track(
                "BOOKING_COMPLETED",
                customerId,
                withObservability(payload, Map.of("booking_id", bookingId, "task_id", taskId, "tasker_id", taskerId)));

        trustCommandPort.createReviewEnforcementCases(bookingId, customerId, taskerId);
        identityCommandPort.recomputeReliabilityScore(taskerId);
        identityCommandPort.evaluateBadges(taskerId);

        tryClaimEventComplete(envelope);

        log.info(
                "Booking completed aftermath: bookingId={} taskId={} taskerId={} price={}",
                bookingId,
                taskId,
                taskerId,
                price);
    }

    private int requiredInt(Map<String, Object> payload) {
        Object value = payload.get("price");
        if (value == null) {
            throw new IllegalArgumentException("Missing payload field: price");
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Payload field is not an integer: price", exception);
        }
    }
}
