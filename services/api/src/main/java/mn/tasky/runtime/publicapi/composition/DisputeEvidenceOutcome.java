package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record DisputeEvidenceOutcome(Status status, Map<String, Object> body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        NOT_FOUND,
        FORBIDDEN,
        INVALID_STATUS,
        INVALID_EVIDENCE,
        INTERNAL_ERROR
    }

    public static DisputeEvidenceOutcome success(Map<String, Object> body) {
        return new DisputeEvidenceOutcome(Status.SUCCESS, body, null, null);
    }

    public static DisputeEvidenceOutcome failure(Status status, String errorCode, String errorMessage) {
        return new DisputeEvidenceOutcome(status, null, errorCode, errorMessage);
    }

    public static DisputeEvidenceOutcome internalError() {
        return new DisputeEvidenceOutcome(Status.INTERNAL_ERROR, null, null, null);
    }
}
