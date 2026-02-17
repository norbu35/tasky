package mn.tasky.booking.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final AuthService authService;
    private final BookingDao bookingDao;

    public BookingService(AuthService authService, BookingDao bookingDao) {
        this.authService = authService;
        this.bookingDao = bookingDao;
    }

    public BookingState createBooking(String taskId, String taskerId, String customerId, int price) {
        Instant now = Instant.now();
        String id = UUID.randomUUID().toString();
        BookingState booking = new BookingState(id, taskId, taskerId, customerId, price,
            "PENDING_PAYMENT", null, false, now, now);
        bookingDao.insert(id, taskId, taskerId, customerId, price, "PENDING_PAYMENT", null, false, now, now);
        return booking;
    }

    public Optional<BookingState> recordDisclaimerAcceptance(String bookingId) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) return Optional.empty();

        BookingState current = bookingOpt.get();
        Instant now = Instant.now();
        bookingDao.update(bookingId, current.status(), current.cancellationFee(), true, now);
        return bookingDao.findById(bookingId);
    }

    public Optional<BookingState> getBooking(String id) {
        return bookingDao.findById(id);
    }

    public List<BookingState> listBookings(String userId, String role, String status) {
        if ("customer".equalsIgnoreCase(role)) {
            return bookingDao.findByCustomerId(userId, status);
        } else if ("tasker".equalsIgnoreCase(role)) {
            return bookingDao.findByTaskerId(userId, status);
        }
        return bookingDao.findByParticipant(userId, status);
    }

    public BookingTransitionResult transitionToPaid(String bookingId) {
        return transition(bookingId, "PAID", List.of("PENDING_PAYMENT"), null);
    }

    public BookingTransitionResult completeBooking(String userId, String bookingId) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) return BookingTransitionResult.NOT_FOUND_RESULT;
        BookingState booking = bookingOpt.get();
        if (!booking.customerId().equals(userId)) return BookingTransitionResult.FORBIDDEN_RESULT;

        BookingTransitionResult result = transition(bookingId, "COMPLETED", List.of("PAID"), null);
        if (result.isSuccess()) {
            authService.updateUserStats(booking.taskerId(), 0, true);
        }
        return result;
    }

    public BookingTransitionResult cancelBooking(String userId, String bookingId, Instant scheduledAt) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) return BookingTransitionResult.NOT_FOUND_RESULT;
        BookingState booking = bookingOpt.get();

        boolean isCustomer = booking.customerId().equals(userId);
        boolean isTasker = booking.taskerId().equals(userId);
        if (!isCustomer && !isTasker) {
            return BookingTransitionResult.FORBIDDEN_RESULT;
        }

        Integer fee = null;
        if (isCustomer) {
            Instant fourHoursBefore = scheduledAt.minus(4, java.time.temporal.ChronoUnit.HOURS);
            if (Instant.now().isAfter(fourHoursBefore)) {
                fee = (int) Math.max(5000, booking.price() * 0.1);
            }
        }

        return transition(bookingId, "CANCELLED", List.of("PENDING_PAYMENT", "PAID"), fee);
    }

    private BookingTransitionResult transition(
        String bookingId,
        String newStatus,
        List<String> allowedFrom,
        Integer cancellationFeeOverride
    ) {
        Optional<BookingState> currentOpt = bookingDao.findById(bookingId);
        if (currentOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }

        BookingState current = currentOpt.get();
        if (!allowedFrom.contains(current.status())) {
            return BookingTransitionResult.INVALID_TRANSITION_RESULT;
        }

        Instant now = Instant.now();
        Integer fee = cancellationFeeOverride != null ? cancellationFeeOverride : current.cancellationFee();
        bookingDao.update(bookingId, newStatus, fee, current.liabilityDisclaimerAccepted(), now);

        BookingState updated = new BookingState(
            current.id(), current.taskId(), current.taskerId(), current.customerId(),
            current.price(), newStatus, fee, current.liabilityDisclaimerAccepted(),
            current.createdAt(), now
        );
        return BookingTransitionResult.success(updated);
    }
}
