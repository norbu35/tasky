package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.BadgeEvaluationService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
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

    public BadgeRevocationScheduler(BadgeEvaluationService badgeEvaluationService) {
        this.badgeEvaluationService = badgeEvaluationService;
    }

    @Scheduled(cron = "0 0 4 * * *")
    @SchedulerLock(name = "badge_revocation_sweep", lockAtMostFor = "10m", lockAtLeastFor = "1m")
    public void sweepBadges() {
        badgeEvaluationService.sweepAllBadges();
    }
}
