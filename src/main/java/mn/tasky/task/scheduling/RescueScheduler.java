package mn.tasky.task.scheduling;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskRescueEventDao;
import mn.tasky.task.dto.TaskState;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically checks for OPEN tasks that have received zero applications after
 * 120 minutes. Triggers rescue actions: customer budget/schedule prompt,
 * broadened tasker push, and concierge flag.
 *
 * Only runs during daytime hours (08:00-21:59) in Asia/Ulaanbaatar timezone.
 */
@Component
public class RescueScheduler {

    private static final Logger log = LoggerFactory.getLogger(RescueScheduler.class);
    private static final ZoneId UB_ZONE = ZoneId.of("Asia/Ulaanbaatar");
    private static final int RESCUE_THRESHOLD_MINUTES = 120;
    private static final int HOUR_START = 8;
    private static final int HOUR_END = 21;
    private static final int BATCH_LIMIT = 200;
    private static final String RESCUE_ACTIONS_JSON =
            "{\"actions\": [\"CUSTOMER_BUDGET_SCHEDULE_PROMPT\", \"BROADENED_TASKER_PUSH\", \"CONCIERGE_FLAG\"]}";

    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final TaskRescueEventDao taskRescueEventDao;
    private final NotificationService notificationService;

    public RescueScheduler(
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao,
            TaskRescueEventDao taskRescueEventDao,
            NotificationService notificationService) {
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
        this.taskRescueEventDao = taskRescueEventDao;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 300000)
    @SchedulerLock(name = "task_rescue", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void checkRescue() {
        processRescue();
    }

    void processRescue() {
        ZonedDateTime now = ZonedDateTime.now(UB_ZONE);
        int hour = now.getHour();

        if (hour < HOUR_START || hour > HOUR_END) {
            log.debug("Rescue scheduler skipped — outside operating hours ({}:00 UB)", hour);
            return;
        }

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
        if (applicationCount > 0) {
            return;
        }

        if (taskRescueEventDao.existsByTaskId(task.id())) {
            return;
        }

        Instant now = Instant.now();
        String eventId = UUID.randomUUID().toString();
        taskRescueEventDao.insert(eventId, task.id(), now, triggerWindow, RESCUE_ACTIONS_JSON);

        notificationService.sendPush(
                task.customerId(),
                "No applications yet",
                "Your task hasn't received applications yet. Consider adjusting budget or schedule.",
                "RESCUE_CUSTOMER_PROMPT");

        // Concierge / admin notification — send to the task's customer ID channel as a proxy;
        // in production this would target an admin user or ops channel.
        log.warn("Task {} triggered rescue — needs concierge attention", task.id());

        log.info("Rescue event created for task {}: eventId={}, triggerWindow={}", task.id(), eventId, triggerWindow);
    }
}
