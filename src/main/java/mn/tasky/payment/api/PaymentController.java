package mn.tasky.payment.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.payment.application.PaymentService;
import mn.tasky.payment.dto.InitiatePaymentRequest;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.dto.QpayCallbackRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Validated
public class PaymentController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    public PaymentController(BookingService bookingService, PaymentService paymentService) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }

    @PostMapping("/bookings/{id}/initiate")
    public ResponseEntity<?> initiatePayment(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody InitiatePaymentRequest body,
        HttpServletRequest request
    ) {
        if (!Boolean.TRUE.equals(body.liabilityDisclaimerAccepted())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "DISCLAIMER_REQUIRED",
                    "message", "Liability disclaimer must be accepted to initiate payment.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        return bookingService.getBooking(id)
            .filter(b -> b.customerId().equals(principal.userId()))
            .<ResponseEntity<?>>map(booking -> {
                if (!"PENDING_PAYMENT".equals(booking.status())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(
                        Map.of(
                            "code", "INVALID_STATUS",
                            "message", "Booking is not in PENDING_PAYMENT status.",
                            "trace_id", resolveTraceId(request)
                        )
                    );
                }

                bookingService.recordDisclaimerAcceptance(id);
                PaymentIntent intent = paymentService.initiatePayment(id);

                return ResponseEntity.ok(Map.of(
                    "payment_url", intent.paymentUrl(),
                    "qr_code", intent.qrCode()
                ));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    @PostMapping("/qpay/callback")
    public ResponseEntity<?> qpayCallback(
        @Valid @RequestBody QpayCallbackRequest body,
        HttpServletRequest request
    ) {
        boolean success = paymentService.processCallback(
            body.paymentId(),
            body.status(),
            body.signature()
        );

        if (success) {
            return ResponseEntity.ok(Map.of("status", "ok"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of(
                "code", "INVALID_CALLBACK",
                "message", "Payment could not be processed.",
                "trace_id", resolveTraceId(request)
            )
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

}
