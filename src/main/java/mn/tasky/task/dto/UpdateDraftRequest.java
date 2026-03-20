package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

public record UpdateDraftRequest(
        @JsonProperty("intake_answers") @Size(max = 5000) String intakeAnswers,
        @JsonProperty("summary_draft") @Size(max = 2000) String summaryDraft) {}
