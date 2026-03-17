package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily scheduled job that sweeps all active badges and revokes those
 * whose holders no longer meet the qualification criteria.
 * Runs at 4:00 AM daily with distributed lock protection.
 */
@Component
public class BadgeRevocationScheduler {

    private final BadgeEvaluationService badgeEvaluationService;
    private final SchedulerLockRunner lockRunner;

    public BadgeRevocationScheduler(BadgeEvaluationService badgeEvaluationService, SchedulerLockRunner lockRunner) {
        this.badgeEvaluationService = badgeEvaluationService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(cron = "0 0 4 * * *")
    public void sweepBadges() {
        lockRunner.runWithLock("badge_revocation_sweep", badgeEvaluationService::sweepAllBadges);
    }
}
