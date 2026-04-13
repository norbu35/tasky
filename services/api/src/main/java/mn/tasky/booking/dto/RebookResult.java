package mn.tasky.booking.dto;

import mn.tasky.task.dto.TaskState;

public record RebookResult(TaskState task, String errorCode, String errorMessage) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String NOT_COMPLETED = "NOT_COMPLETED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String TASK_NOT_FOUND = "TASK_NOT_FOUND";

    public static RebookResult success(TaskState task) {
        return new RebookResult(task, null, null);
    }

    public static RebookResult error(String code, String message) {
        return new RebookResult(null, code, message);
    }

    public boolean isSuccess() {
        return task != null;
    }
}
