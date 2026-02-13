package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BookingServiceTests {

    private final BookingService bookingService = new BookingService();

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
        bookingService.cancelBooking("customer-1", booking.id());
        BookingService.BookingTransitionResult paidResult = bookingService.transitionToPaid(booking.id());
        assertThat(paidResult.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE cancellation rules")
    void cancellationRules() {
        BookingService.BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // Customer can cancel PENDING_PAYMENT
        BookingService.BookingTransitionResult cancelResult = bookingService.cancelBooking("customer-1", booking.id());
        assertThat(cancelResult.isSuccess()).isTrue();

        // Random user cannot cancel
        BookingService.BookingState booking2 = bookingService.createBooking("task-2", "tasker-2", "customer-2", 50000);
        BookingService.BookingTransitionResult forbiddenResult = bookingService.cancelBooking("random-user", booking2.id());
        assertThat(forbiddenResult.errorCode()).isEqualTo(BookingService.BookingTransitionResult.FORBIDDEN);
    }
}
