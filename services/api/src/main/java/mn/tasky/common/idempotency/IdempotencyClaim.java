package mn.tasky.common.idempotency;

public record IdempotencyClaim(Status status, IdempotencyRecord record) {

    public enum Status {
        NEW,
        IN_PROGRESS,
        COMPLETED
    }
}
