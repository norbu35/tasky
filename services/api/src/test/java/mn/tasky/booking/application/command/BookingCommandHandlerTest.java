package mn.tasky.booking.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.NoShowService;
import mn.tasky.booking.application.RepeatBookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.booking.dto.RebookResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingCommandHandlerTest {

    @Mock
    private BookingLifecycleService bookingLifecycleService;

    @Mock
    private BookingService bookingService;

    @Mock
    private BookingScheduleService bookingScheduleService;

    @Mock
    private NoShowService noShowService;

    @Mock
    private RepeatBookingService repeatBookingService;

    private BookingCommandHandler handler;

    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        handler = new BookingCommandHandler(
                bookingLifecycleService, bookingService, bookingScheduleService, noShowService, repeatBookingService);
    }

    @Test
    void createBooking_delegatesToBookingService() {
        BookingState booking = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "ASSIGNED", null, true, now, "DIRECT", false, now, 0, null, now, now);
        when(bookingService.createBooking("t1", "tk1", "c1", 1000, true, now)).thenReturn(booking);

        BookingState result = handler.createBooking("t1", "tk1", "c1", 1000, true, now);

        assertThat(result.id()).isEqualTo("b1");
    }

    @Test
    void recordDisclaimerAcceptance_delegatesToBookingService() {
        when(bookingService.recordDisclaimerAcceptance("b1")).thenReturn(Optional.empty());

        Optional<BookingState> result = handler.recordDisclaimerAcceptance("b1");

        assertThat(result).isEmpty();
        verify(bookingService).recordDisclaimerAcceptance("b1");
    }

    @Test
    void cancelBooking_delegatesToLifecycleService() {
        BookingTransitionResult transitionResult = BookingTransitionResult.NOT_FOUND_RESULT;
        when(bookingLifecycleService.cancelBooking("u1", "b1")).thenReturn(transitionResult);

        BookingTransitionResult result = handler.cancelBooking("u1", "b1");

        assertThat(result).isEqualTo(transitionResult);
    }

    @Test
    void completeBooking_delegatesToLifecycleService() {
        BookingState booking = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "COMPLETED", null, true, now, "DIRECT", false, now, 0, null, now, now);
        BookingTransitionResult success = BookingTransitionResult.success(booking);
        when(bookingLifecycleService.completeBooking("c1", "b1")).thenReturn(success);

        BookingTransitionResult result = handler.completeBooking("c1", "b1");

        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void markBookingDone_delegatesToBookingService() {
        BookingMarkDoneResult markResult = BookingMarkDoneResult.NOT_FOUND_RESULT;
        when(bookingService.markBookingDone("u1", "b1")).thenReturn(markResult);

        BookingMarkDoneResult result = handler.markBookingDone("u1", "b1");

        assertThat(result).isEqualTo(markResult);
    }

    @Test
    void requestReschedule_delegatesToScheduleService() {
        BookingScheduleEvent event =
                new BookingScheduleEvent("e1", "b1", "u1", "REQUESTED", now.plusSeconds(3600), null, now);
        when(bookingScheduleService.requestReschedule("b1", "u1", event.proposedScheduledAt(), "reason"))
                .thenReturn(event);

        BookingScheduleEvent result = handler.requestReschedule("b1", "u1", event.proposedScheduledAt(), "reason");

        assertThat(result.id()).isEqualTo("e1");
    }

    @Test
    void respondToReschedule_delegatesToScheduleService() {
        BookingScheduleEvent event =
                new BookingScheduleEvent("e1", "b1", "u1", "ACCEPTED", now.plusSeconds(3600), null, now);
        when(bookingScheduleService.respondToReschedule("b1", "e1", "u1", "ACCEPT"))
                .thenReturn(event);

        BookingScheduleEvent result = handler.respondToReschedule("b1", "e1", "u1", "ACCEPT");

        assertThat(result.eventType()).isEqualTo("ACCEPTED");
    }

    @Test
    void flagNoShow_delegatesToNoShowService() {
        NoShowFlagResult flagResult = NoShowFlagResult.error("NOT_FOUND");
        when(noShowService.flagNoShow("b1", "u1")).thenReturn(flagResult);

        NoShowFlagResult result = handler.flagNoShow("b1", "u1");

        assertThat(result.errorCode()).isEqualTo("NOT_FOUND");
    }

    @Test
    void rebook_delegatesToRepeatBookingService() {
        RebookResult rebookResult = RebookResult.error(RebookResult.NOT_FOUND, "Not found");
        when(repeatBookingService.rebook("b1", "c1")).thenReturn(rebookResult);

        RebookResult result = handler.rebook("b1", "c1");

        assertThat(result.errorCode()).isEqualTo(RebookResult.NOT_FOUND);
    }

    @Test
    void forceTransition_delegatesToBookingService() {
        BookingTransitionResult transitionResult = BookingTransitionResult.NOT_FOUND_RESULT;
        when(bookingService.forceTransition("b1", "CANCELLED")).thenReturn(transitionResult);

        BookingTransitionResult result = handler.forceTransition("b1", "CANCELLED");

        assertThat(result).isEqualTo(transitionResult);
    }

    @Test
    void transitionToDisputed_delegatesToBookingService() {
        handler.transitionToDisputed("b1");

        verify(bookingService).transitionToDisputed("b1");
    }
}
