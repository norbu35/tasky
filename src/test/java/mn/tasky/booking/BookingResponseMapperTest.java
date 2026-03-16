package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import mn.tasky.booking.api.BookingResponseMapper;
import mn.tasky.booking.dto.BookingState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BookingResponseMapperTest {

    @Test
    @DisplayName("withCancellationFee maps all core fields including settlement mode and schedule")
    void withCancellationFeeMapsAllFields() {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        Instant scheduled = now.plusSeconds(3600);
        BookingState booking = new BookingState(
                "booking-1",
                "task-1",
                "tasker-1",
                "customer-1",
                50000,
                "ASSIGNED",
                2500,
                true,
                scheduled,
                "ESCROW",
                true,
                now,
                now,
                now);

        Map<String, Object> result = BookingResponseMapper.withCancellationFee(booking);

        assertThat(result)
                .containsEntry("id", "booking-1")
                .containsEntry("task_id", "task-1")
                .containsEntry("tasker_id", "tasker-1")
                .containsEntry("customer_id", "customer-1")
                .containsEntry("price", 50000)
                .containsEntry("status", "ASSIGNED")
                .containsEntry("cancellation_fee", 2500)
                .containsEntry("created_at", now.toString())
                .containsEntry("updated_at", now.toString());
    }

    @Test
    @DisplayName("basic maps response without cancellation fee")
    void basicMapsWithoutCancellationFee() {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        BookingState booking = new BookingState(
                "booking-2",
                "task-2",
                "tasker-2",
                "customer-2",
                30000,
                "COMPLETED",
                null,
                false,
                null,
                "DIRECT",
                false,
                null,
                now,
                now);

        Map<String, Object> result = BookingResponseMapper.basic(booking);

        assertThat(result)
                .containsEntry("id", "booking-2")
                .containsEntry("price", 30000)
                .containsEntry("status", "COMPLETED")
                .doesNotContainKey("cancellation_fee");
    }
}
