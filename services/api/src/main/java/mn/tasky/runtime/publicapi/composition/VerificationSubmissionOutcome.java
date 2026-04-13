package mn.tasky.runtime.publicapi.composition;

import mn.tasky.verification.dto.VerificationStatusApiResponse;

public record VerificationSubmissionOutcome(
        Status status, VerificationStatusApiResponse body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        CONSENT_REQUIRED,
        INVALID_VERIFICATION_KEY,
        CONFLICT,
        NOT_TASKER,
        USER_NOT_FOUND
    }

    public static VerificationSubmissionOutcome success(VerificationStatusApiResponse body) {
        return new VerificationSubmissionOutcome(Status.SUCCESS, body, null, null);
    }

    public static VerificationSubmissionOutcome failure(Status status, String errorCode, String errorMessage) {
        return new VerificationSubmissionOutcome(status, null, errorCode, errorMessage);
    }
}
