package mn.tasky.analytics;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.dao.AnalyticsEventDao;
import mn.tasky.common.outbox.DomainEventOutboxProcessor;
import mn.tasky.common.outbox.OutboxEvent;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.wallet.application.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Domain-unit tests for analytics event emission scenarios.
 * Covers: SCN-ANALYTICS-001, SCN-ANALYTICS-002, SCN-ANALYTICS-003.
 *
 * <p>SCN-ANALYTICS-001 verifies TASK_POSTED events via AnalyticsService directly.
 * SCN-ANALYTICS-002/003 verify BOOKING_CONFIRMED/BOOKING_COMPLETED events emitted
 * by the DomainEventOutboxProcessor when processing outbox events.
 */
class AnalyticsScenarioTests {

    private AnalyticsEventDao analyticsEventDao;
    private AnalyticsService analyticsService;
    private ObjectMapper objectMapper;

    // DomainEventOutboxProcessor dependencies
    private MessagingService messagingService;
    private NotificationService notificationService;
    private WalletService walletService;
    private ReviewEnforcementService reviewEnforcementService;
    private ReliabilityScoreService reliabilityScoreService;
    private BadgeEvaluationService badgeEvaluationService;

    @BeforeEach
    void setUp() {
        analyticsEventDao = mock(AnalyticsEventDao.class);
        objectMapper = new ObjectMapper();
        analyticsService = new AnalyticsService(analyticsEventDao, objectMapper);

        messagingService = mock(MessagingService.class);
        notificationService = mock(NotificationService.class);
        walletService = mock(WalletService.class);
        reviewEnforcementService = mock(ReviewEnforcementService.class);
        reliabilityScoreService = mock(ReliabilityScoreService.class);
        badgeEvaluationService = mock(BadgeEvaluationService.class);
    }

    // ── SCN-ANALYTICS-001 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001: Task posted event is emitted when a customer creates a task")
    void taskPostedEventEmittedWithRequiredProperties() {
        String customerId = "customer-1";
        String taskId = "task-123";
        String categoryId = "cat-456";

        analyticsService.track(
                AnalyticsService.EVENT_TASK_POSTED,
                customerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID, taskId,
                        "category_id", categoryId));

        // Verify that the event was persisted to the DAO with the correct event name
        ArgumentCaptor<String> nameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> propsCaptor = ArgumentCaptor.forClass(String.class);
        verify(analyticsEventDao).insert(anyString(), nameCaptor.capture(), eq(customerId),
                propsCaptor.capture(), any());

        assertThat(nameCaptor.getValue()).isEqualTo("TASK_POSTED");

