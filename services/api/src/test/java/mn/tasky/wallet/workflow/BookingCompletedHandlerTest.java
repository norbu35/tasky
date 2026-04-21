package mn.tasky.wallet.workflow;

import static org.mockito.ArgumentMatchers.*;
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
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BookingCompletedHandlerTest {

    private static final String EVENT_ID = UUID.randomUUID().toString();
    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final int PRICE = 5000;

    private WorkflowIdempotencyGuard idempotencyGuard;
    private WalletCommandPort walletCommandPort;
    private NotificationCommandPort notificationCommandPort;
    private AnalyticsCommandPort analyticsCommandPort;
    private TrustCommandPort trustCommandPort;
    private IdentityCommandPort identityCommandPort;
    private BookingCompletedHandler handler;

    @BeforeEach
    void setUp() {
        walletCommandPort = mock(WalletCommandPort.class);
        notificationCommandPort = mock(NotificationCommandPort.class);
        analyticsCommandPort = mock(AnalyticsCommandPort.class);
        trustCommandPort = mock(TrustCommandPort.class);
        identityCommandPort = mock(IdentityCommandPort.class);
        idempotencyGuard = mock(WorkflowIdempotencyGuard.class);

        handler = new BookingCompletedHandler(
                walletCommandPort,
                notificationCommandPort,
                analyticsCommandPort,
                trustCommandPort,
                identityCommandPort,
                1500);
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
                .eventType(AutomationEventTypes.BOOKING_COMPLETED)
                .aggregateType("booking")
                .aggregateId(BOOKING_ID)
                .payload(Map.of(
                        "booking_id", BOOKING_ID,
                        "task_id", TASK_ID,
                        "customer_id", CUSTOMER_ID,
                        "tasker_id", TASKER_ID,
                        "price", PRICE))
                .correlationId(UUID.randomUUID().toString())
                .traceId(UUID.randomUUID().toString())
                .occurredAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("IDEM-006: Booking completed first delivery executes all side effects")
    void firstDeliveryExecutesAllSideEffects() {
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true);

        handler.handle(envelope());

        verify(walletCommandPort).creditTaskCompletion(TASKER_ID, BOOKING_ID, PRICE, 1500);
        verify(notificationCommandPort)
                .sendPushWithEventKey(eq(TASKER_ID), anyString(), anyString(), anyString(), anyString());
        verify(analyticsCommandPort).track(anyString(), eq(CUSTOMER_ID), anyMap());
        verify(trustCommandPort).createReviewEnforcementCases(BOOKING_ID, CUSTOMER_ID, TASKER_ID);
        verify(identityCommandPort).recomputeReliabilityScore(TASKER_ID);
        verify(identityCommandPort).evaluateBadges(TASKER_ID);
        verify(idempotencyGuard).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-007: Booking completed duplicate delivery does not duplicate wallet credit")
    void duplicateDeliveryDoesNotDuplicateWalletCredit() {
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true).thenReturn(false);

        AutomationEventEnvelope env = envelope();
        handler.handle(env);
        handler.handle(env);

        verify(walletCommandPort, times(1)).creditTaskCompletion(anyString(), anyString(), anyInt(), anyInt());
        verify(notificationCommandPort, times(1))
                .sendPushWithEventKey(anyString(), anyString(), anyString(), anyString(), anyString());
        verify(trustCommandPort, times(1)).createReviewEnforcementCases(anyString(), anyString(), anyString());
        verify(identityCommandPort, times(1)).recomputeReliabilityScore(anyString());
        verify(identityCommandPort, times(1)).evaluateBadges(anyString());
        verify(idempotencyGuard, times(1)).complete(EVENT_ID);
    }
}
