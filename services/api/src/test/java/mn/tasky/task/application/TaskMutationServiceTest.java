package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskMutationService")
class TaskMutationServiceTest {

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskPhotoDao taskPhotoDao;

    @Mock
    private TaskPhotoKeyHelper taskPhotoKeyHelper;

    private TaskMutationService service;

    private final Instant now = Instant.now();

    private final TaskState openTask = new TaskState(
            "t1",
            "c1",
            "cat1",
            "Fix sink",
            5000,
            47.9,
            106.9,
            "UB",
            "OPEN",
            now.plusSeconds(86400),
            "BUDGET",
            List.of(),
            null,
            null,
            null,
            now,
            now);

    @BeforeEach
    void setUp() {
        service = new TaskMutationService(taskDao, taskPhotoDao, taskPhotoKeyHelper);
    }

    @Nested
    @DisplayName("cancelTask")
    class CancelTask {

        @Test
        @DisplayName("returns NOT_FOUND when task does not exist")
        void notFound() {
            when(taskDao.findById("t1")).thenReturn(Optional.empty());

            TaskCancelResult result = service.cancelTask("c1", "t1");

            assertThat(result.errorCode()).isEqualTo(TaskCancelResult.NOT_FOUND);
        }

        @Test
        @DisplayName("returns FORBIDDEN when customer is not the owner")
        void forbidden() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));

            TaskCancelResult result = service.cancelTask("other", "t1");

            assertThat(result.errorCode()).isEqualTo(TaskCancelResult.FORBIDDEN);
        }

        @Test
        @DisplayName("returns INVALID_STATUS when task is not OPEN")
        void invalidStatus() {
            TaskState assigned = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "ASSIGNED",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(assigned));

            TaskCancelResult result = service.cancelTask("c1", "t1");

            assertThat(result.errorCode()).isEqualTo(TaskCancelResult.INVALID_STATUS);
        }

        @Test
        @DisplayName("cancels open task successfully")
        void success() {
            TaskState cancelled = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "Fix sink",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "CANCELLED",
                    now.plusSeconds(86400),
                    "BUDGET",
                    List.of(),
                    null,
                    null,
                    null,
                    now,
                    now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(cancelled));
            when(taskPhotoKeyHelper.populatePhotoKeys(cancelled)).thenReturn(cancelled);

            TaskCancelResult result = service.cancelTask("c1", "t1");

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.task().status()).isEqualTo("CANCELLED");
            verify(taskDao).updateStatus(eq("t1"), eq("CANCELLED"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("updateTask")
    class UpdateTaskTests {

        @Test
        @DisplayName("returns NOT_FOUND when task does not exist")
        void notFound() {
            when(taskDao.findById("t1")).thenReturn(Optional.empty());

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask("new desc", null, null, null, null, null, null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.NOT_FOUND);
        }

        @Test
        @DisplayName("returns FORBIDDEN when not owner")
        void forbidden() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result =
                    service.updateTask("other", "t1", new UpdateTask(null, null, null, null, null, null, null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.FORBIDDEN);
        }

        @Test
        @DisplayName("returns INVALID_STATUS when task is not OPEN")
        void invalidStatus() {
            TaskState assigned = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "ASSIGNED",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(assigned));
            when(taskPhotoKeyHelper.populatePhotoKeys(assigned)).thenReturn(assigned);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask(null, null, null, null, null, null, null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_STATUS);
        }

        @Test
        @DisplayName("returns INVALID_DESCRIPTION when sanitized description is blank")
        void invalidDescription() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask("   ", null, null, null, null, null, null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_DESCRIPTION);
        }

        @Test
        @DisplayName("returns INVALID_LOCATION when sanitized location is blank")
        void invalidLocation() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask(null, null, null, null, "   ", null, null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_LOCATION);
        }

        @Test
        @DisplayName("returns INVALID_SCHEDULE when date is in the past")
        void invalidSchedule() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result = service.updateTask(
                    "c1", "t1", new UpdateTask(null, null, null, null, null, "2020-01-01T00:00:00Z", null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_SCHEDULE);
        }

        @Test
        @DisplayName("returns INVALID_SCHEDULE when date format is bad")
        void badScheduleFormat() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask(null, null, null, null, null, "not-a-date", null));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_SCHEDULE);
        }

        @Test
        @DisplayName("returns TOO_MANY_PHOTOS when more than 3")
        void tooManyPhotos() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result = service.updateTask(
                    "c1", "t1", new UpdateTask(null, null, null, null, null, null, List.of("k1", "k2", "k3", "k4")));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.TOO_MANY_PHOTOS);
        }

        @Test
        @DisplayName("returns INVALID_PHOTO_KEY when keys not owned")
        void invalidPhotoKeys() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(any(), eq("c1"))).thenReturn(false);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask(null, null, null, null, null, null, List.of("bad")));

            assertThat(result.errorCode()).isEqualTo(TaskUpdateResult.INVALID_PHOTO_KEY);
        }

        @Test
        @DisplayName("updates task successfully with no photo changes")
        void successNoPhotos() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);

            TaskUpdateResult result = service.updateTask(
                    "c1", "t1", new UpdateTask("new desc", 6000, 48.0, 107.0, "New loc", null, null));

            assertThat(result.isSuccess()).isTrue();
            verify(taskDao)
                    .updateDetails(
                            eq("t1"),
                            eq("new desc"),
                            eq(6000),
                            eq(48.0),
                            eq(107.0),
                            eq("New loc"),
                            any(Instant.class),
                            any(Instant.class));
        }

        @Test
        @DisplayName("replaces photos on update")
        void replacesPhotos() {
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask));
            when(taskPhotoKeyHelper.populatePhotoKeys(openTask)).thenReturn(openTask);
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of("k1"), "c1")).thenReturn(true);

            TaskUpdateResult result =
                    service.updateTask("c1", "t1", new UpdateTask(null, null, null, null, null, null, List.of("k1")));

            assertThat(result.isSuccess()).isTrue();
            verify(taskPhotoDao).deleteByTaskId("t1");
            verify(taskPhotoDao).insert(anyString(), eq("t1"), eq("k1"), eq(0));
        }
    }
}
