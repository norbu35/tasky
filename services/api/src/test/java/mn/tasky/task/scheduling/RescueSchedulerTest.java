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
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskRescueEventDao;
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
    private TaskRescueEventDao taskRescueEventDao;

    @Mock
    private NotificationService notificationService;

    private RescueScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new RescueScheduler(taskDao, taskApplicationDao, taskRescueEventDao, notificationService);
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
        when(taskRescueEventDao.existsByTaskId("t1")).thenReturn(false);

        scheduler.processRescue();

        verify(taskRescueEventDao)
                .insert(anyString(), eq("t1"), any(Instant.class), eq("DAYTIME"), anyString(), eq("SYSTEM_ASSISTED"));
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

        scheduler.processRescue();

        verify(taskRescueEventDao, never())
                .insert(anyString(), anyString(), any(Instant.class), anyString(), anyString(), anyString());
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
        when(taskRescueEventDao.existsByTaskId("t1")).thenReturn(true);

        scheduler.processRescue();

        verify(taskRescueEventDao, never())
                .insert(anyString(), anyString(), any(Instant.class), anyString(), anyString(), anyString());
    }

    @Test
    void processRescue_noCandidates_doesNothing() {
        when(taskDao.findOpenOlderThan(any(Instant.class), eq(200))).thenReturn(List.of());

        scheduler.processRescue();

        verify(taskRescueEventDao, never())
                .insert(anyString(), anyString(), any(Instant.class), anyString(), anyString(), anyString());
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
        when(taskRescueEventDao.existsByTaskId("t2")).thenReturn(false);

        scheduler.processRescue();

        verify(taskRescueEventDao)
                .insert(anyString(), eq("t2"), any(Instant.class), eq("DAYTIME"), anyString(), eq("SYSTEM_ASSISTED"));
    }
}
