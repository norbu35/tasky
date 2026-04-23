package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.application.CompletionTimeoutService;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingCompletionSignal;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskLifecycleService;
import mn.tasky.task.application.TaskQueryService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskSelectResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * Domain-unit tests for booking selection and completion scenarios.
 * Covers SCN-BOOK-007, SCN-BOOK-022 through SCN-BOOK-027.
 *
 * <p>No Spring context. External boundaries and DAOs are mocked via Mockito.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingSelectionScenarioTests {

    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String APP_ID = UUID.randomUUID().toString();
    private static final int BUDGET_PRICE = 50_000;
    private static final int QUOTE_PRICE = 75_000;

    private TaskApplicationDao taskApplicationDao;
    private TaskDao taskDao;
    private BookingCommandPort bookingCommandPort;
    private NotificationService notificationService;
    private TaskApplicationService taskApplicationService;

    private BookingDao bookingDao;
    private BookingCompletionSignalDao completionSignalDao;
    private BookingService bookingService;

    private TaskQueryService taskQueryService;
    private TaskLifecycleService taskLifecycleService;
    private BookingTimelineService bookingTimelineService;
    private BookingLifecycleService bookingLifecycleService;
    private CompletionTimeoutService completionTimeoutService;

    @BeforeEach
    void setUp() {
        taskApplicationDao = mock(TaskApplicationDao.class);
        taskDao = mock(TaskDao.class);
        bookingCommandPort = mock(BookingCommandPort.class);
        notificationService = mock(NotificationService.class);
        AnalyticsService analyticsService = mock(AnalyticsService.class);
        DomainEventOutboxService outboxService = mock(DomainEventOutboxService.class);
        ReviewEnforcementService reviewEnforcementService = mock(ReviewEnforcementService.class);
        UserProfileService userProfileService = mock(UserProfileService.class);

        taskApplicationService = new TaskApplicationService(
                userProfileService,
                bookingCommandPort,
                notificationService,
                analyticsService,
                outboxService,
                reviewEnforcementService,
                taskDao,
                taskApplicationDao);

        bookingDao = mock(BookingDao.class);
        completionSignalDao = mock(BookingCompletionSignalDao.class);
        BookingReliabilityIncidentDao incidentDao = mock(BookingReliabilityIncidentDao.class);

        bookingService = new BookingService(
                mock(UserProfileService.class),
                bookingDao,
                incidentDao,
                completionSignalDao,
                new SimpleMeterRegistry());

        taskQueryService = mock(TaskQueryService.class);
        taskLifecycleService = mock(TaskLifecycleService.class);
        bookingTimelineService = mock(BookingTimelineService.class);
        DomainEventOutboxService lifecycleOutbox = mock(DomainEventOutboxService.class);
        TrustQueryPort trustQueryPort = mock(TrustQueryPort.class);
        ModerationService moderationService = mock(ModerationService.class);

        bookingLifecycleService = new BookingLifecycleService(
                bookingService,
                bookingTimelineService,
                taskQueryService,
                taskLifecycleService,
                moderationService,
                lifecycleOutbox,
                trustQueryPort);

        completionTimeoutService =
                new CompletionTimeoutService(bookingDao, bookingLifecycleService, notificationService);
    }

    // ── SCN-BOOK-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-007: Booking confirmation without liability disclaimer acceptance is rejected")
    void bookingConfirmationWithoutDisclaimerIsRejected() {
        TaskState task = openBudgetTask();
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));

        TaskApplicationState application = appliedApplication();
        when(taskApplicationDao.findById(APP_ID)).thenReturn(Optional.of(application));

        TaskAcceptResult result = taskApplicationService.acceptApplication(CUSTOMER_ID, TASK_ID, APP_ID, false);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.DISCLAIMER_REQUIRED);
        verify(bookingCommandPort, never())
                .createBooking(anyString(), anyString(), anyString(), anyInt(), anyBoolean(), any());
    }

    // ── SCN-BOOK-022 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-022: Customer selects one applicant and booking becomes ASSIGNED")
    void customerSelectsApplicantAndBookingBecomesAssigned() {
        TaskState task = openBudgetTask();
        TaskApplicationState application = appliedApplication();

        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        when(taskApplicationDao.findById(APP_ID)).thenReturn(Optional.of(application));

        Instant selectedAt = Instant.now();
        Instant respondByAt = selectedAt.plusSeconds(4 * 3600);
        TaskApplicationState selectedApp = selectedApplication(selectedAt, respondByAt);

        doAnswer(inv -> {
                    when(taskApplicationDao.findById(APP_ID)).thenReturn(Optional.of(selectedApp));
                    return null;
                })
                .when(taskApplicationDao)
                .updateSelection(eq(APP_ID), eq("SELECTED"), any(Instant.class), any(Instant.class));

        TaskSelectResult selectResult = taskApplicationService.selectApplication(CUSTOMER_ID, TASK_ID, APP_ID);

        assertThat(selectResult.isSuccess()).isTrue();
        assertThat(selectResult.application().status()).isEqualTo("SELECTED");
        verify(taskApplicationDao).updateSelection(eq(APP_ID), eq("SELECTED"), any(Instant.class), any(Instant.class));

        when(taskApplicationDao.findByTaskerAndId(TASKER_ID, APP_ID)).thenReturn(Optional.of(selectedApp));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        BookingState booking = new BookingState(
                UUID.randomUUID().toString(),
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                task.scheduledAt(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
        when(bookingCommandPort.createBooking(TASK_ID, TASKER_ID, CUSTOMER_ID, BUDGET_PRICE, true, task.scheduledAt()))
                .thenReturn(booking);

        TaskAcceptResult acceptResult = taskApplicationService.confirmAcceptance(TASKER_ID, APP_ID);

        assertThat(acceptResult.isSuccess()).isTrue();
        assertThat(acceptResult.booking()).isNotNull();
        assertThat(acceptResult.booking().status()).isEqualTo("ASSIGNED");
        assertThat(acceptResult.booking().taskerId()).isEqualTo(TASKER_ID);
        assertThat(acceptResult.booking().taskId()).isEqualTo(TASK_ID);

        verify(taskApplicationDao).updateStatus(anyString(), eq("ACCEPTED"));
        verify(taskDao).updateStatus(eq(TASK_ID), eq("ASSIGNED"), any(Instant.class));
    }

    // ── SCN-BOOK-023 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-023: Selected tasker does not accept within 4 hours - selection expires")
    void selectedTaskerDoesNotAcceptWithin4HoursSelectionExpires() {
        Instant fourHoursAgo = Instant.now().minusSeconds(4 * 3600 + 1);
        Instant fiveHoursAgo = Instant.now().minusSeconds(5 * 3600);
        TaskApplicationState expiredApp = new TaskApplicationState(
                APP_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "I can help",
                null,
                "SELECTED",
                null,
                null,
                fiveHoursAgo,
                fourHoursAgo,
                fiveHoursAgo);

        when(taskApplicationDao.findSelectedExpired(any(Instant.class), eq(100)))
                .thenReturn(List.of(expiredApp));

        TaskState task = openBudgetTask();
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));

        taskApplicationService.expireStaleSelections();

        verify(taskApplicationDao).updateStatus(APP_ID, "EXPIRED");
        verify(notificationService).sendPush(eq(CUSTOMER_ID), anyString(), anyString(), eq("SELECTION_EXPIRED"));
    }

    // ── SCN-BOOK-024 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-024: Non-selected applications close automatically once one tasker is confirmed")
    void nonSelectedApplicationsCloseAutomatically() {
        TaskState task = openBudgetTask();
        Instant respondByAt = Instant.now().plusSeconds(4 * 3600);
        TaskApplicationState selectedApp = selectedApplication(Instant.now(), respondByAt);

        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(taskApplicationDao.findByTaskerAndId(TASKER_ID, APP_ID)).thenReturn(Optional.of(selectedApp));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        BookingState booking = new BookingState(
                UUID.randomUUID().toString(),
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                task.scheduledAt(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
        when(bookingCommandPort.createBooking(eq(TASK_ID), eq(TASKER_ID), eq(CUSTOMER_ID), anyInt(), eq(true), any()))
                .thenReturn(booking);

        taskApplicationService.confirmAcceptance(TASKER_ID, APP_ID);

        verify(taskApplicationDao).rejectOthers(TASK_ID, APP_ID);
    }

    // ── SCN-BOOK-025 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-025: Booking price is locked at confirmed booking")
    void bookingPriceIsLockedAtConfirmedBooking() {
        TaskState quoteTask = openQuoteTask();
        Instant respondByAt = Instant.now().plusSeconds(4 * 3600);
        TaskApplicationState quoteApp = new TaskApplicationState(
                APP_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "My quote",
                QUOTE_PRICE,
                "SELECTED",
                null,
                null,
                Instant.now(),
                respondByAt,
                Instant.now());

        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(quoteTask));
        when(taskApplicationDao.findByTaskerAndId(TASKER_ID, APP_ID)).thenReturn(Optional.of(quoteApp));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        BookingState quoteBooking = new BookingState(
                UUID.randomUUID().toString(),
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                QUOTE_PRICE,
                "ASSIGNED",
                null,
                true,
                quoteTask.scheduledAt(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
        when(bookingCommandPort.createBooking(
                        eq(TASK_ID), eq(TASKER_ID), eq(CUSTOMER_ID), eq(QUOTE_PRICE), eq(true), any()))
                .thenReturn(quoteBooking);

        TaskAcceptResult quoteResult = taskApplicationService.confirmAcceptance(TASKER_ID, APP_ID);

        assertThat(quoteResult.isSuccess()).isTrue();
        assertThat(quoteResult.booking().price()).isEqualTo(QUOTE_PRICE);
        verify(bookingCommandPort)
                .createBooking(TASK_ID, TASKER_ID, CUSTOMER_ID, QUOTE_PRICE, true, quoteTask.scheduledAt());

        TaskState budgetTask = openBudgetTask();
        TaskApplicationState budgetApp = selectedApplication(Instant.now(), respondByAt);

        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(budgetTask));
        when(taskApplicationDao.findByTaskerAndId(TASKER_ID, APP_ID)).thenReturn(Optional.of(budgetApp));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        BookingState budgetBooking = new BookingState(
                UUID.randomUUID().toString(),
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                budgetTask.scheduledAt(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
        when(bookingCommandPort.createBooking(
                        eq(TASK_ID), eq(TASKER_ID), eq(CUSTOMER_ID), eq(BUDGET_PRICE), eq(true), any()))
                .thenReturn(budgetBooking);

        TaskAcceptResult budgetResult = taskApplicationService.confirmAcceptance(TASKER_ID, APP_ID);

        assertThat(budgetResult.isSuccess()).isTrue();
        assertThat(budgetResult.booking().price()).isEqualTo(BUDGET_PRICE);
        verify(bookingCommandPort)
                .createBooking(TASK_ID, TASKER_ID, CUSTOMER_ID, BUDGET_PRICE, true, budgetTask.scheduledAt());
    }

    // ── SCN-BOOK-026 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-026: Tasker marks complete and customer confirms completion")
    void taskerMarksCompleteAndCustomerConfirmsCompletion() {
        BookingState booking = setupBookingWithStore();

        when(completionSignalDao.markDone(eq(booking.id()), eq(TASKER_ID), any(Instant.class)))
                .thenReturn(1);
        Instant markedDoneAt = Instant.now();
        when(completionSignalDao.findByBookingId(booking.id()))
                .thenReturn(
                        Optional.of(new BookingCompletionSignal(booking.id(), TASKER_ID, markedDoneAt, null, null)));

        BookingMarkDoneResult markDoneResult = bookingService.markBookingDone(TASKER_ID, booking.id());

        assertThat(markDoneResult.isSuccess()).isTrue();
        assertThat(markDoneResult.markedDoneAt()).isNotNull();
        assertThat(markDoneResult.newlyMarked()).isTrue();
        assertThat(markDoneResult.booking().status()).isEqualTo("ASSIGNED");

        when(taskQueryService.getTask(TASK_ID)).thenReturn(Optional.of(assignedTask()));
        when(taskLifecycleService.transitionToCompleted(TASK_ID)).thenReturn(Optional.of(mock(TaskState.class)));

        BookingTransitionResult completeResult = bookingLifecycleService.completeBooking(CUSTOMER_ID, booking.id());

        assertThat(completeResult.isSuccess()).isTrue();
        assertThat(completeResult.booking().status()).isEqualTo("COMPLETED");
        verify(taskLifecycleService).transitionToCompleted(TASK_ID);
        verify(bookingTimelineService).recordEvent(eq(booking.id()), eq("BOOKING_COMPLETED"), eq(CUSTOMER_ID), any());
    }

    // ── SCN-BOOK-027 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-027: Customer silence after tasker-marked complete triggers timeout auto-complete")
    void customerSilenceTriggersTimeoutAutoComplete() {
        Instant now = Instant.now();
        Instant markedDoneAt72hAgo = now.minus(72, ChronoUnit.HOURS);

        BookingState booking0 = new BookingState(
                "booking-1",
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                null,
                "DIRECT",
                false,
                null,
                0,
                null,
                markedDoneAt72hAgo,
                now);

        when(bookingDao.findPendingCompletion(any(Instant.class), eq(100))).thenReturn(List.of(booking0));

        completionTimeoutService.processFirstReminder(now);

        verify(bookingDao).updateCompletionReminder("booking-1", 1, now);
        verify(notificationService).sendPush(eq(CUSTOMER_ID), anyString(), anyString(), eq("COMPLETION_REMINDER"));

        BookingState booking1 = new BookingState(
                "booking-2",
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                null,
                "DIRECT",
                false,
                null,
                1,
                null,
                markedDoneAt72hAgo,
                now);

        org.mockito.Mockito.reset(bookingDao, taskLifecycleService);
        when(bookingDao.findPendingCompletion(any(Instant.class), eq(100))).thenReturn(List.of(booking1));

        completionTimeoutService.processSecondReminder(now);

        verify(bookingDao).updateCompletionReminder("booking-2", 2, now);
        verify(notificationService)
                .sendPushWithSmsFallback(
                        eq(CUSTOMER_ID), anyString(), anyString(), eq("COMPLETION_REMINDER"), anyString());

        BookingState booking2 = new BookingState(
                "booking-3",
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                BUDGET_PRICE,
                "ASSIGNED",
                null,
                true,
                null,
                "DIRECT",
                false,
                null,
                2,
                null,
                markedDoneAt72hAgo,
                now);

        org.mockito.Mockito.reset(bookingDao);
        when(bookingDao.findPendingCompletion(any(Instant.class), eq(100))).thenReturn(List.of(booking2));
        when(bookingDao.findById("booking-3")).thenReturn(Optional.of(booking2));
        when(bookingDao.findByIdForUpdate("booking-3")).thenReturn(Optional.of(booking2));
        when(taskLifecycleService.transitionToCompleted(TASK_ID)).thenReturn(Optional.of(mock(TaskState.class)));

        completionTimeoutService.processAutoComplete(now);

        verify(notificationService)
                .sendPush(eq(CUSTOMER_ID), eq("Task auto-completed"), anyString(), eq("BOOKING_AUTO_COMPLETED"));
        verify(notificationService)
                .sendPush(eq(TASKER_ID), eq("Task auto-completed"), anyString(), eq("BOOKING_AUTO_COMPLETED"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TaskState openBudgetTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                UUID.randomUUID().toString(),
                "Clean my apartment",
                BUDGET_PRICE,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().plus(1, ChronoUnit.DAYS),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private TaskState openQuoteTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                UUID.randomUUID().toString(),
                "Custom task",
                null,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().plus(1, ChronoUnit.DAYS),
                "QUOTE",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private TaskState assignedTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                UUID.randomUUID().toString(),
                "Clean my apartment",
                BUDGET_PRICE,
                47.9,
                106.9,
                "UB",
                "ASSIGNED",
                Instant.now().plus(1, ChronoUnit.DAYS),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private TaskApplicationState appliedApplication() {
        return new TaskApplicationState(
                APP_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "I can help",
                null,
                "APPLIED",
                null,
                null,
                null,
                null,
                Instant.now());
    }

    private TaskApplicationState selectedApplication(Instant selectedAt, Instant respondByAt) {
        return new TaskApplicationState(
                APP_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "I can help",
                null,
                "SELECTED",
                null,
                null,
                selectedAt,
                respondByAt,
                Instant.now());
    }

    /**
     * Sets up BookingService with an in-memory store and returns the created booking.
     * Uses lenient stubs because not every test exercises all DAO operations.
     */
    private BookingState setupBookingWithStore() {
        Map<String, BookingState> store = new HashMap<>();

        doAnswer(inv -> {
                    String id = inv.getArgument(0);
                    String taskId = inv.getArgument(1);
                    String taskerId = inv.getArgument(2);
                    String custId = inv.getArgument(3);
                    int price = inv.getArgument(4);
                    String status = inv.getArgument(5);
                    Integer fee = inv.getArgument(6);
                    boolean disclaimer = inv.getArgument(7);
                    Instant createdAt = inv.getArgument(12);
                    Instant updatedAt = inv.getArgument(13);
                    store.put(
                            id,
                            new BookingState(
                                    id,
                                    taskId,
                                    taskerId,
                                    custId,
                                    price,
                                    status,
                                    fee,
                                    disclaimer,
                                    null,
                                    "DIRECT",
                                    false,
                                    disclaimer ? createdAt : null,
                                    0,
                                    null,
                                    createdAt,
                                    updatedAt));
                    return null;
                })
                .when(bookingDao)
                .insert(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyInt(),
                        anyString(),
                        any(),
                        anyBoolean(),
                        any(),
                        any(),
                        anyBoolean(),
                        any(),
                        any(Instant.class),
                        any(Instant.class));

        when(bookingDao.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0))));
        when(bookingDao.findByIdForUpdate(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0))));

        doAnswer(inv -> {
                    String id = inv.getArgument(0);
                    String newStatus = inv.getArgument(1);
                    Integer fee = inv.getArgument(2);
                    boolean disclaimer = inv.getArgument(3);
                    Instant updatedAt = inv.getArgument(4);
                    BookingState ex = store.get(id);
                    if (ex != null) {
                        store.put(
                                id,
                                new BookingState(
                                        ex.id(),
                                        ex.taskId(),
                                        ex.taskerId(),
                                        ex.customerId(),
                                        ex.price(),
                                        newStatus,
                                        fee,
                                        disclaimer,
                                        ex.confirmedScheduledAt(),
                                        ex.settlementMode(),
                                        ex.lateCancelIncident(),
                                        ex.liabilityDisclaimerAcceptedAt(),
                                        ex.completionReminderCount(),
                                        ex.completionReminderLastAt(),
                                        ex.createdAt(),
                                        updatedAt));
                    }
                    return null;
                })
                .when(bookingDao)
                .update(anyString(), anyString(), any(), anyBoolean(), any(Instant.class));

        return bookingService.createBooking(TASK_ID, TASKER_ID, CUSTOMER_ID, BUDGET_PRICE);
    }
}
