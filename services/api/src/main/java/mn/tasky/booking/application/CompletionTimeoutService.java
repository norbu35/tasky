package mn.tasky.booking.application;

import java.time.Instant;
import java.util.List;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompletionTimeoutService {
    private static final Logger log = LoggerFactory.getLogger(CompletionTimeoutService.class);
    private static final int REMINDER_FIRST_HOURS = 24;
    private static final int REMINDER_SECOND_HOURS = 48;
    private static final int AUTOCOMPLETE_HOURS = 72;
    private static final int BATCH_LIMIT = 100;

    private final BookingDao bookingDao;
    private final BookingLifecycleService bookingLifecycleService;
    private final NotificationService notificationService;

    public CompletionTimeoutService(
            BookingDao bookingDao,
            BookingLifecycleService bookingLifecycleService,
            NotificationService notificationService) {
        this.bookingDao = bookingDao;
        this.bookingLifecycleService = bookingLifecycleService;
        this.notificationService = notificationService;
    }

    public void processCompletionTimeouts() {
        Instant now = Instant.now();

        // Each tier runs in its own transaction so a failure in one doesn't roll back the others.
        processAutoComplete(now);
        processSecondReminder(now);
        processFirstReminder(now);
    }

    @Transactional
    public void processAutoComplete(Instant now) {
        Instant threshold = now.minusSeconds(AUTOCOMPLETE_HOURS * 3600L);
        List<BookingState> candidates = bookingDao.findPendingCompletion(threshold, BATCH_LIMIT);
        for (BookingState booking : candidates) {
            try {
                if (booking.completionReminderCount() < 2) {
                    continue;
                }
                bookingLifecycleService.completeBooking(booking.customerId(), booking.id());
                notificationService.sendPush(
                        booking.customerId(),
                        "Task auto-completed",
                        "Your task has been automatically marked as completed.",
                        "BOOKING_AUTO_COMPLETED");
                notificationService.sendPush(
                        booking.taskerId(),
                        "Task auto-completed",
                        "The customer did not respond and the task has been automatically completed.",
                        "BOOKING_AUTO_COMPLETED");
                log.info("Auto-completed booking {} after {} hours", booking.id(), AUTOCOMPLETE_HOURS);
            } catch (Exception e) {
                log.error("Error auto-completing booking {}", booking.id(), e);
            }
        }
    }

    @Transactional
    public void processSecondReminder(Instant now) {
        Instant threshold = now.minusSeconds(REMINDER_SECOND_HOURS * 3600L);
        List<BookingState> candidates = bookingDao.findPendingCompletion(threshold, BATCH_LIMIT);
        for (BookingState booking : candidates) {
            try {
                if (booking.completionReminderCount() != 1) {
                    continue;
                }
                bookingDao.updateCompletionReminder(booking.id(), 2, now);
                notificationService.sendPushWithEventKey(
                        booking.customerId(),
                        "Task completion reminder",
                        "Your tasker marked the task done 48 hours ago. Please confirm completion.",
                        "COMPLETION_REMINDER",
                        "COMPLETION_REMINDER_48H_" + booking.id());
                log.info("Sent 48h completion reminder for booking {}", booking.id());
            } catch (Exception e) {
                log.error("Error sending 48h reminder for booking {}", booking.id(), e);
            }
        }
    }

    @Transactional
    public void processFirstReminder(Instant now) {
        Instant threshold = now.minusSeconds(REMINDER_FIRST_HOURS * 3600L);
        List<BookingState> candidates = bookingDao.findPendingCompletion(threshold, BATCH_LIMIT);
        for (BookingState booking : candidates) {
            try {
                if (booking.completionReminderCount() >= 1) {
                    continue;
                }
                bookingDao.updateCompletionReminder(booking.id(), 1, now);
                notificationService.sendPush(
                        booking.customerId(),
                        "Task completion reminder",
                        "Your tasker marked the task done 24 hours ago. Please confirm completion.",
                        "COMPLETION_REMINDER");
                log.info("Sent 24h completion reminder for booking {}", booking.id());
            } catch (Exception e) {
                log.error("Error sending 24h reminder for booking {}", booking.id(), e);
            }
        }
    }
}
