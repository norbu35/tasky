package mn.tasky.booking.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages reschedule request lifecycle: request, accept, decline, and auto-expiry.
 */
@Service
public class BookingScheduleService {

    private static final Logger log = LoggerFactory.getLogger(BookingScheduleService.class);
    private static final Duration EXPIRY_WINDOW = Duration.ofHours(24);

    private final BookingScheduleEventDao scheduleEventDao;
    private final BookingDao bookingDao;
    private final BookingTimelineService timelineService;
    private final NotificationService notificationService;

    public BookingScheduleService(
            BookingScheduleEventDao scheduleEventDao,
            BookingDao bookingDao,
            BookingTimelineService timelineService,
            NotificationService notificationService) {
        this.scheduleEventDao = scheduleEventDao;
        this.bookingDao = bookingDao;
        this.timelineService = timelineService;
        this.notificationService = notificationService;
    }

    /**
     * Creates a reschedule request for a booking. The proposed time must be in the future,
     * and the booking must be in ASSIGNED status.
     *
     * @return The created BookingScheduleEvent with event_type REQUESTED.
     * @throws IllegalStateException if the booking is not ASSIGNED.
     * @throws IllegalArgumentException if the proposed time is not in the future.
     */
    public BookingScheduleEvent requestReschedule(
            String bookingId, String actorUserId, Instant proposedScheduledAt, String reason) {
        BookingState booking = requireParticipant(bookingId, actorUserId);

        if (!"ASSIGNED".equals(booking.status())) {
            throw new IllegalStateException("Booking must be ASSIGNED to request reschedule.");
        }

        if (proposedScheduledAt == null || !proposedScheduledAt.isAfter(Instant.now())) {
            throw new IllegalArgumentException("Proposed schedule must be in the future.");
        }

        String eventId = UUID.randomUUID().toString();
        scheduleEventDao.insert(eventId, bookingId, actorUserId, "REQUESTED", proposedScheduledAt, reason);

        String metadataJson = "{\"proposed_at\":\"" + proposedScheduledAt + "\",\"reason\":\""
                + (reason != null ? reason.replace("\"", "\\\"") : "") + "\"}";
        timelineService.recordEvent(bookingId, BookingTimelineService.RESCHEDULE_REQUESTED, actorUserId, metadataJson);

        // Notify the other participant
        String recipientId = booking.customerId().equals(actorUserId) ? booking.taskerId() : booking.customerId();
        notificationService.sendPush(
                recipientId,
                "Reschedule requested",
                "A reschedule has been requested for your booking.",
                "RESCHEDULE_REQUESTED");

        return scheduleEventDao.findById(eventId).orElseThrow();
    }

    /**
     * Responds to a pending reschedule request. Action must be ACCEPT or DECLINE.
     * ACCEPT updates the booking's confirmed_scheduled_at transactionally.
     *
     * @return The updated BookingScheduleEvent.
     * @throws IllegalStateException if the booking is not ASSIGNED or the event is not REQUESTED.
     */
    @Transactional
    public BookingScheduleEvent respondToReschedule(
            String bookingId, String eventId, String actorUserId, String action) {
        BookingState booking = requireParticipant(bookingId, actorUserId);

        if (!"ASSIGNED".equals(booking.status())) {
            throw new IllegalStateException("Booking must be ASSIGNED to respond to reschedule.");
        }

        BookingScheduleEvent event = scheduleEventDao
                .findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule event not found: " + eventId));

        if (!"REQUESTED".equals(event.eventType())) {
            throw new IllegalStateException("Event is not in REQUESTED state.");
        }

        if (!event.bookingId().equals(bookingId)) {
            throw new IllegalArgumentException("Event does not belong to the specified booking.");
        }

        String recipientId = booking.customerId().equals(actorUserId) ? booking.taskerId() : booking.customerId();

        if ("ACCEPT".equals(action)) {
            bookingDao.updateConfirmedSchedule(bookingId, event.proposedScheduledAt());
            scheduleEventDao.updateStatus(eventId, "ACCEPTED");
            timelineService.recordEvent(bookingId, BookingTimelineService.RESCHEDULE_ACCEPTED, actorUserId, null);
            notificationService.sendPush(
                    recipientId,
                    "Reschedule accepted",
                    "Your reschedule request has been accepted.",
                    "RESCHEDULE_ACCEPTED");
        } else if ("DECLINE".equals(action)) {
            scheduleEventDao.updateStatus(eventId, "DECLINED");
            timelineService.recordEvent(bookingId, BookingTimelineService.RESCHEDULE_DECLINED, actorUserId, null);
            notificationService.sendPush(
                    recipientId,
                    "Reschedule declined",
                    "Your reschedule request has been declined.",
                    "RESCHEDULE_DECLINED");
        } else {
            throw new IllegalArgumentException("Action must be ACCEPT or DECLINE.");
        }

        return scheduleEventDao.findById(eventId).orElseThrow();
    }

    /**
     * Lists all schedule events for a booking, ordered by created_at descending.
     */
    public List<BookingScheduleEvent> listScheduleEvents(String bookingId, String requestingUserId) {
        requireParticipant(bookingId, requestingUserId);
        return scheduleEventDao.findByBookingId(bookingId);
    }

    /**
     * Retrieves a single schedule event by ID.
     */
    public Optional<BookingScheduleEvent> getScheduleEvent(String eventId) {
        return scheduleEventDao.findById(eventId);
    }

    private BookingState requireParticipant(String bookingId, String userId) {
        BookingState booking = bookingDao
                .findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
        if (!booking.customerId().equals(userId) && !booking.taskerId().equals(userId)) {
            throw new IllegalArgumentException("Booking not found: " + bookingId);
        }
        return booking;
    }

    /**
     * Expires stale reschedule requests. A request is stale when
     * MIN(created_at + 24h, booking.confirmed_scheduled_at) is before now.
     */
    public void expireStaleRequests() {
        Instant now = Instant.now();
        List<BookingScheduleEvent> pendingRequests = scheduleEventDao.findAllPendingRequests();

        for (BookingScheduleEvent event : pendingRequests) {
            bookingDao.findById(event.bookingId()).ifPresent(booking -> {
                Instant expiryDeadline = event.createdAt().plus(EXPIRY_WINDOW);
                if (booking.confirmedScheduledAt() != null
                        && booking.confirmedScheduledAt().isBefore(expiryDeadline)) {
                    expiryDeadline = booking.confirmedScheduledAt();
                }

                if (expiryDeadline.isBefore(now)) {
                    scheduleEventDao.updateStatus(event.id(), "EXPIRED");
                    timelineService.recordEvent(
                            event.bookingId(), BookingTimelineService.RESCHEDULE_EXPIRED, null, null);
                    log.info(
                            "Expired stale reschedule request: eventId={} bookingId={}", event.id(), event.bookingId());
                }
            });
        }
    }
}
