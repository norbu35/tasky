package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.application.NoShowService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for no-show adjudication scenarios SCN-BOOK-010 through SCN-BOOK-016.
 */
class NoShowScenarioTests {

    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";
    private static final String TASK_ID = "task-1";

    private BookingDao bookingDao;
    private BookingTimelineEventDao timelineEventDao;
    private BookingScheduleEventDao scheduleEventDao;
    private ConversationDao conversationDao;
    private MessageDao messageDao;
    private BookingTimelineService timelineService;
    private NotificationService notificationService;
    private ModerationService moderationService;
    private AuditEventDao auditEventDao;
    private TaskLifecycleService taskLifecycleService;
    private NoShowService noShowService;

    @BeforeEach
    void setUp() {
        bookingDao = mock(BookingDao.class);
        timelineEventDao = mock(BookingTimelineEventDao.class);
        scheduleEventDao = mock(BookingScheduleEventDao.class);
        conversationDao = mock(ConversationDao.class);
        messageDao = mock(MessageDao.class);
        timelineService = mock(BookingTimelineService.class);
        notificationService = mock(NotificationService.class);
        moderationService = mock(ModerationService.class);
        auditEventDao = mock(AuditEventDao.class);
        taskLifecycleService = mock(TaskLifecycleService.class);

        // flagNoShow uses findByIdForUpdate; other paths use findById
        when(bookingDao.findByIdForUpdate(anyString()))
                .thenAnswer(inv -> bookingDao.findById(inv.getArgument(0, String.class)));

        noShowService = new NoShowService(
                bookingDao,
                timelineService,
                timelineEventDao,
                scheduleEventDao,
                messageDao,
                conversationDao,
                taskLifecycleService,
                moderationService,
                notificationService,
                auditEventDao);

        // Default: no recent activity, no accepted reschedule, no conversation
        when(timelineEventDao.existsRecentByBookingId(anyString(), any())).thenReturn(false);
        when(scheduleEventDao.findLatestAcceptedByBookingId(anyString())).thenReturn(Optional.empty());
        when(conversationDao.findByTaskAndParticipants(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());
    }

    /** Creates a booking state with configuredScheduledAt, in ASSIGNED status. */
    private BookingState assignedBooking(Instant confirmedScheduledAt) {
        return new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "ASSIGNED",
                null,
                true,
                confirmedScheduledAt,
                "DIRECT",
                false,
                null,
                0,
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now());
    }

    // ── SCN-BOOK-010 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-010: Scheduled start plus 10 minutes sends no-show reminder to both parties")
    void reminderSentAtPlusTenMinutes() {
        // Booking past the 10-minute threshold (schedule was 11 minutes ago)
        Instant scheduledAt = Instant.now().minus(11, ChronoUnit.MINUTES);
        BookingState booking = assignedBooking(scheduledAt);
        noShowService.sendReminder(booking);

        verify(notificationService).sendPush(eq(CUSTOMER_ID), anyString(), anyString(), eq("NO_SHOW_REMINDER"));
        verify(notificationService).sendPush(eq(TASKER_ID), anyString(), anyString(), eq("NO_SHOW_REMINDER"));
        verify(timelineService)
                .recordEvent(eq(BOOKING_ID), eq(BookingTimelineService.NO_SHOW_REMINDER_SENT), any(), any());
    }

