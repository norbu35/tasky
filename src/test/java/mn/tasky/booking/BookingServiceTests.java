package mn.tasky.booking;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BookingServiceTests {

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        AuthService authService = Mockito.mock(AuthService.class);
        bookingService = new BookingService(authService);
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE valid transitions")
    void validTransitions() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);
        assertThat(booking.status()).isEqualTo("PENDING_PAYMENT");

        // PENDING_PAYMENT -> PAID
        BookingTransitionResult paidResult = bookingService.transitionToPaid(booking.id());
        assertThat(paidResult.isSuccess()).isTrue();
        assertThat(paidResult.booking().status()).isEqualTo("PAID");

        // PAID -> COMPLETED
        BookingTransitionResult completedResult = bookingService.completeBooking("customer-1", booking.id());
        assertThat(completedResult.isSuccess()).isTrue();
        assertThat(completedResult.booking().status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE invalid transitions")
    void invalidTransitions() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // PENDING_PAYMENT -> COMPLETED (Invalid)
        BookingTransitionResult completedResult = bookingService.completeBooking("customer-1", booking.id());
        assertThat(completedResult.isSuccess()).isFalse();
        assertThat(completedResult.errorCode()).isEqualTo(BookingTransitionResult.INVALID_TRANSITION);

        // CANCELLED -> PAID (Invalid)
        bookingService.cancelBooking("customer-1", booking.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        BookingTransitionResult paidResult = bookingService.transitionToPaid(booking.id());
        assertThat(paidResult.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE cancellation rules")
    void cancellationRules() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // Customer can cancel PENDING_PAYMENT
        BookingTransitionResult cancelResult = bookingService.cancelBooking("customer-1", booking.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        assertThat(cancelResult.isSuccess()).isTrue();

        // Random user cannot cancel
        BookingState booking2 = bookingService.createBooking("task-2", "tasker-2", "customer-2", 50000);
        BookingTransitionResult forbiddenResult = bookingService.cancelBooking("random-user", booking2.id(), Instant.now().plus(10, ChronoUnit.HOURS));
        assertThat(forbiddenResult.errorCode()).isEqualTo(BookingTransitionResult.FORBIDDEN);
    }

    @Test
    @DisplayName("TID-TASK-030-API-BOOKING-READS list bookings with filters")
    void listBookings() {
        bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);
        bookingService.createBooking("task-2", "tasker-2", "customer-1", 60000);
        bookingService.createBooking("task-3", "tasker-1", "customer-2", 70000);

        // Filter by customer
        assertThat(bookingService.listBookings("customer-1", "customer", null)).hasSize(2);
        // Filter by tasker
        assertThat(bookingService.listBookings("tasker-1", "tasker", null)).hasSize(2);
        // Filter by other (both)
        assertThat(bookingService.listBookings("tasker-1", "any", null)).hasSize(2);
        // Filter by status
        assertThat(bookingService.listBookings("customer-1", "customer", "PAID")).isEmpty();
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE complete booking errors")
    void completeBookingErrors() {
        BookingState booking = bookingService.createBooking("t1", "tr1", "c1", 100);
        
        // Not found
        assertThat(bookingService.completeBooking("c1", "missing").errorCode()).isEqualTo("NOT_FOUND");
        // Forbidden
        assertThat(bookingService.completeBooking("stranger", booking.id()).errorCode()).isEqualTo("FORBIDDEN");
        // Invalid transition
        assertThat(bookingService.completeBooking("c1", booking.id()).errorCode()).isEqualTo("INVALID_TRANSITION");
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-TASKER-CANCEL tasker can cancel without fee")
    void taskerCancel() {
        BookingState booking = bookingService.createBooking("t1", "tr1", "c1", 100000);
        BookingTransitionResult res = bookingService.cancelBooking("tr1", booking.id(), Instant.now().plus(1, ChronoUnit.HOURS));
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.booking().cancellationFee()).isNull();
    }

    @Test
    @DisplayName("TID-TASK-064-payment-disclaimer record disclaimer acceptance")
    void disclaimerAcceptance() {
        BookingState booking = bookingService.createBooking("t1", "tr1", "c1", 100);
        assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

        Optional<BookingState> updated = bookingService.recordDisclaimerAcceptance(booking.id());
        assertThat(updated).isPresent();
        assertThat(updated.get().liabilityDisclaimerAccepted()).isTrue();

        assertThat(bookingService.recordDisclaimerAcceptance("missing")).isEmpty();
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE customer late-cancel applies fee")
    void customerLateCancelFee() {
        // Task scheduled 1 hour from now (late)
        Instant scheduledAt = Instant.now().plus(1, ChronoUnit.HOURS);
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 100000);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().cancellationFee()).isEqualTo(10000); // 10% of 100,000
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL-FEE customer free cancellation")
    void customerFreeCancel() {
        // Task scheduled 10 hours from now (free)
        Instant scheduledAt = Instant.now().plus(10, ChronoUnit.HOURS);
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 100000);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().cancellationFee()).isNull();
    }
}
