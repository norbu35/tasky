package mn.tasky.payment.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.featureDeferred;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.payment.dto.InitiatePaymentRequest;
import mn.tasky.payment.dto.QpayCallbackRequest;
import mn.tasky.payment.publicapi.PaymentCommandPort;
import mn.tasky.runtime.publicapi.composition.PaymentInitiationOutcome;
import mn.tasky.runtime.publicapi.composition.PaymentInitiationService;
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

@RestController
@RequestMapping("/api/v1/payments")
@Validated
public class PaymentController {

    private final PaymentCommandPort paymentCommandPort;
    private final PaymentInitiationService paymentInitiationService;
    private final FeatureToggleService featureToggleService;

    public PaymentController(
            PaymentCommandPort paymentCommandPort,
            PaymentInitiationService paymentInitiationService,
            FeatureToggleService featureToggleService) {
        this.paymentCommandPort = paymentCommandPort;
        this.paymentInitiationService = paymentInitiationService;
        this.featureToggleService = featureToggleService;
    }

    @PostMapping("/bookings/{id}/initiate")
    public ResponseEntity<?> initiatePayment(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody InitiatePaymentRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        PaymentInitiationOutcome outcome = paymentInitiationService.initiatePayment(
                principal.userId(), id, Boolean.TRUE.equals(body.liabilityDisclaimerAccepted()), idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case FEATURE_DEFERRED -> featureDeferred(request, outcome.errorMessage());
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case DISCLAIMER_REQUIRED -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INVALID_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
        };
    }

    @PostMapping("/qpay/callback")
    public ResponseEntity<?> qpayCallback(@Valid @RequestBody QpayCallbackRequest body, HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return featureDeferred(request, "Payments are deferred during the liquidity-first MVP phase.");
        }
        boolean success =
                paymentCommandPort.processCallback(body.paymentId(), body.status(), body.timestamp(), body.signature());

        if (success) {
            return ResponseEntity.ok(Map.of("status", "ok"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody("INVALID_CALLBACK", "Payment could not be processed.", request));
    }
}
