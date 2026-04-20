package mn.tasky.payment.application.command;

import java.util.Optional;
import mn.tasky.payment.application.PaymentService;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.publicapi.PaymentCommandPort;
import org.springframework.stereotype.Service;

@Service
public class PaymentCommandHandler implements PaymentCommandPort {

    private final PaymentService paymentService;

    public PaymentCommandHandler(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Override
    public PaymentIntent initiatePayment(String bookingId) {
        return paymentService.initiatePayment(bookingId);
    }

    @Override
    public Optional<PaymentIntent> findPaymentIntent(String paymentId) {
        return paymentService.findPaymentIntent(paymentId);
    }

    @Override
    public boolean processCallback(String paymentId, String status, long timestamp, String signature) {
        return paymentService.processCallback(paymentId, status, timestamp, signature);
    }
}
