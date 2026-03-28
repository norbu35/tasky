package mn.tasky.booking.dto;

public record BookingTransitionResult(BookingState booking, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_TRANSITION = "INVALID_TRANSITION";
    public static final String OPEN_DISPUTE = "OPEN_DISPUTE";
    public static final BookingTransitionResult NOT_FOUND_RESULT = new BookingTransitionResult(null, NOT_FOUND);
    public static final BookingTransitionResult FORBIDDEN_RESULT = new BookingTransitionResult(null, FORBIDDEN);
    public static final BookingTransitionResult INVALID_TRANSITION_RESULT =
            new BookingTransitionResult(null, INVALID_TRANSITION);
    public static final BookingTransitionResult OPEN_DISPUTE_RESULT =
            new BookingTransitionResult(null, OPEN_DISPUTE);

    public static BookingTransitionResult success(BookingState booking) {
        return new BookingTransitionResult(booking, null);
    }

    public boolean isSuccess() {
        return booking != null;
    }
}
