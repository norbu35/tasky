package mn.tasky.booking.dto;

public record BookingIntentConfirmResult(BookingState booking, String errorCode, String errorMessage) {
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String DISCLAIMER_REQUIRED = "DISCLAIMER_REQUIRED";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String CONFLICT = "CONFLICT";
    public static final String DEFERRED = "DEFERRED";

    public static BookingIntentConfirmResult success(BookingState booking) {
        return new BookingIntentConfirmResult(booking, null, null);
    }

    public static BookingIntentConfirmResult error(String errorCode, String errorMessage) {
        return new BookingIntentConfirmResult(null, errorCode, errorMessage);
    }

    public boolean isSuccess() {
        return booking != null;
    }
}
