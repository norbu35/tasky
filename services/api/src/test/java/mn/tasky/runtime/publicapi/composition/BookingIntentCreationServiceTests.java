package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.CreateBookingIntentRequest;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingIntentCreationServiceTests {

    @Mock
    private BookingIntentCommandPort bookingIntentCommandPort;

    @Mock
    private IdempotencyService idempotencyService;

    private BookingIntentCreationService service;

    private final String customerId = "customer-001";
    private final String taskId = "task-001";
    private final String taskerId = "tasker-001";
    private final String originalBookingId = "booking-001";
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();
    private final CreateBookingIntentRequest request =
            new CreateBookingIntentRequest("REBOOK", taskerId, originalBookingId);

    @BeforeEach
    void setUp() {
        service = new BookingIntentCreationService(
                bookingIntentCommandPort, new BookingIntentCompositionService(), idempotencyService);
    }

    private BookingIntentState rebookIntent(String id) {
        Instant now = Instant.now();
        return new BookingIntentState(
                id,
                taskId,
                taskerId,
                customerId,
                "REBOOK",
                "PENDING",
                null,
                originalBookingId,
                null,
                null,
                null,
                null,
                now,
                now);
    }

    @Nested
    @DisplayName("createIntent")
    class CreateIntent {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(bookingIntentCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record returns replayed success")
        void completedReplay() {
            BookingIntentState intent = rebookIntent("intent-001");
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    IdempotencyOperations.CREATE_BOOKING_INTENT,
                    idempotencyKey,
                    "COMPLETED",
                    "BOOKING_INTENT",
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(bookingIntentCommandPort.getIntent(record.resourceId().toString()))
                    .thenReturn(Optional.of(intent));

            BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", intent.id());
            assertThat(outcome.body()).containsEntry("source", "REBOOK");
        }

        @Test
        @DisplayName("COMPLETED claim with missing record returns replay missing")
        void completedReplayMissing() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.REPLAY_MISSING);
            verifyNoInteractions(bookingIntentCommandPort);
        }

        @Test
        @DisplayName("SCN-BOOK-033: Completed booking rebook creates one-time repeat "
                + "task without recurring or payment promises")
        void newClaimSuccessCompletesIdempotency() {
            BookingIntentState intent = rebookIntent("intent-002");
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.createIntent(customerId, taskId, "REBOOK", taskerId, originalBookingId))
                    .thenReturn(BookingIntentCreateResult.success(intent));

            BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", intent.id());
            assertThat(outcome.body()).containsEntry("original_booking_id", originalBookingId);
            verify(idempotencyService)
                    .completeWithResource(
                            customerId,
                            IdempotencyOperations.CREATE_BOOKING_INTENT,
                            idempotencyKey,
                            "BOOKING_INTENT",
                            intent.id());
        }

        @Test
        @DisplayName("NEW claim with validation error abandons idempotency")
        void validationErrorAbandonsIdempotency() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.createIntent(customerId, taskId, "REBOOK", taskerId, originalBookingId))
                    .thenReturn(BookingIntentCreateResult.error(
                            BookingIntentCreateResult.INVALID_REQUEST, "original_booking_id is required"));

            BookingIntentCreationOutcome outcome = service.createIntent(customerId, taskId, request, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.INVALID_REQUEST);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.createIntent(customerId, taskId, "REBOOK", taskerId, originalBookingId))
                    .thenThrow(new RuntimeException("db error"));

            assertThatThrownBy(() -> service.createIntent(customerId, taskId, request, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
        }
    }
}
