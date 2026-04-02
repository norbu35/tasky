package mn.tasky.payment.dto;

public record PaymentIntent(String paymentId, String paymentUrl, String qrCode) {}
