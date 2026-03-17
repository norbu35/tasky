package mn.tasky.booking.application;

import java.util.List;
import java.util.UUID;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import mn.tasky.booking.dto.BookingTimelineEvent;
import org.springframework.stereotype.Service;

/**
 * Append-only lifecycle event log for bookings.
 * Records immutable timeline events for audit, analytics, and downstream features
 * such as NO_SHOW adjudication and reschedule tracking.
 */
@Service
public class BookingTimelineService {

    public static final String NO_SHOW_REMINDER_SENT = "NO_SHOW_REMINDER_SENT";
    public static final String NO_SHOW_CONFIRMED = "NO_SHOW_CONFIRMED";
    public static final String RESCHEDULE_REQUESTED = "RESCHEDULE_REQUESTED";
    public static final String RESCHEDULE_ACCEPTED = "RESCHEDULE_ACCEPTED";
    public static final String RESCHEDULE_DECLINED = "RESCHEDULE_DECLINED";
    public static final String RESCHEDULE_EXPIRED = "RESCHEDULE_EXPIRED";
    public static final String BOOKING_CANCELLED = "BOOKING_CANCELLED";
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";

    private final BookingTimelineEventDao bookingTimelineEventDao;

    public BookingTimelineService(BookingTimelineEventDao bookingTimelineEventDao) {
        this.bookingTimelineEventDao = bookingTimelineEventDao;
    }

    /**
     * Records an immutable timeline event for a booking.
     *
     * @param bookingId    The booking this event belongs to.
     * @param eventType    One of the event type constants defined on this class.
     * @param actorUserId  The user who triggered the event, or null for system events.
     * @param metadataJson Optional JSON payload with additional context.
     */
    public void recordEvent(String bookingId, String eventType, String actorUserId, String metadataJson) {
        String id = UUID.randomUUID().toString();
        bookingTimelineEventDao.insert(id, bookingId, eventType, actorUserId, metadataJson);
    }

    /**
     * Returns all timeline events for a booking, ordered by created_at descending.
     *
     * @param bookingId The booking to query.
     * @return Immutable list of timeline events.
     */
    public List<BookingTimelineEvent> getEvents(String bookingId) {
        return bookingTimelineEventDao.findByBookingId(bookingId);
    }
}
