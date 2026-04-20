package mn.tasky.payment.publicapi;

import java.util.Optional;
import mn.tasky.payment.dto.PaymentIntent;

public interface PaymentCommandPort {
    PaymentIntent initiatePayment(String bookingId);

    Optional<PaymentIntent> findPaymentIntent(String paymentId);

    boolean processCallback(String paymentId, String status, long timestamp, String signature);
}
