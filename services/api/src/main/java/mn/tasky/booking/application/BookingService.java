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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for managing bookings between customers and taskers.
 * Handles the booking lifecycle, including creation, status transitions,
 * cancellations, and completion signals.
 */
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

    /**
     * Creates a new booking with the default liability disclaimer acceptance (false).
     *
     * @param taskId     The ID of the task being booked.
     * @param taskerId   The ID of the tasker assigned to the task.
     * @param customerId The ID of the customer who created the task.
     * @param price      The agreed-upon price for the task.
     * @return The newly created {@link BookingState}.
     */
    public BookingState createBooking(String taskId, String taskerId, String customerId, int price) {
        return createBooking(taskId, taskerId, customerId, price, false, null);
    }

    /**
     * Creates a new booking with an explicitly provided liability disclaimer acceptance status.
     *
     * @param taskId                      The ID of the task being booked.
     * @param taskerId                    The ID of the tasker assigned to the task.
     * @param customerId                  The ID of the customer who created the task.
     * @param price                       The agreed-upon price for the task.
     * @param liabilityDisclaimerAccepted True if the disclaimer is accepted; false otherwise.
     * @return The newly created {@link BookingState}.
     */
    public BookingState createBooking(
            String taskId, String taskerId, String customerId, int price, boolean liabilityDisclaimerAccepted) {
        return createBooking(taskId, taskerId, customerId, price, liabilityDisclaimerAccepted, null);
    }

    /**
     * Creates a new booking with liability disclaimer and confirmed schedule.
     *
     * @param taskId                      The ID of the task being booked.
     * @param taskerId                    The ID of the tasker assigned to the task.
     * @param customerId                  The ID of the customer who created the task.
     * @param price                       The agreed-upon price for the task.
     * @param liabilityDisclaimerAccepted True if the disclaimer is accepted; false otherwise.
     * @param confirmedScheduledAt        The initial confirmed schedule from the task's scheduledAt.
     * @return The newly created {@link BookingState}.
     */
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

    /**
     * Records that the liability disclaimer has been accepted for a specific booking.
     *
     * @param bookingId The ID of the booking.
     * @return An Optional containing the updated {@link BookingState}, or empty if not found.
     */
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

    /**
     * Retrieves a booking by its ID.
     *
     * @param id The ID of the booking.
     * @return An Optional containing the {@link BookingState}, or empty if not found.
     */
    public Optional<BookingState> getBooking(String id) {
        return bookingDao.findById(id);
    }

    /**
     * Lists bookings for a specific user, role, and status, returning the first page.
     *
     * @param userId The ID of the user (customer or tasker).
     * @param role   The role of the user ("customer" or "tasker"). If not recognized, matches either.
     * @param status The status of the bookings to filter by (e.g., "ASSIGNED", "COMPLETED").
     * @return A list of matching {@link BookingState} instances.
     */
    public List<BookingState> listBookings(String userId, String role, String status) {
        return listBookings(userId, role, status, null, 50);
    }

    /**
     * Lists a paginated set of bookings for a specific user, role, and status.
     *
     * @param userId The ID of the user.
     * @param role   The role of the user ("customer" or "tasker").
     * @param status The status of the bookings to filter by.
     * @param cursor The pagination cursor.
     * @param limit  The maximum number of results to return.
     * @return A list of matching {@link BookingState} instances.
     */
    public List<BookingState> listBookings(String userId, String role, String status, String cursor, int limit) {
        if ("customer".equalsIgnoreCase(role)) {
            return bookingDao.findByCustomerId(userId, status, cursor, limit);
        } else if ("tasker".equalsIgnoreCase(role)) {
            return bookingDao.findByTaskerId(userId, status, cursor, limit);
        }
        return bookingDao.findByParticipant(userId, status, cursor, limit);
    }

    /**
     * Transitions a booking to the "PAID" state. Only allowed from "ASSIGNED".
     *
     * @param bookingId The ID of the booking to transition.
     * @return The {@link BookingTransitionResult} describing success or failure.
     */
    public BookingTransitionResult transitionToPaid(String bookingId) {
        return transition(bookingId, "PAID", List.of("ASSIGNED"));
    }

    private BookingTransitionResult transition(String bookingId, String newStatus, List<String> allowedFrom) {
        Optional<BookingState> currentOpt = bookingDao.findById(bookingId);
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
                current.createdAt(),
                now);
        return BookingTransitionResult.success(updated);
    }

    /**
     * Completes a booking. Must be requested by the customer.
     * Allowed transitions are from "ASSIGNED" or "PAID".
     *
     * @param userId    The ID of the user requesting completion (must be the customer).
     * @param bookingId The ID of the booking to complete.
     * @return The {@link BookingTransitionResult} describing success or failure.
     */
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

        BookingTransitionResult result = transition(bookingId, "COMPLETED", List.of("ASSIGNED", "PAID"));
        if (result.isSuccess()) {
            userProfileService.updateUserStats(booking.taskerId(), 0, true);
        }
        return result;
    }

    /**
     * Cancels a booking. Can be requested by either the customer or the tasker.
     * Allowed transitions are from "ASSIGNED" or "PAID".
     * If the customer cancels late (within 4 hours of scheduled time), a reliability incident is logged.
     *
     * @param userId      The ID of the user requesting cancellation.
     * @param bookingId   The ID of the booking to cancel.
     * @param scheduledAt The scheduled time of the underlying task, used to calculate late cancellations.
     * @return The {@link BookingTransitionResult} describing success or failure.
     */
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
        BookingTransitionResult result = transition(bookingId, "CANCELLED", List.of("ASSIGNED", "PAID"));
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
        if (scheduledAt == null) {
            return false;
        }
        Instant fourHoursBefore = scheduledAt.minus(4, java.time.temporal.ChronoUnit.HOURS);
        return Instant.now().isAfter(fourHoursBefore);
    }

    /**
     * Marks a booking as done (signal from the tasker).
     * The booking must be in the "ASSIGNED" or "PAID" state.
     *
     * @param userId    The ID of the user marking it done (must be the tasker).
     * @param bookingId The ID of the booking.
     * @return The {@link BookingMarkDoneResult} detailing the outcome.
     */
    public BookingMarkDoneResult markBookingDone(String userId, String bookingId) {
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
        int inserted = bookingCompletionSignalDao.markDone(bookingId, userId, now);
        log.info("Tasker {} marked booking {} as done", userId, bookingId);
        Instant markedDoneAt = bookingCompletionSignalDao
                .findByBookingId(bookingId)
                .map(BookingCompletionSignal::markedDoneAt)
                .orElse(now);

        return BookingMarkDoneResult.success(booking, markedDoneAt, inserted > 0);
    }

    /**
     * Retrieves the time the tasker marked the booking as done, if any.
     *
     * @param bookingId The ID of the booking.
     * @return An Optional containing the {@link Instant} it was marked done, or empty.
     */
    public Optional<Instant> getTaskerMarkedDoneAt(String bookingId) {
        return bookingCompletionSignalDao.findByBookingId(bookingId).map(BookingCompletionSignal::markedDoneAt);
    }
}
