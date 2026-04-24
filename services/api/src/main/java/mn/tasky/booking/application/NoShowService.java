package mn.tasky.booking.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.TaskLifecycleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles NO_SHOW adjudication for bookings.
 * <p>
 * A booking is eligible for a no-show reminder 30 minutes after its confirmed schedule.
 * A booking can be flagged as NO_SHOW 1 hour after its confirmed schedule,
 * provided there is no recent activity from either party and no future reschedule.
 */
@Service
public class NoShowService {

    private static final Logger log = LoggerFactory.getLogger(NoShowService.class);

    private static final int REMINDER_DELAY_MINUTES = 30;
    private static final int FLAG_ELIGIBILITY_MINUTES = 60;
    private static final int INACTIVITY_WINDOW_MINUTES = 30;

    private final BookingDao bookingDao;
    private final BookingTimelineService timelineService;
    private final BookingTimelineEventDao bookingTimelineEventDao;
    private final BookingScheduleEventDao bookingScheduleEventDao;
    private final MessageDao messageDao;
    private final ConversationDao conversationDao;
    private final TaskLifecycleService taskLifecycleService;
    private final ModerationService moderationService;
    private final NotificationService notificationService;
    private final AuditEventDao auditEventDao;
    private final ReviewEnforcementService reviewEnforcementService;

    public NoShowService(
            BookingDao bookingDao,
            BookingTimelineService timelineService,
            BookingTimelineEventDao bookingTimelineEventDao,
            BookingScheduleEventDao bookingScheduleEventDao,
            MessageDao messageDao,
            ConversationDao conversationDao,
            TaskLifecycleService taskLifecycleService,
            ModerationService moderationService,
            NotificationService notificationService,
            AuditEventDao auditEventDao,
            ReviewEnforcementService reviewEnforcementService) {
        this.bookingDao = bookingDao;
        this.timelineService = timelineService;
        this.bookingTimelineEventDao = bookingTimelineEventDao;
        this.bookingScheduleEventDao = bookingScheduleEventDao;
        this.messageDao = messageDao;
        this.conversationDao = conversationDao;
        this.taskLifecycleService = taskLifecycleService;
        this.moderationService = moderationService;
        this.notificationService = notificationService;
        this.auditEventDao = auditEventDao;
        this.reviewEnforcementService = reviewEnforcementService;
    }

    /**
     * Finds ASSIGNED bookings past their confirmed schedule by 30+ minutes
     * that have not yet received a NO_SHOW_REMINDER_SENT timeline event.
     */
    public List<BookingState> findBookingsNeedingReminder() {
        Instant threshold = Instant.now().minus(REMINDER_DELAY_MINUTES, ChronoUnit.MINUTES);
        List<BookingState> candidates = bookingDao.findAssignedPastSchedule(threshold);
        return candidates.stream()
                .filter(b -> !bookingTimelineEventDao.existsByBookingIdAndEventType(
                        b.id(), BookingTimelineService.NO_SHOW_REMINDER_SENT))
                .toList();
    }

    /**
     * Sends a no-show reminder to both booking participants and records the timeline event.
     */
    public void sendReminder(BookingState booking) {
        timelineService.recordEvent(booking.id(), BookingTimelineService.NO_SHOW_REMINDER_SENT, null, null);

        String title = "Attendance Reminder";
        String body = "Your booking is scheduled for now -- please confirm attendance.";

        notificationService.sendPush(booking.customerId(), title, body, "NO_SHOW_REMINDER");
        notificationService.sendPush(booking.taskerId(), title, body, "NO_SHOW_REMINDER");

        log.info("No-show reminder sent for booking {}", booking.id());
    }

