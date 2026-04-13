package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record ReviewSubmissionOutcome(Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        INVALID_RATING,
        NOT_FOUND,
        BOOKING_NOT_COMPLETED,
        FORBIDDEN,
        ALREADY_REVIEWED,
        INTERNAL_ERROR
    }

    public static ReviewSubmissionOutcome success(Map<String, Object> body) {
        return new ReviewSubmissionOutcome(Status.SUCCESS, body, null, null);
    }

    public static ReviewSubmissionOutcome failure(Status status, String errorCode, String errorMessage) {
        return new ReviewSubmissionOutcome(status, null, errorCode, errorMessage);
    }

    public static ReviewSubmissionOutcome internalError() {
        return new ReviewSubmissionOutcome(Status.INTERNAL_ERROR, null, null, null);
    }
}
