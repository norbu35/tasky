package mn.tasky.wallet.workflow;

import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.wallet.application.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Handles the BOOKING_COMPLETED event aftermath:
 * credits the tasker's wallet, sends push notification, tracks analytics,
 * creates review enforcement cases, recomputes reliability score, and evaluates badges.
 *
 * Migrated from {@code DomainEventOutboxProcessor.handleBookingCompleted}.
 * Idempotent: duplicate event delivery will not duplicate wallet credits or other side effects.
 */
@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class BookingCompletedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(BookingCompletedHandler.class);

    private final WalletService walletService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final ReviewEnforcementService reviewEnforcementService;
    private final ReliabilityScoreService reliabilityScoreService;
    private final BadgeEvaluationService badgeEvaluationService;
    private final int platformFeeBasisPoints;

    public BookingCompletedHandler(
            WalletService walletService,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            ReviewEnforcementService reviewEnforcementService,
            ReliabilityScoreService reliabilityScoreService,
            BadgeEvaluationService badgeEvaluationService,
            @Value("${tasky.wallet.platform-fee-basis-points:1500}") int platformFeeBasisPoints) {
        this.walletService = walletService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.reviewEnforcementService = reviewEnforcementService;
        this.reliabilityScoreService = reliabilityScoreService;
        this.badgeEvaluationService = badgeEvaluationService;
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

        walletService.creditTaskCompletion(taskerId, bookingId, price, platformFeeBasisPoints);
        notificationService.sendPushWithEventKey(
                taskerId,
                "Job Complete",
                "The customer has marked the job as complete.",
                "JOB_COMPLETED",
                "BOOKING_COMPLETED_" + bookingId);

        analyticsService.track(
                AnalyticsService.EVENT_BOOKING_COMPLETED,
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                AnalyticsService.PROPERTY_BOOKING_ID,
                                bookingId,
                                AnalyticsService.PROPERTY_TASK_ID,
                                taskId,
                                "tasker_id",
                                taskerId)));

        reviewEnforcementService.createCasesForBooking(bookingId, customerId, taskerId);
        reliabilityScoreService.recompute(taskerId);
        badgeEvaluationService.evaluate(taskerId);

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
