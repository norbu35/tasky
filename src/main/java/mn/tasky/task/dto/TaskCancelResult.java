package mn.tasky.task.dto;

public record TaskCancelResult(TaskState task, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_STATUS = "INVALID_STATUS";
    public static final TaskCancelResult NOT_FOUND_RESULT = new TaskCancelResult(null,
                                                                                 NOT_FOUND);
    public static final TaskCancelResult FORBIDDEN_RESULT = new TaskCancelResult(null,
                                                                                 FORBIDDEN);
    public static final TaskCancelResult INVALID_STATUS_RESULT = new TaskCancelResult(null,
                                                                                      INVALID_STATUS);

    public static TaskCancelResult success(TaskState task) {
        return new TaskCancelResult(task,
                                    null);
    }

    public boolean isSuccess() {
        return task != null;
    }
}
