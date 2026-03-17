package mn.tasky.booking.scheduling;

import mn.tasky.booking.application.NoShowService;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for bookings that are past their confirmed schedule
 * and sends no-show reminders to both participants.
 */
@Component
public class NoShowReminderScheduler {

    private final NoShowService noShowService;
    private final SchedulerLockRunner lockRunner;

    public NoShowReminderScheduler(NoShowService noShowService, SchedulerLockRunner lockRunner) {
        this.noShowService = noShowService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(fixedDelay = 60000)
    public void checkReminders() {
        lockRunner.runWithLock("noshow_reminder", () -> {
            noShowService.findBookingsNeedingReminder().forEach(noShowService::sendReminder);
        });
    }
}
