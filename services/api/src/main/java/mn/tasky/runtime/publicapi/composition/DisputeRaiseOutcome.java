package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record DisputeRaiseOutcome(Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        IN_PROGRESS,
        REPLAY_MISSING,
        NOT_FOUND,
        FORBIDDEN,
        INVALID_REASON,
        INVALID_STATUS,
        DISPUTE_WINDOW_EXPIRED,
        DISPUTE_EXISTS,
        INTERNAL_ERROR
    }

    public static DisputeRaiseOutcome success(Map<String, Object> body) {
        return new DisputeRaiseOutcome(Status.SUCCESS, body, null, null);
    }

    public static DisputeRaiseOutcome inProgress() {
        return new DisputeRaiseOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static DisputeRaiseOutcome replayMissing() {
        return new DisputeRaiseOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static DisputeRaiseOutcome failure(Status status, String errorCode, String errorMessage) {
        return new DisputeRaiseOutcome(status, null, errorCode, errorMessage);
    }

    public static DisputeRaiseOutcome internalError() {
        return new DisputeRaiseOutcome(Status.INTERNAL_ERROR, null, null, null);
    }
}
