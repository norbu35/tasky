package mn.tasky.messaging.workflow;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.common.i18n.BackendMessageResolver;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticMessageSource;

class TaskApplicationAcceptedHandlerTest {

    private static final String EVENT_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String APPLICATION_ID = UUID.randomUUID().toString();

    private WorkflowIdempotencyGuard idempotencyGuard;
    private MessagingCommandPort messagingCommandPort;
    private NotificationCommandPort notificationCommandPort;
    private AnalyticsCommandPort analyticsCommandPort;
    private TaskApplicationAcceptedHandler handler;

    @BeforeEach
    void setUp() {
        messagingCommandPort = mock(MessagingCommandPort.class);
        notificationCommandPort = mock(NotificationCommandPort.class);
        analyticsCommandPort = mock(AnalyticsCommandPort.class);
        idempotencyGuard = mock(WorkflowIdempotencyGuard.class);

        when(messagingCommandPort.startConversation(anyString(), anyString(), anyString()))
                .thenReturn(UUID.randomUUID().toString());

        handler = new TaskApplicationAcceptedHandler(
                messagingCommandPort,
                notificationCommandPort,
                analyticsCommandPort,
                new BackendMessageResolver(new StaticMessageSource()));
        setField(handler, "idempotencyGuard", idempotencyGuard);
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
            field.setAccessible(true); // NOPMD AvoidAccessibilityAlteration
            field.set(target, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    private AutomationEventEnvelope envelope() {
        return AutomationEventEnvelope.builder()
                .eventId(EVENT_ID)
                .eventType(AutomationEventTypes.TASK_APPLICATION_ACCEPTED)
                .aggregateType("task")
                .aggregateId(TASK_ID)
                .payload(Map.of(
                        "task_id", TASK_ID,
                        "booking_id", BOOKING_ID,
                        "customer_id", CUSTOMER_ID,
                        "tasker_id", TASKER_ID,
                        "application_id", APPLICATION_ID))
                .correlationId(UUID.randomUUID().toString())
                .traceId(UUID.randomUUID().toString())
                .occurredAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("IDEM-001: First event delivery executes all side effects")
    void firstEventDeliveryExecutesAllSideEffects() {
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true);

        handler.handle(envelope());

        verify(messagingCommandPort).startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);
        verify(notificationCommandPort)
                .sendPushWithEventKey(eq(TASKER_ID), anyString(), anyString(), anyString(), anyString());
        verify(analyticsCommandPort, atLeastOnce()).track(anyString(), eq(CUSTOMER_ID), anyMap());
        verify(idempotencyGuard).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-002: Duplicate event delivery does not duplicate side effects")
    void duplicateEventDeliveryDoesNotDuplicateSideEffects() {
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true).thenReturn(false);

        AutomationEventEnvelope env = envelope();
        handler.handle(env);
        handler.handle(env);

        verify(messagingCommandPort, times(1)).startConversation(anyString(), anyString(), anyString());
        verify(notificationCommandPort, times(1))
                .sendPushWithEventKey(anyString(), anyString(), anyString(), anyString(), anyString());
        verify(idempotencyGuard, times(1)).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-003: Different events (different eventId) execute independently")
    void differentEventsExecuteIndependently() {
        String eventId2 = UUID.randomUUID().toString();

        when(idempotencyGuard.claim(eq(AutomationEventTypes.TASK_APPLICATION_ACCEPTED), eq(EVENT_ID)))
                .thenReturn(true);
        when(idempotencyGuard.claim(eq(AutomationEventTypes.TASK_APPLICATION_ACCEPTED), eq(eventId2)))
                .thenReturn(true);

        handler.handle(envelope());

        AutomationEventEnvelope envelope2 = AutomationEventEnvelope.builder()
                .eventId(eventId2)
                .eventType(AutomationEventTypes.TASK_APPLICATION_ACCEPTED)
                .aggregateType("task")
                .aggregateId(TASK_ID)
                .payload(Map.of(
                        "task_id", TASK_ID,
                        "booking_id", BOOKING_ID,
                        "customer_id", CUSTOMER_ID,
                        "tasker_id", TASKER_ID,
                        "application_id", UUID.randomUUID().toString()))
                .correlationId(UUID.randomUUID().toString())
                .traceId(UUID.randomUUID().toString())
                .occurredAt(Instant.now())
                .build();
        handler.handle(envelope2);

        verify(messagingCommandPort, times(2)).startConversation(anyString(), anyString(), anyString());
    }
}
