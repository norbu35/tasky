package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record TaskDraftResponse(
    String id,
    @JsonProperty("customer_id") String customerId,
    @JsonProperty("category_id") String categoryId,
    @JsonProperty("intake_answers") String intakeAnswers,
    @JsonProperty("intake_schema_version") int intakeSchemaVersion,
    @JsonProperty("summary_draft") String summaryDraft,
    @JsonProperty("created_at") Instant createdAt,
    @JsonProperty("expires_at") Instant expiresAt) {

    public static TaskDraftResponse from(TaskDraft draft) {
        return new TaskDraftResponse(
            draft.id(),
            draft.customerId(),
            draft.categoryId(),
            draft.intakeAnswersJson(),
            draft.intakeSchemaVersion(),
            draft.summaryDraft(),
            draft.createdAt(),
            draft.expiresAt());
    }
}
