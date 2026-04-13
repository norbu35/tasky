package mn.tasky.booking.publicapi;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.booking.dto.BookingState;

public interface BookingQueryPort {
    Optional<BookingState> getBooking(String id);

    List<BookingState> listBookings(String userId, String role, String status);

    List<BookingState> listBookings(String userId, String role, String status, String cursor, int limit);

    Optional<Instant> getTaskerMarkedDoneAt(String bookingId);
}
