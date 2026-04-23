package mn.tasky.booking.application;

import io.micrometer.core.instrument.MeterRegistry;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingCompletionSignal;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private final UserProfileService userProfileService;
    private final BookingDao bookingDao;
    private final BookingReliabilityIncidentDao bookingReliabilityIncidentDao;
    private final BookingCompletionSignalDao bookingCompletionSignalDao;
    private final MeterRegistry meterRegistry;

    public BookingService(
            UserProfileService userProfileService,
            BookingDao bookingDao,
            BookingReliabilityIncidentDao bookingReliabilityIncidentDao,
            BookingCompletionSignalDao bookingCompletionSignalDao,
            MeterRegistry meterRegistry) {
        this.userProfileService = userProfileService;
        this.bookingDao = bookingDao;
        this.bookingReliabilityIncidentDao = bookingReliabilityIncidentDao;
        this.bookingCompletionSignalDao = bookingCompletionSignalDao;
        this.meterRegistry = meterRegistry;
    }

    public BookingState createBooking(String taskId, String taskerId, String customerId, int price) {
        return createBooking(taskId, taskerId, customerId, price, false, null);
    }

    public BookingState createBooking(
            String taskId, String taskerId, String customerId, int price, boolean liabilityDisclaimerAccepted) {
        return createBooking(taskId, taskerId, customerId, price, liabilityDisclaimerAccepted, null);
    }

    @Transactional
    public BookingState createBooking(
            String taskId,
            String taskerId,
            String customerId,
            int price,
            boolean liabilityDisclaimerAccepted,
            Instant confirmedScheduledAt) {
        Instant now = Instant.now();
        String id = UUID.randomUUID().toString();
        Instant disclaimerAcceptedAt = liabilityDisclaimerAccepted ? now : null;
        BookingState booking = new BookingState(
                id,
                taskId,
                taskerId,
                customerId,
                price,
                "ASSIGNED",
                null,
                liabilityDisclaimerAccepted,
                confirmedScheduledAt,
                "DIRECT",
                false,
                disclaimerAcceptedAt,
                0,
                null,
                now,
                now);
        bookingDao.insert(
                id,
                taskId,
                taskerId,
                customerId,
                price,
                "ASSIGNED",
                null,
                liabilityDisclaimerAccepted,
                confirmedScheduledAt,
                "DIRECT",
                false,
                disclaimerAcceptedAt,
                now,
                now);
        log.info(
                "Booking created: id={}, task={}, tasker={}, customer={}, price={}",
                id,
                taskId,
                taskerId,
                customerId,
                price);
        return booking;
    }

    public Optional<BookingState> recordDisclaimerAcceptance(String bookingId) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return Optional.empty();
        }
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

    @Transactional
    public BookingTransitionResult transitionToPaid(String bookingId) {
        return transition(bookingId, "PAID", List.of("ASSIGNED"));
    }

    private BookingTransitionResult transition(String bookingId, String newStatus, List<String> allowedFrom) {
        Optional<BookingState> currentOpt = bookingDao.findByIdForUpdate(bookingId);
        if (currentOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        BookingState current = currentOpt.get();
        if (!allowedFrom.contains(current.status())) {
            return BookingTransitionResult.INVALID_TRANSITION_RESULT;
        }
        String oldStatus = current.status();
        Instant now = Instant.now();
        Integer fee = current.cancellationFee();
        bookingDao.update(bookingId, newStatus, fee, current.liabilityDisclaimerAccepted(), now);
        meterRegistry
                .counter("tasky.booking.transitions", "from", oldStatus, "to", newStatus)
                .increment();
        log.info("Booking {} transitioned from {} to {}", bookingId, current.status(), newStatus);
        BookingState updated = new BookingState(
                current.id(),
                current.taskId(),
                current.taskerId(),
                current.customerId(),
                current.price(),
                newStatus,
                fee,
                current.liabilityDisclaimerAccepted(),
                current.confirmedScheduledAt(),
                current.settlementMode(),
                current.lateCancelIncident(),
                current.liabilityDisclaimerAcceptedAt(),
                current.completionReminderCount(),
                current.completionReminderLastAt(),
                current.createdAt(),
                now);
        return BookingTransitionResult.success(updated);
    }

    @Transactional
    public BookingTransitionResult completeBooking(String userId, String bookingId) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        BookingState booking = bookingOpt.get();
        if (!booking.customerId().equals(userId)) {
            return BookingTransitionResult.FORBIDDEN_RESULT;
        }
        BookingTransitionResult result = transition(bookingId, "COMPLETED", List.of("ASSIGNED", "PAID", "DISPUTED"));
        if (result.isSuccess()) {
            userProfileService.updateUserStats(booking.taskerId(), 0, true);
        }
        return result;
    }

    @Transactional
    public BookingTransitionResult cancelBooking(String userId, String bookingId, Instant scheduledAt) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        BookingState booking = bookingOpt.get();
        boolean isCustomer = booking.customerId().equals(userId);
        boolean isTasker = booking.taskerId().equals(userId);
        if (!isCustomer && !isTasker) {
            return BookingTransitionResult.FORBIDDEN_RESULT;
        }
        boolean lateCustomerCancellation = isCustomer && isLateCancellation(scheduledAt);
        BookingTransitionResult result = transition(bookingId, "CANCELLED", List.of("ASSIGNED", "PAID", "DISPUTED"));
        if (result.isSuccess() && lateCustomerCancellation) {
            log.warn("Late cancellation for booking {} by customer {}", bookingId, userId);
            Instant windowStart = Instant.now().minus(28, java.time.temporal.ChronoUnit.DAYS);
            long recentIncidents =
                    bookingReliabilityIncidentDao.countRecentIncidents(userId, "CUSTOMER_LATE_CANCEL%", windowStart);
            String incidentType =
                    recentIncidents == 0 ? "CUSTOMER_LATE_CANCEL_WARNING" : "CUSTOMER_LATE_CANCEL_PENALTY";
            bookingReliabilityIncidentDao.insert(
                    UUID.randomUUID().toString(),
                    bookingId,
                    userId,
                    incidentType,
                    recentIncidents == 0
                            ? "Customer cancelled within 4 hours. Warning issued."
                            : "Customer cancelled within 4 hours. Ranking penalty and Instant Match disabled.",
                    Instant.now());
            if ("CUSTOMER_LATE_CANCEL_PENALTY".equals(incidentType)) {
                userProfileService.revokeInstantMatch(userId, java.time.Duration.ofDays(30));
            }
        }
        return result;
    }

    private boolean isLateCancellation(Instant scheduledAt) {
        return scheduledAt != null && Instant.now().isAfter(scheduledAt.minus(4, java.time.temporal.ChronoUnit.HOURS));
    }

    public BookingMarkDoneResult markBookingDone(String userId, String bookingId) {
        return markBookingDone(userId, bookingId, null, null);
    }

    public BookingMarkDoneResult markBookingDone(
            String userId, String bookingId, @Nullable String proofPhotoKey, @Nullable String proofNote) {
        Optional<BookingState> bookingOpt = bookingDao.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return BookingMarkDoneResult.NOT_FOUND_RESULT;
        }
        BookingState booking = bookingOpt.get();
        if (!booking.taskerId().equals(userId)) {
            return BookingMarkDoneResult.FORBIDDEN_RESULT;
        }
        if (!"ASSIGNED".equals(booking.status()) && !"PAID".equals(booking.status())) {
            return BookingMarkDoneResult.INVALID_TRANSITION_RESULT;
        }
        Instant now = Instant.now();
        int inserted;
        if (proofPhotoKey != null || proofNote != null) {
            inserted = bookingCompletionSignalDao.markDoneWithProof(bookingId, userId, now, proofPhotoKey, proofNote);
        } else {
            inserted = bookingCompletionSignalDao.markDone(bookingId, userId, now);
        }
        log.info("Tasker {} marked booking {} as done", userId, bookingId);
        Instant markedDoneAt = bookingCompletionSignalDao
                .findByBookingId(bookingId)
                .map(BookingCompletionSignal::markedDoneAt)
                .orElse(now);
        return BookingMarkDoneResult.success(booking, markedDoneAt, inserted > 0);
    }

    public Optional<Instant> getTaskerMarkedDoneAt(String bookingId) {
        return bookingCompletionSignalDao.findByBookingId(bookingId).map(BookingCompletionSignal::markedDoneAt);
    }

    @Transactional
    public BookingTransitionResult forceTransition(String bookingId, String newStatus) {
        var bookingOpt = bookingDao.findByIdForUpdate(bookingId);
        if (bookingOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        BookingState current = bookingOpt.get();
        Instant now = Instant.now();
        bookingDao.updateStatus(bookingId, newStatus, now);
        meterRegistry
                .counter("tasky.booking.transitions", "from", current.status(), "to", newStatus)
                .increment();
        log.info(
                "Booking {} force-transitioned from {} to {} (admin override)", bookingId, current.status(), newStatus);
        var updated = bookingDao.findById(bookingId).orElseThrow();
        return BookingTransitionResult.success(updated);
    }

    @Transactional
    public BookingTransitionResult transitionToDisputed(String bookingId) {
        var bookingOpt = bookingDao.findByIdForUpdate(bookingId);
        if (bookingOpt.isEmpty()) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        BookingState current = bookingOpt.get();
        if (!"ASSIGNED".equals(current.status()) && !"PAID".equals(current.status())) {
            return BookingTransitionResult.error("INVALID_TRANSITION", "Can only dispute ASSIGNED or PAID bookings");
        }
        Instant now = Instant.now();
        bookingDao.updateStatus(bookingId, "DISPUTED", now);
        meterRegistry
                .counter("tasky.booking.transitions", "from", current.status(), "to", "DISPUTED")
                .increment();
        log.info("Booking {} transitioned from {} to DISPUTED", bookingId, current.status());
        var updated = bookingDao.findById(bookingId).orElseThrow();
        return BookingTransitionResult.success(updated);
    }
}
