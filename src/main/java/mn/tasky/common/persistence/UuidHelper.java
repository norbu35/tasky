package mn.tasky.common.persistence;

import java.util.UUID;

public final class UuidHelper {

    private UuidHelper() {
    }

    public static UUID required(String value,
                                String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException("Missing UUID for " + fieldName + ".");
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid UUID for " + fieldName + ": " + value,
                exception);
        }
    }

    public static UUID optional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid UUID: " + value,
                exception);
        }
    }
}
