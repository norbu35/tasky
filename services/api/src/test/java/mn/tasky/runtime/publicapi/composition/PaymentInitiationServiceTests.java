package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.publicapi.PaymentCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentInitiationServiceTests {

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private PaymentCommandPort paymentCommandPort;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private IdempotencyService idempotencyService;

    private PaymentInitiationService service;

    private final String customerId = "customer-001";
    private final String bookingId = "booking-001";
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();

    private BookingState assignedBooking() {
        return new BookingState(
                bookingId,
                "task-001",
                "tasker-001",
                customerId,
                10000,
                "ASSIGNED",
                null,
                true,
                Instant.now(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
    }

    @BeforeEach
    void setUp() {
        service = new PaymentInitiationService(
                bookingCommandPort, bookingQueryPort, paymentCommandPort, featureToggleService, idempotencyService);
    }

    @Nested
    @DisplayName("initiatePayment")
    class InitiatePayment {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.IN_PROGRESS);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record replays from payment port")
        void completedReplay() {
            UUID resourceId = UUID.randomUUID();
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "PAYMENT_INTENT",
                    resourceId,
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            PaymentIntent intent = new PaymentIntent(resourceId.toString(), "https://pay.url", "qr-code");
            when(paymentCommandPort.findPaymentIntent(resourceId.toString())).thenReturn(Optional.of(intent));

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("payment_url", "https://pay.url");
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with escrow disabled returns FEATURE_DEFERRED")
        void escrowDisabled() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(false);

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.FEATURE_DEFERRED);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with disclaimer not accepted returns DISCLAIMER_REQUIRED")
        void disclaimerNotAccepted() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, false, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.DISCLAIMER_REQUIRED);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with booking not found returns NOT_FOUND")
        void bookingNotFound() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.empty());

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NEW claim with booking owned by another user returns NOT_FOUND")
        void bookingOwnedByOther() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);

            BookingState otherCustomerBooking = new BookingState(
                    bookingId,
                    "task-001",
                    "tasker-001",
                    "other-customer",
                    10000,
                    "ASSIGNED",
                    null,
                    true,
                    Instant.now(),
                    "DIRECT",
                    false,
                    Instant.now(),
                    0,
                    null,
                    Instant.now(),
                    Instant.now());
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(otherCustomerBooking));

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("NEW claim with non-ASSIGNED booking returns INVALID_STATUS")
        void bookingNotAssigned() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);

            BookingState completedBooking = new BookingState(
                    bookingId,
                    "task-001",
                    "tasker-001",
                    customerId,
                    10000,
                    "COMPLETED",
                    null,
                    true,
                    Instant.now(),
                    "DIRECT",
                    false,
                    Instant.now(),
                    0,
                    null,
                    Instant.now(),
                    Instant.now());
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(completedBooking));

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.INVALID_STATUS);
        }

        @Test
        @DisplayName("NEW claim with happy path returns SUCCESS with payment URL")
        void happyPath() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(assignedBooking()));

            PaymentIntent intent = new PaymentIntent("pay-001", "https://pay.url", "qr-data");
            when(paymentCommandPort.initiatePayment(bookingId)).thenReturn(intent);

            PaymentInitiationOutcome outcome = service.initiatePayment(customerId, bookingId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(PaymentInitiationOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("payment_url", "https://pay.url");
            assertThat(outcome.body()).containsEntry("qr_code", "qr-data");
            verify(bookingCommandPort).recordDisclaimerAcceptance(bookingId);
            verify(idempotencyService)
                    .completeWithResource(
                            customerId,
                            IdempotencyOperations.INITIATE_PAYMENT,
                            idempotencyKey,
                            "PAYMENT_INTENT",
                            "pay-001");
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(assignedBooking()));
            when(paymentCommandPort.initiatePayment(bookingId)).thenThrow(new RuntimeException("gateway down"));

            assertThatThrownBy(() -> service.initiatePayment(customerId, bookingId, true, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.INITIATE_PAYMENT, idempotencyKey);
        }
    }
}
