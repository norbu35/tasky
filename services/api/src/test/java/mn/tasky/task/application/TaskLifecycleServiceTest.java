package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskLifecycleService")
class TaskLifecycleServiceTest {

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskPhotoKeyHelper taskPhotoKeyHelper;

    private TaskLifecycleService service;
    private final Instant now = Instant.now();

    private final TaskState openTask = new TaskState(
            "t1", "c1", "cat1", "desc", 5000, 47.9, 106.9, "UB", "OPEN", now, "BUDGET", null, null, null, null, now,
            now);

    @BeforeEach
    void setUp() {
        service = new TaskLifecycleService(taskDao, taskPhotoKeyHelper);
    }

    @Nested
    @DisplayName("transitionToAssigned")
    class TransitionToAssigned {
        @Test
        @DisplayName("returns empty when task not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.transitionToAssigned("missing")).isEmpty();
        }

        @Test
        @DisplayName("transitions task to ASSIGNED")
        void success() {
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
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(assigned));
            when(taskPhotoKeyHelper.populatePhotoKeys(assigned)).thenReturn(assigned);

            Optional<TaskState> result = service.transitionToAssigned("t1");

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("ASSIGNED");
            verify(taskDao).updateStatus(eq("t1"), eq("ASSIGNED"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("reopenTask")
    class ReopenTask {
        @Test
        @DisplayName("returns empty when task not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.reopenTask("missing")).isEmpty();
        }

        @Test
        @DisplayName("reopens task to OPEN status")
        void success() {
            TaskState reopened = new TaskState(
                    "t1", "c1", "cat1", "desc", 5000, 47.9, 106.9, "UB", "OPEN", now, "BUDGET", null, null, null, null,
                    now, now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(reopened));
            when(taskPhotoKeyHelper.populatePhotoKeys(reopened)).thenReturn(reopened);

            Optional<TaskState> result = service.reopenTask("t1");

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("OPEN");
            verify(taskDao).updateStatus(eq("t1"), eq("OPEN"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("transitionToCompleted")
    class TransitionToCompleted {
        @Test
        @DisplayName("returns empty when task not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.transitionToCompleted("missing")).isEmpty();
        }

        @Test
        @DisplayName("transitions task to COMPLETED")
        void success() {
            TaskState completed = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "COMPLETED",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(completed));
            when(taskPhotoKeyHelper.populatePhotoKeys(completed)).thenReturn(completed);

            assertThat(service.transitionToCompleted("t1")).isPresent();
            verify(taskDao).updateStatus(eq("t1"), eq("COMPLETED"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("transitionToCancelled")
    class TransitionToCancelled {
        @Test
        @DisplayName("returns empty when task not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.transitionToCancelled("missing")).isEmpty();
        }

        @Test
        @DisplayName("transitions task to CANCELLED")
        void success() {
            TaskState cancelled = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "CANCELLED",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(cancelled));
            when(taskPhotoKeyHelper.populatePhotoKeys(cancelled)).thenReturn(cancelled);

            assertThat(service.transitionToCancelled("t1")).isPresent();
            verify(taskDao).updateStatus(eq("t1"), eq("CANCELLED"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("transitionToNoShow")
    class TransitionToNoShow {
        @Test
        @DisplayName("returns empty when task not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.transitionToNoShow("missing")).isEmpty();
        }

        @Test
        @DisplayName("transitions task to NO_SHOW")
        void success() {
            TaskState noShow = new TaskState(
                    "t1", "c1", "cat1", "desc", 5000, 47.9, 106.9, "UB", "NO_SHOW", now, "BUDGET", null, null, null,
                    null, now, now);
            when(taskDao.findById("t1")).thenReturn(Optional.of(openTask), Optional.of(noShow));
            when(taskPhotoKeyHelper.populatePhotoKeys(noShow)).thenReturn(noShow);

            assertThat(service.transitionToNoShow("t1")).isPresent();
            verify(taskDao).updateStatus(eq("t1"), eq("NO_SHOW"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("updateTaskStatus")
    class UpdateTaskStatus {
        @Test
        @DisplayName("delegates to DAO")
        void delegates() {
            service.updateTaskStatus("t1", "CANCELLED");
            verify(taskDao).updateStatus(eq("t1"), eq("CANCELLED"), any(Instant.class));
        }
    }
}
