package mn.tasky.task.dto;

public record TaskCreateResult(TaskState task, String errorCode, String errorMessage) {

    public static final String INVALID_CATEGORY = "INVALID_CATEGORY";
    public static final String TOO_MANY_PHOTOS = "TOO_MANY_PHOTOS";
    public static final String INVALID_DESCRIPTION = "INVALID_DESCRIPTION";
    public static final String INVALID_SCHEDULE = "INVALID_SCHEDULE";
    public static final String INTAKE_NOT_ENABLED = "INTAKE_NOT_ENABLED";
    public static final String INVALID_SCHEMA_VERSION = "INVALID_SCHEMA_VERSION";
    public static final String INTAKE_VALIDATION_FAILED = "INTAKE_VALIDATION_FAILED";
    public static final String DRAFT_NOT_FOUND = "DRAFT_NOT_FOUND";

    public static TaskCreateResult success(TaskState task) {
        return new TaskCreateResult(task,
            null,
            null);
    }

    public static TaskCreateResult error(String code, String message) {
        return new TaskCreateResult(null,
            code,
            message);
    }

    public boolean isSuccess() {
        return task != null;
    }
}
