package mn.tasky.booking.scheduling;

import mn.tasky.booking.application.CompletionTimeoutService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for bookings where the tasker has marked done
 * but the customer has not confirmed. Sends escalating reminders and
 * eventually auto-completes.
 */
@Component
public class CompletionTimeoutScheduler {

    private final CompletionTimeoutService completionTimeoutService;

    public CompletionTimeoutScheduler(CompletionTimeoutService completionTimeoutService) {
        this.completionTimeoutService = completionTimeoutService;
    }

    @Scheduled(fixedDelay = 600000)
    @SchedulerLock(name = "completion_timeout", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkCompletionTimeouts() {
        completionTimeoutService.processCompletionTimeouts();
    }
}
