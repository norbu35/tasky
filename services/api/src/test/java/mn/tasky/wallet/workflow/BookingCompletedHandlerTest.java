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
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.automation.event.AutomationEventTypes;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.wallet.application.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests duplicate event delivery idempotency for BookingCompletedHandler.
 * Critical: wallet credit must not be duplicated.
 */
class BookingCompletedHandlerTest {

    private static final String EVENT_ID = UUID.randomUUID().toString();
    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final int PRICE = 5000;

    private WorkflowIdempotencyGuard idempotencyGuard;
    private WalletService walletService;
    private NotificationService notificationService;
    private AnalyticsService analyticsService;
    private ReviewEnforcementService reviewEnforcementService;
    private ReliabilityScoreService reliabilityScoreService;
    private BadgeEvaluationService badgeEvaluationService;
    private BookingCompletedHandler handler;

    @BeforeEach
    void setUp() {
        walletService = mock(WalletService.class);
        notificationService = mock(NotificationService.class);
        analyticsService = mock(AnalyticsService.class);
        reviewEnforcementService = mock(ReviewEnforcementService.class);
        reliabilityScoreService = mock(ReliabilityScoreService.class);
        badgeEvaluationService = mock(BadgeEvaluationService.class);
        idempotencyGuard = mock(WorkflowIdempotencyGuard.class);

        handler = new BookingCompletedHandler(
                walletService,
                notificationService,
                analyticsService,
                reviewEnforcementService,
                reliabilityScoreService,
                badgeEvaluationService,
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

        verify(walletService).creditTaskCompletion(TASKER_ID, BOOKING_ID, PRICE, 1500);
        verify(notificationService)
                .sendPushWithEventKey(eq(TASKER_ID), anyString(), anyString(), anyString(), anyString());
        verify(analyticsService).track(anyString(), eq(CUSTOMER_ID), anyMap());
        verify(reviewEnforcementService).createCasesForBooking(BOOKING_ID, CUSTOMER_ID, TASKER_ID);
        verify(reliabilityScoreService).recompute(TASKER_ID);
        verify(badgeEvaluationService).evaluate(TASKER_ID);
        verify(idempotencyGuard).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-007: Booking completed duplicate delivery does not duplicate wallet credit")
    void duplicateDeliveryDoesNotDuplicateWalletCredit() {
        when(idempotencyGuard.claim(anyString(), anyString()))
                .thenReturn(true) // first delivery
                .thenReturn(false); // duplicate

        AutomationEventEnvelope env = envelope();
        handler.handle(env);
        handler.handle(env); // duplicate

        verify(walletService, times(1)).creditTaskCompletion(anyString(), anyString(), anyInt(), anyInt());
        verify(notificationService, times(1))
                .sendPushWithEventKey(anyString(), anyString(), anyString(), anyString(), anyString());
        verify(reviewEnforcementService, times(1)).createCasesForBooking(anyString(), anyString(), anyString());
        verify(reliabilityScoreService, times(1)).recompute(anyString());
        verify(badgeEvaluationService, times(1)).evaluate(anyString());
        verify(idempotencyGuard, times(1)).complete(EVENT_ID);
    }

    @Test
    @DisplayName("IDEM-008: IN_PROGRESS event retry after partial failure re-executes all side effects")
    void inProgressRetryReExecutesAllSideEffects() {
        // Simulate: first attempt crashed after partial side effects.
        // claim() returns true for IN_PROGRESS (allow retry).
        // The handler should execute fully again.
        when(idempotencyGuard.claim(anyString(), anyString())).thenReturn(true);

        handler.handle(envelope());

        // All side effects executed
        verify(walletService).creditTaskCompletion(TASKER_ID, BOOKING_ID, PRICE, 1500);
        verify(notificationService)
                .sendPushWithEventKey(eq(TASKER_ID), anyString(), anyString(), anyString(), anyString());
        verify(reviewEnforcementService).createCasesForBooking(BOOKING_ID, CUSTOMER_ID, TASKER_ID);
        verify(reliabilityScoreService).recompute(TASKER_ID);
        verify(badgeEvaluationService).evaluate(TASKER_ID);
        verify(idempotencyGuard).complete(EVENT_ID);
    }
}
