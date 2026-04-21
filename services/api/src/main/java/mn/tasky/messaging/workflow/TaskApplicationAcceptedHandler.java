package mn.tasky.messaging.workflow;

import java.util.Map;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.automation.worker.AbstractEventHandler;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class TaskApplicationAcceptedHandler extends AbstractEventHandler {

    private static final Logger log = LoggerFactory.getLogger(TaskApplicationAcceptedHandler.class);

    private final MessagingCommandPort messagingCommandPort;
    private final NotificationCommandPort notificationCommandPort;
    private final AnalyticsCommandPort analyticsCommandPort;

    public TaskApplicationAcceptedHandler(
            MessagingCommandPort messagingCommandPort,
            NotificationCommandPort notificationCommandPort,
            AnalyticsCommandPort analyticsCommandPort) {
        this.messagingCommandPort = messagingCommandPort;
        this.notificationCommandPort = notificationCommandPort;
        this.analyticsCommandPort = analyticsCommandPort;
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

        String conversationId = messagingCommandPort.startConversation(taskId, taskerId, customerId);
        notificationCommandPort.sendPushWithEventKey(
                taskerId, "You are hired!", "Your application has been accepted.", "HIRED", "HIRED_" + bookingId);

        analyticsCommandPort.track(
                "TASKER_ACCEPTED",
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                "task_id",
                                taskId,
                                "booking_id",
                                bookingId,
                                "tasker_id",
                                taskerId,
                                "application_id",
                                applicationId,
                                "conversation_id",
                                conversationId)));
        analyticsCommandPort.track(
                "BOOKING_CONFIRMED",
                customerId,
                withObservability(
                        payload,
                        Map.of(
                                "task_id",
                                taskId,
                                "booking_id",
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
