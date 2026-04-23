package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("BookingResponseCompositionService")
class BookingResponseCompositionServiceTests {

    private BookingResponseCompositionService service;

    @BeforeEach
    void setUp() {
        service = new BookingResponseCompositionService();
    }

    @Nested
    @DisplayName("basicBookingResponse")
    class BasicBookingResponse {

        @Test
        @DisplayName("maps all BookingState fields to response map")
        void mapsAllFields() {
            Instant now = Instant.now();
            BookingState booking = new BookingState(
                    "b-1",
                    "t-1",
                    "tasker-1",
                    "cust-1",
                    5000,
                    "CONFIRMED",
                    null,
                    true,
                    now,
                    "CONCIERGE",
                    false,
                    now,
                    0,
                    null,
                    now,
                    now);

            Map<String, Object> response = service.basicBookingResponse(booking);

            assertThat(response).containsEntry("id", "b-1");
            assertThat(response).containsEntry("task_id", "t-1");
            assertThat(response).containsEntry("tasker_id", "tasker-1");
            assertThat(response).containsEntry("customer_id", "cust-1");
            assertThat(response).containsEntry("price", 5000);
            assertThat(response).containsEntry("status", "CONFIRMED");
            assertThat(response).containsEntry("created_at", now.toString());
            assertThat(response).containsEntry("updated_at", now.toString());
        }

        @Test
        @DisplayName("does not include cancellation_fee field")
        void doesNotIncludeCancellationFee() {
            BookingState booking = new BookingState(
                    "b-1",
                    "t-1",
                    "tasker-1",
                    "cust-1",
                    5000,
                    "CONFIRMED",
                    500,
                    true,
                    null,
                    "CONCIERGE",
                    false,
                    null,
                    0,
                    null,
                    Instant.now(),
                    Instant.now());

            Map<String, Object> response = service.basicBookingResponse(booking);

            assertThat(response).doesNotContainKey("cancellation_fee");
        }
    }

    @Nested
    @DisplayName("bookingResponse")
    class BookingResponse {

        @Test
        @DisplayName("includes all basic fields plus cancellation_fee")
        void includesBasicFieldsPlusCancellationFee() {
            Instant now = Instant.now();
            BookingState booking = new BookingState(
                    "b-2",
                    "t-2",
                    "tasker-2",
                    "cust-2",
                    3000,
                    "CANCELLED",
                    300,
                    true,
                    null,
                    "CONCIERGE",
                    false,
                    null,
                    0,
                    null,
                    now,
                    now);

            Map<String, Object> response = service.bookingResponse(booking);

            assertThat(response).containsEntry("id", "b-2");
            assertThat(response).containsEntry("task_id", "t-2");
            assertThat(response).containsEntry("price", 3000);
            assertThat(response).containsEntry("cancellation_fee", 300);
        }

        @Test
        @DisplayName("includes null cancellation_fee when not set")
        void includesNullCancellationFee() {
            BookingState booking = new BookingState(
                    "b-3",
                    "t-3",
                    "tasker-3",
                    "cust-3",
                    1000,
                    "CONFIRMED",
                    null,
                    true,
                    null,
                    "CONCIERGE",
                    false,
                    null,
                    0,
                    null,
                    Instant.now(),
                    Instant.now());

            Map<String, Object> response = service.bookingResponse(booking);

            assertThat(response).containsEntry("cancellation_fee", null);
        }
    }

    @Nested
    @DisplayName("markDoneResponse")
    class MarkDoneResponse {

