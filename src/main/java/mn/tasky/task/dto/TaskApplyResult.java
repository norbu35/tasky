package mn.tasky.task.dto;

public record TaskApplyResult(TaskApplicationState application, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION";
    public static final String REVIEW_LOCK_ACTIVE = "REVIEW_LOCK_ACTIVE";
    public static final TaskApplyResult NOT_FOUND_RESULT = new TaskApplyResult(null, NOT_FOUND);
    public static final TaskApplyResult FORBIDDEN_RESULT = new TaskApplyResult(null, FORBIDDEN);
    public static final TaskApplyResult TASK_NOT_OPEN_RESULT = new TaskApplyResult(null, TASK_NOT_OPEN);
    public static final TaskApplyResult DUPLICATE_APPLICATION_RESULT = new TaskApplyResult(null, DUPLICATE_APPLICATION);

    public static TaskApplyResult success(TaskApplicationState application) {
        return new TaskApplyResult(application, null);
    }

    public boolean isSuccess() {
        return application != null;
    }
}
