package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record BookingIntentCreationOutcome(
        Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        NOT_FOUND,
        FORBIDDEN,
        NOT_COMPLETED,
        TASK_NOT_OPEN,
        CONFLICT,
        INVALID_REQUEST,
        INVALID_SOURCE,
        DEFERRED,
        INTERNAL_ERROR
    }

    public static BookingIntentCreationOutcome inProgress() {
        return new BookingIntentCreationOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static BookingIntentCreationOutcome replayMissing() {
        return new BookingIntentCreationOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static BookingIntentCreationOutcome success(Map<String, Object> body) {
        return new BookingIntentCreationOutcome(Status.SUCCESS, body, null, null);
    }

    public static BookingIntentCreationOutcome failure(Status status, String errorCode, String errorMessage) {
        return new BookingIntentCreationOutcome(status, null, errorCode, errorMessage);
    }
}
