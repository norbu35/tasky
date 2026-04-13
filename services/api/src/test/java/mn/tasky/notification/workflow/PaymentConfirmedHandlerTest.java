package mn.tasky.notification.workflow;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import mn.tasky.notification.application.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests duplicate event delivery idempotency for PaymentConfirmedHandler.
 */
class PaymentConfirmedHandlerTest {

    private static final String EVENT_ID = UUID.randomUUID().toString();
    private static final String PAYMENT_ID = UUID.randomUUID().toString();
    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();

    private WorkflowIdempotencyGuard idempotencyGuard;
    private NotificationService notificationService;
    private AnalyticsService analyticsService;
    private PaymentConfirmedHandler handler;

    @BeforeEach
    void setUp() {
        notificationService = mock(NotificationService.class);
        analyticsService = mock(AnalyticsService.class);
        idempotencyGuard = mock(WorkflowIdempotencyGuard.class);

        handler = new PaymentConfirmedHandler(notificationService, analyticsService);
        setField(handler, "idempotencyGuard", idempotencyGuard);
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    private AutomationEventEnvelope envelope() {
        return AutomationEventEnvelope.builder()
                .eventId(EVENT_ID)
                .eventType(AutomationEventTypes.PAYMENT_CONFIRMED)
                .aggregateType("payment")
                .aggregateId(PAYMENT_ID)
                .payload(Map.of(
                        "payment_id", PAYMENT_ID,
                        "booking_id", BOOKING_ID,
                        "task_id", TASK_ID,
                        "customer_id", CUSTOMER_ID,
                        "tasker_id", TASKER_ID))
                .correlationId(UUID.randomUUID().toString())
                .traceId(UUID.randomUUID().toString())
                .occurredAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("IDEM-004: Payment confirmed first delivery sends notifications")
    void firstDeliverySendsNotifications() {
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true);

        handler.handle(envelope());

        verify(notificationService, times(2))
                .sendPushWithEventKey(anyString(), anyString(), anyString(), anyString(), anyString());
        verify(analyticsService).track(anyString(), eq(CUSTOMER_ID), anyMap());
        verify(idempotencyGuard).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-005: Payment confirmed duplicate delivery does not resend notifications")
    void duplicateDeliveryDoesNotResend() {
        when(idempotencyGuard.claim(anyString(), anyString()))
                .thenReturn(true) // first
                .thenReturn(false); // duplicate

        AutomationEventEnvelope env = envelope();
        handler.handle(env);
        handler.handle(env);

        verify(notificationService, times(2))
                .sendPushWithEventKey(anyString(), anyString(), anyString(), anyString(), anyString());
        verify(idempotencyGuard, times(1)).complete(EVENT_ID);
    }
}