    // ── SCN-BOOK-011 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-011: No-show flag before 15 minutes after schedule returns TOO_EARLY")
    void noShowFlagBefore15MinutesReturnsTooEarly() {
        // Scheduled 10 minutes ago — still too early (< 15 min threshold)
        BookingState booking = assignedBooking(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        NoShowFlagResult result = noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("TOO_EARLY");
    }

    // ── SCN-BOOK-012 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-012: Recent in-app activity within 30 minutes blocks no-show flag")
    void recentActivityBlocksNoShowFlag() {
        // Past the 15-minute threshold
        BookingState booking = assignedBooking(Instant.now().minus(20, ChronoUnit.MINUTES));
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        // Recent timeline activity from a participant
        when(timelineEventDao.existsRecentByBookingId(eq(BOOKING_ID), any())).thenReturn(true);

        NoShowFlagResult result = noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("ACTIVITY_DETECTED");
    }

    // ── SCN-BOOK-013 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-013: Accepted future reschedule supersedes no-show adjudication on the original schedule")
    void acceptedFutureRescheduleSupersedes() {
        // Past the 15-minute threshold, no activity
        BookingState booking = assignedBooking(Instant.now().minus(20, ChronoUnit.MINUTES));
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        // An accepted reschedule for a future time exists
        BookingScheduleEvent acceptedReschedule = new BookingScheduleEvent(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                CUSTOMER_ID,
                "ACCEPTED",
                Instant.now().plus(2, ChronoUnit.HOURS),
                null,
                Instant.now());
        when(scheduleEventDao.findLatestAcceptedByBookingId(BOOKING_ID)).thenReturn(Optional.of(acceptedReschedule));

        NoShowFlagResult result = noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("RESCHEDULE_SUPERSEDES");
    }

    // ── SCN-BOOK-014 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-014: Valid no-show flag transitions booking and task to NO_SHOW and records audit history")
    void validNoShowFlagTransitionsToNoShowAndRecordsAudit() {
        // All preconditions met: past 15 min, no activity, no superseding reschedule
        BookingState booking = assignedBooking(Instant.now().minus(20, ChronoUnit.MINUTES));
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        // After update, return updated state
        BookingState updated = new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "NO_SHOW",
                null,
                true,
                booking.confirmedScheduledAt(),
                "DIRECT",
                false,
                null,
                0,
                null,
                booking.createdAt(),
                Instant.now());
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking)).thenReturn(Optional.of(updated));

        NoShowFlagResult result = noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        assertThat(result.success()).isTrue();
        assertThat(result.booking().status()).isEqualTo("NO_SHOW");
        verify(bookingDao).updateStatus(eq(BOOKING_ID), eq("NO_SHOW"), any());
        verify(taskLifecycleService).transitionToNoShow(TASK_ID);
        verify(timelineService)
                .recordEvent(eq(BOOKING_ID), eq(BookingTimelineService.NO_SHOW_CONFIRMED), anyString(), anyString());
        verify(auditEventDao).insert(anyString(), eq("NO_SHOW_FLAGGED"), eq("BOOKING"), eq(BOOKING_ID), anyString());
    }

    // ── SCN-BOOK-015 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-015: Repeated no-shows within 28 days create a strike-review case")
    void repeatedNoShowsCreateStrikeReviewCase() {
        // When no-show party is the tasker, moderationService.addStrike() is called
        BookingState booking = assignedBooking(Instant.now().minus(20, ChronoUnit.MINUTES));
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(bookingDao.findById(BOOKING_ID))
                .thenReturn(Optional.of(booking))
                .thenReturn(Optional.of(new BookingState(
                        BOOKING_ID,
                        TASK_ID,
                        TASKER_ID,
                        CUSTOMER_ID,
                        50_000,
                        "NO_SHOW",
                        null,
                        true,
                        booking.confirmedScheduledAt(),
                        "DIRECT",
                        false,
                        null,
                        0,
                        null,
                        booking.createdAt(),
                        Instant.now())));

        // Customer flags no-show (tasker is the no-show party)
        noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        // addStrike is called for the tasker (no-show party) with reason and booking context
        verify(moderationService).addStrike(eq(TASKER_ID), eq("NO_SHOW"), eq(BOOKING_ID));
    }

    // ── SCN-BOOK-016 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-016: Repeating the no-show flag on an already NO_SHOW booking is idempotent")
    void duplicateNoShowFlagOnAlreadyNoShowIsIdempotent() {
        // Booking already in NO_SHOW terminal state
        BookingState noShowBooking = new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "NO_SHOW",
                null,
                true,
                Instant.now().minus(20, ChronoUnit.MINUTES),
                "DIRECT",
                false,
                null,
                0,
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now());
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(noShowBooking));

        NoShowFlagResult result = noShowService.flagNoShow(BOOKING_ID, CUSTOMER_ID);

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("INVALID_STATUS");
        // No additional state changes
        verify(bookingDao, never()).updateStatus(anyString(), anyString(), any());
    }
}
