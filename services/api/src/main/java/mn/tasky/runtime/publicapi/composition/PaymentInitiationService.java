package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.payment.application.PaymentService;
import mn.tasky.payment.dto.PaymentIntent;
import org.springframework.stereotype.Component;

@Component
public class PaymentInitiationService {

    private final BookingCommandPort bookingCommandPort;
    private final BookingQueryPort bookingQueryPort;
    private final PaymentService paymentService;
    private final FeatureToggleService featureToggleService;
    private final IdempotencyService idempotencyService;

    public PaymentInitiationService(
            BookingCommandPort bookingCommandPort,
            BookingQueryPort bookingQueryPort,
            PaymentService paymentService,
            FeatureToggleService featureToggleService,
            IdempotencyService idempotencyService) {
        this.bookingCommandPort = bookingCommandPort;
        this.bookingQueryPort = bookingQueryPort;
        this.paymentService = paymentService;
        this.featureToggleService = featureToggleService;
        this.idempotencyService = idempotencyService;
    }

    public PaymentInitiationOutcome initiatePayment(
            String customerId, String bookingId, boolean liabilityDisclaimerAccepted, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return PaymentInitiationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return PaymentInitiationOutcome.replayMissing();
            }
            return paymentService
                    .findPaymentIntent(claim.record().resourceId().toString())
                    .map(intent -> PaymentInitiationOutcome.success(paymentIntentResponse(intent)))
                    .orElseGet(PaymentInitiationOutcome::replayMissing);
        }

        try {
            if (!featureToggleService.isEnabled("escrow_enabled")) {
                idempotencyService.abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
                return PaymentInitiationOutcome.featureDeferred(
                        "Payments are deferred during the liquidity-first MVP phase.");
            }
            if (!liabilityDisclaimerAccepted) {
                idempotencyService.abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
                return PaymentInitiationOutcome.failure(
                        PaymentInitiationOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted to initiate payment.");
            }

            return bookingQueryPort
                    .getBooking(bookingId)
                    .filter(booking -> booking.customerId().equals(customerId))
                    .map(booking -> {
                        if (!"ASSIGNED".equals(booking.status())) {
                            idempotencyService.abandon(
                                    customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
                            return PaymentInitiationOutcome.failure(
                                    PaymentInitiationOutcome.Status.INVALID_STATUS,
                                    "INVALID_STATUS",
                                    "Booking is not in ASSIGNED status.");
                        }

                        bookingCommandPort.recordDisclaimerAcceptance(bookingId);
                        PaymentIntent intent = paymentService.initiatePayment(bookingId);
                        idempotencyService.completeWithResource(
                                customerId,
                                IdempotencyOperations.INITIATE_PAYMENT,
                                idempotencyKey,
                                "PAYMENT_INTENT",
                                intent.paymentId());
                        return PaymentInitiationOutcome.success(paymentIntentResponse(intent));
                    })
                    .orElseGet(() -> {
                        idempotencyService.abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
                        return PaymentInitiationOutcome.failure(
                                PaymentInitiationOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found.");
                    });
        } catch (RuntimeException exception) {
            idempotencyService.abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
            throw exception;
        }
    }

    private Map<String, Object> paymentIntentResponse(PaymentIntent intent) {
        return Map.of("payment_url", intent.paymentUrl(), "qr_code", intent.qrCode());
    }
}
