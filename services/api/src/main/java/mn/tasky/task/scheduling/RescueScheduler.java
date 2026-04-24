package mn.tasky.task.scheduling;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskAssistanceService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for OPEN tasks that have received zero applications after
 * 8 hours. Triggers backend-controlled rescue actions: broadened tasker
 * push, concierge flag, and intervention tracking.
 *
 * REQ-P1-ASSIST-03A: customers are not asked to choose rescue behavior.
 * Only runs during daytime hours (08:00-21:59) in Asia/Ulaanbaatar timezone.
 */
@Component
public class RescueScheduler {

    private static final Logger log = LoggerFactory.getLogger(RescueScheduler.class);
    private static final ZoneId UB_ZONE = ZoneId.of("Asia/Ulaanbaatar");
    private static final int RESCUE_THRESHOLD_MINUTES = 480;
    private static final int HOUR_START = 8;
    private static final int HOUR_END = 21;
    private static final int BATCH_LIMIT = 200;

    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final TaskAssistanceService taskAssistanceService;
    private final NotificationService notificationService;

    public RescueScheduler(
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao,
            TaskAssistanceService taskAssistanceService,
            NotificationService notificationService) {
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
        this.taskAssistanceService = taskAssistanceService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 300000)
    @SchedulerLock(name = "task_rescue", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkRescue() {
        ZonedDateTime now = ZonedDateTime.now(UB_ZONE);
        int hour = now.getHour();

        if (hour < HOUR_START || hour > HOUR_END) {
            log.debug("Rescue scheduler skipped - outside operating hours ({}:00 UB)", hour);
            return;
        }

        processRescue();
    }

    public void processRescue() {
        String triggerWindow = "DAYTIME";

        Instant cutoff = Instant.now().minus(RESCUE_THRESHOLD_MINUTES, ChronoUnit.MINUTES);
        List<TaskState> candidates = taskDao.findOpenOlderThan(cutoff, BATCH_LIMIT);

        for (TaskState task : candidates) {
            try {
                processTask(task, triggerWindow);
            } catch (Exception e) {
                log.error("Error processing rescue for task {}", task.id(), e);
            }
        }
    }

    private void processTask(TaskState task, String triggerWindow) {
        int applicationCount = taskApplicationDao.countByTaskId(task.id());
        if (!taskAssistanceService
                .evaluateExternalDistribution(task, applicationCount, Instant.now())
                .externalDistributionAllowed()) {
            return;
        }

        Instant now = Instant.now();
        var event = taskAssistanceService.recordExternalDistribution(task, triggerWindow, now);

        notificationService.sendPush(
                task.customerId(), "Finding taskers", "We're expanding the search for your task.", "RESCUE_INFO");

        // Concierge / admin notification - send to the task's customer ID channel as a proxy;
        // in production this would target an admin user or ops channel.
        log.warn("Task {} triggered rescue - needs concierge attention", task.id());

        log.info(
                "Rescue event created for task {}: eventId={}, triggerWindow={}", task.id(), event.id(), triggerWindow);
    }
}
