package mn.tasky.booking.dto;

public record NoShowFlagResult(boolean success, BookingState booking, String errorCode) {

    public static NoShowFlagResult success(BookingState booking) {
        return new NoShowFlagResult(true, booking, null);
    }

    public static NoShowFlagResult error(String errorCode) {
        return new NoShowFlagResult(false, null, errorCode);
    }
}
