package mn.tasky.runtime.adminapi.composition;

import mn.tasky.admin.dto.StrikePolicyResponse;

public record AdminModerationPolicyUpdateOutcome(
        Status status, StrikePolicyResponse body, String errorCode, String errorMessage) {

    public enum Status {
        SUCCESS,
        INVALID_POLICY
    }

    public static AdminModerationPolicyUpdateOutcome success(StrikePolicyResponse body) {
        return new AdminModerationPolicyUpdateOutcome(Status.SUCCESS, body, null, null);
    }

    public static AdminModerationPolicyUpdateOutcome invalidPolicy(String errorMessage) {
        return new AdminModerationPolicyUpdateOutcome(Status.INVALID_POLICY, null, "INVALID_POLICY", errorMessage);
    }
}
