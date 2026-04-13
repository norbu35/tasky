package mn.tasky.runtime.adminapi.composition;

import java.util.Map;

public record AdminPayoutProcessingOutcome(Status status, Map<String, Object> body, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        FEATURE_DEFERRED,
        INVALID_WEEKDAY,
        SUCCESS,
        BAD_REQUEST
    }

    public static AdminPayoutProcessingOutcome inProgress() {
        return new AdminPayoutProcessingOutcome(Status.IN_PROGRESS, null, null);
    }

    public static AdminPayoutProcessingOutcome replayMissing() {
        return new AdminPayoutProcessingOutcome(Status.REPLAY_MISSING, null, null);
    }

    public static AdminPayoutProcessingOutcome featureDeferred(String errorMessage) {
        return new AdminPayoutProcessingOutcome(Status.FEATURE_DEFERRED, null, errorMessage);
    }

    public static AdminPayoutProcessingOutcome invalidWeekday(String errorMessage) {
        return new AdminPayoutProcessingOutcome(Status.INVALID_WEEKDAY, null, errorMessage);
    }

    public static AdminPayoutProcessingOutcome success(Map<String, Object> body) {
        return new AdminPayoutProcessingOutcome(Status.SUCCESS, body, null);
    }

    public static AdminPayoutProcessingOutcome badRequest(String errorMessage) {
        return new AdminPayoutProcessingOutcome(Status.BAD_REQUEST, null, errorMessage);
    }
}
