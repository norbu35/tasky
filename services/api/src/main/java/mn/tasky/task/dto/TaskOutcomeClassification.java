package mn.tasky.task.dto;

public record TaskOutcomeClassification(
        AssistanceOutcomeType outcomeType,
        boolean includedInSelfServeFulfillmentReporting,
        boolean includedInAssistedOutcomeReporting) {}
