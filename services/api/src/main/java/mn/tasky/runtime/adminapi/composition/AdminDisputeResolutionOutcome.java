package mn.tasky.runtime.adminapi.composition;

import java.util.Map;

public record AdminDisputeResolutionOutcome(Status status, Map<String, Object> body) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        NOT_FOUND,
        BAD_REQUEST
    }

    public static AdminDisputeResolutionOutcome of(Status status, Map<String, Object> body) {
        return new AdminDisputeResolutionOutcome(status, body);
    }
}
