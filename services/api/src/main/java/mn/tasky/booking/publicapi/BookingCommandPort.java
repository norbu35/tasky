package mn.tasky.booking.publicapi;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;

public interface BookingCommandPort {
    BookingState createBooking(
            String taskId,
            String taskerId,
            String customerId,
            int price,
            boolean liabilityDisclaimerAccepted,
            Instant confirmedScheduledAt);

    Optional<BookingState> recordDisclaimerAcceptance(String bookingId);

    BookingTransitionResult cancelBooking(String actorUserId, String bookingId);

    BookingTransitionResult completeBooking(String actorUserId, String bookingId);

    BookingMarkDoneResult markBookingDone(String userId, String bookingId);
}
