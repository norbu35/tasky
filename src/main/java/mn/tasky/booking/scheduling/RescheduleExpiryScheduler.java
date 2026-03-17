package mn.tasky.booking.scheduling;

import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically expires stale reschedule requests that have exceeded
 * MIN(24h from creation, booking confirmed_scheduled_at).
 */
@Component
public class RescheduleExpiryScheduler {

    private final BookingScheduleService scheduleService;
    private final SchedulerLockRunner lockRunner;

    public RescheduleExpiryScheduler(BookingScheduleService scheduleService, SchedulerLockRunner lockRunner) {
        this.scheduleService = scheduleService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(fixedDelay = 300000)
    public void checkExpiry() {
        lockRunner.runWithLock("reschedule_expiry", scheduleService::expireStaleRequests);
    }
}
