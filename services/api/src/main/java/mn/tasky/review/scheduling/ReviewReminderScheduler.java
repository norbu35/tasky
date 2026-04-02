package mn.tasky.review.scheduling;

import mn.tasky.review.application.ReviewEnforcementService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically sends review reminder notifications (24h and 72h)
 * for pending enforcement cases.
 */
@Component
public class ReviewReminderScheduler {

    private final ReviewEnforcementService reviewEnforcementService;

    public ReviewReminderScheduler(ReviewEnforcementService reviewEnforcementService) {
        this.reviewEnforcementService = reviewEnforcementService;
    }

    @Scheduled(fixedDelay = 3600000)
    @SchedulerLock(name = "review_reminder", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void sendReminders() {
        reviewEnforcementService.sendReminders();
    }
}
