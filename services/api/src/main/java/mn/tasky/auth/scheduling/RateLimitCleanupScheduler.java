package mn.tasky.auth.scheduling;

import java.time.Instant;
import mn.tasky.auth.dao.RateLimitCounterDao;
import mn.tasky.common.security.TokenBlacklistDao;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically purges expired rows from {@code rate_limit_counters} and
 * {@code token_blacklist}. Moved out of the hot request path to avoid
 * per-request DELETE queries.
 */
@Component
public class RateLimitCleanupScheduler {

    private final RateLimitCounterDao rateLimitCounterDao;
    private final TokenBlacklistDao tokenBlacklistDao;

    public RateLimitCleanupScheduler(RateLimitCounterDao rateLimitCounterDao, TokenBlacklistDao tokenBlacklistDao) {
        this.rateLimitCounterDao = rateLimitCounterDao;
        this.tokenBlacklistDao = tokenBlacklistDao;
    }

    @Scheduled(fixedDelay = 30_000)
    @SchedulerLock(name = "rate_limit_cleanup", lockAtMostFor = "25s", lockAtLeastFor = "5s")
    public void purgeExpired() {
        rateLimitCounterDao.deleteExpired(Instant.now());
    }

    @Scheduled(fixedDelay = 60_000)
    @SchedulerLock(name = "token_blacklist_cleanup", lockAtMostFor = "55s", lockAtLeastFor = "5s")
    public void purgeExpiredBlacklistEntries() {
        tokenBlacklistDao.deleteExpired(Instant.now());
    }
}
