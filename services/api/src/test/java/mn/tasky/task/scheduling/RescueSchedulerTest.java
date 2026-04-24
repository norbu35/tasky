package mn.tasky.task.scheduling;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskAssistanceService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.AssistanceEvaluation;
import mn.tasky.task.dto.TaskRescueEvent;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RescueSchedulerTest {

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskApplicationDao taskApplicationDao;

    @Mock
    private TaskAssistanceService taskAssistanceService;

    @Mock
    private NotificationService notificationService;

    private RescueScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new RescueScheduler(taskDao, taskApplicationDao, taskAssistanceService, notificationService);
    }

    @Test
    void processRescue_createsEventForOldOpenTaskWithZeroApplications() {
        TaskState task = new TaskState(
                "t1",
                "c1",
                null,
                "desc",
                1000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().minusSeconds(600),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of(task));
        when(taskApplicationDao.countByTaskId("t1")).thenReturn(0);
        when(taskAssistanceService.evaluateExternalDistribution(eq(task), eq(0), any(Instant.class)))
                .thenReturn(new AssistanceEvaluation(true, AssistanceEvaluation.ALLOWED));
        when(taskAssistanceService.recordExternalDistribution(eq(task), eq("DAYTIME"), any(Instant.class)))
                .thenReturn(new TaskRescueEvent(
                        "event-1",
                        "t1",
                        Instant.now(),
                        "DAYTIME",
                        "{}",
                        TaskAssistanceService.INTERVENTION_EXTERNAL_DISTRIBUTION,
                        TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH,
                        Instant.now()));

        scheduler.processRescue();

        verify(taskAssistanceService).recordExternalDistribution(eq(task), eq("DAYTIME"), any(Instant.class));
        verify(notificationService).sendPush(eq("c1"), anyString(), anyString(), eq("RESCUE_INFO"));
    }

    @Test
    void processRescue_skipsTaskWithExistingApplications() {
        TaskState task = new TaskState(
                "t1",
                "c1",
                null,
                "desc",
                1000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().minusSeconds(600),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of(task));
        when(taskApplicationDao.countByTaskId("t1")).thenReturn(3);
        when(taskAssistanceService.evaluateExternalDistribution(eq(task), eq(3), any(Instant.class)))
                .thenReturn(new AssistanceEvaluation(false, AssistanceEvaluation.QUALIFIED_APPLICATION_EXISTS));

        scheduler.processRescue();

        verify(taskAssistanceService, never())
                .recordExternalDistribution(any(TaskState.class), anyString(), any(Instant.class));
    }

    @Test
    void processRescue_skipsTaskWithExistingRescueEvent() {
        TaskState task = new TaskState(
                "t1",
                "c1",
                null,
                "desc",
                1000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().minusSeconds(600),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of(task));
        when(taskApplicationDao.countByTaskId("t1")).thenReturn(0);
        when(taskAssistanceService.evaluateExternalDistribution(eq(task), eq(0), any(Instant.class)))
                .thenReturn(new AssistanceEvaluation(false, AssistanceEvaluation.INTERVENTION_ALREADY_EXISTS));

        scheduler.processRescue();

        verify(taskAssistanceService, never())
                .recordExternalDistribution(any(TaskState.class), anyString(), any(Instant.class));
    }

    @Test
    void processRescue_noCandidates_doesNothing() {
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of());

        scheduler.processRescue();

        verify(taskAssistanceService, never())
                .recordExternalDistribution(any(TaskState.class), anyString(), any(Instant.class));
    }

    @Test
    void processRescue_continuesAfterException() {
        TaskState task1 = new TaskState(
                "t1",
                "c1",
                null,
                "desc",
                1000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().minusSeconds(600),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        TaskState task2 = new TaskState(
                "t2",
                "c2",
                null,
                "desc2",
                2000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now().minusSeconds(600),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of(task1, task2));
        when(taskApplicationDao.countByTaskId("t1")).thenThrow(new RuntimeException("DB error"));
        when(taskApplicationDao.countByTaskId("t2")).thenReturn(0);
        when(taskAssistanceService.evaluateExternalDistribution(eq(task2), eq(0), any(Instant.class)))
                .thenReturn(new AssistanceEvaluation(true, AssistanceEvaluation.ALLOWED));
        when(taskAssistanceService.recordExternalDistribution(eq(task2), eq("DAYTIME"), any(Instant.class)))
                .thenReturn(new TaskRescueEvent(
                        "event-2",
                        "t2",
                        Instant.now(),
                        "DAYTIME",
                        "{}",
                        TaskAssistanceService.INTERVENTION_EXTERNAL_DISTRIBUTION,
                        TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH,
                        Instant.now()));

        scheduler.processRescue();

        verify(taskAssistanceService).recordExternalDistribution(eq(task2), eq("DAYTIME"), any(Instant.class));
    }
}
