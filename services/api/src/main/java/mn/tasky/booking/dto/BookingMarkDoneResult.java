package mn.tasky.booking.dto;

import java.time.Instant;

public record BookingMarkDoneResult(
        boolean isSuccess, BookingState booking, Instant markedDoneAt, boolean newlyMarked, String errorCode) {

    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String INVALID_TRANSITION = "INVALID_TRANSITION";

    public static final BookingMarkDoneResult NOT_FOUND_RESULT =
            new BookingMarkDoneResult(false, null, null, false, NOT_FOUND);
    public static final BookingMarkDoneResult FORBIDDEN_RESULT =
            new BookingMarkDoneResult(false, null, null, false, FORBIDDEN);
    public static final BookingMarkDoneResult INVALID_TRANSITION_RESULT =
            new BookingMarkDoneResult(false, null, null, false, INVALID_TRANSITION);

    public static BookingMarkDoneResult success(BookingState booking, Instant markedDoneAt, boolean newlyMarked) {
        return new BookingMarkDoneResult(true, booking, markedDoneAt, newlyMarked, null);
    }
}
