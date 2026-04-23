package mn.tasky.task.dto;

public record TaskWithdrawResult(TaskApplicationState application, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_STATUS = "INVALID_STATUS";
    public static final TaskWithdrawResult NOT_FOUND_RESULT = new TaskWithdrawResult(null, NOT_FOUND);
    public static final TaskWithdrawResult FORBIDDEN_RESULT = new TaskWithdrawResult(null, FORBIDDEN);
    public static final TaskWithdrawResult INVALID_STATUS_RESULT = new TaskWithdrawResult(null, INVALID_STATUS);

    public static TaskWithdrawResult success(TaskApplicationState application) {
        return new TaskWithdrawResult(application, null);
    }

    public boolean isSuccess() {
        return application != null;
    }
}
