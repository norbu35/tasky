package mn.tasky.runtime.adminapi.composition;

import mn.tasky.admin.dto.VerificationDetailResponse;

public record AdminVerificationDecisionOutcome(
        Status status, VerificationDetailResponse body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        NOT_PENDING,
        NOT_FOUND
    }

    public static AdminVerificationDecisionOutcome success(VerificationDetailResponse body) {
        return new AdminVerificationDecisionOutcome(Status.SUCCESS, body, null, null);
    }

    public static AdminVerificationDecisionOutcome failure(Status status, String errorCode, String errorMessage) {
        return new AdminVerificationDecisionOutcome(status, null, errorCode, errorMessage);
    }
}
