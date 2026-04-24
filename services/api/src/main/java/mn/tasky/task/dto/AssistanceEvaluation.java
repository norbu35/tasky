package mn.tasky.task.dto;

public record AssistanceEvaluation(boolean externalDistributionAllowed, String reason) {
    public static final String ALLOWED = "ALLOWED";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String QUALIFIED_APPLICATION_EXISTS = "QUALIFIED_APPLICATION_EXISTS";
    public static final String TOO_EARLY = "TOO_EARLY";
    public static final String CATEGORY_NOT_ELIGIBLE = "CATEGORY_NOT_ELIGIBLE";
    public static final String INTERVENTION_ALREADY_EXISTS = "INTERVENTION_ALREADY_EXISTS";
}
