package mn.tasky.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.application.command.AnalyticsCommandHandler;
import mn.tasky.analytics.dao.AnalyticsEventDao;
import mn.tasky.analytics.dto.Event;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.messaging.workflow.TaskApplicationAcceptedHandler;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.workflow.BookingCompletedHandler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

@SuppressWarnings("PMD.SingularField")
@ExtendWith(MockitoExtension.class)
class AnalyticsScenarioTests {

    @Mock
    private AnalyticsEventDao analyticsEventDao;

    @Mock
    private MessagingCommandPort messagingCommandPort;

    @Mock
    private NotificationCommandPort notificationCommandPort;

    @Mock
    private WalletCommandPort walletCommandPort;

    @Mock
    private TrustCommandPort trustCommandPort;

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Captor
    private ArgumentCaptor<String> eventNameCaptor;

    @Captor
    private ArgumentCaptor<String> propsCaptor;

    private AnalyticsService analyticsService;
    private AnalyticsCommandPort analyticsCommandPort;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        analyticsService = new AnalyticsService(analyticsEventDao, objectMapper);
        analyticsCommandPort = new AnalyticsCommandHandler(analyticsService);
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    private Map<String, Object> parseProps(String json) throws Exception {
        return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
    }

    // ── SCN-ANALYTICS-001 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001: Task posted event is emitted when a customer creates a task")
    void taskPostedEventEmittedWithRequiredProperties() throws Exception {
        String customerId = "customer-1";
        String taskId = "task-123";
        String categoryId = "cat-456";

        analyticsService.track(
                AnalyticsService.EVENT_TASK_POSTED,
                customerId,
                Map.of(AnalyticsService.PROPERTY_TASK_ID, taskId, "category_id", categoryId));

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq(customerId),
                        propsCaptor.capture(),
                        any(Instant.class));

