package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingPublicCompositionService")
class BookingPublicCompositionServiceTests {

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private BookingResponseCompositionService bookingResponseCompositionService;

    private BookingPublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new BookingPublicCompositionService(bookingQueryPort, bookingResponseCompositionService);
    }

    private BookingState booking(String id, String taskId, String taskerId, String customerId) {
        return new BookingState(
                id,
                taskId,
                taskerId,
                customerId,
                5000,
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
    }

    @Nested
    @DisplayName("listBookings")
    class ListBookings {

        @Test
        @DisplayName("returns page with correct data and pagination metadata")
        void returnsPageWithCorrectData() {
            BookingState b1 = booking("b-1", "t-1", "tasker-1", "cust-1");
            BookingState b2 = booking("b-2", "t-2", "tasker-2", "cust-1");
            when(bookingQueryPort.listBookings("cust-1", "CUSTOMER", "CONFIRMED", null, 11))
                    .thenReturn(List.of(b1, b2));
            when(bookingResponseCompositionService.bookingResponse(b1)).thenReturn(Map.of("id", "b-1"));
            when(bookingResponseCompositionService.bookingResponse(b2)).thenReturn(Map.of("id", "b-2"));

            BookingPublicPage page = service.listBookings("cust-1", "CUSTOMER", "CONFIRMED", null, 10);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("sets hasMore and nextCursor when results exceed limit")
        void setsHasMoreWhenResultsExceedLimit() {
            BookingState b1 = booking("b-1", "t-1", "tasker-1", "cust-1");
            BookingState b2 = booking("b-2", "t-2", "tasker-2", "cust-1");
            when(bookingQueryPort.listBookings("cust-1", "CUSTOMER", null, "cursor-1", 3))
                    .thenReturn(List.of(b1, b2, booking("b-3", "t-3", "tasker-3", "cust-1")));
            when(bookingResponseCompositionService.bookingResponse(b1)).thenReturn(Map.of("id", "b-1"));
            when(bookingResponseCompositionService.bookingResponse(b2)).thenReturn(Map.of("id", "b-2"));

            BookingPublicPage page = service.listBookings("cust-1", "CUSTOMER", null, "cursor-1", 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo("b-2");
        }

        @Test
        @DisplayName("clamps limit to range 1-100")
        void clampsLimit() {
            when(bookingQueryPort.listBookings("u-1", "TASKER", null, null, 101))
                    .thenReturn(List.of());

            BookingPublicPage page = service.listBookings("u-1", "TASKER", null, null, 200);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
        }

        @Test
        @DisplayName("clamps zero limit to 1")
        void clampsZeroLimit() {
            when(bookingQueryPort.listBookings("u-1", "TASKER", null, null, 2)).thenReturn(List.of());

            BookingPublicPage page = service.listBookings("u-1", "TASKER", null, null, 0);

            assertThat(page.data()).isEmpty();
        }

        @Test
        @DisplayName("returns empty page when no bookings found")
        void returnsEmptyPage() {
            when(bookingQueryPort.listBookings("u-1", "CUSTOMER", "OPEN", null, 11))
                    .thenReturn(List.of());

            BookingPublicPage page = service.listBookings("u-1", "CUSTOMER", "OPEN", null, 10);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }
    }

    @Nested
    @DisplayName("getVisibleBooking")
    class GetVisibleBooking {

        @Test
        @DisplayName("returns booking response when user is customer")
        void returnsWhenCustomer() {
            BookingState b = booking("b-1", "t-1", "tasker-1", "cust-1");
            when(bookingQueryPort.getBooking("b-1")).thenReturn(Optional.of(b));
            when(bookingResponseCompositionService.bookingResponse(b)).thenReturn(Map.of("id", "b-1"));

            Optional<Map<String, Object>> result = service.getVisibleBooking("b-1", "cust-1");

            assertThat(result).isPresent();
            assertThat(result.get()).containsEntry("id", "b-1");
        }

        @Test
        @DisplayName("returns booking response when user is tasker")
        void returnsWhenTasker() {
            BookingState b = booking("b-1", "t-1", "tasker-1", "cust-1");
            when(bookingQueryPort.getBooking("b-1")).thenReturn(Optional.of(b));
            when(bookingResponseCompositionService.bookingResponse(b)).thenReturn(Map.of("id", "b-1"));

            Optional<Map<String, Object>> result = service.getVisibleBooking("b-1", "tasker-1");

            assertThat(result).isPresent();
        }

        @Test
        @DisplayName("returns empty when booking not found")
        void returnsEmptyWhenNotFound() {
            when(bookingQueryPort.getBooking("b-999")).thenReturn(Optional.empty());

            Optional<Map<String, Object>> result = service.getVisibleBooking("b-999", "cust-1");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when user is neither customer nor tasker")
        void returnsEmptyWhenUnauthorized() {
            BookingState b = booking("b-1", "t-1", "tasker-1", "cust-1");
            when(bookingQueryPort.getBooking("b-1")).thenReturn(Optional.of(b));

            Optional<Map<String, Object>> result = service.getVisibleBooking("b-1", "other-user");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("scheduleEventsResponse")
    class ScheduleEventsResponse {

        @Test
        @DisplayName("returns mapped schedule events in data wrapper")
        void returnsMappedEvents() {
            BookingScheduleEvent event = new BookingScheduleEvent(
                    "se-1", "b-1", "user-1", "RESCHEDULE_REQUEST", Instant.now(), "conflict", Instant.now());
            when(bookingQueryPort.listScheduleEvents("b-1", "user-1")).thenReturn(List.of(event));
            when(bookingResponseCompositionService.scheduleEventResponse(event)).thenReturn(Map.of("id", "se-1"));

            Map<String, Object> response = service.scheduleEventsResponse("b-1", "user-1");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            assertThat(data).hasSize(1);
            assertThat(data.get(0)).containsEntry("id", "se-1");
        }

        @Test
        @DisplayName("returns empty data list when no events")
        void returnsEmptyDataList() {
            when(bookingQueryPort.listScheduleEvents("b-1", "user-1")).thenReturn(List.of());

            Map<String, Object> response = service.scheduleEventsResponse("b-1", "user-1");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
            assertThat(data).isEmpty();
        }
    }

    @Nested
    @DisplayName("scheduleEventReplayResponse")
    class ScheduleEventReplayResponse {

        @Test
        @DisplayName("returns mapped event when found")
        void returnsMappedEventWhenFound() {
            BookingScheduleEvent event = new BookingScheduleEvent(
                    "se-1", "b-1", "user-1", "RESCHEDULE_ACCEPT", Instant.now(), null, Instant.now());
            when(bookingQueryPort.getScheduleEvent("se-1")).thenReturn(Optional.of(event));
            when(bookingResponseCompositionService.scheduleEventResponse(event)).thenReturn(Map.of("id", "se-1"));

            Map<String, Object> response = service.scheduleEventReplayResponse("se-1");

            assertThat(response).containsEntry("id", "se-1");
        }

        @Test
        @DisplayName("returns fallback map with just id when event not found")
        void returnsFallbackWhenNotFound() {
            when(bookingQueryPort.getScheduleEvent("se-missing")).thenReturn(Optional.empty());

            Map<String, Object> response = service.scheduleEventReplayResponse("se-missing");

            assertThat(response).containsEntry("id", "se-missing");
            assertThat(response).hasSize(1);
        }
    }
}
