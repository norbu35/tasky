package mn.tasky.booking.application.command;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.publicapi.BookingCommandPort;
import org.springframework.stereotype.Service;

@Service
public class BookingCommandHandler implements BookingCommandPort {
    private final BookingLifecycleService bookingLifecycleService;
    private final BookingService bookingService;

    public BookingCommandHandler(BookingLifecycleService bookingLifecycleService, BookingService bookingService) {
        this.bookingLifecycleService = bookingLifecycleService;
        this.bookingService = bookingService;
    }

    @Override
    public BookingState createBooking(
            String taskId,
            String taskerId,
            String customerId,
            int price,
            boolean liabilityDisclaimerAccepted,
            Instant confirmedScheduledAt) {
        return bookingService.createBooking(
                taskId, taskerId, customerId, price, liabilityDisclaimerAccepted, confirmedScheduledAt);
    }

    @Override
    public Optional<BookingState> recordDisclaimerAcceptance(String bookingId) {
        return bookingService.recordDisclaimerAcceptance(bookingId);
    }

    @Override
    public BookingTransitionResult cancelBooking(String actorUserId, String bookingId) {
        return bookingLifecycleService.cancelBooking(actorUserId, bookingId);
    }

    @Override
    public BookingTransitionResult completeBooking(String actorUserId, String bookingId) {
        return bookingLifecycleService.completeBooking(actorUserId, bookingId);
    }

    @Override
    public BookingMarkDoneResult markBookingDone(String userId, String bookingId) {
        return bookingService.markBookingDone(userId, bookingId);
    }
}
