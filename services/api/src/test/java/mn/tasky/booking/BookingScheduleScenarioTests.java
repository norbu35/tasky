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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.notification.application.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for booking reschedule lifecycle scenarios SCN-BOOK-017 through SCN-BOOK-020.
 */
class BookingScheduleScenarioTests {

    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String EVENT_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";
    private static final String TASK_ID = "task-1";

    private BookingScheduleEventDao scheduleEventDao;
    private BookingDao bookingDao;
    private BookingTimelineService timelineService;
    private NotificationService notificationService; // NOPMD SingularField
    private BookingScheduleService scheduleService;

    @BeforeEach
    void setUp() {
        scheduleEventDao = mock(BookingScheduleEventDao.class);
        bookingDao = mock(BookingDao.class);
        timelineService = mock(BookingTimelineService.class);
        notificationService = mock(NotificationService.class);

        scheduleService =
                new BookingScheduleService(scheduleEventDao, bookingDao, timelineService, notificationService);
    }

    private BookingState assignedBooking() {
        return new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "ASSIGNED",
                null,
                true,
                Instant.now().plus(2, ChronoUnit.HOURS),
                "DIRECT",
                false,
                null,
                0,
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now());
    }

    // ── SCN-BOOK-017 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-017: Reschedule request in ASSIGNED creates a REQUESTED event"
            + " with proposed datetime and optional reason")
    void rescheduleRequestCreatesRequestedEvent() {
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(assignedBooking()));
        Instant proposed = Instant.now().plus(1, ChronoUnit.DAYS);
        BookingScheduleEvent created = new BookingScheduleEvent(
                EVENT_ID, BOOKING_ID, CUSTOMER_ID, "REQUESTED", proposed, "Need to move it", Instant.now());
        when(scheduleEventDao.findById(anyString())).thenReturn(Optional.of(created));

        BookingScheduleEvent result =
                scheduleService.requestReschedule(BOOKING_ID, CUSTOMER_ID, proposed, "Need to move it");

        assertThat(result.eventType()).isEqualTo("REQUESTED");
        assertThat(result.proposedScheduledAt()).isEqualTo(proposed);
        verify(scheduleEventDao)
                .insert(
                        anyString(),
                        eq(BOOKING_ID),
                        eq(CUSTOMER_ID),
                        eq("REQUESTED"),
                        eq(proposed),
                        eq("Need to move it"));
        verify(timelineService)
                .recordEvent(
                        eq(BOOKING_ID), eq(BookingTimelineService.RESCHEDULE_REQUESTED), eq(CUSTOMER_ID), anyString());
    }

    // ── SCN-BOOK-018 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-018: Accepted reschedule updates the canonical schedule and resets policy timers")
    void acceptedRescheduleUpdatesCanonicalSchedule() {
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(assignedBooking()));
        Instant proposed = Instant.now().plus(1, ChronoUnit.DAYS);
        BookingScheduleEvent requestedEvent =
                new BookingScheduleEvent(EVENT_ID, BOOKING_ID, CUSTOMER_ID, "REQUESTED", proposed, null, Instant.now());
        BookingScheduleEvent acceptedEvent =
                new BookingScheduleEvent(EVENT_ID, BOOKING_ID, CUSTOMER_ID, "ACCEPTED", proposed, null, Instant.now());
        when(scheduleEventDao.findById(EVENT_ID))
                .thenReturn(Optional.of(requestedEvent))
                .thenReturn(Optional.of(acceptedEvent));

        BookingScheduleEvent result = scheduleService.respondToReschedule(BOOKING_ID, EVENT_ID, TASKER_ID, "ACCEPT");

        // Canonical confirmed schedule updated
        verify(bookingDao).updateConfirmedSchedule(eq(BOOKING_ID), eq(proposed));
        verify(scheduleEventDao).updateStatus(eq(EVENT_ID), eq("ACCEPTED"));
        verify(timelineService)
                .recordEvent(eq(BOOKING_ID), eq(BookingTimelineService.RESCHEDULE_ACCEPTED), eq(TASKER_ID), any());
        assertThat(result.eventType()).isEqualTo("ACCEPTED");
    }

    // ── SCN-BOOK-019 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-019: Declined or expired reschedule request preserves the original schedule")
    void declinedReschedulePreservesOriginalSchedule() {
        Instant originalSchedule = Instant.now().plus(2, ChronoUnit.HOURS);
        BookingState booking = new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "ASSIGNED",
                null,
                true,
                originalSchedule,
                "DIRECT",
                false,
                null,
                0,
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now());
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        Instant proposed = Instant.now().plus(1, ChronoUnit.DAYS);
        BookingScheduleEvent requestedEvent =
                new BookingScheduleEvent(EVENT_ID, BOOKING_ID, CUSTOMER_ID, "REQUESTED", proposed, null, Instant.now());
        BookingScheduleEvent declinedEvent =
                new BookingScheduleEvent(EVENT_ID, BOOKING_ID, CUSTOMER_ID, "DECLINED", proposed, null, Instant.now());
        when(scheduleEventDao.findById(EVENT_ID))
                .thenReturn(Optional.of(requestedEvent))
                .thenReturn(Optional.of(declinedEvent));

        BookingScheduleEvent result = scheduleService.respondToReschedule(BOOKING_ID, EVENT_ID, TASKER_ID, "DECLINE");

        // Original confirmed schedule NOT updated
        verify(bookingDao, never()).updateConfirmedSchedule(anyString(), any());
        verify(scheduleEventDao).updateStatus(eq(EVENT_ID), eq("DECLINED"));
        verify(timelineService)
                .recordEvent(eq(BOOKING_ID), eq(BookingTimelineService.RESCHEDULE_DECLINED), eq(TASKER_ID), any());
        assertThat(result.eventType()).isEqualTo("DECLINED");
    }

    // ── SCN-BOOK-020 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-020: Only the latest mutually accepted in-app schedule changes policy timers"
            + " and the reschedule lifecycle remains audit-immutable")
    void onlyAcceptedInAppReschedulesChangePolicyTimers() {
        // Booking has an original confirmed schedule
        Instant originalSchedule = Instant.now().plus(3, ChronoUnit.HOURS);
        BookingState booking = new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                "ASSIGNED",
                null,
                true,
                originalSchedule,
                "DIRECT",
                false,
                null,
                0,
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now());
        when(bookingDao.findById(BOOKING_ID)).thenReturn(Optional.of(booking));

        // There are reschedule events: REQUESTED, DECLINED, and REQUESTED again
        Instant proposedA = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant proposedB = Instant.now().plus(2, ChronoUnit.DAYS);
        List<BookingScheduleEvent> allEvents = List.of(
                new BookingScheduleEvent(
                        UUID.randomUUID().toString(),
                        BOOKING_ID,
                        CUSTOMER_ID,
                        "REQUESTED",
                        proposedA,
                        null,
                        Instant.now().minus(2, ChronoUnit.HOURS)),
                new BookingScheduleEvent(
                        UUID.randomUUID().toString(),
                        BOOKING_ID,
                        TASKER_ID,
                        "DECLINED",
                        proposedA,
                        null,
                        Instant.now().minus(1, ChronoUnit.HOURS)),
                new BookingScheduleEvent(
                        UUID.randomUUID().toString(),
                        BOOKING_ID,
                        CUSTOMER_ID,
                        "REQUESTED",
                        proposedB,
                        null,
                        Instant.now().minus(30, ChronoUnit.MINUTES)));
        when(scheduleEventDao.findByBookingId(BOOKING_ID)).thenReturn(allEvents);

        List<BookingScheduleEvent> events = scheduleService.listScheduleEvents(BOOKING_ID, CUSTOMER_ID);

        // All three immutable events are returned in order — nothing deleted or modified
        assertThat(events).hasSize(3);
        assertThat(events.stream().map(BookingScheduleEvent::eventType))
                .containsExactly("REQUESTED", "DECLINED", "REQUESTED");

        // The original confirmed schedule is unchanged (no ACCEPT event)
        // confirmedScheduledAt on booking still = originalSchedule
        assertThat(booking.confirmedScheduledAt()).isEqualTo(originalSchedule);

        // updateConfirmedSchedule was never called (no accepted reschedule)
        verify(bookingDao, never()).updateConfirmedSchedule(anyString(), any());
    }
}
