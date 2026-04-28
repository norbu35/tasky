package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WalletPayoutRequestServiceTests {

    @Mock
    private WalletCommandPort walletCommandPort;

    @Mock
    private WalletQueryPort walletQueryPort;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private IdempotencyService idempotencyService;

    private WalletPayoutRequestService service;

    private final String userId = "tasker-001";
    private final int amount = 5000;
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new WalletPayoutRequestService(
                walletCommandPort, walletQueryPort, featureToggleService, idempotencyService);
    }

    @Nested
    @DisplayName("requestPayout")
    class RequestPayout {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(walletCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record replays from query port")
        void completedReplay() {
            UUID resourceId = UUID.randomUUID();
            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "PAYOUT",
                    resourceId,
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            PayoutRequest payout = new PayoutRequest(resourceId.toString(), userId, amount, "PROCESSED", Instant.now());
            when(walletQueryPort.getPayout(resourceId.toString())).thenReturn(Optional.of(payout));

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", resourceId.toString());
            assertThat(outcome.body()).containsEntry("status", "PROCESSED");
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with escrow disabled returns FEATURE_DEFERRED")
        void escrowDisabled() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(false);

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.FEATURE_DEFERRED);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with happy path returns SUCCESS")
        void happyPath() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(walletCommandPort.requestPayout(userId, amount)).thenReturn("payout-001");

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", "payout-001");
            assertThat(outcome.body()).containsEntry("status", "PENDING");
            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey, "PAYOUT", "payout-001");
        }

        @Test
        @DisplayName("NEW claim with insufficient balance returns BAD_REQUEST")
        void insufficientBalance() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(walletCommandPort.requestPayout(userId, amount))
                    .thenThrow(new IllegalArgumentException("Insufficient balance for payout"));

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.BAD_REQUEST);
            assertThat(outcome.errorMessage()).isEqualTo("Insufficient balance");
            verify(idempotencyService).abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with generic IllegalArgumentException returns BAD_REQUEST with original message")
        void genericIllegalArgument() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(walletCommandPort.requestPayout(userId, amount))
                    .thenThrow(new IllegalArgumentException("Amount must be positive"));

            WalletPayoutRequestOutcome outcome = service.requestPayout(userId, amount, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(WalletPayoutRequestOutcome.Status.BAD_REQUEST);
            assertThat(outcome.errorMessage()).isEqualTo("Amount must be positive");
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            when(walletCommandPort.requestPayout(userId, amount)).thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> service.requestPayout(userId, amount, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
        }
    }
}
