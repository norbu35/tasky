package mn.tasky.task.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dto.TaskDraft;
import org.springframework.stereotype.Service;

/**
 * Manages task draft lifecycle: creation with server-bound schema version,
 * retrieval with expiration enforcement, and answer updates.
 */
@Service
public class TaskDraftService {

    private final TaskDraftDao taskDraftDao;
    private final CategoryDao categoryDao;
    private final CategorySchemaVersionDao categorySchemaVersionDao;

    public TaskDraftService(
            TaskDraftDao taskDraftDao, CategoryDao categoryDao, CategorySchemaVersionDao categorySchemaVersionDao) {
        this.taskDraftDao = taskDraftDao;
        this.categoryDao = categoryDao;
        this.categorySchemaVersionDao = categorySchemaVersionDao;
    }

    /**
     * Creates a new task draft bound to the active schema version for the given category.
     * The client does NOT supply the schema version; the server resolves it from the
     * currently active schema.
     *
     * @param customerId the authenticated customer's ID
     * @param categoryId the category to create a draft for
     * @return the created TaskDraft
     * @throws IllegalArgumentException if category does not exist
     * @throws IllegalStateException    if category is inactive, intake is not enabled,
     *                                  or no active schema version exists
     */
    public TaskDraft createDraft(String customerId, String categoryId) {
        CategoryState category =
                categoryDao.findById(categoryId).orElseThrow(() -> new IllegalArgumentException("Category not found."));

        if (!category.isActive()) {
            throw new IllegalStateException("Category is not active.");
        }

        if (!Boolean.TRUE.equals(category.intakeEnabled())) {
            throw new IllegalStateException("Intake is not enabled for this category.");
        }

        CategorySchemaVersion activeSchema = categorySchemaVersionDao
                .findActiveByCategoryId(categoryId)
                .orElseThrow(() -> new IllegalStateException("No active schema version for this category."));

        String id = UUID.randomUUID().toString();
        taskDraftDao.insert(id, customerId, categoryId, null, activeSchema.version(), null);

        return taskDraftDao
                .findById(id)
                .orElseThrow(() -> new IllegalStateException("Draft was inserted but could not be retrieved."));
    }

    /**
     * Retrieves a draft by ID, enforcing expiration. Returns empty if the draft
     * does not exist or has expired.
     *
     * @param draftId the draft ID to look up
     * @return the draft if found and not expired
     */
    public Optional<TaskDraft> getDraft(String draftId) {
        return taskDraftDao
                .findById(draftId)
                .filter(draft -> draft.expiresAt() == null || draft.expiresAt().isAfter(Instant.now()));
    }

    /**
     * Updates the intake answers and summary draft for an existing draft.
     * The draft must exist and not be expired.
     *
     * @param draftId           the draft ID to update
     * @param intakeAnswersJson the intake answers as JSON string
     * @param summaryDraft      the summary draft text
     * @return the updated draft
     * @throws IllegalArgumentException if the draft does not exist
     * @throws IllegalStateException    if the draft has expired
     */
    public TaskDraft updateDraft(String draftId, String intakeAnswersJson, String summaryDraft) {
        TaskDraft existing =
                taskDraftDao.findById(draftId).orElseThrow(() -> new IllegalArgumentException("Draft not found."));

        if (existing.expiresAt() != null && !existing.expiresAt().isAfter(Instant.now())) {
            throw new IllegalStateException("Draft has expired.");
        }

        taskDraftDao.update(draftId, intakeAnswersJson, summaryDraft);

        return taskDraftDao
                .findById(draftId)
                .orElseThrow(() -> new IllegalStateException("Draft was updated but could not be retrieved."));
    }
}
