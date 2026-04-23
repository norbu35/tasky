package mn.tasky.booking.application.command;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.NoShowService;
import mn.tasky.booking.application.RepeatBookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.booking.dto.RebookResult;
import mn.tasky.booking.publicapi.BookingCommandPort;
import org.springframework.stereotype.Service;

@Service
public class BookingCommandHandler implements BookingCommandPort {
    private final BookingLifecycleService bookingLifecycleService;
    private final BookingService bookingService;
    private final BookingScheduleService bookingScheduleService;
    private final NoShowService noShowService;
    private final RepeatBookingService repeatBookingService;

    public BookingCommandHandler(
            BookingLifecycleService bookingLifecycleService,
            BookingService bookingService,
            BookingScheduleService bookingScheduleService,
            NoShowService noShowService,
            RepeatBookingService repeatBookingService) {
        this.bookingLifecycleService = bookingLifecycleService;
        this.bookingService = bookingService;
        this.bookingScheduleService = bookingScheduleService;
        this.noShowService = noShowService;
        this.repeatBookingService = repeatBookingService;
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

    @Override
    public BookingScheduleEvent requestReschedule(
            String bookingId, String actorUserId, Instant proposedScheduledAt, String reason) {
        return bookingScheduleService.requestReschedule(bookingId, actorUserId, proposedScheduledAt, reason);
    }

    @Override
    public BookingScheduleEvent respondToReschedule(
            String bookingId, String eventId, String actorUserId, String action) {
        return bookingScheduleService.respondToReschedule(bookingId, eventId, actorUserId, action);
    }

    @Override
    public NoShowFlagResult flagNoShow(String bookingId, String flaggingUserId) {
        return noShowService.flagNoShow(bookingId, flaggingUserId);
    }

    @Override
    public RebookResult rebook(String bookingId, String customerId) {
        return repeatBookingService.rebook(bookingId, customerId);
    }

    @Override
    public BookingTransitionResult forceTransition(String bookingId, String newStatus) {
        return bookingService.forceTransition(bookingId, newStatus);
    }

    @Override
    public void transitionToDisputed(String bookingId) {
        bookingService.transitionToDisputed(bookingId);
    }
}
