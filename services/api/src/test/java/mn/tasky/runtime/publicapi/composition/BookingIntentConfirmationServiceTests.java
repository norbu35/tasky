package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentDeclineResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
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
class BookingIntentConfirmationServiceTests {

    @Mock
    private BookingIntentCommandPort bookingIntentCommandPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private BookingResponseCompositionService bookingResponseCompositionService;

    @Mock
    private BookingIntentCompositionService bookingIntentCompositionService;

    @Mock
    private IdempotencyService idempotencyService;

    private BookingIntentConfirmationService service;

    private final String customerId = "customer-001";
    private final String intentId = "intent-001";
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();

    private BookingState defaultBooking() {
        return new BookingState(
                "booking-001",
                "task-001",
                "tasker-001",
                customerId,
                10000,
                "ASSIGNED",
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

    @BeforeEach
    void setUp() {
        service = new BookingIntentConfirmationService(
                bookingIntentCommandPort,
                bookingQueryPort,
                bookingIntentCompositionService,
                bookingResponseCompositionService,
                idempotencyService);
    }

    @Nested
    @DisplayName("confirmIntent")
    class ConfirmIntent {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(bookingIntentCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record replays from query port")
        void completedReplay() {
            UUID resourceId = UUID.randomUUID();
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "BOOKING",
                    resourceId,
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            BookingState booking = defaultBooking();
            when(bookingQueryPort.getBooking(resourceId.toString())).thenReturn(Optional.of(booking));
            when(bookingResponseCompositionService.basicBookingResponse(booking))
                    .thenReturn(Map.of("id", "booking-001"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.SUCCESS);
            verifyNoInteractions(bookingIntentCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("COMPLETED claim with record but booking gone returns REPLAY_MISSING")
        void completedReplayBookingGone() {
            UUID resourceId = UUID.randomUUID();
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "BOOKING",
                    resourceId,
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(bookingQueryPort.getBooking(resourceId.toString())).thenReturn(Optional.empty());

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with successful confirmation returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(BookingIntentConfirmResult.success(booking));
            when(bookingResponseCompositionService.basicBookingResponse(booking))
                    .thenReturn(Map.of("id", "booking-001"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            customerId,
                            IdempotencyOperations.CONFIRM_BOOKING_INTENT,
                            idempotencyKey,
                            "BOOKING",
                            booking.id());
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND outcome")
        void notFound() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(
                            BookingIntentConfirmResult.error(BookingIntentConfirmResult.NOT_FOUND, "Intent not found"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.NOT_FOUND);
            verify(idempotencyService)
                    .abandon(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with FORBIDDEN error returns FORBIDDEN outcome")
        void forbidden() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(BookingIntentConfirmResult.error(BookingIntentConfirmResult.FORBIDDEN, "Not allowed"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("NEW claim with TASK_NOT_OPEN error returns TASK_NOT_OPEN outcome")
        void taskNotOpen() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(
                            BookingIntentConfirmResult.error(BookingIntentConfirmResult.TASK_NOT_OPEN, "Task closed"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.TASK_NOT_OPEN);
        }

        @Test
        @DisplayName("NEW claim with CONFLICT error returns CONFLICT outcome")
        void conflict() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(
                            BookingIntentConfirmResult.error(BookingIntentConfirmResult.CONFLICT, "Already confirmed"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.CONFLICT);
        }

        @Test
        @DisplayName("NEW claim with DEFERRED error returns DEFERRED outcome")
        void deferred() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(BookingIntentConfirmResult.error(BookingIntentConfirmResult.DEFERRED, "Deferred"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.DEFERRED);
        }

        @Test
        @DisplayName("NEW claim with unknown error code returns INTERNAL_ERROR")
        void unknownError() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenReturn(BookingIntentConfirmResult.error("UNKNOWN", "Something"));

            BookingIntentConfirmationOutcome outcome = service.confirmIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.INTERNAL_ERROR);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingIntentCommandPort.confirmIntent(customerId, intentId))
                    .thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> service.confirmIntent(customerId, intentId, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService)
                    .abandon(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
        }
    }

    @Nested
    @DisplayName("declineIntent")
    class DeclineIntent {

        private BookingIntentState declinedIntent() {
            Instant now = Instant.now();
            return new BookingIntentState(
                    intentId,
                    "task-001",
                    "tasker-001",
                    customerId,
                    "APPLICATION_SELECTION",
                    "DECLINED",
                    "application-001",
                    null,
                    null,
                    now.plusSeconds(3600),
                    null,
                    null,
                    now,
                    now);
        }

        @Test
        @DisplayName("NEW claim with successful decline returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.DECLINE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            BookingIntentState intent = declinedIntent();
            when(bookingIntentCommandPort.declineIntent(customerId, intentId))
                    .thenReturn(BookingIntentDeclineResult.success(intent));
            when(bookingIntentCompositionService.bookingIntentResponse(intent))
                    .thenReturn(Map.of("id", intentId, "status", "DECLINED"));

            BookingIntentConfirmationOutcome outcome = service.declineIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            customerId,
                            IdempotencyOperations.DECLINE_BOOKING_INTENT,
                            idempotencyKey,
                            "BOOKING_INTENT",
                            intentId);
        }

        @Test
        @DisplayName("COMPLETED claim replays declined booking intent")
        void completedReplay() {
            UUID resourceId = UUID.randomUUID();
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "BOOKING_INTENT",
                    resourceId,
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.DECLINE_BOOKING_INTENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            BookingIntentState intent = declinedIntent();
            when(bookingIntentCommandPort.getIntent(resourceId.toString())).thenReturn(Optional.of(intent));
            when(bookingIntentCompositionService.bookingIntentResponse(intent))
                    .thenReturn(Map.of("id", intent.id(), "status", intent.status()));

            BookingIntentConfirmationOutcome outcome = service.declineIntent(customerId, intentId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingIntentConfirmationOutcome.Status.SUCCESS);
            verifyNoInteractions(bookingQueryPort);
        }
    }
}
