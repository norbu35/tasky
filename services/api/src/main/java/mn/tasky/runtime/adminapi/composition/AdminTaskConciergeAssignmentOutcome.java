package mn.tasky.runtime.adminapi.composition;

import java.util.Map;

public record AdminTaskConciergeAssignmentOutcome(
        Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        DISCLAIMER_REQUIRED,
        NOT_FOUND,
        TASK_NOT_OPEN,
        TASKER_NOT_FOUND,
        TASKER_NOT_VERIFIED
    }

    public static AdminTaskConciergeAssignmentOutcome inProgress() {
        return new AdminTaskConciergeAssignmentOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static AdminTaskConciergeAssignmentOutcome replayMissing() {
        return new AdminTaskConciergeAssignmentOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static AdminTaskConciergeAssignmentOutcome success(Map<String, Object> body) {
        return new AdminTaskConciergeAssignmentOutcome(Status.SUCCESS, body, null, null);
    }

    public static AdminTaskConciergeAssignmentOutcome failure(Status status, String errorCode, String errorMessage) {
        return new AdminTaskConciergeAssignmentOutcome(status, null, errorCode, errorMessage);
    }
}
