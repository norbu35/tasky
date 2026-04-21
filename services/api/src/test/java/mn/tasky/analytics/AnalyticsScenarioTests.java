package mn.tasky.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.application.command.AnalyticsCommandHandler;
import mn.tasky.analytics.dao.AnalyticsEventDao;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.messaging.workflow.TaskApplicationAcceptedHandler;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.workflow.BookingCompletedHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AnalyticsScenarioTests {

    private AnalyticsEventDao analyticsEventDao;
    private AnalyticsService analyticsService;
    private AnalyticsCommandPort analyticsCommandPort;
    private ObjectMapper objectMapper;

    // Workflow handler dependencies
    private MessagingCommandPort messagingCommandPort;
    private NotificationCommandPort notificationCommandPort;
    private WalletCommandPort walletCommandPort;
    private TrustCommandPort trustCommandPort;
    private IdentityCommandPort identityCommandPort;

    @BeforeEach
    void setUp() {
        analyticsEventDao = mock(AnalyticsEventDao.class);
        objectMapper = new ObjectMapper();
        analyticsService = new AnalyticsService(analyticsEventDao, objectMapper);
        analyticsCommandPort = new AnalyticsCommandHandler(analyticsService);

        messagingCommandPort = mock(MessagingCommandPort.class);
        notificationCommandPort = mock(NotificationCommandPort.class);
        walletCommandPort = mock(WalletCommandPort.class);
        trustCommandPort = mock(TrustCommandPort.class);
        identityCommandPort = mock(IdentityCommandPort.class);
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
                Map.of(AnalyticsService.PROPERTY_TASK_ID, taskId, "category_id", categoryId));

        ArgumentCaptor<String> nameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> propsCaptor = ArgumentCaptor.forClass(String.class);
        verify(analyticsEventDao)
                .insert(anyString(), nameCaptor.capture(), eq(customerId), propsCaptor.capture(), any());

        assertThat(nameCaptor.getValue()).isEqualTo("TASK_POSTED");

        String propsJson = propsCaptor.getValue();
        assertThat(propsJson).contains("\"task_id\"");
        assertThat(propsJson).contains("\"" + taskId + "\"");
        assertThat(propsJson).contains("\"category_id\"");
        assertThat(propsJson).contains("\"" + categoryId + "\"");
        assertThat(propsJson).contains("\"locale\"");
        assertThat(propsJson).contains("\"platform\"");
    }

    // ── SCN-ANALYTICS-002 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-002: Booking confirmed event is emitted when an application is accepted")
    void bookingConfirmedEventEmittedOnApplicationAccepted() {
        org.mockito.Mockito.when(messagingCommandPort.startConversation(anyString(), anyString(), anyString()))
                .thenReturn("conv-123");

        TaskApplicationAcceptedHandler handler =
                new TaskApplicationAcceptedHandler(messagingCommandPort, notificationCommandPort, analyticsCommandPort);

        AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("TASK_APPLICATION_ACCEPTED")
                .aggregateType("BOOKING")
                .aggregateId(UUID.randomUUID().toString())
                .payload(Map.of(
                        "task_id",
                        "task-1",
                        "booking_id",
                        "booking-1",
                        "customer_id",
                        "customer-1",
                        "tasker_id",
                        "tasker-1",
                        "application_id",
                        "app-1",
                        AnalyticsService.PROPERTY_CORRELATION_ID,
                        "corr-1",
                        AnalyticsService.PROPERTY_LOCALE,
                        "mn",
                        AnalyticsService.PROPERTY_PLATFORM,
                        "WEB"))
                .correlationId("corr-1")
                .occurredAt(Instant.now())
                .build();

        handler.handle(envelope);

        ArgumentCaptor<String> eventNameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> propsCaptor = ArgumentCaptor.forClass(String.class);
        verify(analyticsEventDao, org.mockito.Mockito.atLeast(2))
                .insert(anyString(), eventNameCaptor.capture(), anyString(), propsCaptor.capture(), any());

        assertThat(eventNameCaptor.getAllValues()).contains(AnalyticsService.EVENT_BOOKING_CONFIRMED);
    }

    // ── SCN-ANALYTICS-003 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-003: Booking completed event is emitted when a booking transitions to COMPLETED")
    void bookingCompletedEventEmittedOnTransition() {
        BookingCompletedHandler handler = new BookingCompletedHandler(
                walletCommandPort,
                notificationCommandPort,
                analyticsCommandPort,
                trustCommandPort,
                identityCommandPort,
                1500);

        AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("BOOKING_COMPLETED")
                .aggregateType("BOOKING")
                .aggregateId(UUID.randomUUID().toString())
                .payload(Map.of(
                        "booking_id",
                        "booking-2",
                        "task_id",
                        "task-2",
                        "customer_id",
                        "customer-2",
                        "tasker_id",
                        "tasker-2",
                        "price",
                        75000,
                        AnalyticsService.PROPERTY_CORRELATION_ID,
                        "corr-2",
                        AnalyticsService.PROPERTY_LOCALE,
                        "mn",
                        AnalyticsService.PROPERTY_PLATFORM,
                        "ANDROID"))
                .correlationId("corr-2")
                .occurredAt(Instant.now())
                .build();

        handler.handle(envelope);

        ArgumentCaptor<String> eventNameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> propsCaptor = ArgumentCaptor.forClass(String.class);
        verify(analyticsEventDao)
                .insert(anyString(), eventNameCaptor.capture(), anyString(), propsCaptor.capture(), any());

        assertThat(eventNameCaptor.getValue()).isEqualTo(AnalyticsService.EVENT_BOOKING_COMPLETED);

        @SuppressWarnings("unchecked")
        String completedProps = propsCaptor.getValue();
        assertThat(completedProps).contains("booking_id");
        assertThat(completedProps).contains("task_id");
        assertThat(completedProps).contains("tasker-2");
    }
}
