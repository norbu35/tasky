package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import mn.tasky.booking.dto.BookingIntentState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("BookingIntentCompositionService")
class BookingIntentCompositionServiceTests {

    private BookingIntentCompositionService service;

    @BeforeEach
    void setUp() {
        service = new BookingIntentCompositionService();
    }

    @Nested
    @DisplayName("bookingIntentResponse")
    class BookingIntentResponse {

        @Test
        @DisplayName("maps all BookingIntentState fields to response map")
        void mapsAllFields() {
            Instant now = Instant.now();
            Instant expiresAt = now.plusSeconds(14400);
            Instant confirmedAt = now.plusSeconds(3600);
            BookingIntentState intent = new BookingIntentState(
                    "intent-1",
                    "task-1",
                    "tasker-1",
                    "cust-1",
                    "SELF_SERVE",
                    "CONFIRMED",
                    "booking-prev-1",
                    "offer-1",
                    expiresAt,
                    "booking-new-1",
                    confirmedAt,
                    now,
                    now);

            Map<String, Object> response = service.bookingIntentResponse(intent);

            assertThat(response).containsEntry("id", "intent-1");
            assertThat(response).containsEntry("task_id", "task-1");
            assertThat(response).containsEntry("tasker_id", "tasker-1");
            assertThat(response).containsEntry("customer_id", "cust-1");
            assertThat(response).containsEntry("source", "SELF_SERVE");
            assertThat(response).containsEntry("status", "CONFIRMED");
            assertThat(response).containsEntry("original_booking_id", "booking-prev-1");
            assertThat(response).containsEntry("offer_id", "offer-1");
            assertThat(response).containsEntry("expires_at", expiresAt.toString());
            assertThat(response).containsEntry("confirmed_booking_id", "booking-new-1");
            assertThat(response).containsEntry("confirmed_at", confirmedAt.toString());
            assertThat(response).containsEntry("created_at", now.toString());
            assertThat(response).containsEntry("updated_at", now.toString());
        }

        @Test
        @DisplayName("handles nullable fields set to null")
        void handlesNullableFields() {
            Instant now = Instant.now();
            BookingIntentState intent = new BookingIntentState(
                    "intent-2",
                    "task-2",
                    "tasker-2",
                    "cust-2",
                    "SELF_SERVE",
                    "PENDING",
                    null,
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);

            Map<String, Object> response = service.bookingIntentResponse(intent);

            assertThat(response).containsEntry("original_booking_id", null);
            assertThat(response).containsEntry("offer_id", null);
            assertThat(response).containsEntry("expires_at", null);
            assertThat(response).containsEntry("confirmed_booking_id", null);
            assertThat(response).containsEntry("confirmed_at", null);
        }
    }
}
