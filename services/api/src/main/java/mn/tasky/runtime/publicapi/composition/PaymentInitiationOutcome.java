package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record PaymentInitiationOutcome(Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        FEATURE_DEFERRED,
        SUCCESS,
        DISCLAIMER_REQUIRED,
        INVALID_STATUS,
        NOT_FOUND
    }

    public static PaymentInitiationOutcome inProgress() {
        return new PaymentInitiationOutcome(Status.IN_PROGRESS, null, null, null);
    }

    public static PaymentInitiationOutcome replayMissing() {
        return new PaymentInitiationOutcome(Status.REPLAY_MISSING, null, null, null);
    }

    public static PaymentInitiationOutcome featureDeferred(String message) {
        return new PaymentInitiationOutcome(Status.FEATURE_DEFERRED, null, "FEATURE_DEFERRED", message);
    }

    public static PaymentInitiationOutcome success(Map<String, Object> body) {
        return new PaymentInitiationOutcome(Status.SUCCESS, body, null, null);
    }

    public static PaymentInitiationOutcome failure(Status status, String errorCode, String errorMessage) {
        return new PaymentInitiationOutcome(status, null, errorCode, errorMessage);
    }
}
