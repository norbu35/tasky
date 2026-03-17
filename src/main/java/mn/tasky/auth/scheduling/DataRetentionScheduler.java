package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.DataRetentionService;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily scheduled job that processes data retention for banned users.
 * Runs at 3:00 AM daily with distributed lock protection.
 */
@Component
public class DataRetentionScheduler {

    private final DataRetentionService dataRetentionService;
    private final SchedulerLockRunner lockRunner;

    public DataRetentionScheduler(DataRetentionService dataRetentionService, SchedulerLockRunner lockRunner) {
        this.dataRetentionService = dataRetentionService;
        this.lockRunner = lockRunner;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void processRetention() {
        lockRunner.runWithLock("data_retention_sweep", dataRetentionService::processRetention);
    }
}
