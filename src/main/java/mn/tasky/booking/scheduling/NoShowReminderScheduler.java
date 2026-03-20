package mn.tasky.booking.scheduling;

import mn.tasky.booking.application.NoShowService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for bookings that are past their confirmed schedule
 * and sends no-show reminders to both participants.
 */
@Component
public class NoShowReminderScheduler {

    private final NoShowService noShowService;

    public NoShowReminderScheduler(NoShowService noShowService) {
        this.noShowService = noShowService;
    }

    @Scheduled(fixedDelay = 60000)
    @SchedulerLock(name = "noshow_reminder", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkReminders() {
        noShowService.findBookingsNeedingReminder().forEach(noShowService::sendReminder);
    }
}
