package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.notification.application.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingScheduleServiceTest {

    @Mock
    private BookingScheduleEventDao scheduleEventDao;

    @Mock
    private BookingDao bookingDao;

    @Mock
    private BookingTimelineService timelineService;

    @Mock
    private NotificationService notificationService;

    private BookingScheduleService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new BookingScheduleService(scheduleEventDao, bookingDao, timelineService, notificationService);
    }

    private BookingState assignedBooking(String customerId, String taskerId) {
        return new BookingState(
                "b1",
                "t1",
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                false,
                now.plusSeconds(7200),
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    @Test
    void requestReschedule_bookingNotFound() {
        when(bookingDao.findById("b1")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.requestReschedule("b1", "u1", now.plusSeconds(3600), "reason"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void requestReschedule_notParticipant() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking("c1", "tk1")));
        assertThatThrownBy(() -> service.requestReschedule("b1", "other", now.plusSeconds(3600), "reason"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void requestReschedule_notAssigned() {
        BookingState paid = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "PAID", null, false, now, "DIRECT", false, null, 0, null, now, now);
        when(bookingDao.findById("b1")).thenReturn(Optional.of(paid));
        assertThatThrownBy(() -> service.requestReschedule("b1", "c1", now.plusSeconds(3600), "reason"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void requestReschedule_pastTime() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking("c1", "tk1")));
        assertThatThrownBy(() -> service.requestReschedule("b1", "c1", now.minusSeconds(60), "reason"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void requestReschedule_success() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking("c1", "tk1")));
        Instant proposed = now.plusSeconds(3600);
        BookingScheduleEvent event = new BookingScheduleEvent("e1", "b1", "c1", "REQUESTED", proposed, "reason", now);
        when(scheduleEventDao.findById(anyString())).thenReturn(Optional.of(event));
        BookingScheduleEvent result = service.requestReschedule("b1", "c1", proposed, "reason");
        verify(scheduleEventDao).insert(anyString(), eq("b1"), eq("c1"), eq("REQUESTED"), eq(proposed), eq("reason"));
    }

    @Test
    void respondToReschedule_accept() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking("c1", "tk1")));
        Instant proposed = now.plusSeconds(3600);
        BookingScheduleEvent requested = new BookingScheduleEvent("e1", "b1", "c1", "REQUESTED", proposed, null, now);
        BookingScheduleEvent accepted = new BookingScheduleEvent("e1", "b1", "c1", "ACCEPTED", proposed, null, now);
        when(scheduleEventDao.findById("e1")).thenReturn(Optional.of(requested)).thenReturn(Optional.of(accepted));
        service.respondToReschedule("b1", "e1", "tk1", "ACCEPT");
        verify(bookingDao).updateConfirmedSchedule("b1", proposed);
        verify(scheduleEventDao).updateStatus("e1", "ACCEPTED");
    }

    @Test
    void getScheduleEvent_found() {
        BookingScheduleEvent event =
                new BookingScheduleEvent("e1", "b1", "c1", "REQUESTED", now.plusSeconds(3600), null, now);
        when(scheduleEventDao.findById("e1")).thenReturn(Optional.of(event));
        assertThat(service.getScheduleEvent("e1")).containsSame(event);
    }
}
