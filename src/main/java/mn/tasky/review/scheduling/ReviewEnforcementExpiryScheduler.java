package mn.tasky.review.scheduling;

import mn.tasky.common.scheduling.SchedulerLockRunner;
import mn.tasky.review.application.ReviewEnforcementService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically expires review enforcement cases that have been open
 * for more than 7 days without a review submission.
 */
@Component
public class ReviewEnforcementExpiryScheduler {

    private final ReviewEnforcementService reviewEnforcementService;
    private final SchedulerLockRunner lockRunner;

    public ReviewEnforcementExpiryScheduler(
            ReviewEnforcementService reviewEnforcementService, SchedulerLockRunner lockRunner) {
        this.reviewEnforcementService = reviewEnforcementService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(fixedDelay = 3600000)
    public void expireOldCases() {
        lockRunner.runWithLock("review_enforcement_expiry", reviewEnforcementService::expireOldCases);
    }
}
