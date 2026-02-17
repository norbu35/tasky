package mn.tasky.task.dto;

public record TaskCreateResult(TaskState task, String errorCode, String errorMessage) {

    public static final String INVALID_CATEGORY = "INVALID_CATEGORY";
    public static final String TOO_MANY_PHOTOS = "TOO_MANY_PHOTOS";
    public static final String INVALID_DESCRIPTION = "INVALID_DESCRIPTION";
    public static final String INVALID_SCHEDULE = "INVALID_SCHEDULE";

    public static TaskCreateResult success(TaskState task) {
        return new TaskCreateResult(task,
                                    null,
                                    null);
    }

    public static TaskCreateResult error(String code,
                                         String message) {
        return new TaskCreateResult(null,
                                    code,
                                    message);
    }

    public boolean isSuccess() {
        return task != null;
    }
}
