package mn.tasky.booking.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
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
    private final BookingReliabilityIncidentDao bookingReliabilityIncidentDao;

    public BookingService(
        AuthService authService,
        BookingDao bookingDao,
        BookingReliabilityIncidentDao bookingReliabilityIncidentDao
    ) {
        this.authService = authService;
        this.bookingDao = bookingDao;
        this.bookingReliabilityIncidentDao = bookingReliabilityIncidentDao;
    }

    public BookingState createBooking(String taskId, String taskerId, String customerId, int price) {
        return createBooking(taskId, taskerId, customerId, price, false);
    }

    public BookingState createBooking(
        String taskId,
        String taskerId,
        String customerId,
        int price,
        boolean liabilityDisclaimerAccepted
    ) {
        Instant now = Instant.now();
        String id = UUID.randomUUID().toString();
        BookingState booking = new BookingState(id, taskId, taskerId, customerId, price,
            "ASSIGNED", null, liabilityDisclaimerAccepted, now, now);
        bookingDao.insert(
            id,
            taskId,
            taskerId,
            customerId,
            price,
            "ASSIGNED",
            null,
            liabilityDisclaimerAccepted,
            now,
            now
        );
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
        return listBookings(userId, role, status, null, 50);
    }

    public List<BookingState> listBookings(String userId, String role, String status, String cursor, int limit) {
        if ("customer".equalsIgnoreCase(role)) {
            return bookingDao.findByCustomerId(userId, status, cursor, limit);
        } else if ("tasker".equalsIgnoreCase(role)) {
            return bookingDao.findByTaskerId(userId, status, cursor, limit);
        }
        return bookingDao.findByParticipant(userId, status, cursor, limit);
    }

    public BookingTransitionResult transitionToPaid(String bookingId) {
        return transition(bookingId, "PAID", List.of("ASSIGNED"), null);
    }

    public BookingTransitionResult completeBooking(String userId, String bookingId) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) return BookingTransitionResult.NOT_FOUND_RESULT;
        BookingState booking = bookingOpt.get();
        if (!booking.customerId().equals(userId)) return BookingTransitionResult.FORBIDDEN_RESULT;

        BookingTransitionResult result = transition(bookingId, "COMPLETED", List.of("ASSIGNED", "PAID"), null);
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

        boolean lateCustomerCancellation = isCustomer && isLateCancellation(scheduledAt);
        BookingTransitionResult result = transition(bookingId, "CANCELLED", List.of("ASSIGNED", "PAID"), null);
        if (result.isSuccess() && lateCustomerCancellation) {
            bookingReliabilityIncidentDao.insert(
                UUID.randomUUID().toString(),
                bookingId,
                userId,
                "CUSTOMER_LATE_CANCEL",
                "Customer cancelled within 4 hours of scheduled task time.",
                Instant.now()
            );
        }
        return result;
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

    private boolean isLateCancellation(Instant scheduledAt) {
        if (scheduledAt == null) {
            return false;
        }
        Instant fourHoursBefore = scheduledAt.minus(4, java.time.temporal.ChronoUnit.HOURS);
        return Instant.now().isAfter(fourHoursBefore);
    }
}
