package mn.tasky.booking.application.query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import org.springframework.stereotype.Service;

@Service
public class BookingQueryHandler implements BookingQueryPort {
    private final BookingService bookingService;
    private final BookingScheduleService bookingScheduleService;

    public BookingQueryHandler(BookingService bookingService, BookingScheduleService bookingScheduleService) {
        this.bookingService = bookingService;
        this.bookingScheduleService = bookingScheduleService;
    }

    @Override
    public Optional<BookingState> getBooking(String id) {
        return bookingService.getBooking(id);
    }

    @Override
    public List<BookingState> listBookings(String userId, String role, String status) {
        return bookingService.listBookings(userId, role, status);
    }

    @Override
    public List<BookingState> listBookings(String userId, String role, String status, String cursor, int limit) {
        return bookingService.listBookings(userId, role, status, cursor, limit);
    }

    @Override
    public Optional<Instant> getTaskerMarkedDoneAt(String bookingId) {
        return bookingService.getTaskerMarkedDoneAt(bookingId);
    }

    @Override
    public List<BookingScheduleEvent> listScheduleEvents(String bookingId, String requestingUserId) {
        return bookingScheduleService.listScheduleEvents(bookingId, requestingUserId);
    }

    @Override
    public Optional<BookingScheduleEvent> getScheduleEvent(String eventId) {
        return bookingScheduleService.getScheduleEvent(eventId);
    }
}
