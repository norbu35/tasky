package mn.tasky.booking.api;

import static mn.tasky.booking.api.BookingResponseMapper.basic;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.ConfirmBookingIntentRequest;
import mn.tasky.booking.dto.CreateBookingIntentRequest;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
public class BookingIntentController {

    private final BookingIntentService bookingIntentService;
    private final BookingService bookingService;
    private final IdempotencyService idempotencyService;

    public BookingIntentController(
            BookingIntentService bookingIntentService,
            BookingService bookingService,
            IdempotencyService idempotencyService) {
        this.bookingIntentService = bookingIntentService;
        this.bookingService = bookingService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping("/tasks/{id}/booking-intents")
    public ResponseEntity<?> createBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody CreateBookingIntentRequest body,
            HttpServletRequest request) {
        BookingIntentService.CreateResult result = bookingIntentService.createIntent(
                principal.userId(), id, body.source(), body.taskerId(), body.originalBookingId(), body.offerId());
        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result.intent()));
        }

        return switch (result.errorCode()) {
            case BookingIntentService.CreateResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(error("NOT_FOUND", result.errorMessage(), request));
            case BookingIntentService.CreateResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(error("FORBIDDEN", result.errorMessage(), request));
            case BookingIntentService.CreateResult.NOT_COMPLETED -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(error("NOT_COMPLETED", result.errorMessage(), request));
            case BookingIntentService.CreateResult.TASK_NOT_OPEN -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(error("TASK_NOT_OPEN", result.errorMessage(), request));
            case BookingIntentService.CreateResult.DEFERRED -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(error("NOT_IMPLEMENTED", result.errorMessage(), request));
            case BookingIntentService.CreateResult.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(error("CONFLICT", result.errorMessage(), request));
            case BookingIntentService.CreateResult.INVALID_SOURCE,
                    BookingIntentService.CreateResult.INVALID_REQUEST -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(error("BAD_REQUEST", result.errorMessage(), request));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        };
    }

    @GetMapping("/booking-intents/{id}")
    public ResponseEntity<?> getBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        return bookingIntentService
                .getIntent(id)
                .filter(intent -> principal.userId().equals(intent.customerId()))
                .<ResponseEntity<?>>map(intent -> ResponseEntity.ok(toResponse(intent)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", "Booking intent not found.", request)));
    }

    @PostMapping("/booking-intents/{id}/confirm")
    public ResponseEntity<?> confirmBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ConfirmBookingIntentRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        IdempotencyClaim claim = idempotencyService.claim(
                principal.userId(), IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String bookingId = claim.record().resourceId().toString();
            return bookingService
                    .getBooking(bookingId)
                    .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(basic(booking)))
                    .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            BookingIntentService.ConfirmResult result = bookingIntentService.confirmIntent(
                    principal.userId(), id, Boolean.TRUE.equals(body.liabilityDisclaimerAccepted()));
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        principal.userId(),
                        IdempotencyOperations.CONFIRM_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return ResponseEntity.ok(basic(result.booking()));
            }

            idempotencyService.abandon(
                    principal.userId(), IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentService.ConfirmResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", result.errorMessage(), request));
                case BookingIntentService.ConfirmResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(error("FORBIDDEN", result.errorMessage(), request));
                case BookingIntentService.ConfirmResult.DISCLAIMER_REQUIRED -> ResponseEntity.status(
                                HttpStatus.BAD_REQUEST)
                        .body(error("DISCLAIMER_REQUIRED", result.errorMessage(), request));
                case BookingIntentService.ConfirmResult.TASK_NOT_OPEN,
                        BookingIntentService.ConfirmResult.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(error(result.errorCode(), result.errorMessage(), request));
                case BookingIntentService.ConfirmResult.DEFERRED -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_IMPLEMENTED", result.errorMessage(), request));
                default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .build();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(
                    principal.userId(), IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            throw exception;
        }
    }

    private static Map<String, Object> toResponse(BookingIntentState intent) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", intent.id());
        body.put("task_id", intent.taskId());
        body.put("tasker_id", intent.taskerId());
        body.put("customer_id", intent.customerId());
        body.put("source", intent.source());
        body.put("status", intent.status());
        body.put("original_booking_id", intent.originalBookingId());
        body.put("offer_id", intent.offerId());
        body.put("expires_at", intent.expiresAt() != null ? intent.expiresAt().toString() : null);
        body.put("confirmed_booking_id", intent.confirmedBookingId());
        body.put(
                "confirmed_at",
                intent.confirmedAt() != null ? intent.confirmedAt().toString() : null);
        body.put("created_at", intent.createdAt().toString());
        body.put("updated_at", intent.updatedAt().toString());
        return body;
    }

    private static Map<String, Object> error(String code, String message, HttpServletRequest request) {
        return Map.of("code", code, "message", message, "trace_id", resolveTraceId(request));
    }
}