        assertThat(eventNameCaptor.getValue()).isEqualTo("TASK_POSTED");

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("task_id", taskId));
        assertThat(props).contains(entry("category_id", categoryId));
        assertThat(props).contains(entry("locale", "mn"));
        assertThat(props).contains(entry("platform", "UNKNOWN"));
        assertThat(props).doesNotContainKey("correlation_id");
    }

    // ── SCN-ANALYTICS-002 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-002: Booking confirmed event is emitted when selected tasker accepts")
    void bookingConfirmedEventEmittedWhenSelectedTaskerAccepts() throws Exception {
        when(messagingCommandPort.startConversation(anyString(), anyString(), anyString()))
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

        verify(analyticsEventDao, atLeast(2))
                .insert(anyString(), eventNameCaptor.capture(), anyString(), propsCaptor.capture(), any(Instant.class));

        List<String> eventNames = eventNameCaptor.getAllValues();
        List<String> propsValues = propsCaptor.getAllValues();

        assertThat(eventNames).contains(AnalyticsService.EVENT_BOOKING_CONFIRMED);
        assertThat(eventNames).contains(AnalyticsService.EVENT_TASKER_ACCEPTED);

        // Verify TASKER_ACCEPTED event properties
        int taskerAcceptedIndex = eventNames.indexOf(AnalyticsService.EVENT_TASKER_ACCEPTED);
        Map<String, Object> acceptedProps = parseProps(propsValues.get(taskerAcceptedIndex));
        assertThat(acceptedProps).contains(entry("task_id", "task-1"));
        assertThat(acceptedProps).contains(entry("booking_id", "booking-1"));
        assertThat(acceptedProps).contains(entry("tasker_id", "tasker-1"));
        assertThat(acceptedProps).contains(entry("application_id", "app-1"));
        assertThat(acceptedProps).contains(entry("conversation_id", "conv-123"));
        assertThat(acceptedProps).contains(entry(AnalyticsService.PROPERTY_CORRELATION_ID, "corr-1"));
        assertThat(acceptedProps).contains(entry(AnalyticsService.PROPERTY_LOCALE, "mn"));
        assertThat(acceptedProps).contains(entry(AnalyticsService.PROPERTY_PLATFORM, "WEB"));

        // Verify BOOKING_CONFIRMED event properties
        int bookingConfirmedIndex = eventNames.indexOf(AnalyticsService.EVENT_BOOKING_CONFIRMED);
        Map<String, Object> confirmedProps = parseProps(propsValues.get(bookingConfirmedIndex));
        assertThat(confirmedProps).contains(entry("task_id", "task-1"));
        assertThat(confirmedProps).contains(entry("booking_id", "booking-1"));
        assertThat(confirmedProps).contains(entry("tasker_id", "tasker-1"));
        assertThat(confirmedProps).contains(entry("application_id", "app-1"));
        assertThat(confirmedProps).contains(entry(AnalyticsService.PROPERTY_CORRELATION_ID, "corr-1"));
        assertThat(confirmedProps).contains(entry(AnalyticsService.PROPERTY_LOCALE, "mn"));
        assertThat(confirmedProps).contains(entry(AnalyticsService.PROPERTY_PLATFORM, "WEB"));
        assertThat(confirmedProps).doesNotContainKey("conversation_id");
    }

    // ── SCN-ANALYTICS-003 ───────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-003: Booking completed event is emitted when a booking transitions to COMPLETED")
    void bookingCompletedEventEmittedOnTransition() throws Exception {
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

        verify(analyticsEventDao)
                .insert(anyString(), eventNameCaptor.capture(), anyString(), propsCaptor.capture(), any(Instant.class));

        assertThat(eventNameCaptor.getValue()).isEqualTo(AnalyticsService.EVENT_BOOKING_COMPLETED);

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("booking_id", "booking-2"));
        assertThat(props).contains(entry("task_id", "task-2"));
        assertThat(props).contains(entry("tasker_id", "tasker-2"));
        assertThat(props).contains(entry(AnalyticsService.PROPERTY_CORRELATION_ID, "corr-2"));
        assertThat(props).contains(entry(AnalyticsService.PROPERTY_LOCALE, "mn"));
        assertThat(props).contains(entry(AnalyticsService.PROPERTY_PLATFORM, "ANDROID"));
    }

    // ── Branch coverage: MDC enrichment ─────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: track() enriches with MDC correlation_id, locale, platform when present")
    void trackEnrichesWithMdcValues() throws Exception {
        MDC.put(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY, "corr-mdc-1");
        MDC.put(RequestObservabilityFilter.LOCALE_MDC_KEY, "en");
        MDC.put(RequestObservabilityFilter.PLATFORM_MDC_KEY, "ios");

        analyticsService.track("TEST_EVENT", "user-1", Map.of("key1", "value1"));

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-1"),
                        propsCaptor.capture(),
                        any(Instant.class));

        assertThat(eventNameCaptor.getValue()).isEqualTo("TEST_EVENT");

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("key1", "value1"));
        assertThat(props).contains(entry("correlation_id", "corr-mdc-1"));
        assertThat(props).contains(entry("locale", "en"));
        assertThat(props).contains(entry("platform", "IOS"));
    }

    @Test
    @DisplayName(
            "SCN-ANALYTICS-001 branch: track() defaults locale to 'mn' and platform to 'UNKNOWN' when MDC is empty")
    void trackDefaultsLocaleAndPlatformWhenMdcMissing() throws Exception {
        analyticsService.track("TEST_EVENT", "user-1", Map.of("key1", "value1"));

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-1"),
                        propsCaptor.capture(),
                        any(Instant.class));

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("locale", "mn"));
        assertThat(props).contains(entry("platform", "UNKNOWN"));
        assertThat(props).doesNotContainKey("correlation_id");
    }

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: track() uppercases platform from MDC")
    void trackUppercasesPlatformFromMdc() throws Exception {
        MDC.put(RequestObservabilityFilter.PLATFORM_MDC_KEY, "android");

        analyticsService.track("TEST_EVENT", "user-2", Map.of());

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-2"),
                        propsCaptor.capture(),
                        any(Instant.class));

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("platform", "ANDROID"));
    }

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: track() handles null properties and enriches with defaults")
    void trackHandlesNullProperties() throws Exception {
        MDC.put(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY, "corr-null");

        analyticsService.track("NULL_PROPS_EVENT", "user-3", null);

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-3"),
                        propsCaptor.capture(),
                        any(Instant.class));

        assertThat(eventNameCaptor.getValue()).isEqualTo("NULL_PROPS_EVENT");

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("correlation_id", "corr-null"));
        assertThat(props).contains(entry("locale", "mn"));
        assertThat(props).contains(entry("platform", "UNKNOWN"));
    }

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: track() does not overwrite existing properties with MDC defaults")
    void trackDoesNotOverwriteExistingPropertiesWithMdc() throws Exception {
        MDC.put(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY, "corr-mdc");
        MDC.put(RequestObservabilityFilter.LOCALE_MDC_KEY, "en");
        MDC.put(RequestObservabilityFilter.PLATFORM_MDC_KEY, "android");

        analyticsService.track(
                "TEST_EVENT",
                "user-1",
                Map.of(
                        "correlation_id", "existing-corr",
                        "locale", "existing-locale",
                        "platform", "existing-platform"));

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-1"),
                        propsCaptor.capture(),
                        any(Instant.class));

        Map<String, Object> props = parseProps(propsCaptor.getValue());
        assertThat(props).contains(entry("correlation_id", "existing-corr"));
        assertThat(props).contains(entry("locale", "existing-locale"));
        assertThat(props).contains(entry("platform", "existing-platform"));
    }

    // ── Branch coverage: getEvents() delegation ─────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: getEvents() delegates to DAO and returns all events")
    void getEventsDelegatesToDao() {
        Event event1 = new Event("id-1", "TASK_POSTED", "user-1", Map.of(), Instant.now());
        Event event2 = new Event("id-2", "BOOKING_COMPLETED", "user-2", Map.of(), Instant.now());
        when(analyticsEventDao.findAll()).thenReturn(List.of(event1, event2));

        List<Event> result = analyticsService.getEvents();

        assertThat(result).containsExactly(event1, event2);
    }

    // ── Branch coverage: JSON serialization fallback ────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: track() falls back to empty JSON when serialization fails")
    void trackFallsBackToEmptyJsonOnSerializationError() throws Exception {
        ObjectMapper failingMapper = mock(ObjectMapper.class);
        when(failingMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("test error") {});

        AnalyticsService service = new AnalyticsService(analyticsEventDao, failingMapper);

        service.track("FAIL_EVENT", "user-1", Map.of("key", "value"));

        verify(analyticsEventDao)
                .insert(
                        anyString(),
                        eventNameCaptor.capture(),
                        eq("user-1"),
                        propsCaptor.capture(),
                        any(Instant.class));

        assertThat(propsCaptor.getValue()).isEqualTo("{}");
    }

    // ── Branch coverage: sanitizeForLog ─────────────────────────────────────

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: sanitizeForLog replaces CRLF with underscores in log output")
    void sanitizeForLogReplacesCrlfInLogOutput() {
        Logger logger = (Logger) LoggerFactory.getLogger(AnalyticsService.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);

        try {
            analyticsService.track("EVENT\r\nNAME", "user\rId", Map.of());

            List<ILoggingEvent> logEvents = listAppender.list;
            assertThat(logEvents).hasSize(1);
            String formattedMessage = logEvents.get(0).getFormattedMessage();
            assertThat(formattedMessage).contains("EVENT__NAME");
            assertThat(formattedMessage).contains("user_Id");
            assertThat(formattedMessage).doesNotContain("\r");
            assertThat(formattedMessage).doesNotContain("\n");
        } finally {
            logger.detachAppender(listAppender);
        }
    }

    @Test
    @DisplayName("SCN-ANALYTICS-001 branch: sanitizeForLog handles null values in log output")
    void sanitizeForLogHandlesNullValues() {
        Logger logger = (Logger) LoggerFactory.getLogger(AnalyticsService.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);

        try {
            analyticsService.track("NULL_USER_EVENT", null, Map.of());

            List<ILoggingEvent> logEvents = listAppender.list;
            assertThat(logEvents).hasSize(1);
            String formattedMessage = logEvents.get(0).getFormattedMessage();
            assertThat(formattedMessage).contains("user=null");
        } finally {
            logger.detachAppender(listAppender);
        }
    }

    // SCN-ANALYTICS-004 is an IMPLEMENTATION GAP: TaskApplicationService.applyToTask()
    // tracks APPLICATION_SUBMITTED, not QUALIFIED_APPLICATION. The scenario requires an
    // event with {task_id, tasker_id, category_id, pricing_mode}. Deferred to implementation work.

    // SCN-ANALYTICS-005 is an IMPLEMENTATION GAP: RescueScheduler creates TaskRescueEvent
    // but does NOT call AnalyticsService.track(). Deferred to implementation work.
}
