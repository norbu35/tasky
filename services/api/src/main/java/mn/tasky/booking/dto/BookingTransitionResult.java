package mn.tasky.booking.dto;

public record BookingTransitionResult(BookingState booking, String errorCode, String errorMessage) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_TRANSITION = "INVALID_TRANSITION";
    public static final String OPEN_DISPUTE = "OPEN_DISPUTE";
    public static final BookingTransitionResult NOT_FOUND_RESULT = new BookingTransitionResult(null, NOT_FOUND, null);
    public static final BookingTransitionResult FORBIDDEN_RESULT = new BookingTransitionResult(null, FORBIDDEN, null);
    public static final BookingTransitionResult INVALID_TRANSITION_RESULT =
            new BookingTransitionResult(null, INVALID_TRANSITION, null);
    public static final BookingTransitionResult OPEN_DISPUTE_RESULT =
            new BookingTransitionResult(null, OPEN_DISPUTE, null);

    public static BookingTransitionResult success(BookingState booking) {
        return new BookingTransitionResult(booking, null, null);
    }

    public static BookingTransitionResult error(String errorCode, String errorMessage) {
        return new BookingTransitionResult(null, errorCode, errorMessage);
    }

    public boolean isSuccess() {
        return booking != null;
    }
}
