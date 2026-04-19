package mn.tasky.auth.scheduling;

import java.time.Instant;
import mn.tasky.auth.dao.RateLimitCounterDao;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically purges expired rows from {@code rate_limit_counters}.
 * Moved out of the hot request path to avoid a per-request DELETE on every API call.
 */
@Component
public class RateLimitCleanupScheduler {

    private final RateLimitCounterDao rateLimitCounterDao;

    public RateLimitCleanupScheduler(RateLimitCounterDao rateLimitCounterDao) {
        this.rateLimitCounterDao = rateLimitCounterDao;
    }

    @Scheduled(fixedDelay = 30_000)
    @SchedulerLock(name = "rate_limit_cleanup", lockAtMostFor = "25s", lockAtLeastFor = "5s")
    public void purgeExpired() {
        rateLimitCounterDao.deleteExpired(Instant.now());
    }
}
