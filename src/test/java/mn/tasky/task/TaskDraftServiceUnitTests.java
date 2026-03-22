package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dto.TaskDraft;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskDraftServiceUnitTests {

    @Mock
    private TaskDraftDao taskDraftDao;

    @Mock
    private CategoryDao categoryDao;

    @Mock
    private CategorySchemaVersionDao categorySchemaVersionDao;

    private TaskDraftService service;

    @BeforeEach
    void setUp() {
        service = new TaskDraftService(taskDraftDao, categoryDao, categorySchemaVersionDao);
    }

    // --- createDraft tests ---

    @Test
    @DisplayName("createDraft throws when category not found")
    void createDraftCategoryNotFound() {
        when(categoryDao.findById("cat-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createDraft("cust-1", "cat-1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Category not found.");
    }

    @Test
    @DisplayName("createDraft throws when category is inactive")
    void createDraftCategoryInactive() {
        CategoryState inactive = new CategoryState("cat-1", "Test", "Тест", "icon.png", false, 1, true, 1, "[]", null);
        when(categoryDao.findById("cat-1")).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.createDraft("cust-1", "cat-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Category is not active.");
    }

    @Test
    @DisplayName("createDraft throws when intake is not enabled")
    void createDraftIntakeNotEnabled() {
        CategoryState noIntake =
                new CategoryState("cat-1", "Test", "Тест", "icon.png", true, 1, false, null, null, null);
        when(categoryDao.findById("cat-1")).thenReturn(Optional.of(noIntake));

        assertThatThrownBy(() -> service.createDraft("cust-1", "cat-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Intake is not enabled for this category.");
    }

    @Test
    @DisplayName("createDraft throws when intake is null (not enabled)")
    void createDraftIntakeNull() {
        CategoryState nullIntake =
                new CategoryState("cat-1", "Test", "Тест", "icon.png", true, 1, null, null, null, null);
        when(categoryDao.findById("cat-1")).thenReturn(Optional.of(nullIntake));

        assertThatThrownBy(() -> service.createDraft("cust-1", "cat-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Intake is not enabled for this category.");
    }

    @Test
    @DisplayName("createDraft throws when no active schema version exists")
    void createDraftNoActiveSchema() {
        CategoryState active = new CategoryState("cat-1", "Test", "Тест", "icon.png", true, 1, true, 1, "[]", null);
        when(categoryDao.findById("cat-1")).thenReturn(Optional.of(active));
        when(categorySchemaVersionDao.findActiveByCategoryId("cat-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createDraft("cust-1", "cat-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No active schema version for this category.");
    }

    @Test
    @DisplayName("createDraft succeeds and returns persisted draft")
    void createDraftSuccess() {
        CategoryState active = new CategoryState("cat-1", "Test", "Тест", "icon.png", true, 1, true, 1, "[]", null);
        when(categoryDao.findById("cat-1")).thenReturn(Optional.of(active));

        Instant now = Instant.now();
        CategorySchemaVersion schema =
                new CategorySchemaVersion("sv-1", "cat-1", 1, "[]", "ACTIVE", false, "admin", now, now);
        when(categorySchemaVersionDao.findActiveByCategoryId("cat-1")).thenReturn(Optional.of(schema));

        TaskDraft draft = new TaskDraft("draft-1", "cust-1", "cat-1", null, 1, null, now, now.plusSeconds(3600));
        when(taskDraftDao.findById(anyString())).thenReturn(Optional.of(draft));

        TaskDraft result = service.createDraft("cust-1", "cat-1");

        assertThat(result).isEqualTo(draft);
        verify(taskDraftDao).insert(anyString(), eq("cust-1"), eq("cat-1"), eq(null), eq(1), eq(null));
    }

    // --- getDraft tests ---

    @Test
    @DisplayName("getDraft returns empty when draft not found")
    void getDraftNotFound() {
        when(taskDraftDao.findById("draft-x")).thenReturn(Optional.empty());

        assertThat(service.getDraft("draft-x", "c1")).isEmpty();
    }

    @Test
    @DisplayName("getDraft returns draft when not expired (null expiresAt)")
    void getDraftNoExpiration() {
        TaskDraft draft = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), null);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));

        assertThat(service.getDraft("d1", "c1")).contains(draft);
    }

    @Test
    @DisplayName("getDraft returns draft when not yet expired")
    void getDraftNotExpired() {
        Instant future = Instant.now().plusSeconds(3600);
        TaskDraft draft = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), future);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));

        assertThat(service.getDraft("d1", "c1")).contains(draft);
    }

    @Test
    @DisplayName("getDraft returns empty when draft is expired")
    void getDraftExpired() {
        Instant past = Instant.now().minusSeconds(3600);
        TaskDraft draft =
                new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now().minusSeconds(7200), past);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));

        assertThat(service.getDraft("d1", "c1")).isEmpty();
    }

    @Test
    @DisplayName("getDraft returns empty when requesting user is not the owner")
    void getDraftWrongUser() {
        TaskDraft draft = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), null);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(draft));

        assertThat(service.getDraft("d1", "other-user")).isEmpty();
    }

    // --- updateDraft tests ---

    @Test
    @DisplayName("updateDraft throws when draft not found")
    void updateDraftNotFound() {
        when(taskDraftDao.findById("draft-x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateDraft("draft-x", "c1", "{}", "summary"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Draft not found.");
    }

    @Test
    @DisplayName("updateDraft throws when requesting user is not the owner")
    void updateDraftWrongUser() {
        TaskDraft existing = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), null);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.updateDraft("d1", "other-user", "{}", "summary"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Draft not found.");
    }

    @Test
    @DisplayName("updateDraft throws when draft has expired")
    void updateDraftExpired() {
        Instant past = Instant.now().minusSeconds(3600);
        TaskDraft expired =
                new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now().minusSeconds(7200), past);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.updateDraft("d1", "c1", "{}", "summary"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Draft has expired.");
    }

    @Test
    @DisplayName("updateDraft succeeds and returns updated draft")
    void updateDraftSuccess() {
        Instant future = Instant.now().plusSeconds(3600);
        TaskDraft existing = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), future);
        TaskDraft updated = new TaskDraft("d1", "c1", "cat-1", "{\"a\":1}", 1, "My summary", Instant.now(), future);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(existing)).thenReturn(Optional.of(updated));

        TaskDraft result = service.updateDraft("d1", "c1", "{\"a\":1}", "My summary");

        assertThat(result).isEqualTo(updated);
        verify(taskDraftDao).update("d1", "{\"a\":1}", "My summary");
    }

    @Test
    @DisplayName("updateDraft succeeds when expiresAt is null (no expiration)")
    void updateDraftNoExpiration() {
        TaskDraft existing = new TaskDraft("d1", "c1", "cat-1", null, 1, null, Instant.now(), null);
        TaskDraft updated = new TaskDraft("d1", "c1", "cat-1", "{}", 1, "s", Instant.now(), null);
        when(taskDraftDao.findById("d1")).thenReturn(Optional.of(existing)).thenReturn(Optional.of(updated));

        TaskDraft result = service.updateDraft("d1", "c1", "{}", "s");

        assertThat(result).isEqualTo(updated);
    }
}
