package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UpdateDraftRequest(
    @JsonProperty("intake_answers") String intakeAnswers,
    @JsonProperty("summary_draft") String summaryDraft) {
}
