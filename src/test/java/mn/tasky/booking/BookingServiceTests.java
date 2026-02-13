package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import mn.tasky.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class BookingServiceTests {

    private AuthService authService;
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        authService = Mockito.mock(AuthService.class);
        bookingService = new BookingService(authService);
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE valid transitions")
    void validTransitions() {
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);
        assertThat(booking.status()).isEqualTo("PENDING_PAYMENT");

        // PENDING_PAYMENT -> PAID
        BookingService.BookingTransitionResult paidResult = bookingService.transitionToPaid(booking.id());
        assertThat(paidResult.isSuccess()).isTrue();
        assertThat(paidResult.booking().status()).isEqualTo("PAID");

        // PAID -> COMPLETED
        BookingService.BookingTransitionResult completedResult = bookingService.completeBooking("customer-1", booking.id());
        assertThat(completedResult.isSuccess()).isTrue();
        assertThat(completedResult.booking().status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE invalid transitions")
    void invalidTransitions() {
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // PENDING_PAYMENT -> COMPLETED (Invalid)
        BookingService.BookingTransitionResult completedResult = bookingService.completeBooking("customer-1", booking.id());
        assertThat(completedResult.isSuccess()).isFalse();
        assertThat(completedResult.errorCode()).isEqualTo(BookingService.BookingTransitionResult.INVALID_TRANSITION);

        // CANCELLED -> PAID (Invalid)
        bookingService.cancelBooking("customer-1", booking.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        BookingService.BookingTransitionResult paidResult = bookingService.transitionToPaid(booking.id());
        assertThat(paidResult.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE cancellation rules")
    void cancellationRules() {
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // Customer can cancel PENDING_PAYMENT
        BookingService.BookingTransitionResult cancelResult = bookingService.cancelBooking("customer-1", booking.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        assertThat(cancelResult.isSuccess()).isTrue();

        // Random user cannot cancel
        BookingService.BookingState booking2 = bookingService.createBooking("task-2", "tasker-2", "customer-2", 50000);
        BookingService.BookingTransitionResult forbiddenResult = bookingService.cancelBooking("random-user", booking2.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        assertThat(forbiddenResult.errorCode()).isEqualTo(BookingService.BookingTransitionResult.FORBIDDEN);
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE customer late-cancel applies fee")
    void customerLateCancelFee() {
        // Task scheduled 1 hour from now (late)
        Instant scheduledAt = Instant.now().plus(1, ChronoUnit.HOURS);
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 100000);

        BookingService.BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().cancellationFee()).isEqualTo(10000); // 10% of 100,000
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE customer free cancellation")
    void customerFreeCancel() {
        // Task scheduled 10 hours from now (free)
        Instant scheduledAt = Instant.now().plus(10, ChronoUnit.HOURS);
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 100000);

        BookingService.BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().cancellationFee()).isNull();
    }
}
