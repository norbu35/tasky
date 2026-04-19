package mn.tasky.auth.scheduling;

import java.time.Instant;
import mn.tasky.auth.dao.RefreshSessionDao;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily job that removes abandoned refresh sessions (logged-in but token never refreshed).
 * Without this, {@code refresh_sessions} grows unbounded over time.
 */
@Component
public class SessionCleanupScheduler {

    private final RefreshSessionDao refreshSessionDao;

    public SessionCleanupScheduler(RefreshSessionDao refreshSessionDao) {
        this.refreshSessionDao = refreshSessionDao;
    }

    @Scheduled(cron = "0 30 2 * * *")
    @SchedulerLock(name = "session_cleanup", lockAtMostFor = "10m", lockAtLeastFor = "1m")
    public void purgeExpiredSessions() {
        refreshSessionDao.deleteExpired(Instant.now());
    }
}
