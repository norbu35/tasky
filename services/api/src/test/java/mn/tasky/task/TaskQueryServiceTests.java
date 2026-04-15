package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.task.application.TaskQueryService;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskPhotoDao;
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

/**
 * Domain-unit tests for TaskQueryService.
 * Covers task retrieval, feed listing, my-tasks filtering, cursor encoding/decoding,
 * and recent location deduplication.
 */
@ExtendWith(MockitoExtension.class)
class TaskQueryServiceTests {

    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskPhotoDao taskPhotoDao;

    private TaskQueryService service;

    @BeforeEach
    void setUp() {
        service = new TaskQueryService(taskDao, taskPhotoDao);
    }

    private TaskState openTask(String id) {
        return new TaskState(
                id,
                CUSTOMER_ID,
                "cat-1",
                "Fix sink",
                5000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                Instant.now(),
                null,
                null,
                null,
                null,
                Instant.parse("2026-04-10T00:00:00Z"),
                Instant.now());
    }

    // ── getTask ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTask")
    class GetTask {

        @Test
        @DisplayName("Returns empty when task does not exist")
        void missingTaskReturnsEmpty() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.empty());

            assertThat(service.getTask(TASK_ID)).isEmpty();
        }

        @Test
        @DisplayName("Returns task with photo keys populated from DAO")
        void populatesPhotoKeys() {
            TaskState task = openTask(TASK_ID);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
            when(taskPhotoDao.findKeysByTaskId(TASK_ID)).thenReturn(List.of("photo-1", "photo-2"));

            Optional<TaskState> result = service.getTask(TASK_ID);

            assertThat(result).isPresent();
            assertThat(result.get().photoKeys()).containsExactly("photo-1", "photo-2");
        }

        @Test
        @DisplayName("Skips photo population when keys already present")
        void skipsPopulationWhenKeysPresent() {
            TaskState taskWithPhotos = new TaskState(
                    TASK_ID,
                    CUSTOMER_ID,
                    "cat-1",
                    "Fix sink",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "OPEN",
                    Instant.now(),
                    List.of("existing-key"),
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(taskWithPhotos));

            Optional<TaskState> result = service.getTask(TASK_ID);

            assertThat(result.get().photoKeys()).containsExactly("existing-key");
        }
    }

    // ── listTasks ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listTasks")
    class ListTasks {

        @Test
        @DisplayName("Returns paginated results with nextCursor when hasMore")
        void paginatesWithCursor() {
            TaskState task1 = openTask(UUID.randomUUID().toString());
            TaskState task2 = openTask(UUID.randomUUID().toString());
            // 2 results for limit=1 → hasMore=true
            when(taskDao.findOpen(isNull(), isNull(), isNull(), eq(2))).thenReturn(List.of(task1, task2));
            when(taskPhotoDao.findKeysByTaskId(any())).thenReturn(List.of());

            TaskPage page = service.listTasks(null, null, null, null, null, 1);

            assertThat(page.data()).hasSize(1);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isNotNull();
        }

        @Test
        @DisplayName("Returns empty page when no open tasks")
        void noTasksReturnsEmptyPage() {
            when(taskDao.findOpen(isNull(), isNull(), isNull(), eq(11))).thenReturn(List.of());

            TaskPage page = service.listTasks(null, null, null, null, null, 10);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("Geo-radius query is used when lat/lng/radius are provided")
        void geoRadiusQuery() {
            when(taskDao.findOpenWithinRadius(isNull(), eq(47.9), eq(106.9), eq(5000.0), isNull(), isNull(), eq(11)))
                    .thenReturn(List.of());

            service.listTasks(null, 47.9, 106.9, 5.0, null, 10);

            verify(taskDao).findOpenWithinRadius(isNull(), eq(47.9), eq(106.9), eq(5000.0), isNull(), isNull(), eq(11));
        }
    }

    // ── listMyTasks ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("listMyTasks")
    class ListMyTasks {

        @Test
        @DisplayName("Defaults to customer role when role is null")
        void defaultsToCustomerRole() {
            when(taskDao.findByCustomer(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11)))
                    .thenReturn(List.of());

            service.listMyTasks(CUSTOMER_ID, null, null, null, 10);

            verify(taskDao).findByCustomer(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11));
        }

        @Test
        @DisplayName("Tasker role filters as tasker")
        void taskerRoleFiltersAsTasker() {
            when(taskDao.findByTasker(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11)))
                    .thenReturn(List.of());

            service.listMyTasks(CUSTOMER_ID, "tasker", null, null, 10);

            verify(taskDao).findByTasker(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11));
        }

        @Test
        @DisplayName("Case-insensitive role normalization")
        void caseInsensitiveRole() {
            when(taskDao.findByTasker(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11)))
                    .thenReturn(List.of());

            service.listMyTasks(CUSTOMER_ID, "TASKER", null, null, 10);

            verify(taskDao).findByTasker(eq(CUSTOMER_ID), isNull(), isNull(), isNull(), eq(11));
        }

        @Test
        @DisplayName("Invalid role throws IAE")
        void invalidRoleThrows() {
            assertThatThrownBy(() -> service.listMyTasks(CUSTOMER_ID, "admin", null, null, 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Role filter is invalid");
        }

        @Test
        @DisplayName("Status filter normalizes to uppercase")
        void statusFilterNormalization() {
            when(taskDao.findByCustomer(eq(CUSTOMER_ID), eq("OPEN"), isNull(), isNull(), eq(11)))
                    .thenReturn(List.of());

            service.listMyTasks(CUSTOMER_ID, "customer", "open", null, 10);

            verify(taskDao).findByCustomer(eq(CUSTOMER_ID), eq("OPEN"), isNull(), isNull(), eq(11));
        }

        @Test
        @DisplayName("Invalid status throws IAE")
        void invalidStatusThrows() {
            assertThatThrownBy(() -> service.listMyTasks(CUSTOMER_ID, null, "INVALID_STATUS", null, 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Status filter is invalid");
        }
    }

    // ── cursor encoding/decoding ─────────────────────────────────────────

    @Nested
    @DisplayName("cursor encoding/decoding")
    class CursorCodec {

        @Test
        @DisplayName("Invalid cursor throws IAE")
        void invalidCursorThrows() {
            assertThatThrownBy(() -> service.listTasks(null, null, null, null, "garbage!@#$", 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }

        @Test
        @DisplayName("Malformed cursor payload throws IAE")
        void malformedPayloadThrows() {
            String badPayload = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString("no-pipe-separator".getBytes(StandardCharsets.UTF_8));

            assertThatThrownBy(() -> service.listTasks(null, null, null, null, badPayload, 10))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── recentLocations ─────────────────────────────────────────────────

    @Nested
    @DisplayName("recentLocations")
    class RecentLocations {

        @Test
        @DisplayName("Returns up to maxResults distinct locations")
        void returnsDistinctLocations() {
            List<RecentLocation> candidates = List.of(
                    new RecentLocation(47.900, 106.900, "Location A"),
                    new RecentLocation(47.950, 106.950, "Location B"), // >200m from A
                    new RecentLocation(47.990, 106.990, "Location C")); // >200m from B
            when(taskDao.findRecentLocationCandidates(UUID.fromString(CUSTOMER_ID)))
                    .thenReturn(candidates);

            List<RecentLocation> result = service.recentLocations(CUSTOMER_ID, 2);

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Skips locations within ~200m of accepted locations")
        void skipsNearbyLocations() {
            List<RecentLocation> candidates = List.of(
                    new RecentLocation(47.900000, 106.900000, "Loc A"),
                    new RecentLocation(47.900001, 106.900001, "Loc B (too close to A)"),
                    new RecentLocation(47.950000, 106.950000, "Loc C (far from A)"));
            when(taskDao.findRecentLocationCandidates(UUID.fromString(CUSTOMER_ID)))
                    .thenReturn(candidates);

            List<RecentLocation> result = service.recentLocations(CUSTOMER_ID, 10);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).locationText()).isEqualTo("Loc A");
            assertThat(result.get(1).locationText()).isEqualTo("Loc C (far from A)");
        }
    }
}
