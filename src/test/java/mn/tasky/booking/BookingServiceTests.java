package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

class BookingServiceTests {

    private BookingService bookingService;
    private final Map<String, BookingState> store = new HashMap<>();

    @BeforeEach
    void setUp() {
        store.clear();
        AuthService authService = Mockito.mock(AuthService.class);
        BookingDao bookingDao = Mockito.mock(BookingDao.class);
        BookingReliabilityIncidentDao bookingReliabilityIncidentDao = Mockito.mock(BookingReliabilityIncidentDao.class);

        // Simulate insert: capture the booking into the in-memory store
        doAnswer(invocation -> {
            String id = invocation.getArgument(0);
            String taskId = invocation.getArgument(1);
            String taskerId = invocation.getArgument(2);
            String customerId = invocation.getArgument(3);
            int price = invocation.getArgument(4);
            String status = invocation.getArgument(5);
            Integer cancellationFee = invocation.getArgument(6);
            boolean disclaimer = invocation.getArgument(7);
            Instant createdAt = invocation.getArgument(8);
            Instant updatedAt = invocation.getArgument(9);
            store.put(id, new BookingState(id, taskId, taskerId, customerId, price,
                status, cancellationFee, disclaimer, createdAt, updatedAt));
            return null;
        }).when(bookingDao).insert(anyString(), anyString(), anyString(), anyString(),
            anyInt(), anyString(), any(), anyBoolean(), any(Instant.class), any(Instant.class));

        // Simulate findById: look up from store
        when(bookingDao.findById(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            return Optional.ofNullable(store.get(id));
        });

        // Simulate update: modify the stored booking
        doAnswer(invocation -> {
            String id = invocation.getArgument(0);
            String newStatus = invocation.getArgument(1);
            Integer fee = invocation.getArgument(2);
            boolean disclaimer = invocation.getArgument(3);
            Instant updatedAt = invocation.getArgument(4);
            BookingState existing = store.get(id);
            if (existing != null) {
                store.put(id, new BookingState(existing.id(), existing.taskId(), existing.taskerId(),
                    existing.customerId(), existing.price(), newStatus, fee, disclaimer,
                    existing.createdAt(), updatedAt));
            }
            return null;
        }).when(bookingDao).update(anyString(), anyString(), any(), anyBoolean(), any(Instant.class));

        // Simulate listing queries
        when(bookingDao.findByCustomerId(anyString(), any(), any(), anyInt())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            String status = invocation.getArgument(1);
            return store.values().stream()
                .filter(b -> b.customerId().equals(userId))
                .filter(b -> status == null || b.status().equalsIgnoreCase(status))
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .toList();
        });

        when(bookingDao.findByTaskerId(anyString(), any(), any(), anyInt())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            String status = invocation.getArgument(1);
            return store.values().stream()
                .filter(b -> b.taskerId().equals(userId))
                .filter(b -> status == null || b.status().equalsIgnoreCase(status))
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .toList();
        });

        when(bookingDao.findByParticipant(anyString(), any(), any(), anyInt())).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            String status = invocation.getArgument(1);
            return store.values().stream()
                .filter(b -> b.customerId().equals(userId) || b.taskerId().equals(userId))
                .filter(b -> status == null || b.status().equalsIgnoreCase(status))
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .toList();
        });

        bookingService = new BookingService(authService, bookingDao, bookingReliabilityIncidentDao);
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE valid transitions")
    void validTransitions() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);
        assertThat(booking.status()).isEqualTo("ASSIGNED");

        // ASSIGNED -> PAID
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

        // ASSIGNED -> COMPLETED (Valid)
        BookingTransitionResult completedResult = bookingService.completeBooking("customer-1", booking.id());
        assertThat(completedResult.isSuccess()).isTrue();
        assertThat(completedResult.booking().status()).isEqualTo("COMPLETED");

        BookingState secondBooking = bookingService.createBooking("task-2", "tasker-1", "customer-1", 50000);
        bookingService.cancelBooking("customer-1", secondBooking.id(), Instant.now().plus(10, ChronoUnit.HOURS));

        // CANCELLED -> PAID (Invalid)
        BookingTransitionResult paidResult = bookingService.transitionToPaid(secondBooking.id());
        assertThat(paidResult.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE cancellation rules")
    void cancellationRules() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50000);

        // Customer can cancel ASSIGNED
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
        assertThat(bookingService.listBookings("customer-1", "customer", "ASSIGNED")).hasSize(2);
    }

    @Test
    @DisplayName("TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE complete booking errors")
    void completeBookingErrors() {
        BookingState booking = bookingService.createBooking("t1", "tr1", "c1", 100);

        // Not found
        assertThat(bookingService.completeBooking("c1", UUID.randomUUID().toString()).errorCode()).isEqualTo("NOT_FOUND");
        // Forbidden
        assertThat(bookingService.completeBooking("stranger", booking.id()).errorCode()).isEqualTo("FORBIDDEN");
        // Already completed cannot transition again
        assertThat(bookingService.completeBooking("c1", booking.id()).isSuccess()).isTrue();
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
    @DisplayName("TID-TASK-064-API-DISCLAIMER-REQUIRED record disclaimer acceptance")
    void disclaimerAcceptance() {
        BookingState booking = bookingService.createBooking("t1", "tr1", "c1", 100);
        assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

        Optional<BookingState> updated = bookingService.recordDisclaimerAcceptance(booking.id());
        assertThat(updated).isPresent();
        assertThat(updated.get().liabilityDisclaimerAccepted()).isTrue();

        assertThat(bookingService.recordDisclaimerAcceptance(UUID.randomUUID().toString())).isEmpty();
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-CUSTOMER-CANCEL customer late-cancel records incident without fee")
    void customerLateCancelNoFee() {
        // Task scheduled 1 hour from now (late)
        Instant scheduledAt = Instant.now().plus(1, ChronoUnit.HOURS);
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 100000);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().cancellationFee()).isNull();
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
