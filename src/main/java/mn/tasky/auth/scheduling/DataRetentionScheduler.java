package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.DataRetentionService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily scheduled job that processes data retention for banned users.
 * Runs at 3:00 AM daily with distributed lock protection.
 */
@Component
public class DataRetentionScheduler {

    private final DataRetentionService dataRetentionService;

    public DataRetentionScheduler(DataRetentionService dataRetentionService) {
        this.dataRetentionService = dataRetentionService;
    }

    @Scheduled(cron = "0 0 3 * * *")
    @SchedulerLock(name = "data_retention_sweep", lockAtMostFor = "10m", lockAtLeastFor = "1m")
    public void processRetention() {
        dataRetentionService.processRetention();
    }
}
