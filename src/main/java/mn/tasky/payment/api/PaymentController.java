package mn.tasky.payment.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.payment.application.PaymentService;
import mn.tasky.payment.dto.InitiatePaymentRequest;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.dto.QpayCallbackRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

@RestController
@RequestMapping("/api/v1/payments")
@Validated
public class PaymentController {

    private final BookingService bookingService;
    private final PaymentService paymentService;
    private final boolean monetizationEnabled;
    private final IdempotencyService idempotencyService;

    public PaymentController(
        BookingService bookingService,
        PaymentService paymentService,
        IdempotencyService idempotencyService,
        @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled
    ) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
        this.idempotencyService = idempotencyService;
        this.monetizationEnabled = monetizationEnabled;
    }

    @PostMapping("/bookings/{id}/initiate")
    public ResponseEntity<?> initiatePayment(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody InitiatePaymentRequest body,
        @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest request
    ) {
        IdempotencyClaim claim = idempotencyService.claim(
            principal.userId(),
            IdempotencyOperations.INITIATE_PAYMENT,
            idempotencyKey
        );
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            return paymentService.findPaymentIntent(claim.record()
                    .resourceId()
                    .toString())
                .<ResponseEntity<?>>map(intent -> ResponseEntity.ok(
                    Map.of(
                        "payment_url",
                        intent.paymentUrl(),
                        "qr_code",
                        intent.qrCode()
                    )
                ))
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            if (!monetizationEnabled) {
                idempotencyService.abandon(principal.userId(),
                    IdempotencyOperations.INITIATE_PAYMENT,
                    idempotencyKey);
                return deferredResponse(request);
            }
            if (!Boolean.TRUE.equals(body.liabilityDisclaimerAccepted())) {
                idempotencyService.abandon(principal.userId(),
                    IdempotencyOperations.INITIATE_PAYMENT,
                    idempotencyKey);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                        Map.of(
                            "code",
                            "DISCLAIMER_REQUIRED",
                            "message",
                            "Liability disclaimer must be accepted to initiate " +
                                "payment.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
            }

            return bookingService.getBooking(id)
                .filter(b -> b.customerId()
                    .equals(principal.userId()))
                .<ResponseEntity<?>>map(booking -> {
                    if (!"ASSIGNED".equals(booking.status())) {
                        idempotencyService.abandon(principal.userId(),
                            IdempotencyOperations.INITIATE_PAYMENT,
                            idempotencyKey);
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(
                                Map.of(
                                    "code",
                                    "INVALID_STATUS",
                                    "message",
                                    "Booking is not in ASSIGNED status.",
                                    "trace_id",
                                    resolveTraceId(request)
                                )
                            );
                    }

                    bookingService.recordDisclaimerAcceptance(id);
                    PaymentIntent intent = paymentService.initiatePayment(id);
                    idempotencyService.completeWithResource(
                        principal.userId(),
                        IdempotencyOperations.INITIATE_PAYMENT,
                        idempotencyKey,
                        "PAYMENT_INTENT",
                        intent.paymentId()
                    );

                    return ResponseEntity.ok(Map.of(
                        "payment_url",
                        intent.paymentUrl(),
                        "qr_code",
                        intent.qrCode()
                    ));
                })
                .orElseGet(() -> {
                    idempotencyService.abandon(principal.userId(),
                        IdempotencyOperations.INITIATE_PAYMENT,
                        idempotencyKey);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(
                            Map.of(
                                "code",
                                "NOT_FOUND",
                                "message",
                                "Booking not found.",
                                "trace_id",
                                resolveTraceId(request)
                            )
                        );
                });
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.INITIATE_PAYMENT,
                idempotencyKey);
            throw exception;
        }
    }

    private ResponseEntity<Map<String, Object>> deferredResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(
                Map.of(
                    "code",
                    "FEATURE_DEFERRED",
                    "message",
                    "Payments are deferred during the liquidity-first MVP phase.",
                    "trace_id",
                    resolveTraceId(request)
                )
            );
    }

    @PostMapping("/qpay/callback")
    public ResponseEntity<?> qpayCallback(
        @Valid @RequestBody QpayCallbackRequest body,
        HttpServletRequest request
    ) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
        boolean success = paymentService.processCallback(
            body.paymentId(),
            body.status(),
            body.timestamp(),
            body.signature()
        );

        if (success) {
            return ResponseEntity.ok(Map.of("status",
                "ok"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(
                Map.of(
                    "code",
                    "INVALID_CALLBACK",
                    "message",
                    "Payment could not be processed.",
                    "trace_id",
                    resolveTraceId(request)
                )
            );
    }

}
