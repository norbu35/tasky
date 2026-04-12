package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskDraftResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskDraftLocationTests {

    @Test
    @DisplayName("TaskDraftResponse.from() maps location fields")
    void responseIncludesLocationFields() {
        var draft = new TaskDraft(
                "d1",
                "c1",
                "cat1",
                null,
                1,
                null,
                47.9184,
                106.9177,
                "Near State Dept Store",
                Instant.now(),
                Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isEqualTo(47.9184);
        assertThat(response.locationLng()).isEqualTo(106.9177);
        assertThat(response.locationText()).isEqualTo("Near State Dept Store");
    }

    @Test
    @DisplayName("TaskDraftResponse.from() handles null location")
    void responseHandlesNullLocation() {
        var draft = new TaskDraft(
                "d1",
                "c1",
                "cat1",
                null,
                1,
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now().plusSeconds(3600));

        TaskDraftResponse response = TaskDraftResponse.from(draft);

        assertThat(response.locationLat()).isNull();
        assertThat(response.locationLng()).isNull();
        assertThat(response.locationText()).isNull();
    }

    @Test
    @DisplayName("updateDraft passes location fields to DAO")
    void updateDraftPassesLocation() {
        TaskDraftDao dao = mock(TaskDraftDao.class);
        var service = new TaskDraftService(dao, mock(CategoryDao.class), mock(CategorySchemaVersionDao.class));

        var existing = new TaskDraft(
                "d1",
                "user1",
                "cat1",
                null,
                1,
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now().plusSeconds(86400));
        when(dao.findById("d1")).thenReturn(Optional.of(existing), Optional.of(existing));

        service.updateDraft("d1", "user1", null, null, 47.9184, 106.9177, "Near State Dept Store");

        verify(dao).update(eq("d1"), isNull(), isNull(), eq(47.9184), eq(106.9177), eq("Near State Dept Store"));
    }

    @Test
    @DisplayName("updateDraft rejects mismatched owner (security: must throw, not silently update)")
    void updateDraftRejectsWrongOwner() {
        TaskDraftDao dao = mock(TaskDraftDao.class);
        var service = new TaskDraftService(
                dao,
                mock(mn.tasky.category.dao.CategoryDao.class),
                mock(mn.tasky.category.dao.CategorySchemaVersionDao.class));

        var existing = new TaskDraft(
                "d1",
                "owner-user",
                "cat1",
                null,
                1,
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now().plusSeconds(86400));
        when(dao.findById("d1")).thenReturn(Optional.of(existing));

        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> service.updateDraft("d1", "attacker-user", null, null, null, null, null));

        verify(dao, never()).update(any(String.class), any(), any(), any(), any(), any());
    }
}
