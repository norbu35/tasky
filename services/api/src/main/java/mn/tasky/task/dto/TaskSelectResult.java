package mn.tasky.task.dto;

public record TaskSelectResult(TaskApplicationState application, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String CONFLICT = "CONFLICT";
    public static final TaskSelectResult NOT_FOUND_RESULT = new TaskSelectResult(null, NOT_FOUND);
    public static final TaskSelectResult FORBIDDEN_RESULT = new TaskSelectResult(null, FORBIDDEN);
    public static final TaskSelectResult TASK_NOT_OPEN_RESULT = new TaskSelectResult(null, TASK_NOT_OPEN);
    public static final TaskSelectResult CONFLICT_RESULT = new TaskSelectResult(null, CONFLICT);

    public static TaskSelectResult success(TaskApplicationState application) {
        return new TaskSelectResult(application, null);
    }

    public boolean isSuccess() {
        return application != null;
    }
}
