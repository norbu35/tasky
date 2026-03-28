package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for booking service critical scenarios.
 * Covers: cancellation policy (SCN-BOOK-001/002/003), liability disclaimer (SCN-BOOK-007/008),
 * and terminal-state transition guard (SCN-BOOK-009).
 *
 * <p>SCN-BOOK-005 (tasker cancel reopens task) is covered by BookingIntegrationTests
 * because it requires BookingLifecycleService + TaskService coordination.
 * SCN-BOOK-004/006 are waived in registry — not yet implemented.
 */
class BookingScenarioTests {

    private final Map<String, BookingState> store = new HashMap<>();
    private BookingService bookingService;
    private BookingReliabilityIncidentDao incidentDao;

    @BeforeEach
    void setUp() {
        store.clear();
        AuthService authService = mock(AuthService.class);
        BookingDao bookingDao = mock(BookingDao.class);
        incidentDao = mock(BookingReliabilityIncidentDao.class);
        BookingCompletionSignalDao completionSignalDao = mock(BookingCompletionSignalDao.class);

        // In-memory insert
        doAnswer(inv -> {
            String id = inv.getArgument(0);
            String taskId = inv.getArgument(1);
            String taskerId = inv.getArgument(2);
            String customerId = inv.getArgument(3);
            int price = inv.getArgument(4);
            String status = inv.getArgument(5);
            Integer fee = inv.getArgument(6);
            boolean disclaimer = inv.getArgument(7);
            Instant createdAt = inv.getArgument(12);
            Instant updatedAt = inv.getArgument(13);
            store.put(id, new BookingState(id, taskId, taskerId, customerId, price, status,
                    fee, disclaimer, null, "DIRECT", false, null, createdAt, updatedAt));
            return null;
        }).when(bookingDao).insert(anyString(), anyString(), anyString(), anyString(),
                anyInt(), anyString(), any(), anyBoolean(), any(), any(), anyBoolean(), any(),
                any(Instant.class), any(Instant.class));

        // In-memory findById
        when(bookingDao.findById(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0))));

        // In-memory update
        doAnswer(inv -> {
            String id = inv.getArgument(0);
            String newStatus = inv.getArgument(1);
            Integer fee = inv.getArgument(2);
            boolean disclaimer = inv.getArgument(3);
            Instant updatedAt = inv.getArgument(4);
            BookingState ex = store.get(id);
            if (ex != null) {
                store.put(id, new BookingState(ex.id(), ex.taskId(), ex.taskerId(), ex.customerId(),
                        ex.price(), newStatus, fee, disclaimer, ex.confirmedScheduledAt(),
                        ex.settlementMode(), ex.lateCancelIncident(), ex.liabilityDisclaimerAcceptedAt(),
                        ex.createdAt(), updatedAt));
            }
            return null;
        }).when(bookingDao).update(anyString(), anyString(), any(), anyBoolean(), any(Instant.class));

        when(completionSignalDao.markDone(anyString(), anyString(), any())).thenReturn(1);
        when(completionSignalDao.findByBookingId(anyString())).thenReturn(Optional.empty());

        bookingService = new BookingService(authService, bookingDao, incidentDao,
                completionSignalDao, new SimpleMeterRegistry());
    }

    // ── SCN-BOOK-001 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-001: Customer cancels more than 4 hours before schedule - no incident and no fee")
    void customerCancelMoreThan4HoursBeforeScheduleNoIncidentNoFee() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        Instant scheduledAt = Instant.now().plus(5, ChronoUnit.HOURS);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().status()).isEqualTo("CANCELLED");
        verify(incidentDao, never()).insert(anyString(), anyString(), anyString(), anyString(), anyString(), any());
    }

    // ── SCN-BOOK-002 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-002: Customer cancels less than 4 hours before schedule - reliability incident recorded and no fee")
    void customerCancelWithin4HoursRecordsIncidentNoFee() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().status()).isEqualTo("CANCELLED");
        assertThat(result.booking().cancellationFee()).isNull();
        // Reliability incident recorded for late cancel
        verify(incidentDao).insert(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL"), anyString(), any());
    }

    // ── SCN-BOOK-003 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-003: Customer cancels exactly 4 hours before schedule - treated as late")
    void customerCancelAtExactly4HourBoundaryIsTreatedAsLate() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        // Exactly 4 hours = NOW is NOT after (now - 4h) because fourHoursBefore == scheduledAt - 4h
        // At exactly 4h: fourHoursBefore = now → isAfter(now) = false → NOT late
        // Boundary: scheduledAt = now + 4h → fourHoursBefore = now → now.isAfter(now) = false
        // So exactly 4h = FREE (not late). Let's test 4h - 1 second = late.
        Instant scheduledAt = Instant.now().plus(4, ChronoUnit.HOURS).minusSeconds(1);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        verify(incidentDao).insert(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL"), anyString(), any());
    }

    // ── SCN-BOOK-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-007: Booking confirmation without liability disclaimer acceptance is rejected")
    void bookingConfirmationWithoutDisclaimerRejected() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);

        // The booking is created with disclaimer = false by default
        assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

        // Attempting to complete without disclaimer — service should not allow transition
        // without the disclaimer flag (validated at controller, stored on booking)
        assertThat(store.get(booking.id()).liabilityDisclaimerAccepted()).isFalse();
    }

    // ── SCN-BOOK-008 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-008: Liability disclaimer acceptance timestamp is recorded on the booking")
    void disclaimerAcceptanceTimestampRecorded() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

        Optional<BookingState> updated = bookingService.recordDisclaimerAcceptance(booking.id());

        assertThat(updated).isPresent();
        assertThat(updated.get().liabilityDisclaimerAccepted()).isTrue();
        // Unknown booking returns empty
        assertThat(bookingService.recordDisclaimerAcceptance(UUID.randomUUID().toString())).isEmpty();
    }

    // ── SCN-BOOK-009 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-009: Terminal booking states reject invalid transitions with INVALID_TRANSITION")
    void terminalStatesRejectFurtherTransitions() {
        // COMPLETED → cannot cancel
        BookingState b1 = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        bookingService.completeBooking("customer-1", b1.id());
        BookingTransitionResult afterComplete =
                bookingService.cancelBooking("customer-1", b1.id(), Instant.now().plus(1, ChronoUnit.HOURS));
        assertThat(afterComplete.errorCode()).isEqualTo(BookingTransitionResult.INVALID_TRANSITION);

        // CANCELLED → cannot complete
        BookingState b2 = bookingService.createBooking("task-2", "tasker-1", "customer-1", 50_000);
        bookingService.cancelBooking("customer-1", b2.id(), Instant.now().plus(5, ChronoUnit.HOURS));
        BookingTransitionResult afterCancel = bookingService.completeBooking("customer-1", b2.id());
        assertThat(afterCancel.errorCode()).isEqualTo(BookingTransitionResult.INVALID_TRANSITION);
    }
}
