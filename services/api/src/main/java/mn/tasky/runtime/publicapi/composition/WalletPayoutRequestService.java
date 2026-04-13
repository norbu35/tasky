package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.stereotype.Component;

@Component
public class WalletPayoutRequestService {

    private final WalletCommandPort walletCommandPort;
    private final WalletQueryPort walletQueryPort;
    private final FeatureToggleService featureToggleService;
    private final IdempotencyService idempotencyService;

    public WalletPayoutRequestService(
            WalletCommandPort walletCommandPort,
            WalletQueryPort walletQueryPort,
            FeatureToggleService featureToggleService,
            IdempotencyService idempotencyService) {
        this.walletCommandPort = walletCommandPort;
        this.walletQueryPort = walletQueryPort;
        this.featureToggleService = featureToggleService;
        this.idempotencyService = idempotencyService;
    }

    public WalletPayoutRequestOutcome requestPayout(String userId, int amount, String idempotencyKey) {
        IdempotencyClaim claim = idempotencyService.claim(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return WalletPayoutRequestOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return WalletPayoutRequestOutcome.replayMissing();
            }
            return walletQueryPort
                    .getPayout(claim.record().resourceId().toString())
                    .map(payout ->
                            WalletPayoutRequestOutcome.success(Map.of("id", payout.id(), "status", payout.status())))
                    .orElseGet(WalletPayoutRequestOutcome::replayMissing);
        }

        try {
            if (!featureToggleService.isEnabled("escrow_enabled")) {
                idempotencyService.abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
                return WalletPayoutRequestOutcome.featureDeferred(
                        "Wallet and payouts are deferred during the liquidity-first MVP phase.");
            }
            String payoutId = walletCommandPort.requestPayout(userId, amount);
            idempotencyService.completeWithResource(
                    userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey, "PAYOUT", payoutId);
            return WalletPayoutRequestOutcome.success(Map.of("id", payoutId, "status", "PENDING"));
        } catch (IllegalArgumentException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
            String message = exception.getMessage();
            if ("Insufficient balance for payout".equals(message)) {
                message = "Insufficient balance";
            }
            return WalletPayoutRequestOutcome.badRequest(message);
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.REQUEST_PAYOUT, idempotencyKey);
            throw exception;
        }
    }
}
