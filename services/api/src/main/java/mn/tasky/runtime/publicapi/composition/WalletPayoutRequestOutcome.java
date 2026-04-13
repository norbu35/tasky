package mn.tasky.runtime.publicapi.composition;

import java.util.Map;

public record WalletPayoutRequestOutcome(Status status, Map<String, Object> body, String errorMessage) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        FEATURE_DEFERRED,
        SUCCESS,
        BAD_REQUEST
    }

    public static WalletPayoutRequestOutcome inProgress() {
        return new WalletPayoutRequestOutcome(Status.IN_PROGRESS, null, null);
    }

    public static WalletPayoutRequestOutcome replayMissing() {
        return new WalletPayoutRequestOutcome(Status.REPLAY_MISSING, null, null);
    }

    public static WalletPayoutRequestOutcome featureDeferred(String errorMessage) {
        return new WalletPayoutRequestOutcome(Status.FEATURE_DEFERRED, null, errorMessage);
    }

    public static WalletPayoutRequestOutcome success(Map<String, Object> body) {
        return new WalletPayoutRequestOutcome(Status.SUCCESS, body, null);
    }

    public static WalletPayoutRequestOutcome badRequest(String errorMessage) {
        return new WalletPayoutRequestOutcome(Status.BAD_REQUEST, null, errorMessage);
    }
}
