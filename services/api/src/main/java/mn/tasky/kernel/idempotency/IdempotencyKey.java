package mn.tasky.kernel.idempotency;

public record IdempotencyKey(String value) {
    private static final int MAX_LENGTH = 128;

    public IdempotencyKey {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Idempotency key must not be blank.");
        }

        value = value.trim();
        if (value.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Idempotency key must be at most " + MAX_LENGTH + " characters.");
        }
    }

    public static IdempotencyKey of(String value) {
        return new IdempotencyKey(value);
    }
}
