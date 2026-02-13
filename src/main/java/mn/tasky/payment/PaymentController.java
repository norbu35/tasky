package mn.tasky.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;
import mn.tasky.booking.BookingService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@Validated
public class PaymentController {

    private final BookingService bookingService;

    public PaymentController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings/{id}/initiate")
    public ResponseEntity<?> initiatePayment(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody InitiatePaymentBody body,
        HttpServletRequest request
    ) {
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

                // Placeholder for actual provider integration (TASK-031)
                return ResponseEntity.ok(Map.of(
                    "payment_url", "https://qpay.mn/pay/" + UUID.randomUUID(),
                    "qr_code", "BASE64_QR_CODE_PLACEHOLDER"
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

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record InitiatePaymentBody(
        @JsonProperty("liability_disclaimer_accepted")
        @NotNull
        @AssertTrue(message = "Liability disclaimer must be accepted to initiate payment.")
        Boolean liabilityDisclaimerAccepted
    ) {
    }
}