        @Test
        @DisplayName("wraps booking response with tasker_marked_done_at")
        void wrapsWithMarkedDoneAt() {
            Instant now = Instant.now();
            Instant markedDoneAt = Instant.now().plusSeconds(60);
            BookingState booking = new BookingState(
                    "b-4",
                    "t-4",
                    "tasker-4",
                    "cust-4",
                    2000,
                    "COMPLETED",
                    null,
                    true,
                    now,
                    "CONCIERGE",
                    false,
                    null,
                    0,
                    null,
                    now,
                    now);

            Map<String, Object> response = service.markDoneResponse(booking, markedDoneAt);

            @SuppressWarnings("unchecked")
            Map<String, Object> bookingData = (Map<String, Object>) response.get("booking");
            assertThat(bookingData).containsEntry("id", "b-4");
            assertThat(response).containsEntry("tasker_marked_done_at", markedDoneAt.toString());
        }

        @Test
        @DisplayName("handles null markedDoneAt gracefully")
        void handlesNullMarkedDoneAt() {
            BookingState booking = new BookingState(
                    "b-5",
                    "t-5",
                    "tasker-5",
                    "cust-5",
                    2000,
                    "COMPLETED",
                    null,
                    true,
                    null,
                    "CONCIERGE",
                    false,
                    null,
                    0,
                    null,
                    Instant.now(),
                    Instant.now());

            Map<String, Object> response = service.markDoneResponse(booking, null);

            assertThat(response).containsEntry("tasker_marked_done_at", null);
        }
    }

    @Nested
    @DisplayName("scheduleEventResponse")
    class ScheduleEventResponse {

        @Test
        @DisplayName("maps all BookingScheduleEvent fields")
        void mapsAllFields() {
            Instant now = Instant.now();
            Instant proposed = now.plusSeconds(3600);
            BookingScheduleEvent event = new BookingScheduleEvent(
                    "se-1", "b-1", "user-1", "RESCHEDULE_REQUEST", proposed, "timing conflict", now);

            Map<String, Object> response = service.scheduleEventResponse(event);

            assertThat(response).containsEntry("id", "se-1");
            assertThat(response).containsEntry("booking_id", "b-1");
            assertThat(response).containsEntry("actor_user_id", "user-1");
            assertThat(response).containsEntry("event_type", "RESCHEDULE_REQUEST");
            assertThat(response).containsEntry("proposed_scheduled_at", proposed.toString());
            assertThat(response).containsEntry("reason", "timing conflict");
            assertThat(response).containsEntry("created_at", now.toString());
        }

        @Test
        @DisplayName("handles null proposedScheduledAt and null reason")
        void handlesNullFields() {
            BookingScheduleEvent event =
                    new BookingScheduleEvent("se-2", "b-2", "user-2", "RESCHEDULE_ACCEPT", null, null, Instant.now());

            Map<String, Object> response = service.scheduleEventResponse(event);

            assertThat(response).containsEntry("proposed_scheduled_at", null);
            assertThat(response).containsEntry("reason", null);
        }
    }

    @Nested
    @DisplayName("rebookTaskResponse")
    class RebookTaskResponse {

        @Test
        @DisplayName("maps all TaskState fields to response")
        void mapsAllFields() {
            Instant now = Instant.now();
            TaskState task = new TaskState(
                    "task-1",
                    "cust-1",
                    "cat-1",
                    "Fix sink",
                    5000,
                    47.9,
                    106.9,
                    "Ulaanbaatar",
                    "OPEN",
                    now,
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    now,
                    now);

            Map<String, Object> response = service.rebookTaskResponse(task);

            assertThat(response).containsEntry("id", "task-1");
            assertThat(response).containsEntry("customer_id", "cust-1");
            assertThat(response).containsEntry("category_id", "cat-1");
            assertThat(response).containsEntry("description", "Fix sink");
            assertThat(response).containsEntry("budget", 5000);
            assertThat(response).containsEntry("location_lat", 47.9);
            assertThat(response).containsEntry("location_lng", 106.9);
            assertThat(response).containsEntry("location_text", "Ulaanbaatar");
            assertThat(response).containsEntry("status", "OPEN");
            assertThat(response).containsEntry("created_at", now.toString());
            assertThat(response).containsEntry("updated_at", now.toString());
        }
    }
}
