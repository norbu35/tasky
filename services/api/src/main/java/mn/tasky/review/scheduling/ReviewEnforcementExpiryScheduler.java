package mn.tasky.review.scheduling;

import mn.tasky.review.application.ReviewEnforcementService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically expires review enforcement cases that have been open
 * for more than 7 days without a review submission.
 */
@Component
public class ReviewEnforcementExpiryScheduler {

    private final ReviewEnforcementService reviewEnforcementService;

    public ReviewEnforcementExpiryScheduler(ReviewEnforcementService reviewEnforcementService) {
        this.reviewEnforcementService = reviewEnforcementService;
    }

    @Scheduled(fixedDelay = 3600000)
    @SchedulerLock(name = "review_enforcement_expiry", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void expireOldCases() {
        reviewEnforcementService.expireOldCases();
    }
}
