package mn.tasky.booking.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record BookingCompletionSignal(
        String bookingId,
        String taskerId,
        Instant markedDoneAt,
        @Nullable String proofPhotoKey,
        @Nullable String proofNote) {}
