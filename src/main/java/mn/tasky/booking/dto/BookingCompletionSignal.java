package mn.tasky.booking.dto;

import java.time.Instant;

public record BookingCompletionSignal(String bookingId, String taskerId, Instant markedDoneAt) {
}
