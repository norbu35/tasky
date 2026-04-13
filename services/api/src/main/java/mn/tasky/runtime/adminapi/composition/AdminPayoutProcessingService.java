package mn.tasky.runtime.adminapi.composition;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminPayoutProcessingService {

    private final WalletCommandPort walletCommandPort;
    private final WalletQueryPort walletQueryPort;
    private final FeatureToggleService featureToggleService;
    private final IdempotencyService idempotencyService;

    public AdminPayoutProcessingService(
            WalletCommandPort walletCommandPort,
            WalletQueryPort walletQueryPort,
            FeatureToggleService featureToggleService,
            IdempotencyService idempotencyService) {
        this.walletCommandPort = walletCommandPort;
        this.walletQueryPort = walletQueryPort;
        this.featureToggleService = featureToggleService;
        this.idempotencyService = idempotencyService;
    }

    public AdminPayoutProcessingOutcome processPayout(
            String adminId, String payoutId, String reason, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return AdminPayoutProcessingOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return AdminPayoutProcessingOutcome.replayMissing();
            }
            return walletQueryPort
                    .getPayout(claim.record().resourceId().toString())
                    .map(payout -> AdminPayoutProcessingOutcome.success(Map.of("status", payout.status())))
                    .orElseGet(AdminPayoutProcessingOutcome::replayMissing);
        }

        if (!featureToggleService.isEnabled("escrow_enabled")) {
            idempotencyService.abandon(adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey);
            return AdminPayoutProcessingOutcome.featureDeferred(
                    "Payout operations are deferred during the liquidity-first MVP phase.");
        }

        DayOfWeek today = LocalDate.now(ZoneId.of("Asia/Ulaanbaatar")).getDayOfWeek();
        if (today != DayOfWeek.TUESDAY && today != DayOfWeek.FRIDAY) {
            idempotencyService.abandon(adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey);
            return AdminPayoutProcessingOutcome.invalidWeekday(
                    "Payouts can only be processed on Tuesday and Friday. Today is " + today);
        }

        try {
            walletCommandPort.processPayout(adminId, payoutId, reason);
            idempotencyService.completeWithResource(
                    adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey, "PAYOUT", payoutId);
            return AdminPayoutProcessingOutcome.success(Map.of("status", "PROCESSED"));
        } catch (IllegalArgumentException exception) {
            idempotencyService.abandon(adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey);
            return AdminPayoutProcessingOutcome.badRequest("Payout processing failed.");
        } catch (RuntimeException exception) {
            idempotencyService.abandon(adminId, IdempotencyOperations.PROCESS_PAYOUT, idempotencyKey);
            throw exception;
        }
    }
}
