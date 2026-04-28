package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dto.TaskDraft;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskDraftService")
class TaskDraftServiceTest {

    @Mock
    private TaskDraftDao taskDraftDao;

    @Mock
    private CategoryQueryPort categoryQueryPort;

    private TaskDraftService service;

    private final CategoryState activeCategory =
            new CategoryState("cat1", "Plumbing", "desc", null, true, 0, true, false, null, null);

    private final CategorySchemaVersion schemaVersion = new CategorySchemaVersion(
            "sv1", "cat1", 1, "[{\"key\":\"q1\"}]", "ACTIVE", "admin", Instant.now(), Instant.now());

    @BeforeEach
    void setUp() {
        service = new TaskDraftService(taskDraftDao, categoryQueryPort);
    }

    private TaskDraft makeDraft(String id, String customerId, Instant expiresAt) {
        return new TaskDraft(id, customerId, "cat1", null, 1, null, null, null, null, Instant.now(), expiresAt);
    }

    @Nested
    @DisplayName("createDraft")
    class CreateDraft {
        @Test
        @DisplayName("throws when category not found")
        void categoryNotFound() {
            when(categoryQueryPort.getCategory("cat99")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createDraft("c1", "cat99"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Category not found");
        }

        @Test
        @DisplayName("throws when category is inactive")
        void inactiveCategory() {
            CategoryState inactive = new CategoryState("cat1", "Pl", "d", null, false, 0, true, false, null, null);
            when(categoryQueryPort.getCategory("cat1")).thenReturn(Optional.of(inactive));
            assertThatThrownBy(() -> service.createDraft("c1", "cat1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("not active");
        }

        @Test
        @DisplayName("throws when intake not enabled")
        void intakeNotEnabled() {
            CategoryState noIntake = new CategoryState("cat1", "Pl", "d", null, true, 0, false, false, null, null);
            when(categoryQueryPort.getCategory("cat1")).thenReturn(Optional.of(noIntake));
            assertThatThrownBy(() -> service.createDraft("c1", "cat1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Intake is not enabled");
        }

        @Test
        @DisplayName("throws when no active schema version")
        void noActiveSchema() {
            when(categoryQueryPort.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(categoryQueryPort.getActiveSchemaVersion("cat1")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createDraft("c1", "cat1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("No active schema version");
        }

        @Test
        @DisplayName("creates draft successfully")
        void success() {
            TaskDraft draft = makeDraft("d1", "c1", Instant.now().plusSeconds(3600));
            when(categoryQueryPort.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(categoryQueryPort.getActiveSchemaVersion("cat1")).thenReturn(Optional.of(schemaVersion));
            when(taskDraftDao.findById(anyString())).thenReturn(Optional.of(draft));
            TaskDraft result = service.createDraft("c1", "cat1");
            assertThat(result.id()).isEqualTo("d1");
        }
    }

    @Nested
    @DisplayName("getDraft")
    class GetDraft {
        @Test
        @DisplayName("returns empty when not found")
        void notFound() {
            when(taskDraftDao.findById("d1")).thenReturn(Optional.empty());
            assertThat(service.getDraft("d1", "c1")).isEmpty();
        }

        @Test
        @DisplayName("returns empty when expired")
        void expired() {
            TaskDraft expired = makeDraft("d1", "c1", Instant.now().minusSeconds(60));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(expired));
            assertThat(service.getDraft("d1", "c1")).isEmpty();
        }

        @Test
        @DisplayName("returns empty when not owner")
        void notOwner() {
            TaskDraft draft = makeDraft("d1", "c1", Instant.now().plusSeconds(3600));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));
            assertThat(service.getDraft("d1", "other")).isEmpty();
        }

        @Test
        @DisplayName("returns draft when valid and owned")
        void success() {
            TaskDraft draft = makeDraft("d1", "c1", Instant.now().plusSeconds(3600));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));
            assertThat(service.getDraft("d1", "c1")).isPresent();
        }
    }

    @Nested
    @DisplayName("updateDraft")
    class UpdateDraft {
        @Test
        @DisplayName("throws when draft not found")
        void notFound() {
            when(taskDraftDao.findById("d1")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.updateDraft("d1", "c1", "{}", "summary", null, null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Draft not found");
        }

        @Test
        @DisplayName("throws when not owner")
        void notOwner() {
            TaskDraft draft = makeDraft("d1", "c1", Instant.now().plusSeconds(3600));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.updateDraft("d1", "other", "{}", "summary", null, null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Draft not found");
        }

        @Test
        @DisplayName("throws when expired")
        void expired() {
            TaskDraft expired = makeDraft("d1", "c1", Instant.now().minusSeconds(60));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(expired));
            assertThatThrownBy(() -> service.updateDraft("d1", "c1", "{}", "summary", null, null, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("updates draft successfully")
        void success() {
            TaskDraft draft = makeDraft("d1", "c1", Instant.now().plusSeconds(3600));
            TaskDraft updated = new TaskDraft(
                    "d1",
                    "c1",
                    "cat1",
                    "{\"q1\":\"a1\"}",
                    1,
                    "summary",
                    47.9,
                    106.9,
                    "UB",
                    Instant.now(),
                    Instant.now().plusSeconds(3600));
            when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft), Optional.of(updated));
            TaskDraft result = service.updateDraft("d1", "c1", "{\"q1\":\"a1\"}", "summary", 47.9, 106.9, "UB");
            assertThat(result.intakeAnswersJson()).isEqualTo("{\"q1\":\"a1\"}");
            assertThat(result.summaryDraft()).isEqualTo("summary");
        }
    }
}
