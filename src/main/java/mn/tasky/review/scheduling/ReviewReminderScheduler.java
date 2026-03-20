package mn.tasky.review.scheduling;

import mn.tasky.common.scheduling.SchedulerLockRunner;
import mn.tasky.review.application.ReviewEnforcementService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically sends review reminder notifications (24h and 72h)
 * for pending enforcement cases.
 */
@Component
public class ReviewReminderScheduler {

    private final ReviewEnforcementService reviewEnforcementService;
    private final SchedulerLockRunner lockRunner;

    public ReviewReminderScheduler(ReviewEnforcementService reviewEnforcementService, SchedulerLockRunner lockRunner) {
        this.reviewEnforcementService = reviewEnforcementService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(fixedDelay = 3600000)
    public void sendReminders() {
        lockRunner.runWithLock("review_reminder", reviewEnforcementService::sendReminders);
    }
}
