package mn.tasky.booking.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class BookingService {

    private final AuthService authService;
    private final ConcurrentHashMap<String, BookingState> bookingsById = new ConcurrentHashMap<>();

    public BookingService(AuthService authService) {
        this.authService = authService;
    }

    public BookingState createBooking(String taskId, String taskerId, String customerId, int price) {
        Instant now = Instant.now();
        BookingState booking = new BookingState(
            UUID.randomUUID().toString(),
            taskId,
            taskerId,
            customerId,
            price,
            "PENDING_PAYMENT",
            null,
            false,
            now,
            now
        );
        bookingsById.put(booking.id(), booking);
        return booking;
    }

    public Optional<BookingState> recordDisclaimerAcceptance(String bookingId) {
        BookingState updated = bookingsById.computeIfPresent(bookingId, (ignored, current) ->
            new BookingState(
                current.id(),
                current.taskId(),
                current.taskerId(),
                current.customerId(),
                current.price(),
                current.status(),
                current.cancellationFee(),
                true,
                current.createdAt(),
                Instant.now()
            )
        );
        return Optional.ofNullable(updated);
    }

    public Optional<BookingState> getBooking(String id) {
        return Optional.ofNullable(bookingsById.get(id));
    }

    public List<BookingState> listBookings(String userId, String role, String status) {
        return bookingsById.values().stream()
            .filter(booking -> {
                if ("customer".equalsIgnoreCase(role)) {
                    return booking.customerId().equals(userId);
                } else if ("tasker".equalsIgnoreCase(role)) {
                    return booking.taskerId().equals(userId);
                }
                return booking.customerId().equals(userId) || booking.taskerId().equals(userId);
            })
            .filter(booking -> status == null || booking.status().equalsIgnoreCase(status))
            .sorted(Comparator.comparing(BookingState::createdAt).reversed())
            .toList();
    }

    public BookingTransitionResult transitionToPaid(String bookingId) {
        return transition(bookingId, "PAID", List.of("PENDING_PAYMENT"), null);
    }

    public BookingTransitionResult completeBooking(String userId, String bookingId) {
        BookingState booking = bookingsById.get(bookingId);
        if (booking == null) return BookingTransitionResult.NOT_FOUND_RESULT;
        if (!booking.customerId().equals(userId)) return BookingTransitionResult.FORBIDDEN_RESULT;
        
        BookingTransitionResult result = transition(bookingId, "COMPLETED", List.of("PAID"), null);
        if (result.isSuccess()) {
            authService.updateUserStats(booking.taskerId(), 0, true);
        }
        return result;
    }

    public BookingTransitionResult cancelBooking(String userId, String bookingId, Instant scheduledAt) {
        BookingState booking = bookingsById.get(bookingId);
        if (booking == null) return BookingTransitionResult.NOT_FOUND_RESULT;
        
        boolean isCustomer = booking.customerId().equals(userId);
        boolean isTasker = booking.taskerId().equals(userId);
        if (!isCustomer && !isTasker) {
            return BookingTransitionResult.FORBIDDEN_RESULT;
        }

        Integer fee = null;
        if (isCustomer) {
            // Free cancellation > 4 hours before scheduled_at. 
            // Late cancellation incurs 10% fee (min 5,000 MNT).
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
        AtomicReference<BookingTransitionResult> result = new AtomicReference<>();

        bookingsById.compute(bookingId, (ignored, current) -> {
            if (current == null) {
                result.set(BookingTransitionResult.NOT_FOUND_RESULT);
                return null;
            }

            if (!allowedFrom.contains(current.status())) {
                result.set(BookingTransitionResult.INVALID_TRANSITION_RESULT);
                return current;
            }

            BookingState updated = new BookingState(
                current.id(),
                current.taskId(),
                current.taskerId(),
                current.customerId(),
                current.price(),
                newStatus,
                cancellationFeeOverride != null ? cancellationFeeOverride : current.cancellationFee(),
                current.liabilityDisclaimerAccepted(),
                current.createdAt(),
                Instant.now()
            );
            result.set(BookingTransitionResult.success(updated));
            return updated;
        });

        BookingTransitionResult resolved = result.get();
        return resolved != null ? resolved : BookingTransitionResult.NOT_FOUND_RESULT;
    }
}
