package mn.tasky.task.dto;

public record TaskUpdateResult(TaskState task,
                               String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_STATUS = "INVALID_STATUS";
    public static final String INVALID_DESCRIPTION = "INVALID_DESCRIPTION";
    public static final String INVALID_LOCATION = "INVALID_LOCATION";
    public static final String INVALID_SCHEDULE = "INVALID_SCHEDULE";
    public static final String TOO_MANY_PHOTOS = "TOO_MANY_PHOTOS";

    public static final TaskUpdateResult NOT_FOUND_RESULT =
            new TaskUpdateResult(null,
                                 NOT_FOUND);
    public static final TaskUpdateResult FORBIDDEN_RESULT =
            new TaskUpdateResult(null,
                                 FORBIDDEN);
    public static final TaskUpdateResult INVALID_STATUS_RESULT =
            new TaskUpdateResult(null,
                                 INVALID_STATUS);
    public static final TaskUpdateResult INVALID_DESCRIPTION_RESULT =
            new TaskUpdateResult(null,
                                 INVALID_DESCRIPTION);
    public static final TaskUpdateResult INVALID_LOCATION_RESULT =
            new TaskUpdateResult(null,
                                 INVALID_LOCATION);
    public static final TaskUpdateResult INVALID_SCHEDULE_RESULT =
            new TaskUpdateResult(null,
                                 INVALID_SCHEDULE);
    public static final TaskUpdateResult TOO_MANY_PHOTOS_RESULT =
            new TaskUpdateResult(null,
                                 TOO_MANY_PHOTOS);

    public static TaskUpdateResult success(TaskState task) {
        return new TaskUpdateResult(task,
                                    null);
    }

    public boolean isSuccess() {
        return task != null;
    }
}
