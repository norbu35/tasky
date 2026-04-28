package mn.tasky.booking.dto;

import java.util.Optional;

public record BookingIntentCreateResult(Optional<BookingIntentState> intent, String errorCode, String errorMessage) {
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_SOURCE = "INVALID_SOURCE";
    public static final String NOT_COMPLETED = "NOT_COMPLETED";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String INVALID_REQUEST = "INVALID_REQUEST";
    public static final String DISCLAIMER_REQUIRED = "DISCLAIMER_REQUIRED";
    public static final String DEFERRED = "DEFERRED";
    public static final String CONFLICT = "CONFLICT";

    public static BookingIntentCreateResult success(BookingIntentState intent) {
        return new BookingIntentCreateResult(Optional.of(intent), null, null);
    }

    public static BookingIntentCreateResult error(String errorCode, String errorMessage) {
        return new BookingIntentCreateResult(Optional.empty(), errorCode, errorMessage);
    }

    public boolean isSuccess() {
        return intent.isPresent();
    }
}
