package mn.tasky.task.scheduling;

import mn.tasky.task.application.TaskApplicationService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically expires stale SELECTED applications where the tasker
 * has not confirmed within the 4-hour response window.
 */
@Component
public class SelectionExpiryScheduler {

    private final TaskApplicationService taskApplicationService;

    public SelectionExpiryScheduler(TaskApplicationService taskApplicationService) {
        this.taskApplicationService = taskApplicationService;
    }

    @Scheduled(fixedDelay = 300000)
    @SchedulerLock(name = "selection_expiry", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkExpiredSelections() {
        taskApplicationService.expireStaleSelections();
    }
}
