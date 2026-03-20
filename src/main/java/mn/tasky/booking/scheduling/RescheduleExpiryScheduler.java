package mn.tasky.booking.scheduling;

import mn.tasky.booking.application.BookingScheduleService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically expires stale reschedule requests that have exceeded
 * MIN(24h from creation, booking confirmed_scheduled_at).
 */
@Component
public class RescheduleExpiryScheduler {

    private final BookingScheduleService scheduleService;

    public RescheduleExpiryScheduler(BookingScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @Scheduled(fixedDelay = 300000)
    @SchedulerLock(name = "reschedule_expiry", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkExpiry() {
        scheduleService.expireStaleRequests();
    }
}
