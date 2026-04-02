package mn.tasky.common.scheduling;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SchedulerLockRunner {
    private static final Logger log = LoggerFactory.getLogger(SchedulerLockRunner.class);
    private final ConcurrentHashMap<String, ReentrantLock> locks = new ConcurrentHashMap<>();

    public void runWithLock(String jobName, Runnable task) {
        ReentrantLock lock = locks.computeIfAbsent(jobName, k -> new ReentrantLock());
        if (!lock.tryLock()) {
            log.debug("Skipping {} — previous run still in progress", jobName);
            return;
        }
        try {
            task.run();
        } catch (Exception e) {
            log.error("Error in scheduled job {}", jobName, e);
        } finally {
            lock.unlock();
        }
    }
}
