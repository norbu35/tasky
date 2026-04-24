package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NoShowServiceTest {

    @Mock
    private BookingDao bookingDao;

    @Mock
    private BookingTimelineService timelineService;

    @Mock
    private BookingTimelineEventDao bookingTimelineEventDao;

    @Mock
    private BookingScheduleEventDao bookingScheduleEventDao;

    @Mock
    private MessageDao messageDao;

    @Mock
    private ConversationDao conversationDao;

    @Mock
    private TaskLifecycleService taskLifecycleService;

    @Mock
    private ModerationService moderationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditEventDao auditEventDao;

    private NoShowService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new NoShowService(
                bookingDao,
                timelineService,
                bookingTimelineEventDao,
                bookingScheduleEventDao,
                messageDao,
                conversationDao,
                taskLifecycleService,
                moderationService,
                notificationService,
                auditEventDao);
    }

    private BookingState assignedBooking(String bookingId, String customerId, String taskerId) {
        return new BookingState(
                bookingId,
                "task1",
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                true,
                now.minus(61, ChronoUnit.MINUTES),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    private BookingState assignedBookingNoSchedule(String bookingId, String customerId, String taskerId) {
        return new BookingState(
                bookingId,
                "task1",
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                true,
                null,
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    // --- findBookingsNeedingReminder ---

    @Test
    void findBookingsNeedingReminder_filtersOutAlreadyReminded() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        when(bookingDao.findAssignedPastSchedule(any(Instant.class))).thenReturn(List.of(booking));
        when(bookingTimelineEventDao.existsByBookingIdAndEventType("b1", BookingTimelineService.NO_SHOW_REMINDER_SENT))
                .thenReturn(true);

        List<BookingState> result = service.findBookingsNeedingReminder();
        assertThat(result).isEmpty();
    }

    @Test
    void findBookingsNeedingReminder_includesUnreminded() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        when(bookingDao.findAssignedPastSchedule(any(Instant.class))).thenReturn(List.of(booking));
        when(bookingTimelineEventDao.existsByBookingIdAndEventType("b1", BookingTimelineService.NO_SHOW_REMINDER_SENT))
                .thenReturn(false);

        List<BookingState> result = service.findBookingsNeedingReminder();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("b1");
    }

    @Test
    void findBookingsNeedingReminder_noCandidates() {
        when(bookingDao.findAssignedPastSchedule(any(Instant.class))).thenReturn(Collections.emptyList());

        List<BookingState> result = service.findBookingsNeedingReminder();
        assertThat(result).isEmpty();
    }

    // --- sendReminder ---

    @Test
    void sendReminder_recordsTimelineAndSendsNotifications() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");

        service.sendReminder(booking);

        verify(timelineService).recordEvent("b1", BookingTimelineService.NO_SHOW_REMINDER_SENT, null, null);
        verify(notificationService).sendPush(eq("c1"), anyString(), anyString(), eq("NO_SHOW_REMINDER"));
        verify(notificationService).sendPush(eq("tk1"), anyString(), anyString(), eq("NO_SHOW_REMINDER"));
    }

    // --- flagNoShow ---

    @Test
    void flagNoShow_bookingNotFound() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.empty());
        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("NOT_FOUND");
    }

    @Test
    void flagNoShow_invalidStatus() {
        BookingState completed = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "COMPLETED",
                null,
                true,
                now.minus(61, ChronoUnit.MINUTES),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(completed));
        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("INVALID_STATUS");
    }

    @Test
    void flagNoShow_forbidden_nonParticipant() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        NoShowFlagResult result = service.flagNoShow("b1", "stranger");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("FORBIDDEN");
    }

    @Test
    void flagNoShow_noSchedule() {
        BookingState booking = assignedBookingNoSchedule("b1", "c1", "tk1");
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("NO_SCHEDULE");
    }

    @Test
    void flagNoShow_tooEarly() {
        BookingState booking = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "ASSIGNED",
                null,
                true,
                now.plus(1, ChronoUnit.HOURS),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("TOO_EARLY");
    }

    @Test
    void flagNoShow_recentTimelineActivity() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(true);

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("ACTIVITY_DETECTED");
    }

    @Test
    void flagNoShow_recentChatActivity() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        Conversation conversation = new Conversation("conv1", "task1", "c1", "tk1", now);
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.of(conversation));
        when(messageDao.existsRecentByConversationId(eq("conv1"), any(Instant.class)))
                .thenReturn(true);

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("ACTIVITY_DETECTED");
    }

    @Test
    void flagNoShow_futureRescheduleSupersedes() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        BookingScheduleEvent futureReschedule =
                new BookingScheduleEvent("se1", "b1", "c1", "ACCEPTED", now.plus(1, ChronoUnit.DAYS), "reason", now);

        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.empty());
        when(bookingScheduleEventDao.findLatestAcceptedByBookingId("b1")).thenReturn(Optional.of(futureReschedule));

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("RESCHEDULE_SUPERSEDES");
    }

    @Test
    void flagNoShow_success_customerFlags_taskerNoShow() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        BookingState updated = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "NO_SHOW",
                null,
                true,
                booking.confirmedScheduledAt(),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);

        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.empty());
        when(bookingScheduleEventDao.findLatestAcceptedByBookingId("b1")).thenReturn(Optional.empty());
        when(bookingDao.findById("b1")).thenReturn(Optional.of(updated));

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isTrue();
        assertThat(result.booking().status()).isEqualTo("NO_SHOW");

        verify(bookingDao).updateStatus(eq("b1"), eq("NO_SHOW"), any(Instant.class));
        verify(taskLifecycleService).transitionToNoShow("task1");
        verify(timelineService)
                .recordEvent(eq("b1"), eq(BookingTimelineService.NO_SHOW_CONFIRMED), eq("c1"), anyString());
        verify(auditEventDao).insert(eq("c1"), eq("NO_SHOW_FLAGGED"), eq("BOOKING"), eq("b1"), anyString());
        verify(moderationService).addStrike(eq("tk1"), eq("NO_SHOW"), eq("b1"));
    }

    @Test
    void flagNoShow_success_taskerFlags_customerNoShow_noStrikeForCustomer() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        BookingState updated = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "NO_SHOW",
                null,
                true,
                booking.confirmedScheduledAt(),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);

        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.empty());
        when(bookingScheduleEventDao.findLatestAcceptedByBookingId("b1")).thenReturn(Optional.empty());
        when(bookingDao.findById("b1")).thenReturn(Optional.of(updated));

        NoShowFlagResult result = service.flagNoShow("b1", "tk1");
        assertThat(result.success()).isTrue();

        verify(bookingDao).updateStatus(eq("b1"), eq("NO_SHOW"), any(Instant.class));
        verify(taskLifecycleService).transitionToNoShow("task1");
        verify(auditEventDao).insert(eq("tk1"), eq("NO_SHOW_FLAGGED"), eq("BOOKING"), eq("b1"), anyString());
        verify(moderationService, never()).addStrike(anyString(), anyString(), anyString());
    }

    @Test
    void flagNoShow_pastRescheduleAccepted_doesNotBlock() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        BookingScheduleEvent pastReschedule =
                new BookingScheduleEvent("se1", "b1", "c1", "ACCEPTED", now.minus(1, ChronoUnit.HOURS), "reason", now);
        BookingState updated = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "NO_SHOW",
                null,
                true,
                booking.confirmedScheduledAt(),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);

        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.empty());
        when(bookingScheduleEventDao.findLatestAcceptedByBookingId("b1")).thenReturn(Optional.of(pastReschedule));
        when(bookingDao.findById("b1")).thenReturn(Optional.of(updated));

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isTrue();
    }

    @Test
    void flagNoShow_noConversation_doesNotBlock() {
        BookingState booking = assignedBooking("b1", "c1", "tk1");
        BookingState updated = new BookingState(
                "b1",
                "task1",
                "tk1",
                "c1",
                1000,
                "NO_SHOW",
                null,
                true,
                booking.confirmedScheduledAt(),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);

        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(booking));
        when(bookingTimelineEventDao.existsRecentByBookingId(eq("b1"), any(Instant.class)))
                .thenReturn(false);
        when(conversationDao.findByTaskAndParticipants("task1", "c1", "tk1")).thenReturn(Optional.empty());
        when(bookingScheduleEventDao.findLatestAcceptedByBookingId("b1")).thenReturn(Optional.empty());
        when(bookingDao.findById("b1")).thenReturn(Optional.of(updated));

        NoShowFlagResult result = service.flagNoShow("b1", "c1");
        assertThat(result.success()).isTrue();
    }
}
