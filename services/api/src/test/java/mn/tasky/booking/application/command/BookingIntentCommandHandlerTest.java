package mn.tasky.booking.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.application.BookingIntentService.CreateResult;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentDeclineResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingIntentCommandHandlerTest {

    @Mock
    private BookingIntentService bookingIntentService;

    private BookingIntentCommandHandler handler;

    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        handler = new BookingIntentCommandHandler(bookingIntentService);
    }

    private BookingIntentState intentState() {
        return new BookingIntentState(
                "i1", "t1", "tk1", "c1", "DIRECT", "PENDING", null, null, null, null, null, null, now, now);
    }

    @Test
    void confirmIntent_delegates() {
        BookingState booking = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "ASSIGNED", null, false, now, "DIRECT", false, null, 0, null, now, now);
        BookingIntentConfirmResult result = BookingIntentConfirmResult.success(booking);
        when(bookingIntentService.confirmIntent("tk1", "i1")).thenReturn(result);

        BookingIntentConfirmResult actual = handler.confirmIntent("tk1", "i1");

        assertThat(actual).isSameAs(result);
        assertThat(actual.isSuccess()).isTrue();
    }

    @Test
    void declineIntent_delegates() {
        BookingIntentState intent = intentState();
        BookingIntentDeclineResult result = BookingIntentDeclineResult.success(intent);
        when(bookingIntentService.declineIntent("tk1", "i1")).thenReturn(result);

        BookingIntentDeclineResult actual = handler.declineIntent("tk1", "i1");

        assertThat(actual).isSameAs(result);
        assertThat(actual.isSuccess()).isTrue();
    }

    @Test
    void createIntent_success() {
        BookingIntentState intent = intentState();
        CreateResult cr = new CreateResult(intent, null, null);
        when(bookingIntentService.createIntent("c1", "t1", "DIRECT", "tk1", null))
                .thenReturn(cr);

        BookingIntentCreateResult result = handler.createIntent("c1", "t1", "DIRECT", "tk1", null);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.intent()).containsSame(intent);
    }

    @Test
    void createIntent_error() {
        CreateResult cr = new CreateResult(null, "TASK_NOT_OPEN", "Task is not open");
        when(bookingIntentService.createIntent("c1", "t1", "DIRECT", "tk1", null))
                .thenReturn(cr);

        BookingIntentCreateResult result = handler.createIntent("c1", "t1", "DIRECT", "tk1", null);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo("TASK_NOT_OPEN");
    }

    @Test
    void createApplicationSelectionIntent_success() {
        BookingIntentState intent = intentState();
        CreateResult cr = new CreateResult(intent, null, null);
        Instant expiresAt = now.plusSeconds(900);
        when(bookingIntentService.createApplicationSelectionIntent("c1", "t1", "a1", "tk1", expiresAt))
                .thenReturn(cr);

        BookingIntentCreateResult result = handler.createApplicationSelectionIntent("c1", "t1", "a1", "tk1", expiresAt);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.intent()).containsSame(intent);
    }

    @Test
    void createApplicationSelectionIntent_error() {
        Instant expiresAt = now.plusSeconds(900);
        CreateResult cr = new CreateResult(null, "APPLICATION_NOT_AVAILABLE", "Application is not available");
        when(bookingIntentService.createApplicationSelectionIntent("c1", "t1", "a1", "tk1", expiresAt))
                .thenReturn(cr);

        BookingIntentCreateResult result = handler.createApplicationSelectionIntent("c1", "t1", "a1", "tk1", expiresAt);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo("APPLICATION_NOT_AVAILABLE");
    }

    @Test
    void getIntent_found() {
        BookingIntentState intent = intentState();
        when(bookingIntentService.getIntent("i1")).thenReturn(Optional.of(intent));

        Optional<BookingIntentState> result = handler.getIntent("i1");

        assertThat(result).containsSame(intent);
    }

    @Test
    void getIntent_notFound() {
        when(bookingIntentService.getIntent("i1")).thenReturn(Optional.empty());

        Optional<BookingIntentState> result = handler.getIntent("i1");

        assertThat(result).isEmpty();
    }

    @Test
    void findPendingApplicationSelectionIntent_delegates() {
        BookingIntentState intent = intentState();
        when(bookingIntentService.findPendingApplicationSelectionIntent("t1", "a1", now))
                .thenReturn(Optional.of(intent));

        Optional<BookingIntentState> result = handler.findPendingApplicationSelectionIntent("t1", "a1", now);

        assertThat(result).containsSame(intent);
    }

    @Test
    void expirePendingApplicationSelectionForTask_delegates() {
        when(bookingIntentService.expirePendingApplicationSelectionForTask("t1", now))
                .thenReturn(2);

        int expired = handler.expirePendingApplicationSelectionForTask("t1", now);

        assertThat(expired).isEqualTo(2);
    }

    @Test
    void markIntentConfirmed_delegates() {
        handler.markIntentConfirmed("i1", "b1", now);

        verify(bookingIntentService).markIntentConfirmed("i1", "b1", now);
    }
}