        // Verify the properties contain the required fields
        String propsJson = propsCaptor.getValue();
        assertThat(propsJson).contains("\"task_id\"");
        assertThat(propsJson).contains("\"" + taskId + "\"");
        assertThat(propsJson).contains("\"category_id\"");
        assertThat(propsJson).contains("\"" + categoryId + "\"");
        // AnalyticsService enriches with locale and platform
        assertThat(propsJson).contains("\"locale\"");
        assertThat(propsJson).contains("\"platform\"");
    }

    // ── SCN-ANALYTICS-002 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-002: Booking confirmed event is emitted when an application is accepted")
    void bookingConfirmedEventEmittedOnApplicationAccepted() throws Exception {
        // The BOOKING_CONFIRMED analytics event is emitted by the
        // DomainEventOutboxProcessor when handling a TASK_APPLICATION_ACCEPTED event.
        // Set up a spy analytics service to verify the track call.
        AnalyticsService spyAnalytics = mock(AnalyticsService.class);

        // MessagingService.startConversation returns a conversation ID
        org.mockito.Mockito.when(messagingService.startConversation(anyString(), anyString(), anyString()))
                .thenReturn("conv-123");

        DomainEventOutboxProcessor processor = new DomainEventOutboxProcessor(
                mock(mn.tasky.common.outbox.OutboxEventDao.class),
                objectMapper,
                messagingService,
                notificationService,
                spyAnalytics,
                walletService,
                reviewEnforcementService,
                reliabilityScoreService,
                badgeEvaluationService,
                25, 15, 60, 1500);

        // Build a TASK_APPLICATION_ACCEPTED outbox event payload
        Map<String, Object> payload = Map.of(
                "task_id", "task-1",
                "booking_id", "booking-1",
                "customer_id", "customer-1",
                "tasker_id", "tasker-1",
                "application_id", "app-1");
        String payloadJson = objectMapper.writeValueAsString(payload);

        OutboxEvent event = new OutboxEvent(
                java.util.UUID.randomUUID(),
                OutboxEventTypes.TASK_APPLICATION_ACCEPTED,
                "TASK_APPLICATION",
                java.util.UUID.randomUUID(),
                payloadJson,
                "PROCESSING",
                1,
                null,
                java.time.Instant.now(),
                java.time.Instant.now(),
                null);

        // Invoke dispatch via reflection since it's private — or we test through processBatch
        // Instead, use reflection to call the private dispatch method
        java.lang.reflect.Method dispatch = DomainEventOutboxProcessor.class
                .getDeclaredMethod("dispatch", OutboxEvent.class);
        dispatch.setAccessible(true);
        dispatch.invoke(processor, event);

        // Verify BOOKING_CONFIRMED analytics event was tracked
        ArgumentCaptor<String> eventNameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map> propsCaptor = ArgumentCaptor.forClass(Map.class);
        // The processor calls track twice: once for TASKER_ACCEPTED, once for BOOKING_CONFIRMED
        verify(spyAnalytics, org.mockito.Mockito.atLeast(2))
                .track(eventNameCaptor.capture(), anyString(), propsCaptor.capture());

        assertThat(eventNameCaptor.getAllValues()).contains(AnalyticsService.EVENT_BOOKING_CONFIRMED);

        // Find the BOOKING_CONFIRMED call and verify its properties
        int idx = eventNameCaptor.getAllValues().indexOf(AnalyticsService.EVENT_BOOKING_CONFIRMED);
        @SuppressWarnings("unchecked")
        Map<String, Object> confirmedProps = propsCaptor.getAllValues().get(idx);
        assertThat(confirmedProps).containsKey("booking_id");
        assertThat(confirmedProps).containsKey("task_id");
    }

    // ── SCN-ANALYTICS-003 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-003: Booking completed event is emitted when a booking transitions to COMPLETED")
    void bookingCompletedEventEmittedOnTransition() throws Exception {
        AnalyticsService spyAnalytics = mock(AnalyticsService.class);

        DomainEventOutboxProcessor processor = new DomainEventOutboxProcessor(
                mock(mn.tasky.common.outbox.OutboxEventDao.class),
                objectMapper,
                messagingService,
                notificationService,
                spyAnalytics,
                walletService,
                reviewEnforcementService,
                reliabilityScoreService,
                badgeEvaluationService,
                25, 15, 60, 1500);

        // Build a BOOKING_COMPLETED outbox event payload
        Map<String, Object> payload = Map.of(
                "booking_id", "booking-2",
                "task_id", "task-2",
                "customer_id", "customer-2",
                "tasker_id", "tasker-2",
                "price", 75000);
        String payloadJson = objectMapper.writeValueAsString(payload);

        OutboxEvent event = new OutboxEvent(
                java.util.UUID.randomUUID(),
                OutboxEventTypes.BOOKING_COMPLETED,
                "BOOKING",
                java.util.UUID.randomUUID(),
                payloadJson,
                "PROCESSING",
                1,
                null,
                java.time.Instant.now(),
                java.time.Instant.now(),
                null);

        java.lang.reflect.Method dispatch = DomainEventOutboxProcessor.class
                .getDeclaredMethod("dispatch", OutboxEvent.class);
        dispatch.setAccessible(true);
        dispatch.invoke(processor, event);

        // Verify BOOKING_COMPLETED analytics event was tracked
        ArgumentCaptor<String> eventNameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map> propsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(spyAnalytics).track(eventNameCaptor.capture(), anyString(), propsCaptor.capture());

        assertThat(eventNameCaptor.getValue()).isEqualTo(AnalyticsService.EVENT_BOOKING_COMPLETED);

        @SuppressWarnings("unchecked")
        Map<String, Object> completedProps = propsCaptor.getValue();
        assertThat(completedProps).containsKey("booking_id");
        assertThat(completedProps).containsKey("task_id");
        assertThat(completedProps).containsEntry("tasker_id", "tasker-2");
    }
}
