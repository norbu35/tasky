package mn.tasky.booking.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.booking.dto.RescheduleRequest;
import mn.tasky.booking.dto.RescheduleRespondRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.publicapi.composition.BookingOperationOutcome;
import mn.tasky.runtime.publicapi.composition.BookingPublicCompositionService;
import mn.tasky.runtime.publicapi.composition.BookingPublicOperationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@Validated
public class BookingController {

    private final BookingPublicCompositionService bookingPublicCompositionService;
    private final BookingPublicOperationService bookingPublicOperationService;

    public BookingController(
            BookingPublicCompositionService bookingPublicCompositionService,
            BookingPublicOperationService bookingPublicOperationService) {
        this.bookingPublicCompositionService = bookingPublicCompositionService;
        this.bookingPublicOperationService = bookingPublicOperationService;
    }

    @GetMapping
    public ResponseEntity<?> listBookings(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") int limit) {
        var page = bookingPublicCompositionService.listBookings(principal.userId(), role, status, cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        return bookingPublicCompositionService
                .getVisibleBooking(id, principal.userId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(errorBody("NOT_FOUND", "Booking not found.", request)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.cancelBooking(principal.userId(), id, idempotencyKey), request);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.completeBooking(principal.userId(), id, idempotencyKey), request);
    }

    @PostMapping("/{id}/mark-done")
    public ResponseEntity<?> markBookingDone(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.markBookingDone(principal.userId(), id, idempotencyKey), request);
    }

    @PostMapping("/{id}/no-show/flag")
    public ResponseEntity<?> flagNoShow(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.flagNoShow(principal.userId(), id, idempotencyKey), request);
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<?> requestReschedule(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody RescheduleRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.requestReschedule(principal.userId(), id, body, idempotencyKey), request);
    }

    @PostMapping("/{id}/reschedule/{eventId}/respond")
    public ResponseEntity<?> respondToReschedule(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @PathVariable String eventId,
            @Valid @RequestBody RescheduleRespondRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        return toOperationResponse(
                bookingPublicOperationService.respondToReschedule(
                        principal.userId(), id, eventId, body, idempotencyKey),
                request);
    }

    @PostMapping("/{id}/rebook")
    public ResponseEntity<?> rebook(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        return toOperationResponse(bookingPublicOperationService.rebook(principal.userId(), id), request);
    }

    @GetMapping("/{id}/schedule-events")
    public ResponseEntity<?> getScheduleEvents(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id) {
        return ResponseEntity.ok(bookingPublicCompositionService.scheduleEventsResponse(id, principal.userId()));
    }

    private ResponseEntity<?> toOperationResponse(BookingOperationOutcome outcome, HttpServletRequest request) {
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case CREATED -> ResponseEntity.status(HttpStatus.CREATED).body(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INVALID_STATUS,
                    OPEN_DISPUTE,
                    TOO_EARLY,
                    NO_SCHEDULE,
                    ACTIVITY_DETECTED,
                    RESCHEDULE_SUPERSEDES,
                    NOT_COMPLETED -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        };
    }
}
