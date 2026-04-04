package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;

public record UpdateDraftRequest(
        @JsonProperty("intake_answers") JsonNode intakeAnswers,
        @JsonProperty("summary_draft") @Size(max = 2000) String summaryDraft) {}
