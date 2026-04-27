package mn.tasky.booking.dto;

public record BookingIntentDeclineResult(BookingIntentState intent, String errorCode, String errorMessage) {
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String CONFLICT = "CONFLICT";
    public static final String DEFERRED = "DEFERRED";

    public static BookingIntentDeclineResult success(BookingIntentState intent) {
        return new BookingIntentDeclineResult(intent, null, null);
    }

    public static BookingIntentDeclineResult error(String errorCode, String errorMessage) {
        return new BookingIntentDeclineResult(null, errorCode, errorMessage);
    }

    public boolean isSuccess() {
        return intent != null;
    }
}
