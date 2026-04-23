package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminBookingCompositionServiceTests {

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private AdminAuditCommandPort adminAuditCommandPort;

    @Mock
    private IdempotencyService idempotencyService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AdminBookingCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminBookingCompositionService(
                bookingQueryPort, bookingCommandPort, adminAuditCommandPort, idempotencyService, objectMapper);
    }

    @Nested
    @DisplayName("bookingDetail")
    class BookingDetailTests {

        @Test
        @DisplayName("returns mapped booking detail when booking exists")
        void bookingDetail_returnsMappedResponse() {
            String bookingId = UUID.randomUUID().toString();
            BookingState booking = buildBooking(bookingId);

            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(booking));

            Optional<Map<String, Object>> result = service.bookingDetail(bookingId);

            assertThat(result).isPresent();
            Map<String, Object> body = result.get();
            assertThat(body).containsEntry("id", bookingId);
            assertThat(body).containsEntry("task_id", booking.taskId());
            assertThat(body).containsEntry("tasker_id", booking.taskerId());
            assertThat(body).containsEntry("customer_id", booking.customerId());
            assertThat(body).containsEntry("price", booking.price());
            assertThat(body).containsEntry("status", booking.status());
        }

        @Test
        @DisplayName("returns empty optional when booking not found")
        void bookingDetail_returnsEmptyWhenNotFound() {
            when(bookingQueryPort.getBooking("missing")).thenReturn(Optional.empty());

            Optional<Map<String, Object>> result = service.bookingDetail("missing");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("overrideBookingStatus")
    class OverrideBookingStatusTests {

        @Test
        @DisplayName("returns IN_PROGRESS when idempotency claim is in progress")
        void overrideBookingStatus_returnsInProgress() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", "b1", "CANCELLED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.IN_PROGRESS);
            verify(bookingCommandPort, never()).forceTransition(anyString(), anyString());
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency claim is completed but record is null")
        void overrideBookingStatus_replayMissing_nullRecord() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", "b1", "CANCELLED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency claim completed but booking not found")
        void overrideBookingStatus_replayMissing_bookingGone() {
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "BOOKING",
                    UUID.fromString("00000000-0000-0000-0000-0000000000b1"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(bookingQueryPort.getBooking("00000000-0000-0000-0000-0000000000b1"))
                    .thenReturn(Optional.empty());
            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", "b1", "CANCELLED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns SUCCESS with replayed booking when idempotency claim is completed")
        void overrideBookingStatus_replaysCompleted() {
            String bookingId = UUID.randomUUID().toString();
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "BOOKING",
                    UUID.fromString(bookingId),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(buildBooking(bookingId)));

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", bookingId, "CANCELLED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", bookingId);
        }

        @Test
        @DisplayName("overrides status successfully and records audit")
        void overrideBookingStatus_success() {
            String bookingId = UUID.randomUUID().toString();
            BookingState updated = buildBooking(bookingId);

            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.forceTransition(bookingId, "CANCELLED"))
                    .thenReturn(BookingTransitionResult.success(updated));

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", bookingId, "CANCELLED", "test reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", bookingId);
            verify(adminAuditCommandPort)
                    .recordAdminAction(
                            eq("admin1"), eq("BOOKING_STATUS_OVERRIDE"), eq("BOOKING"), eq(bookingId), anyString());
            verify(idempotencyService)
                    .completeWithResource(
                            "admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1", "BOOKING", bookingId);
        }

        @Test
        @DisplayName("returns NOT_FOUND when forceTransition reports NOT_FOUND")
        void overrideBookingStatus_notFound() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.forceTransition("b1", "CANCELLED"))
                    .thenReturn(BookingTransitionResult.NOT_FOUND_RESULT);

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", "b1", "CANCELLED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1");
            verify(adminAuditCommandPort, never())
                    .recordAdminAction(anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("returns INVALID_TRANSITION when forceTransition reports other error")
        void overrideBookingStatus_invalidTransition() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.forceTransition("b1", "COMPLETED"))
                    .thenReturn(BookingTransitionResult.INVALID_TRANSITION_RESULT);

            AdminBookingOverrideOutcome outcome =
                    service.overrideBookingStatus("admin1", "b1", "COMPLETED", "reason", "key1");

            assertThat(outcome.status()).isEqualTo(AdminBookingOverrideOutcome.Status.INVALID_TRANSITION);
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1");
        }

        @Test
        @DisplayName("abandons idempotency and re-throws on unexpected exception")
        void overrideBookingStatus_throwsAndAbandons() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.forceTransition("b1", "CANCELLED")).thenThrow(new RuntimeException("DB down"));

            assertThatThrownBy(() -> service.overrideBookingStatus("admin1", "b1", "CANCELLED", "reason", "key1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("DB down");

            verify(idempotencyService).abandon("admin1", IdempotencyOperations.CONCIERGE_ASSIGN, "key1");
        }
    }

    private BookingState buildBooking(String id) {
        return new BookingState(
                id,
                UUID.randomUUID().toString(),
                "tasker-1",
                "customer-1",
                5000,
                "CONFIRMED",
                null,
                true,
                Instant.now(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
    }
}
