package mn.tasky.booking.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.booking.dto.CreateBookingIntentRequest;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.publicapi.composition.BookingIntentCompositionService;
import mn.tasky.runtime.publicapi.composition.BookingIntentConfirmationOutcome;
import mn.tasky.runtime.publicapi.composition.BookingIntentConfirmationService;
import mn.tasky.runtime.publicapi.composition.BookingIntentCreationOutcome;
import mn.tasky.runtime.publicapi.composition.BookingIntentCreationService;
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

    private final BookingIntentCommandPort bookingIntentCommandPort;
    private final BookingIntentCompositionService bookingIntentCompositionService;
    private final BookingIntentCreationService bookingIntentCreationService;
    private final BookingIntentConfirmationService bookingIntentConfirmationService;

    public BookingIntentController(
            BookingIntentCommandPort bookingIntentCommandPort,
            BookingIntentCompositionService bookingIntentCompositionService,
            BookingIntentCreationService bookingIntentCreationService,
            BookingIntentConfirmationService bookingIntentConfirmationService) {
        this.bookingIntentCommandPort = bookingIntentCommandPort;
        this.bookingIntentCompositionService = bookingIntentCompositionService;
        this.bookingIntentCreationService = bookingIntentCreationService;
        this.bookingIntentConfirmationService = bookingIntentConfirmationService;
    }

    @PostMapping("/tasks/{id}/booking-intents")
    public ResponseEntity<?> createBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody CreateBookingIntentRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        BookingIntentCreationOutcome outcome =
                bookingIntentCreationService.createIntent(principal.userId(), id, body, idempotencyKey);
        return bookingIntentCreationResponse(outcome, request);
    }

    @GetMapping("/booking-intents/{id}")
    public ResponseEntity<?> getBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        return bookingIntentCommandPort
                .getIntent(id)
                .filter(intent -> principal.userId().equals(intent.customerId())
                        || principal.userId().equals(intent.taskerId()))
                .<ResponseEntity<?>>map(
                        intent -> ResponseEntity.ok(bookingIntentCompositionService.bookingIntentResponse(intent)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(errorBody("NOT_FOUND", "Booking intent not found.", request)));
    }

    @PostMapping("/booking-intents/{id}/confirm")
    public ResponseEntity<?> confirmBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        BookingIntentConfirmationOutcome outcome =
                bookingIntentConfirmationService.confirmIntent(principal.userId(), id, idempotencyKey);
        return bookingIntentResponse(outcome, request);
    }

    @PostMapping("/booking-intents/{id}/decline")
    public ResponseEntity<?> declineBookingIntent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        BookingIntentConfirmationOutcome outcome =
                bookingIntentConfirmationService.declineIntent(principal.userId(), id, idempotencyKey);
        return bookingIntentResponse(outcome, request);
    }

    private ResponseEntity<?> bookingIntentResponse(
            BookingIntentConfirmationOutcome outcome, HttpServletRequest request) {
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case DISCLAIMER_REQUIRED -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case TASK_NOT_OPEN, CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case DEFERRED -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        };
    }

    private ResponseEntity<?> bookingIntentCreationResponse(
            BookingIntentCreationOutcome outcome, HttpServletRequest request) {
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.status(HttpStatus.CREATED).body(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case NOT_COMPLETED, TASK_NOT_OPEN, CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INVALID_REQUEST, INVALID_SOURCE -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case DEFERRED -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        };
    }
}
