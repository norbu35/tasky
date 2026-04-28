package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingCompletionSignal;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private BookingDao bookingDao;

    @Mock
    private BookingReliabilityIncidentDao bookingReliabilityIncidentDao;

    @Mock
    private BookingCompletionSignalDao bookingCompletionSignalDao;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter counter;

    private BookingService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new BookingService(
                userProfileService,
                bookingDao,
                bookingReliabilityIncidentDao,
                bookingCompletionSignalDao,
                meterRegistry);
    }

    private BookingState assignedBooking() {
        return new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "ASSIGNED", null, false, now, "DIRECT", false, null, 0, null, now, now);
    }

    @Test
    void createBooking_simple() {
        BookingState result = service.createBooking("t1", "tk1", "c1", 1000);
        assertThat(result.status()).isEqualTo("ASSIGNED");
        verify(bookingDao)
                .insert(
                        anyString(),
                        eq("t1"),
                        eq("tk1"),
                        eq("c1"),
                        eq(1000),
                        eq("ASSIGNED"),
                        any(),
                        eq(false),
                        any(),
                        eq("DIRECT"),
                        eq(false),
                        any(),
                        any(),
                        any());
    }

    @Test
    void createBooking_withDisclaimer() {
        BookingState result = service.createBooking("t1", "tk1", "c1", 1000, true);
        assertThat(result.liabilityDisclaimerAccepted()).isTrue();
    }

    @Test
    void getBooking_found() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        assertThat(service.getBooking("b1")).isPresent();
    }

    @Test
    void listBookings_customer() {
        when(bookingDao.findByCustomerId("c1", null, null, 50)).thenReturn(List.of(assignedBooking()));
        assertThat(service.listBookings("c1", "customer", null)).hasSize(1);
    }

    @Test
    void listBookings_tasker() {
        when(bookingDao.findByTaskerId("tk1", null, null, 50)).thenReturn(List.of(assignedBooking()));
        assertThat(service.listBookings("tk1", "tasker", null)).hasSize(1);
    }

    @Test
    void listBookings_otherRole() {
        when(bookingDao.findByParticipant("u1", null, null, 50)).thenReturn(List.of());
        assertThat(service.listBookings("u1", "admin", null)).isEmpty();
    }

    @Test
    void transitionToPaid_notFound() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.empty());
        assertThat(service.transitionToPaid("b1")).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void transitionToPaid_invalidStatus() {
        BookingState completed = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "COMPLETED", null, false, now, "DIRECT", false, null, 0, null, now, now);
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(completed));
        assertThat(service.transitionToPaid("b1")).isEqualTo(BookingTransitionResult.INVALID_TRANSITION_RESULT);
    }

    @Test
    void transitionToPaid_success() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(assignedBooking()));
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        BookingTransitionResult result = service.transitionToPaid("b1");
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void completeBooking_notFound() {
        when(bookingDao.findById("b1")).thenReturn(Optional.empty());
        assertThat(service.completeBooking("c1", "b1")).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void completeBooking_forbidden() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        assertThat(service.completeBooking("other", "b1")).isEqualTo(BookingTransitionResult.FORBIDDEN_RESULT);
    }

    @Test
    void completeBooking_success() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(assignedBooking()));
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result.isSuccess()).isTrue();
        verify(userProfileService).updateUserStats("tk1", 0, true);
    }

    @Test
    void cancelBooking_notFound() {
        when(bookingDao.findById("b1")).thenReturn(Optional.empty());
        assertThat(service.cancelBooking("c1", "b1", now)).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void cancelBooking_forbidden() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        assertThat(service.cancelBooking("other", "b1", now)).isEqualTo(BookingTransitionResult.FORBIDDEN_RESULT);
    }

    @Test
    void cancelBooking_success() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(assignedBooking()));
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        BookingTransitionResult result = service.cancelBooking("c1", "b1", now.plusSeconds(86400));
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void markBookingDone_notFound() {
        when(bookingDao.findById("b1")).thenReturn(Optional.empty());
        assertThat(service.markBookingDone("tk1", "b1")).isEqualTo(BookingMarkDoneResult.NOT_FOUND_RESULT);
    }

    @Test
    void markBookingDone_forbidden() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        assertThat(service.markBookingDone("other", "b1")).isEqualTo(BookingMarkDoneResult.FORBIDDEN_RESULT);
    }

    @Test
    void markBookingDone_invalidStatus() {
        BookingState completed = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "COMPLETED", null, false, now, "DIRECT", false, null, 0, null, now, now);
        when(bookingDao.findById("b1")).thenReturn(Optional.of(completed));
        assertThat(service.markBookingDone("tk1", "b1")).isEqualTo(BookingMarkDoneResult.INVALID_TRANSITION_RESULT);
    }

    @Test
    void markBookingDone_success() {
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        when(bookingCompletionSignalDao.markDone(eq("b1"), eq("tk1"), any())).thenReturn(1);
        when(bookingCompletionSignalDao.findByBookingId("b1"))
                .thenReturn(Optional.of(new BookingCompletionSignal("b1", "tk1", now, null, null)));
        BookingMarkDoneResult result = service.markBookingDone("tk1", "b1");
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void forceTransition_notFound() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.empty());
        assertThat(service.forceTransition("b1", "CANCELLED")).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void forceTransition_success() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(assignedBooking()));
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        BookingTransitionResult result = service.forceTransition("b1", "CANCELLED");
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void forceTransition_rejectsPaymentStateOverride() {
        BookingTransitionResult result = service.forceTransition("b1", "PAID");

        assertThat(result).isEqualTo(BookingTransitionResult.INVALID_TRANSITION_RESULT);
    }

    @Test
    void transitionToDisputed_success() {
        when(bookingDao.findByIdForUpdate("b1")).thenReturn(Optional.of(assignedBooking()));
        when(bookingDao.findById("b1")).thenReturn(Optional.of(assignedBooking()));
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        BookingTransitionResult result = service.transitionToDisputed("b1");
        assertThat(result.isSuccess()).isTrue();
    }
}
