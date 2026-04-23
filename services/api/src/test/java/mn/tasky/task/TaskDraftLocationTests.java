package mn.tasky.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dto.TaskDraft;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskDraftLocationTests {

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
