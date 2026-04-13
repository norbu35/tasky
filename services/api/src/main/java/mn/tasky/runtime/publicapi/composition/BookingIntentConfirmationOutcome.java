package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record BookingIntentConfirmationOutcome(
        Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        NOT_FOUND,
        FORBIDDEN,
        DISCLAIMER_REQUIRED,
        TASK_NOT_OPEN,
        CONFLICT,
        DEFERRED,
        INTERNAL_ERROR
    }

    public static BookingIntentConfirmationOutcome inProgress() {
        return new BookingIntentConfirmationOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static BookingIntentConfirmationOutcome replayMissing() {
        return new BookingIntentConfirmationOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static BookingIntentConfirmationOutcome success(Map<String, Object> body) {
        return new BookingIntentConfirmationOutcome(Status.SUCCESS, body, null, null);
    }

    public static BookingIntentConfirmationOutcome failure(Status status, String errorCode, String errorMessage) {
        return new BookingIntentConfirmationOutcome(status, null, errorCode, errorMessage);
    }
}
