package mn.tasky.wallet.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.featureDeferred;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.publicapi.composition.WalletPayoutRequestOutcome;
import mn.tasky.runtime.publicapi.composition.WalletPayoutRequestService;
import mn.tasky.runtime.publicapi.composition.WalletQueryCompositionService;
import mn.tasky.wallet.dto.CreatePayoutRequest;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallet")
@Validated
public class WalletController {

    private final WalletQueryPort walletQueryPort;
    private final WalletQueryCompositionService walletQueryCompositionService;
    private final WalletPayoutRequestService walletPayoutRequestService;
    private final FeatureToggleService featureToggleService;

    public WalletController(
            WalletQueryPort walletQueryPort,
            WalletQueryCompositionService walletQueryCompositionService,
            WalletPayoutRequestService walletPayoutRequestService,
            FeatureToggleService featureToggleService) {
        this.walletQueryPort = walletQueryPort;
        this.walletQueryCompositionService = walletQueryCompositionService;
        this.walletPayoutRequestService = walletPayoutRequestService;
        this.featureToggleService = featureToggleService;
    }

    @GetMapping
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return featureDeferred(request, "Wallet and payouts are deferred during the liquidity-first MVP phase.");
        }
        WalletBalance balance = walletQueryPort.getBalance(principal.userId());
        return ResponseEntity.ok(walletQueryCompositionService.balanceResponse(balance));
    }

    @PostMapping("/payouts")
    public ResponseEntity<?> requestPayout(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CreatePayoutRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        WalletPayoutRequestOutcome outcome =
                walletPayoutRequestService.requestPayout(principal.userId(), body.amount(), idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case FEATURE_DEFERRED -> featureDeferred(request, outcome.errorMessage());
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case BAD_REQUEST -> ResponseEntity.badRequest()
                    .body(errorBody("BAD_REQUEST", outcome.errorMessage(), request));
        };
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(
            @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return featureDeferred(request, "Wallet and payouts are deferred during the liquidity-first MVP phase.");
        }
        List<LedgerEntry> transactions = walletQueryPort.listTransactions(principal.userId());
        List<Map<String, Object>> data = walletQueryCompositionService.ledgerResponses(transactions);
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
    }
}
