package mn.tasky.payment.provider;

import mn.tasky.automation.provider.ProviderHealth;
import mn.tasky.payment.dto.PaymentIntent;

/**
 * Contract for payment gateway providers (QPay, Stripe, etc.).
 * Wraps intent creation and webhook signature verification behind a
 * provider-agnostic interface.
 *
 * Domain orchestration (booking transitions, task assignment, outbox events)
 * remains in {@code PaymentService} — the provider only handles gateway-specific
 * concerns.
 */
public interface PaymentProvider {

    /**
     * Creates a payment intent for a booking.
     *
     * @param bookingId The booking to create a payment intent for.
     * @return Payment intent with checkout URL and QR code data.
     */
    PaymentIntent createIntent(String bookingId);

    /**
     * Validates a payment callback signature from the gateway.
     *
     * @param paymentId   Payment identifier.
     * @param status      Payment status from the gateway.
     * @param timestamp   Callback timestamp (epoch seconds).
     * @param signature   Gateway-provided HMAC signature.
     * @return true if the signature is valid and the callback is recent.
     */
    boolean isValidSignature(String paymentId, String status, long timestamp, String signature);

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "qpay", "stripe").
     */
    String providerName();
}
