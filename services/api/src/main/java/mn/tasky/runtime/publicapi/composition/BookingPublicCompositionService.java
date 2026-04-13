package mn.tasky.runtime.publicapi.composition;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import org.springframework.stereotype.Component;

@Component
public class BookingPublicCompositionService {

    private final BookingQueryPort bookingQueryPort;
    private final BookingResponseCompositionService bookingResponseCompositionService;

    public BookingPublicCompositionService(
            BookingQueryPort bookingQueryPort, BookingResponseCompositionService bookingResponseCompositionService) {
        this.bookingQueryPort = bookingQueryPort;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
    }

    public BookingPublicPage listBookings(String userId, String role, String status, String cursor, int limit) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<BookingState> bookings = bookingQueryPort.listBookings(userId, role, status, cursor, clampedLimit + 1);
        boolean hasMore = bookings.size() > clampedLimit;
        List<BookingState> pageBookings = hasMore ? bookings.subList(0, clampedLimit) : bookings;
        List<Map<String, Object>> data = pageBookings.stream()
                .map(bookingResponseCompositionService::bookingResponse)
                .toList();
        String nextCursor = hasMore ? pageBookings.getLast().id() : null;
        return new BookingPublicPage(data, nextCursor, hasMore);
    }

    public Optional<Map<String, Object>> getVisibleBooking(String bookingId, String userId) {
        return bookingQueryPort
                .getBooking(bookingId)
                .filter(booking -> booking.customerId().equals(userId)
                        || booking.taskerId().equals(userId))
                .map(bookingResponseCompositionService::bookingResponse);
    }

    public Map<String, Object> scheduleEventsResponse(String bookingId, String userId) {
        List<Map<String, Object>> data = bookingQueryPort.listScheduleEvents(bookingId, userId).stream()
                .map(bookingResponseCompositionService::scheduleEventResponse)
                .toList();
        return Map.of("data", data);
    }

    public Map<String, Object> scheduleEventReplayResponse(String eventId) {
        return bookingQueryPort
                .getScheduleEvent(eventId)
                .map(bookingResponseCompositionService::scheduleEventResponse)
                .orElse(Map.of("id", eventId));
    }
}
