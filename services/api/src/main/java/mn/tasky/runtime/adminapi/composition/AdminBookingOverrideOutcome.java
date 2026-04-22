package mn.tasky.runtime.adminapi.composition;

import java.util.Map;

public record AdminBookingOverrideOutcome(Status status, Map<String, Object> body) {

    public enum Status {
        IN_PROGRESS,
        REPLAY_MISSING,
        SUCCESS,
        NOT_FOUND,
        INVALID_TRANSITION
    }

    public static AdminBookingOverrideOutcome inProgress() {
        return new AdminBookingOverrideOutcome(Status.IN_PROGRESS, null);
    }

    public static AdminBookingOverrideOutcome replayMissing() {
        return new AdminBookingOverrideOutcome(Status.REPLAY_MISSING, null);
    }

    public static AdminBookingOverrideOutcome success(Map<String, Object> body) {
        return new AdminBookingOverrideOutcome(Status.SUCCESS, body);
    }

    public static AdminBookingOverrideOutcome notFound() {
        return new AdminBookingOverrideOutcome(Status.NOT_FOUND, null);
    }

    public static AdminBookingOverrideOutcome invalidTransition() {
        return new AdminBookingOverrideOutcome(Status.INVALID_TRANSITION, null);
    }
}
