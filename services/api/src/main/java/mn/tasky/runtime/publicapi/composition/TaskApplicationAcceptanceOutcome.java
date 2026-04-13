package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record TaskApplicationAcceptanceOutcome(
        Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        NOT_FOUND,
        FORBIDDEN,
        TASK_NOT_OPEN,
        DISCLAIMER_REQUIRED,
        CONFLICT,
        INTERNAL_ERROR
    }

    public static TaskApplicationAcceptanceOutcome inProgress() {
        return new TaskApplicationAcceptanceOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static TaskApplicationAcceptanceOutcome replayMissing() {
        return new TaskApplicationAcceptanceOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static TaskApplicationAcceptanceOutcome success(Map<String, Object> body) {
        return new TaskApplicationAcceptanceOutcome(Status.SUCCESS, body, null, null);
    }

    public static TaskApplicationAcceptanceOutcome failure(Status status, String errorCode, String errorMessage) {
        return new TaskApplicationAcceptanceOutcome(status, null, errorCode, errorMessage);
    }
}
