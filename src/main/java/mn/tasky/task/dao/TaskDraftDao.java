package mn.tasky.task.dao;

import mn.tasky.task.dto.TaskDraft;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(TaskDraft.class)
public interface TaskDraftDao {

    default void insert(
        String id,
        String customerId,
        String categoryId,
        String intakeAnswersJson,
        int intakeSchemaVersion,
        String summaryDraft) {
        insert(
            required(id, "id"),
            required(customerId, "customerId"),
            required(categoryId, "categoryId"),
            intakeAnswersJson,
            intakeSchemaVersion,
            summaryDraft);
    }

    @SqlUpdate("INSERT INTO task_drafts (id, customer_id, category_id, intake_answers_json, "
        + "intake_schema_version, summary_draft) "
        + "VALUES (:id, :customerId, :categoryId, CAST(:intakeAnswersJson AS jsonb), "
        + ":intakeSchemaVersion, :summaryDraft)")
    void insert(
        @Bind("id") UUID id,
        @Bind("customerId") UUID customerId,
        @Bind("categoryId") UUID categoryId,
        @Bind("intakeAnswersJson") String intakeAnswersJson,
        @Bind("intakeSchemaVersion") int intakeSchemaVersion,
        @Bind("summaryDraft") String summaryDraft);

    default Optional<TaskDraft> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT id, customer_id, category_id, intake_answers_json, "
        + "intake_schema_version, summary_draft, created_at, expires_at "
        + "FROM task_drafts WHERE id = :id")
    Optional<TaskDraft> findById(@Bind("id") UUID id);

    default void update(String id, String intakeAnswersJson, String summaryDraft) {
        update(required(id, "id"), intakeAnswersJson, summaryDraft);
    }

    @SqlUpdate("UPDATE task_drafts SET intake_answers_json = CAST(:intakeAnswersJson AS jsonb), "
        + "summary_draft = :summaryDraft WHERE id = :id")
    void update(
        @Bind("id") UUID id,
        @Bind("intakeAnswersJson") String intakeAnswersJson,
        @Bind("summaryDraft") String summaryDraft);
}