    /**
     * Flags a booking as NO_SHOW.
     *
     * @param bookingId      The booking to flag.
     * @param flaggingUserId The user flagging the no-show (must be a booking participant).
     * @return The updated booking on success, or an error code string on failure.
     */
    @Transactional
    public NoShowFlagResult flagNoShow(String bookingId, String flaggingUserId) {
        // 1. Booking exists and status is ASSIGNED
        Optional<BookingState> bookingOpt = bookingDao.findByIdForUpdate(bookingId);
        if (bookingOpt.isEmpty()) {
            return NoShowFlagResult.error("NOT_FOUND");
        }
        BookingState booking = bookingOpt.get();
        if (!"ASSIGNED".equals(booking.status())) {
            return NoShowFlagResult.error("INVALID_STATUS");
        }

        // Verify the flagger is a participant
        boolean isCustomer = booking.customerId().equals(flaggingUserId);
        boolean isTasker = booking.taskerId().equals(flaggingUserId);
        if (!isCustomer && !isTasker) {
            return NoShowFlagResult.error("FORBIDDEN");
        }

        // 2. now() >= confirmedScheduledAt + 1 hour
        Instant now = Instant.now();
        if (booking.confirmedScheduledAt() == null) {
            return NoShowFlagResult.error("NO_SCHEDULE");
        }
        Instant eligibleAt = booking.confirmedScheduledAt().plus(FLAG_ELIGIBILITY_MINUTES, ChronoUnit.MINUTES);
        if (now.isBefore(eligibleAt)) {
            return NoShowFlagResult.error("TOO_EARLY");
        }

        // 3. No recent activity from either party in trailing 30 minutes
        Instant activityCutoff = now.minus(INACTIVITY_WINDOW_MINUTES, ChronoUnit.MINUTES);
        if (bookingTimelineEventDao.existsRecentByBookingId(bookingId, activityCutoff)) {
            return NoShowFlagResult.error("ACTIVITY_DETECTED");
        }

        Optional<Conversation> conversationOpt =
                conversationDao.findByTaskAndParticipants(booking.taskId(), booking.customerId(), booking.taskerId());
        if (conversationOpt.isPresent()
                && messageDao.existsRecentByConversationId(conversationOpt.get().id(), activityCutoff)) {
            return NoShowFlagResult.error("ACTIVITY_DETECTED");
        }

        // 4. No ACCEPTED reschedule with proposed_scheduled_at > now
        Optional<BookingScheduleEvent> latestAccepted =
                bookingScheduleEventDao.findLatestAcceptedByBookingId(bookingId);
        if (latestAccepted.isPresent()
                && latestAccepted.get().proposedScheduledAt() != null
                && latestAccepted.get().proposedScheduledAt().isAfter(now)) {
            return NoShowFlagResult.error("RESCHEDULE_SUPERSEDES");
        }

        // 5. Success — atomic transition
        // Determine no-show party: the OTHER participant
        String noShowPartyId = isCustomer ? booking.taskerId() : booking.customerId();

        // a. Update booking status
        bookingDao.updateStatus(bookingId, "NO_SHOW", now);

        // b. Update task status
        taskLifecycleService.transitionToNoShow(booking.taskId());

        // c. Write timeline event
        String metadata =
                String.format("{\"flagged_by\":\"%s\",\"no_show_party\":\"%s\"}", flaggingUserId, noShowPartyId);
        timelineService.recordEvent(bookingId, BookingTimelineService.NO_SHOW_CONFIRMED, flaggingUserId, metadata);

        // d. Write audit event
        auditEventDao.insert(flaggingUserId, "NO_SHOW_FLAGGED", "BOOKING", bookingId, metadata);

        // f. If no-show party is the tasker, add strike
        if (booking.taskerId().equals(noShowPartyId)) {
            moderationService.addStrike(noShowPartyId, "NO_SHOW", bookingId);
        }

        reviewEnforcementService.createCasesForBooking(
                bookingId, booking.customerId(), booking.taskerId(), ReviewEnforcementService.REASON_BOOKING_NO_SHOW);

        // Return updated booking
        BookingState updated = bookingDao.findById(bookingId).orElse(booking);
        log.info("Booking {} flagged as NO_SHOW by {} — no-show party: {}", bookingId, flaggingUserId, noShowPartyId);
        return NoShowFlagResult.success(updated);
    }
}
