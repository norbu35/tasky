package mn.tasky.runtime.publicapi.composition;

import java.time.Instant;
import java.util.Map;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.NoShowFlagResult;
import mn.tasky.booking.dto.RebookResult;
import mn.tasky.booking.dto.RescheduleRequest;
import mn.tasky.booking.dto.RescheduleRespondRequest;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.springframework.stereotype.Component;

@Component
public class BookingPublicOperationService {

    private final BookingQueryPort bookingQueryPort;
    private final BookingCommandPort bookingCommandPort;
    private final NotificationCommandPort notificationCommandPort;
    private final IdempotencyService idempotencyService;
    private final BookingResponseCompositionService bookingResponseCompositionService;

    public BookingPublicOperationService(
            BookingQueryPort bookingQueryPort,
            BookingCommandPort bookingCommandPort,
            NotificationCommandPort notificationCommandPort,
            IdempotencyService idempotencyService,
            BookingResponseCompositionService bookingResponseCompositionService) {
        this.bookingQueryPort = bookingQueryPort;
        this.bookingCommandPort = bookingCommandPort;
        this.notificationCommandPort = notificationCommandPort;
        this.idempotencyService = idempotencyService;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
    }

    public BookingOperationOutcome cancelBooking(String userId, String bookingId, String idempotencyKey) {
        IdempotencyClaim claim = idempotencyService.claim(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayBookingOutcome(claim);
        }

        try {
            BookingTransitionResult result = bookingCommandPort.cancelBooking(userId, bookingId);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        userId,
                        IdempotencyOperations.CANCEL_BOOKING,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingOperationOutcome.success(
                        bookingResponseCompositionService.bookingResponse(result.booking()));
            }

            idempotencyService.abandon(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingTransitionResult.NOT_FOUND -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
                case BookingTransitionResult.FORBIDDEN -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "You do not have permission to cancel this booking.");
                case BookingTransitionResult.INVALID_TRANSITION -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.INVALID_STATUS,
                        "INVALID_STATUS",
                        "Booking cannot be cancelled in its current status.");
                case BookingTransitionResult.OPEN_DISPUTE -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.OPEN_DISPUTE,
                        "OPEN_DISPUTE",
                        "Booking cannot be closed while an open dispute exists.");
                default -> BookingOperationOutcome.internalError();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.CANCEL_BOOKING, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome completeBooking(String userId, String bookingId, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayBookingOutcome(claim);
        }

        try {
            BookingTransitionResult result = bookingCommandPort.completeBooking(userId, bookingId);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        userId,
                        IdempotencyOperations.COMPLETE_BOOKING,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingOperationOutcome.success(
                        bookingResponseCompositionService.bookingResponse(result.booking()));
            }

            idempotencyService.abandon(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingTransitionResult.NOT_FOUND -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
                case BookingTransitionResult.FORBIDDEN -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only the customer can complete this booking.");
                case BookingTransitionResult.INVALID_TRANSITION -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.INVALID_STATUS,
                        "INVALID_STATUS",
                        "Booking must be ASSIGNED to be completed.");
                case BookingTransitionResult.OPEN_DISPUTE -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.OPEN_DISPUTE,
                        "OPEN_DISPUTE",
                        "Booking cannot be closed while an open dispute exists.");
                default -> BookingOperationOutcome.internalError();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.COMPLETE_BOOKING, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome markBookingDone(String userId, String bookingId, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayMarkDoneOutcome(claim);
        }

        try {
            BookingMarkDoneResult result = bookingCommandPort.markBookingDone(userId, bookingId);
            if (result.isSuccess()) {
                if (result.newlyMarked()) {
                    notificationCommandPort.sendPush(
                            result.booking().customerId(),
                            "Tasker marked job complete",
                            "Your tasker marked the booking as done. Please review and confirm completion.",
                            "TASKER_MARKED_COMPLETE");
                }
                idempotencyService.completeWithResource(
                        userId,
                        IdempotencyOperations.MARK_BOOKING_DONE,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingOperationOutcome.success(
                        bookingResponseCompositionService.markDoneResponse(result.booking(), result.markedDoneAt()));
            }

            idempotencyService.abandon(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingMarkDoneResult.NOT_FOUND -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
                case BookingMarkDoneResult.FORBIDDEN -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only the tasker can mark this booking as done.");
                case BookingMarkDoneResult.INVALID_TRANSITION -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.INVALID_STATUS,
                        "INVALID_STATUS",
                        "Booking must be ASSIGNED or PAID to mark done.");
                default -> BookingOperationOutcome.internalError();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.MARK_BOOKING_DONE, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome flagNoShow(String userId, String bookingId, String idempotencyKey) {
        IdempotencyClaim claim = idempotencyService.claim(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayBookingOutcome(claim);
        }

        try {
            NoShowFlagResult result = bookingCommandPort.flagNoShow(bookingId, userId);
            if (result.success()) {
                idempotencyService.completeWithResource(
                        userId,
                        IdempotencyOperations.NO_SHOW_FLAG,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingOperationOutcome.success(
                        bookingResponseCompositionService.bookingResponse(result.booking()));
            }

            idempotencyService.abandon(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey);
            return switch (result.errorCode()) {
                case "NOT_FOUND" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
                case "FORBIDDEN" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "You are not a participant of this booking.");
                case "INVALID_STATUS" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.INVALID_STATUS,
                        "INVALID_STATUS",
                        "Booking must be ASSIGNED to flag no-show.");
                case "TOO_EARLY" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.TOO_EARLY,
                        "TOO_EARLY",
                        "Cannot flag no-show before 15 minutes past scheduled time.");
                case "NO_SCHEDULE" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.NO_SCHEDULE,
                        "NO_SCHEDULE",
                        "Booking has no confirmed schedule.");
                case "ACTIVITY_DETECTED" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.ACTIVITY_DETECTED,
                        "ACTIVITY_DETECTED",
                        "Recent activity detected; no-show cannot be flagged.");
                case "RESCHEDULE_SUPERSEDES" -> BookingOperationOutcome.failure(
                        BookingOperationOutcome.Status.RESCHEDULE_SUPERSEDES,
                        "RESCHEDULE_SUPERSEDES",
                        "An accepted reschedule with a future time supersedes this request.");
                default -> BookingOperationOutcome.internalError();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.NO_SHOW_FLAG, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome requestReschedule(
            String userId, String bookingId, RescheduleRequest body, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayScheduleEventOutcome(claim, true);
        }

        try {
            Instant proposedAt = Instant.parse(body.proposedScheduledAt());
            BookingScheduleEvent event =
                    bookingCommandPort.requestReschedule(bookingId, userId, proposedAt, body.reason());

            idempotencyService.completeWithResource(
                    userId,
                    IdempotencyOperations.RESCHEDULE_REQUEST,
                    idempotencyKey,
                    "BOOKING_SCHEDULE_EVENT",
                    event.id());
            return BookingOperationOutcome.created(bookingResponseCompositionService.scheduleEventResponse(event));
        } catch (IllegalArgumentException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
            return BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
        } catch (IllegalStateException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
            return BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.INVALID_STATUS,
                    "INVALID_STATUS",
                    "Operation not allowed in current booking status.");
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_REQUEST, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome respondToReschedule(
            String userId, String bookingId, String eventId, RescheduleRespondRequest body, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingOperationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            return replayScheduleEventOutcome(claim, false);
        }

        try {
            BookingScheduleEvent event =
                    bookingCommandPort.respondToReschedule(bookingId, eventId, userId, body.action());

            idempotencyService.completeWithResource(
                    userId,
                    IdempotencyOperations.RESCHEDULE_RESPOND,
                    idempotencyKey,
                    "BOOKING_SCHEDULE_EVENT",
                    event.id());
            return BookingOperationOutcome.success(bookingResponseCompositionService.scheduleEventResponse(event));
        } catch (IllegalArgumentException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey);
            return BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking or event not found.");
        } catch (IllegalStateException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey);
            return BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.INVALID_STATUS,
                    "INVALID_STATUS",
                    "Operation not allowed in current booking status.");
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RESCHEDULE_RESPOND, idempotencyKey);
            throw exception;
        }
    }

    public BookingOperationOutcome rebook(String userId, String bookingId) {
        RebookResult result = bookingCommandPort.rebook(bookingId, userId);
        if (result.isSuccess()) {
            return BookingOperationOutcome.created(bookingResponseCompositionService.rebookTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case RebookResult.NOT_FOUND, RebookResult.TASK_NOT_FOUND -> BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.NOT_FOUND, "NOT_FOUND", result.errorMessage());
            case RebookResult.NOT_COMPLETED -> BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.NOT_COMPLETED, "NOT_COMPLETED", result.errorMessage());
            case RebookResult.FORBIDDEN -> BookingOperationOutcome.failure(
                    BookingOperationOutcome.Status.FORBIDDEN, "FORBIDDEN", result.errorMessage());
            default -> BookingOperationOutcome.internalError();
        };
    }

    private BookingOperationOutcome replayBookingOutcome(IdempotencyClaim claim) {
        if (claim.record() == null || claim.record().resourceId() == null) {
            return BookingOperationOutcome.replayMissing();
        }
        String bookingId = claim.record().resourceId().toString();
        return bookingQueryPort
                .getBooking(bookingId)
                .map(booking ->
                        BookingOperationOutcome.success(bookingResponseCompositionService.bookingResponse(booking)))
                .orElseGet(BookingOperationOutcome::replayMissing);
    }

    private BookingOperationOutcome replayMarkDoneOutcome(IdempotencyClaim claim) {
        if (claim.record() == null || claim.record().resourceId() == null) {
            return BookingOperationOutcome.replayMissing();
        }
        String bookingId = claim.record().resourceId().toString();
        return bookingQueryPort
                .getBooking(bookingId)
                .map(booking -> BookingOperationOutcome.success(bookingResponseCompositionService.markDoneResponse(
                        booking,
                        bookingQueryPort.getTaskerMarkedDoneAt(bookingId).orElse(null))))
                .orElseGet(BookingOperationOutcome::replayMissing);
    }

    private BookingOperationOutcome replayScheduleEventOutcome(IdempotencyClaim claim, boolean created) {
        if (claim.record() == null || claim.record().resourceId() == null) {
            return BookingOperationOutcome.replayMissing();
        }
        Map<String, Object> body = bookingQueryPort
                .getScheduleEvent(claim.record().resourceId().toString())
                .map(bookingResponseCompositionService::scheduleEventResponse)
                .orElse(Map.of("id", claim.record().resourceId().toString()));
        return created ? BookingOperationOutcome.created(body) : BookingOperationOutcome.success(body);
    }
}
