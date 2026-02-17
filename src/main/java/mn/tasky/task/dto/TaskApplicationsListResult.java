package mn.tasky.task.dto;

import java.util.List;

public record TaskApplicationsListResult(List<TaskApplicationState> applications,
                                         String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final TaskApplicationsListResult NOT_FOUND_RESULT =
            new TaskApplicationsListResult(
                    null,
                    NOT_FOUND
            );
    public static final TaskApplicationsListResult FORBIDDEN_RESULT =
            new TaskApplicationsListResult(
                    null,
                    FORBIDDEN
            );

    public static TaskApplicationsListResult success(List<TaskApplicationState> applications) {
        return new TaskApplicationsListResult(applications,
                                              null);
    }

    public boolean isSuccess() {
        return applications != null;
    }
}
