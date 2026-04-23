package mn.tasky.review.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import mn.tasky.review.dto.ReviewEnforcementCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages review enforcement lifecycle: case creation on booking completion,
 * resolution on review submission, soft-gate reminders, hard-lock evaluation,
 * and auto-expiry of stale cases.
 */
@Service
public class ReviewEnforcementService implements mn.tasky.review.publicapi.ReviewQueryPort {

    private static final Logger log = LoggerFactory.getLogger(ReviewEnforcementService.class);

    private static final Duration REMINDER_24H = Duration.ofHours(24);
    private static final Duration REMINDER_72H = Duration.ofDays(3);
    private static final Duration EXPIRY = Duration.ofDays(7);

    private static final String STATUS_REMINDED_24H = "REMINDED_24H";
    private static final String STATUS_REMINDED_72H = "REMINDED_72H";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_EXPIRED = "EXPIRED";

    private static final String REASON_BOOKING_COMPLETED = "BOOKING_COMPLETED";
    private static final String NOTIFICATION_TYPE = "REVIEW_PROMPT";

    private final ReviewEnforcementCaseDao reviewEnforcementCaseDao;
    private final NotificationService notificationService;
    private final DisputeDao disputeDao;

    public ReviewEnforcementService(
            ReviewEnforcementCaseDao reviewEnforcementCaseDao,
            NotificationService notificationService,
            DisputeDao disputeDao) {
        this.reviewEnforcementCaseDao = reviewEnforcementCaseDao;
        this.notificationService = notificationService;
        this.disputeDao = disputeDao;
    }

    /**
     * Creates PENDING enforcement cases for both booking participants and sends
     * an immediate review prompt notification to each.
     * Idempotent: skips case creation if cases already exist for this booking+user pair.
     */
    @Transactional
    public void createCasesForBooking(String bookingId, String customerId, String taskerId) {
        // Idempotency: only insert if no case exists for this booking+user pair
        if (reviewEnforcementCaseDao.findByBookingAndUser(bookingId, customerId).isEmpty()) {
            reviewEnforcementCaseDao.insert(
                    UUID.randomUUID().toString(), bookingId, customerId, REASON_BOOKING_COMPLETED);
        }
        if (reviewEnforcementCaseDao.findByBookingAndUser(bookingId, taskerId).isEmpty()) {
            reviewEnforcementCaseDao.insert(
                    UUID.randomUUID().toString(), bookingId, taskerId, REASON_BOOKING_COMPLETED);
        }

        // Use event-keyed push for dedup on retry
        notificationService.sendPushWithEventKey(
                customerId,
                "Review Your Booking",
                "Please review your recent booking.",
                NOTIFICATION_TYPE,
                "REVIEW_PROMPT_" + bookingId + "_customer");
        notificationService.sendPushWithEventKey(
                taskerId,
                "Review Your Booking",
                "Please review your recent booking.",
                NOTIFICATION_TYPE,
                "REVIEW_PROMPT_" + bookingId + "_tasker");

        log.info("Created enforcement cases for booking={} customer={} tasker={}", bookingId, customerId, taskerId);
    }

    /**
     * Resolves (completes) the enforcement case for the given user and booking,
     * indicating they have submitted their review.
     */
    public void resolveCase(String bookingId, String userId) {
        reviewEnforcementCaseDao.findByBookingAndUser(bookingId, userId).ifPresent(enforcementCase -> {
            if (!STATUS_COMPLETED.equals(enforcementCase.status())) {
                reviewEnforcementCaseDao.updateStatus(enforcementCase.id(), STATUS_COMPLETED, Instant.now());
                log.info(
                        "Resolved enforcement case={} for user={} booking={}", enforcementCase.id(), userId, bookingId);
            }
        });
    }

    /**
     * Determines whether a user is hard-locked from creating tasks or applying.
     * REQ-P1-SAFE-07: any open enforcement case blocks the next post/apply action.
     */
    public boolean isUserLocked(String userId) {
        List<ReviewEnforcementCase> openCases = reviewEnforcementCaseDao.findOpenByUser(userId);
        return !openCases.isEmpty();
    }

    /**
     * Sends reminder notifications to users who have not yet submitted reviews.
     * PENDING cases older than 24h are moved to REMINDED_24H.
     * REMINDED_24H cases older than 72h are moved to REMINDED_72H.
     */
    @Transactional
    public void sendReminders() {
        Instant now = Instant.now();

        // 24h reminders
        List<ReviewEnforcementCase> pendingCases =
                reviewEnforcementCaseDao.findPendingOlderThan(now.minus(REMINDER_24H));
        for (ReviewEnforcementCase c : pendingCases) {
            reviewEnforcementCaseDao.updateStatus(c.id(), STATUS_REMINDED_24H, null);
            notificationService.sendPush(
                    c.userId(),
                    "Review Reminder",
                    "You haven't reviewed your recent booking yet. Please leave a review.",
                    NOTIFICATION_TYPE);
            log.info("Sent 24h reminder for case={} user={}", c.id(), c.userId());
        }

        // 72h reminders
        List<ReviewEnforcementCase> reminded24hCases =
                reviewEnforcementCaseDao.findReminded24hOlderThan(now.minus(REMINDER_72H));
        for (ReviewEnforcementCase c : reminded24hCases) {
            reviewEnforcementCaseDao.updateStatus(c.id(), STATUS_REMINDED_72H, null);
            notificationService.sendPush(
                    c.userId(),
                    "Final Review Reminder",
                    "This is your final reminder to review your recent booking.",
                    NOTIFICATION_TYPE);
            log.info("Sent 72h reminder for case={} user={}", c.id(), c.userId());
        }
    }

    /**
     * Retrieves all non-completed and non-expired enforcement cases for a given user.
     */
    @Override
    public List<ReviewEnforcementCase> getOpenCases(String userId) {
        return reviewEnforcementCaseDao.findOpenByUser(userId);
    }

    /**
     * Expires enforcement cases that have been open for more than 7 days
     * without the user submitting a review.
     */
    public void expireOldCases() {
        Instant cutoff = Instant.now().minus(EXPIRY);
        List<ReviewEnforcementCase> expirableCases = reviewEnforcementCaseDao.findExpirableOlderThan(cutoff);
        for (ReviewEnforcementCase c : expirableCases) {
            reviewEnforcementCaseDao.updateStatus(c.id(), STATUS_EXPIRED, null);
            log.info("Expired enforcement case={} user={}", c.id(), c.userId());
        }
    }
}
