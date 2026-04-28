package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.booking.dto.RebookResult;
import mn.tasky.booking.dto.RescheduleRequest;
import mn.tasky.booking.dto.RescheduleRespondRequest;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingPublicOperationServiceTests {

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private NotificationCommandPort notificationCommandPort;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private BookingResponseCompositionService bookingResponseCompositionService;

    private BookingPublicOperationService service;

    private final String userId = "user-001";
    private final String bookingId = "booking-001";
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();

    private BookingState defaultBooking() {
        return new BookingState(
                bookingId,
                "task-001",
                "tasker-001",
                userId,
                10000,
                "CANCELLED",
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
        service = new BookingPublicOperationService(
                bookingQueryPort,
                bookingCommandPort,
                notificationCommandPort,
                idempotencyService,
                bookingResponseCompositionService);
    }

    // ─── cancelBooking ────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelBooking")
    class CancelBooking {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome without calling command port")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(bookingCommandPort);
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
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            BookingState booking = defaultBooking();
            when(bookingQueryPort.getBooking(resourceId.toString())).thenReturn(Optional.of(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verifyNoInteractions(bookingCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with successful cancellation returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.success(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey, "BOOKING", bookingId);
        }

        @Test
        @DisplayName("NEW claim with cancellation reason forwards reason to command port")
        void newClaimSuccessWithReason() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            when(bookingCommandPort.cancelBooking(userId, bookingId, "[SAFETY_FRAUD] suspicious behavior"))
                    .thenReturn(BookingTransitionResult.success(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome =
                    service.cancelBooking(userId, bookingId, idempotencyKey, "[SAFETY_FRAUD] suspicious behavior");

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(bookingCommandPort).cancelBooking(userId, bookingId, "[SAFETY_FRAUD] suspicious behavior");
            verify(bookingCommandPort, never()).cancelBooking(userId, bookingId);
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND outcome")
        void newClaimNotFound() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.NOT_FOUND_RESULT);

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with FORBIDDEN error returns FORBIDDEN outcome")
        void newClaimForbidden() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("NEW claim with INVALID_TRANSITION error returns INVALID_STATUS outcome")
        void newClaimInvalidTransition() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.INVALID_TRANSITION_RESULT);

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.INVALID_STATUS);
        }

        @Test
        @DisplayName("NEW claim with OPEN_DISPUTE error returns OPEN_DISPUTE outcome")
        void newClaimOpenDispute() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.OPEN_DISPUTE_RESULT);

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.OPEN_DISPUTE);
        }

        @Test
        @DisplayName("NEW claim with unknown error code returns INTERNAL_ERROR")
        void newClaimUnknownError() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.error("UNKNOWN_CODE", "something"));

            BookingOperationOutcome outcome = service.cancelBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.INTERNAL_ERROR);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void newClaimRuntimeException() {
            when(idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.cancelBooking(userId, bookingId)).thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> service.cancelBooking(userId, bookingId, idempotencyKey))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("DB error");

            verify(idempotencyService).abandon(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey);
        }
    }

    // ─── completeBooking ──────────────────────────────────────────────

    @Nested
    @DisplayName("completeBooking")
    class CompleteBooking {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.completeBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record replays successfully")
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
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            BookingState booking = defaultBooking();
            when(bookingQueryPort.getBooking(resourceId.toString())).thenReturn(Optional.of(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome = service.completeBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
        }

        @Test
        @DisplayName("NEW claim with successful completion returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            when(bookingCommandPort.completeBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.success(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome = service.completeBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey, "BOOKING", bookingId);
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND outcome")
        void newClaimNotFound() {
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.completeBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.NOT_FOUND_RESULT);

            BookingOperationOutcome outcome = service.completeBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NEW claim with FORBIDDEN error returns FORBIDDEN outcome")
        void newClaimForbidden() {
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.completeBooking(userId, bookingId))
                    .thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

            BookingOperationOutcome outcome = service.completeBooking(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void newClaimRuntimeException() {
            when(idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.completeBooking(userId, bookingId)).thenThrow(new RuntimeException("boom"));

            assertThatThrownBy(() -> service.completeBooking(userId, bookingId, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey);
        }
    }

    // ─── markBookingDone ──────────────────────────────────────────────

    @Nested
    @DisplayName("markBookingDone")
    class MarkBookingDone {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record replays mark-done response")
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
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            BookingState booking = defaultBooking();
            Instant markedDoneAt = Instant.now();
            when(bookingQueryPort.getBooking(resourceId.toString())).thenReturn(Optional.of(booking));
            when(bookingQueryPort.getTaskerMarkedDoneAt(resourceId.toString())).thenReturn(Optional.of(markedDoneAt));
            when(bookingResponseCompositionService.markDoneResponse(booking, markedDoneAt))
                    .thenReturn(Map.of("booking", Map.of("id", bookingId)));

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with successful mark-done and newlyMarked sends push notification")
        void newClaimSuccessNewlyMarked() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            Instant markedDoneAt = Instant.now();
            when(bookingCommandPort.markBookingDone(userId, bookingId))
                    .thenReturn(BookingMarkDoneResult.success(booking, markedDoneAt, true));
            when(bookingResponseCompositionService.markDoneResponse(booking, markedDoneAt))
                    .thenReturn(Map.of("ok", true));

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(notificationCommandPort)
                    .sendPush(eq(booking.customerId()), any(), any(), eq("TASKER_MARKED_COMPLETE"));
            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey, "BOOKING", bookingId);
        }

        @Test
        @DisplayName("NEW claim with successful mark-done but not newly marked does NOT send push")
        void newClaimSuccessNotNewlyMarked() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            Instant markedDoneAt = Instant.now();
            when(bookingCommandPort.markBookingDone(userId, bookingId))
                    .thenReturn(BookingMarkDoneResult.success(booking, markedDoneAt, false));
            when(bookingResponseCompositionService.markDoneResponse(booking, markedDoneAt))
                    .thenReturn(Map.of("ok", true));

            service.markBookingDone(userId, bookingId, idempotencyKey);

            verify(notificationCommandPort, never()).sendPush(any(), any(), any(), any());
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND outcome")
        void newClaimNotFound() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.markBookingDone(userId, bookingId))
                    .thenReturn(BookingMarkDoneResult.NOT_FOUND_RESULT);

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with FORBIDDEN error returns FORBIDDEN outcome")
        void newClaimForbidden() {
            when(idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.markBookingDone(userId, bookingId))
                    .thenReturn(BookingMarkDoneResult.FORBIDDEN_RESULT);

            BookingOperationOutcome outcome = service.markBookingDone(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.FORBIDDEN);
        }
    }

    // ─── flagNoShow ───────────────────────────────────────────────────

    @Nested
    @DisplayName("flagNoShow")
    class FlagNoShow {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("NEW claim with successful no-show flag returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingState booking = defaultBooking();
            when(bookingCommandPort.flagNoShow(bookingId, userId)).thenReturn(NoShowFlagResult.success(booking));
            when(bookingResponseCompositionService.bookingResponse(booking)).thenReturn(Map.of("id", bookingId));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey, "BOOKING", bookingId);
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND outcome")
        void notFound() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.flagNoShow(bookingId, userId)).thenReturn(NoShowFlagResult.error("NOT_FOUND"));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NEW claim with TOO_EARLY error returns TOO_EARLY outcome")
        void tooEarly() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.flagNoShow(bookingId, userId)).thenReturn(NoShowFlagResult.error("TOO_EARLY"));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.TOO_EARLY);
        }

        @Test
        @DisplayName("NEW claim with ACTIVITY_DETECTED error returns ACTIVITY_DETECTED outcome")
        void activityDetected() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.flagNoShow(bookingId, userId))
                    .thenReturn(NoShowFlagResult.error("ACTIVITY_DETECTED"));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.ACTIVITY_DETECTED);
        }

        @Test
        @DisplayName("NEW claim with RESCHEDULE_SUPERSEDES error returns RESCHEDULE_SUPERSEDES outcome")
        void rescheduleSupercedes() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.flagNoShow(bookingId, userId))
                    .thenReturn(NoShowFlagResult.error("RESCHEDULE_SUPERSEDES"));

            BookingOperationOutcome outcome = service.flagNoShow(userId, bookingId, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.RESCHEDULE_SUPERSEDES);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.flagNoShow(bookingId, userId)).thenThrow(new RuntimeException("fail"));

            assertThatThrownBy(() -> service.flagNoShow(userId, bookingId, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey);
        }
    }

    // ─── requestReschedule ────────────────────────────────────────────

    @Nested
    @DisplayName("requestReschedule")
    class RequestReschedule {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.requestReschedule(
                    userId, bookingId, new RescheduleRequest(Instant.now().toString(), "reason"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("NEW claim with successful reschedule request returns CREATED")
        void newClaimSuccess() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            String proposedAt = Instant.now().toString();
            BookingScheduleEvent event = new BookingScheduleEvent(
                    "evt-001",
                    bookingId,
                    userId,
                    "RESCHEDULE_REQUESTED",
                    Instant.parse(proposedAt),
                    "reason",
                    Instant.now());
            when(bookingCommandPort.requestReschedule(eq(bookingId), eq(userId), any(Instant.class), eq("reason")))
                    .thenReturn(event);
            when(bookingResponseCompositionService.scheduleEventResponse(event)).thenReturn(Map.of("id", "evt-001"));

            BookingOperationOutcome outcome = service.requestReschedule(
                    userId, bookingId, new RescheduleRequest(proposedAt, "reason"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.CREATED);
            verify(idempotencyService)
                    .completeWithResource(
                            userId,
                            IdempotencyOperations.RESCHEDULE_REQUEST,
                            idempotencyKey,
                            "BOOKING_SCHEDULE_EVENT",
                            "evt-001");
        }

        @Test
        @DisplayName("NEW claim with IllegalArgumentException returns NOT_FOUND outcome")
        void newClaimIllegalArgument() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            String proposedAt = Instant.now().toString();
            when(bookingCommandPort.requestReschedule(eq(bookingId), eq(userId), any(Instant.class), eq("reason")))
                    .thenThrow(new IllegalArgumentException("not found"));

            BookingOperationOutcome outcome = service.requestReschedule(
                    userId, bookingId, new RescheduleRequest(proposedAt, "reason"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with IllegalStateException returns INVALID_STATUS outcome")
        void newClaimIllegalState() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            String proposedAt = Instant.now().toString();
            when(bookingCommandPort.requestReschedule(eq(bookingId), eq(userId), any(Instant.class), eq("reason")))
                    .thenThrow(new IllegalStateException("bad state"));

            BookingOperationOutcome outcome = service.requestReschedule(
                    userId, bookingId, new RescheduleRequest(proposedAt, "reason"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.INVALID_STATUS);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void newClaimRuntimeException() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            String proposedAt = Instant.now().toString();
            when(bookingCommandPort.requestReschedule(eq(bookingId), eq(userId), any(Instant.class), eq("reason")))
                    .thenThrow(new RuntimeException("db down"));

            assertThatThrownBy(() -> service.requestReschedule(
                            userId, bookingId, new RescheduleRequest(proposedAt, "reason"), idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
        }
    }

    // ─── respondToReschedule ──────────────────────────────────────────

    @Nested
    @DisplayName("respondToReschedule")
    class RespondToReschedule {

        private final String eventId = "evt-001";

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            BookingOperationOutcome outcome = service.respondToReschedule(
                    userId, bookingId, eventId, new RescheduleRespondRequest("ACCEPT"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("NEW claim with successful response returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            BookingScheduleEvent event =
                    new BookingScheduleEvent(eventId, bookingId, userId, "ACCEPTED", null, null, Instant.now());
            when(bookingCommandPort.respondToReschedule(bookingId, eventId, userId, "ACCEPT"))
                    .thenReturn(event);
            when(bookingResponseCompositionService.scheduleEventResponse(event)).thenReturn(Map.of("id", eventId));

            BookingOperationOutcome outcome = service.respondToReschedule(
                    userId, bookingId, eventId, new RescheduleRespondRequest("ACCEPT"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource(
                            userId,
                            IdempotencyOperations.RESCHEDULE_RESPOND,
                            idempotencyKey,
                            "BOOKING_SCHEDULE_EVENT",
                            eventId);
        }

        @Test
        @DisplayName("NEW claim with IllegalArgumentException returns NOT_FOUND")
        void newClaimIllegalArgument() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.respondToReschedule(bookingId, eventId, userId, "ACCEPT"))
                    .thenThrow(new IllegalArgumentException("not found"));

            BookingOperationOutcome outcome = service.respondToReschedule(
                    userId, bookingId, eventId, new RescheduleRespondRequest("ACCEPT"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NEW claim with IllegalStateException returns INVALID_STATUS")
        void newClaimIllegalState() {
            when(idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(bookingCommandPort.respondToReschedule(bookingId, eventId, userId, "DECLINE"))
                    .thenThrow(new IllegalStateException("bad state"));

            BookingOperationOutcome outcome = service.respondToReschedule(
                    userId, bookingId, eventId, new RescheduleRespondRequest("DECLINE"), idempotencyKey);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.INVALID_STATUS);
        }
    }

    // ─── rebook ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("rebook")
    class Rebook {

        @Test
        @DisplayName("Successful rebook returns CREATED with new task response")
        void success() {
            TaskState newTask = new TaskState(
                    "task-new",
                    userId,
                    "cat-1",
                    "Rebooked task",
                    10000,
                    47.9,
                    106.9,
                    "UB",
                    "OPEN",
                    Instant.now(),
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
            when(bookingCommandPort.rebook(bookingId, userId)).thenReturn(RebookResult.success(newTask));
            when(bookingResponseCompositionService.rebookTaskResponse(newTask)).thenReturn(Map.of("id", "task-new"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.CREATED);
        }

        @Test
        @DisplayName("NOT_FOUND error returns NOT_FOUND outcome")
        void notFound() {
            when(bookingCommandPort.rebook(bookingId, userId))
                    .thenReturn(RebookResult.error(RebookResult.NOT_FOUND, "Booking not found"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NOT_COMPLETED error returns NOT_COMPLETED outcome")
        void notCompleted() {
            when(bookingCommandPort.rebook(bookingId, userId))
                    .thenReturn(RebookResult.error(RebookResult.NOT_COMPLETED, "Booking not completed"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_COMPLETED);
        }

        @Test
        @DisplayName("FORBIDDEN error returns FORBIDDEN outcome")
        void forbidden() {
            when(bookingCommandPort.rebook(bookingId, userId))
                    .thenReturn(RebookResult.error(RebookResult.FORBIDDEN, "Not your booking"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("TASK_NOT_FOUND error returns NOT_FOUND outcome")
        void taskNotFound() {
            when(bookingCommandPort.rebook(bookingId, userId))
                    .thenReturn(RebookResult.error(RebookResult.TASK_NOT_FOUND, "Original task gone"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("Unknown error code returns INTERNAL_ERROR")
        void unknownError() {
            when(bookingCommandPort.rebook(bookingId, userId)).thenReturn(RebookResult.error("WEIRD", "something"));

            BookingOperationOutcome outcome = service.rebook(userId, bookingId);

            assertThat(outcome.status()).isEqualTo(BookingOperationOutcome.Status.INTERNAL_ERROR);
        }
    }
}
