package mn.tasky.booking.application.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingQueryHandlerTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private BookingScheduleService bookingScheduleService;

    private BookingQueryHandler handler;

    @BeforeEach
    void setUp() {
        handler = new BookingQueryHandler(bookingService, bookingScheduleService);
    }

    @Test
    void getBooking_delegatesToService() {
        BookingState booking = new BookingState(
                "b1",
                "t1",
                "tk1",
                "c1",
                1000,
                "ASSIGNED",
                null,
                true,
                Instant.now(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));

        Optional<BookingState> result = handler.getBooking("b1");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("b1");
        verify(bookingService).getBooking("b1");
    }

    @Test
    void getBooking_returnsEmptyWhenNotFound() {
        when(bookingService.getBooking("missing")).thenReturn(Optional.empty());

        Optional<BookingState> result = handler.getBooking("missing");

        assertThat(result).isEmpty();
    }

    @Test
    void listBookings_threeArgs_delegatesToService() {
        List<BookingState> bookings = List.of();
        when(bookingService.listBookings("u1", "customer", "ASSIGNED")).thenReturn(bookings);

        List<BookingState> result = handler.listBookings("u1", "customer", "ASSIGNED");

        assertThat(result).isEmpty();
        verify(bookingService).listBookings("u1", "customer", "ASSIGNED");
    }

    @Test
    void listBookings_fiveArgs_delegatesToService() {
        List<BookingState> bookings = List.of();
        when(bookingService.listBookings("u1", "tasker", "OPEN", "cursor1", 10)).thenReturn(bookings);

        List<BookingState> result = handler.listBookings("u1", "tasker", "OPEN", "cursor1", 10);

        assertThat(result).isEmpty();
        verify(bookingService).listBookings("u1", "tasker", "OPEN", "cursor1", 10);
    }

    @Test
    void getTaskerMarkedDoneAt_delegatesToService() {
        Instant doneAt = Instant.now();
        when(bookingService.getTaskerMarkedDoneAt("b1")).thenReturn(Optional.of(doneAt));

        Optional<Instant> result = handler.getTaskerMarkedDoneAt("b1");

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(doneAt);
    }

    @Test
    void listScheduleEvents_delegatesToScheduleService() {
        List<BookingScheduleEvent> events = List.of();
        when(bookingScheduleService.listScheduleEvents("b1", "u1")).thenReturn(events);

        List<BookingScheduleEvent> result = handler.listScheduleEvents("b1", "u1");

        assertThat(result).isEmpty();
        verify(bookingScheduleService).listScheduleEvents("b1", "u1");
    }

    @Test
    void getScheduleEvent_delegatesToScheduleService() {
        BookingScheduleEvent event = new BookingScheduleEvent(
                "e1", "b1", "u1", "REQUESTED", Instant.now().plusSeconds(3600), null, Instant.now());
        when(bookingScheduleService.getScheduleEvent("e1")).thenReturn(Optional.of(event));

        Optional<BookingScheduleEvent> result = handler.getScheduleEvent("e1");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("e1");
    }
}
