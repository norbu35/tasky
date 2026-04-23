package mn.tasky.booking.publicapi;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.booking.dto.RebookResult;

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

    // Schedule operations
    BookingScheduleEvent requestReschedule(
            String bookingId, String actorUserId, Instant proposedScheduledAt, String reason);

    BookingScheduleEvent respondToReschedule(String bookingId, String eventId, String actorUserId, String action);

    // No-show
    NoShowFlagResult flagNoShow(String bookingId, String flaggingUserId);

    // Repeat booking
    RebookResult rebook(String bookingId, String customerId);

    // Admin override
    BookingTransitionResult forceTransition(String bookingId, String newStatus);

    // Dispute transition
    void transitionToDisputed(String bookingId);
}
