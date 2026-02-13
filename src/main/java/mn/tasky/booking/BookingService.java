package mn.tasky.booking;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    private final ConcurrentHashMap<String, BookingState> bookingsById = new ConcurrentHashMap<>();

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
        return transition(bookingId, "PAID", List.of("PENDING_PAYMENT"));
    }

    public BookingTransitionResult completeBooking(String userId, String bookingId) {
        BookingState booking = bookingsById.get(bookingId);
        if (booking == null) return BookingTransitionResult.NOT_FOUND_RESULT;
        if (!booking.customerId().equals(userId)) return BookingTransitionResult.FORBIDDEN_RESULT;
        
        return transition(bookingId, "COMPLETED", List.of("PAID"));
    }

    public BookingTransitionResult cancelBooking(String userId, String bookingId) {
        BookingState booking = bookingsById.get(bookingId);
        if (booking == null) return BookingTransitionResult.NOT_FOUND_RESULT;
        if (!booking.customerId().equals(userId) && !booking.taskerId().equals(userId)) {
            return BookingTransitionResult.FORBIDDEN_RESULT;
        }

        return transition(bookingId, "CANCELLED", List.of("PENDING_PAYMENT", "PAID"));
    }

    private BookingTransitionResult transition(String bookingId, String newStatus, List<String> allowedFrom) {
        BookingState current = bookingsById.get(bookingId);
        if (current == null) return BookingTransitionResult.NOT_FOUND_RESULT;

        if (!allowedFrom.contains(current.status())) {
            return BookingTransitionResult.INVALID_TRANSITION_RESULT;
        }

        BookingState updated = new BookingState(
            current.id(),
            current.taskId(),
            current.taskerId(),
            current.customerId(),
            current.price(),
            newStatus,
            current.cancellationFee(),
            current.liabilityDisclaimerAccepted(),
            current.createdAt(),
            Instant.now()
        );
        bookingsById.put(bookingId, updated);
        return BookingTransitionResult.success(updated);
    }

    public record BookingState(
        String id,
        String taskId,
        String taskerId,
        String customerId,
        int price,
        String status,
        Integer cancellationFee,
        boolean liabilityDisclaimerAccepted,
        Instant createdAt,
        Instant updatedAt
    ) {
    }

    public record BookingTransitionResult(BookingState booking, String errorCode) {
        public static final String NOT_FOUND = "NOT_FOUND";
        public static final String FORBIDDEN = "FORBIDDEN";
        public static final String INVALID_TRANSITION = "INVALID_TRANSITION";

        public static BookingTransitionResult success(BookingState booking) {
            return new BookingTransitionResult(booking, null);
        }

        public static final BookingTransitionResult NOT_FOUND_RESULT = new BookingTransitionResult(null, NOT_FOUND);
        public static final BookingTransitionResult FORBIDDEN_RESULT = new BookingTransitionResult(null, FORBIDDEN);
        public static final BookingTransitionResult INVALID_TRANSITION_RESULT = new BookingTransitionResult(null, INVALID_TRANSITION);

        public boolean isSuccess() {
            return booking != null;
        }
    }
}
