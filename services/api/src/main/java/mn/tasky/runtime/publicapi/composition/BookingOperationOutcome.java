package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record BookingOperationOutcome(Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        CREATED,
        IN_PROGRESS,
        REPLAY_MISSING,
        NOT_FOUND,
        FORBIDDEN,
        INVALID_STATUS,
        OPEN_DISPUTE,
        TOO_EARLY,
        NO_SCHEDULE,
        ACTIVITY_DETECTED,
        RESCHEDULE_SUPERSEDES,
        NOT_COMPLETED,
        INTERNAL_ERROR
    }

    public static BookingOperationOutcome success(Map<String, Object> body) {
        return new BookingOperationOutcome(Status.SUCCESS, body, null, null);
    }

    public static BookingOperationOutcome created(Map<String, Object> body) {
        return new BookingOperationOutcome(Status.CREATED, body, null, null);
    }

    public static BookingOperationOutcome inProgress() {
        return new BookingOperationOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static BookingOperationOutcome replayMissing() {
        return new BookingOperationOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static BookingOperationOutcome failure(Status status, String errorCode, String errorMessage) {
        return new BookingOperationOutcome(status, null, errorCode, errorMessage);
    }

    public static BookingOperationOutcome internalError() {
        return new BookingOperationOutcome(Status.INTERNAL_ERROR, null, null, null);
    }
}
