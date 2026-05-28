package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminTaskCompositionServiceTests {

    @Mock
    private MarketplaceQueryPort marketplaceQueryPort;

    private AdminTaskCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminTaskCompositionService(marketplaceQueryPort);
    }

    @Nested
    @DisplayName("taskDetail")
    class TaskDetailTests {

        @Test
        @DisplayName("returns mapped task detail when task exists")
        void taskDetail_returnsMappedResponse() {
            String taskId = UUID.randomUUID().toString();
            Instant now = Instant.now();
            TaskState task = new TaskState(
                    taskId,
                    "customer-1",
                    "cat-1",
                    "Fix plumbing",
                    5000,
                    47.9,
                    106.9,
                    "Ulaanbaatar",
                    "OPEN",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);

            when(marketplaceQueryPort.getTask(taskId)).thenReturn(Optional.of(task));

            Optional<java.util.Map<String, Object>> result = service.taskDetail(taskId);

            assertThat(result).isPresent();
            java.util.Map<String, Object> body = result.get();
            assertThat(body).containsEntry("id", taskId);
            assertThat(body).containsEntry("customer_id", "customer-1");
            assertThat(body).containsEntry("category_id", "cat-1");
            assertThat(body).containsEntry("description", "Fix plumbing");
            assertThat(body).containsEntry("budget", 5000);
            assertThat(body).containsEntry("location_lat", 47.9);
            assertThat(body).containsEntry("location_lng", 106.9);
            assertThat(body).containsEntry("location_text", "Ulaanbaatar");
            assertThat(body).containsEntry("status", "OPEN");
            assertThat(body).containsEntry("pricing_mode", "BUDGET");
        }

        @Test
        @DisplayName("returns empty optional when task not found")
        void taskDetail_returnsEmptyWhenNotFound() {
            when(marketplaceQueryPort.getTask("missing")).thenReturn(Optional.empty());

            Optional<java.util.Map<String, Object>> result = service.taskDetail("missing");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("maps all task fields including photo_keys and intake_answers")
        void taskDetail_mapsAllFields() {
            String taskId = UUID.randomUUID().toString();
            Instant now = Instant.now();
            TaskState task = new TaskState(
                    taskId,
                    "c1",
                    "cat1",
                    "desc",
                    1000,
                    47.0,
                    106.0,
                    "loc",
                    "ASSIGNED",
                    now,
                    "QUOTE",
                    List.of("photo1.jpg"),
                    "{\"q1\":\"a1\"}",
                    2,
                    "summary",
                    now,
                    now);

            when(marketplaceQueryPort.getTask(taskId)).thenReturn(Optional.of(task));

            Optional<java.util.Map<String, Object>> result = service.taskDetail(taskId);

            assertThat(result).isPresent();
            java.util.Map<String, Object> body = result.get();
            assertThat(body).containsEntry("photo_keys", List.of("photo1.jpg"));
            assertThat(body).containsEntry("intake_answers_json", "{\"q1\":\"a1\"}");
            assertThat(body).containsEntry("intake_schema_version", 2);
            assertThat(body).containsEntry("scope_summary", "summary");
        }

        @Test
        @DisplayName("handles null scheduled_at by returning null value")
        void taskDetail_handlesNullScheduledAt() {
            String taskId = UUID.randomUUID().toString();
            Instant now = Instant.now();
            TaskState task = new TaskState(
                    taskId,
                    "c1",
                    "cat1",
                    "desc",
                    1000,
                    47.0,
                    106.0,
                    "loc",
                    "ASSIGNED",
                    null,
                    "QUOTE",
                    List.of("photo1.jpg"),
                    "{\"q1\":\"a1\"}",
                    2,
                    "summary",
                    now,
                    now);

            when(marketplaceQueryPort.getTask(taskId)).thenReturn(Optional.of(task));

            Optional<java.util.Map<String, Object>> result = service.taskDetail(taskId);

            assertThat(result).isPresent();
            java.util.Map<String, Object> body = result.get();
            assertThat(body).containsEntry("scheduled_at", null);
        }
    }
}
