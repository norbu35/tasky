package mn.tasky.messaging.workflow;

import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Handles the TASK_APPLICATION_ACCEPTED event aftermath:
 * starts a conversation between customer and tasker, sends a push notification,
 * and tracks analytics events.
 *
 * Migrated from {@code DomainEventOutboxProcessor.handleTaskApplicationAccepted}.
 * Idempotent: duplicate event delivery will not duplicate side effects.
 */
@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class TaskApplicationAcceptedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(TaskApplicationAcceptedHandler.class);

    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    public TaskApplicationAcceptedHandler(
            MessagingService messagingService,
            NotificationService notificationService,
            AnalyticsService analyticsService) {
        this.messagingService = messagingService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
    }

    @Override
    public String eventType() {
        return AutomationEventTypes.TASK_APPLICATION_ACCEPTED;
    }

    @Override
    public void handle(AutomationEventEnvelope envelope) {
        if (!tryClaimEvent(envelope)) {
            log.info("Skipping duplicate event: eventId={}", envelope.eventId());
            return;
        }

        Map<String, Object> payload = envelope.payload();
        String taskId = requiredString(payload, "task_id");
        String bookingId = requiredString(payload, "booking_id");
        String customerId = requiredString(payload, "customer_id");
        String taskerId = requiredString(payload, "tasker_id");
        String applicationId = requiredString(payload, "application_id");

        String conversationId = messagingService.startConversation(taskId, taskerId, customerId);
        notificationService.sendPushWithEventKey(
                taskerId, "You are hired!", "Your application has been accepted.", "HIRED", "HIRED_" + bookingId);

        analyticsService.track(
                AnalyticsService.EVENT_TASKER_ACCEPTED,
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                AnalyticsService.PROPERTY_TASK_ID,
                                taskId,
                                AnalyticsService.PROPERTY_BOOKING_ID,
                                bookingId,
                                "tasker_id",
                                taskerId,
                                "application_id",
                                applicationId,
                                "conversation_id",
                                conversationId)));
        analyticsService.track(
                AnalyticsService.EVENT_BOOKING_CONFIRMED,
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                AnalyticsService.PROPERTY_TASK_ID,
                                taskId,
                                AnalyticsService.PROPERTY_BOOKING_ID,
                                bookingId,
                                "tasker_id",
                                taskerId,
                                "application_id",
                                applicationId)));

        tryClaimEventComplete(envelope);

        log.info(
                "Task application accepted aftermath completed: taskId={} bookingId={} conversationId={}",
                taskId,
                bookingId,
                conversationId);
    }
}
