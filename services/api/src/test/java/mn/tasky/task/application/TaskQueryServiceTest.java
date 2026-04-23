package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskQueryService")
class TaskQueryServiceTest {

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskPhotoKeyHelper taskPhotoKeyHelper;

    private TaskQueryService service;
    private final Instant now = Instant.now();

    private final TaskState task1 = new TaskState(
            "id1", "c1", "cat1", "desc1", 5000, 47.9, 106.9, "UB", "OPEN", now, "BUDGET", List.of(), null, null, null,
            now, now);

    @BeforeEach
    void setUp() {
        service = new TaskQueryService(taskDao, taskPhotoKeyHelper);
    }

    @Nested
    @DisplayName("getTask")
    class GetTask {
        @Test
        @DisplayName("returns task with populated photo keys")
        void found() {
            when(taskDao.findById("id1")).thenReturn(Optional.of(task1));
            when(taskPhotoKeyHelper.populatePhotoKeys(task1)).thenReturn(task1);
            assertThat(service.getTask("id1")).isPresent();
        }

        @Test
        @DisplayName("returns empty when not found")
        void notFound() {
            when(taskDao.findById("missing")).thenReturn(Optional.empty());
            assertThat(service.getTask("missing")).isEmpty();
        }
    }

    @Nested
    @DisplayName("listTasks")
    class ListTasks {
        @Test
        @DisplayName("returns empty page when no tasks")
        void empty() {
            when(taskDao.findOpen((String) isNull(), (Instant) isNull(), (UUID) isNull(), anyInt()))
                    .thenReturn(List.of());
            TaskPage page = service.listTasks(null, null, null, null, null, 10);
            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("returns page with tasks")
        void withResults() {
            when(taskDao.findOpen((String) isNull(), (Instant) isNull(), (UUID) isNull(), anyInt()))
                    .thenReturn(List.of(task1));
            when(taskPhotoKeyHelper.populatePhotoKeys(task1)).thenReturn(task1);
            TaskPage page = service.listTasks(null, null, null, null, null, 10);
            assertThat(page.data()).hasSize(1);
            assertThat(page.hasMore()).isFalse();
        }
    }

    @Nested
    @DisplayName("listMyTasks")
    class ListMyTasks {
        @Test
        @DisplayName("defaults to customer role")
        void customerRole() {
            when(taskDao.findByCustomer(eq("c1"), isNull(), (Instant) isNull(), (UUID) isNull(), anyInt()))
                    .thenReturn(List.of(task1));
            when(taskPhotoKeyHelper.populatePhotoKeys(task1)).thenReturn(task1);
            TaskPage page = service.listMyTasks("c1", null, null, null, 10);
            assertThat(page.data()).hasSize(1);
        }

        @Test
        @DisplayName("uses tasker role")
        void taskerRole() {
            when(taskDao.findByTasker(eq("tk1"), isNull(), (Instant) isNull(), (UUID) isNull(), anyInt()))
                    .thenReturn(List.of(task1));
            when(taskPhotoKeyHelper.populatePhotoKeys(task1)).thenReturn(task1);
            TaskPage page = service.listMyTasks("tk1", "tasker", null, null, 10);
            assertThat(page.data()).hasSize(1);
        }

        @Test
        @DisplayName("throws on invalid role")
        void invalidRole() {
            assertThatThrownBy(() -> service.listMyTasks("c1", "admin", null, null, 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Role filter is invalid");
        }

        @Test
        @DisplayName("throws on invalid status")
        void invalidStatus() {
            assertThatThrownBy(() -> service.listMyTasks("c1", null, "INVALID", null, 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Status filter is invalid");
        }

        @Test
        @DisplayName("accepts valid status filter")
        void validStatus() {
            when(taskDao.findByCustomer(eq("c1"), eq("OPEN"), (Instant) isNull(), (UUID) isNull(), anyInt()))
                    .thenReturn(List.of(task1));
            when(taskPhotoKeyHelper.populatePhotoKeys(task1)).thenReturn(task1);
            TaskPage page = service.listMyTasks("c1", null, "OPEN", null, 10);
            assertThat(page.data()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("recentLocations")
    class RecentLocations {
        @Test
        @DisplayName("returns empty list when no candidates")
        void empty() {
            when(taskDao.findRecentLocationCandidates(org.mockito.ArgumentMatchers.any(UUID.class)))
                    .thenReturn(List.of());
            List<RecentLocation> result = service.recentLocations("00000000-0000-0000-0000-000000000001", 5);
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns distinct locations filtering nearby duplicates")
        void filtersDuplicates() {
            RecentLocation loc1 = new RecentLocation(47.900, 106.900, "Loc A");
            RecentLocation loc2 = new RecentLocation(47.901, 106.901, "Near A");
            RecentLocation loc3 = new RecentLocation(48.000, 107.000, "Far");
            when(taskDao.findRecentLocationCandidates(org.mockito.ArgumentMatchers.any(UUID.class)))
                    .thenReturn(List.of(loc1, loc2, loc3));
            List<RecentLocation> result = service.recentLocations("00000000-0000-0000-0000-000000000001", 5);
            assertThat(result).hasSize(2);
            assertThat(result.get(0).locationText()).isEqualTo("Loc A");
            assertThat(result.get(1).locationText()).isEqualTo("Far");
        }

        @Test
        @DisplayName("respects maxResults limit")
        void maxResults() {
            RecentLocation loc1 = new RecentLocation(47.900, 106.900, "A");
            RecentLocation loc2 = new RecentLocation(48.000, 107.000, "B");
            RecentLocation loc3 = new RecentLocation(49.000, 108.000, "C");
            when(taskDao.findRecentLocationCandidates(org.mockito.ArgumentMatchers.any(UUID.class)))
                    .thenReturn(List.of(loc1, loc2, loc3));
            List<RecentLocation> result = service.recentLocations("00000000-0000-0000-0000-000000000001", 2);
            assertThat(result).hasSize(2);
        }
    }
}
