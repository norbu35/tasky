package mn.tasky.wallet.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.featureDeferred;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.api.generated.WalletApi;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.publicapi.composition.WalletPayoutRequestOutcome;
import mn.tasky.runtime.publicapi.composition.WalletPayoutRequestService;
import mn.tasky.runtime.publicapi.composition.WalletQueryCompositionService;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1/wallet")
@Validated
@SuppressWarnings("unchecked")
public class WalletController implements WalletApi {

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

    @Override
    @GetMapping
    public ResponseEntity<mn.tasky.api.generated.model.WalletBalance> getWalletBalance() {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return (ResponseEntity<mn.tasky.api.generated.model.WalletBalance>) (ResponseEntity<?>)
                    featureDeferred(request, "Wallet and payouts are deferred during the liquidity-first MVP phase.");
        }
        WalletBalance balance = walletQueryPort.getBalance(principal.userId());
        return (ResponseEntity<mn.tasky.api.generated.model.WalletBalance>)
                (ResponseEntity<?>) ResponseEntity.ok(walletQueryCompositionService.balanceResponse(balance));
    }

    @Override
    @GetMapping("/transactions")
    public ResponseEntity<mn.tasky.api.generated.model.ListWalletTransactions200Response> listWalletTransactions(
            @RequestParam(value = "cursor", required = false) @Nullable String cursor,
            @RequestParam(value = "limit", required = false, defaultValue = "20") @Min(1) @Max(100) Integer limit) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return (ResponseEntity<mn.tasky.api.generated.model.ListWalletTransactions200Response>) (ResponseEntity<?>)
                    featureDeferred(request, "Wallet and payouts are deferred during the liquidity-first MVP phase.");
        }
        List<LedgerEntry> transactions = walletQueryPort.listTransactions(principal.userId());
        List<Map<String, Object>> data = walletQueryCompositionService.ledgerResponses(transactions);
        var result = ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
        return (ResponseEntity<mn.tasky.api.generated.model.ListWalletTransactions200Response>)
                (ResponseEntity<?>) result;
    }

    @Override
    @PostMapping(
            value = "/payouts",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.PayoutRequest> requestPayout(
            @RequestHeader(value = "Idempotency-Key", required = true) UUID idempotencyKey,
            @Valid @RequestBody mn.tasky.api.generated.model.RequestPayoutRequest requestPayoutRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        WalletPayoutRequestOutcome outcome = walletPayoutRequestService.requestPayout(
                principal.userId(), requestPayoutRequest.getAmount(), idempotencyKey.toString());
        return switch (outcome.status()) {
            case IN_PROGRESS -> (ResponseEntity<mn.tasky.api.generated.model.PayoutRequest>)
                    (ResponseEntity<?>) idempotencyInProgress(request);
            case REPLAY_MISSING -> (ResponseEntity<mn.tasky.api.generated.model.PayoutRequest>)
                    (ResponseEntity<?>) idempotencyReplayMissing(request);
            case FEATURE_DEFERRED -> (ResponseEntity<mn.tasky.api.generated.model.PayoutRequest>)
                    (ResponseEntity<?>) featureDeferred(request, outcome.errorMessage());
            case SUCCESS -> (ResponseEntity<mn.tasky.api.generated.model.PayoutRequest>)
                    (ResponseEntity<?>) ResponseEntity.ok(outcome.body());
            case BAD_REQUEST -> (ResponseEntity<mn.tasky.api.generated.model.PayoutRequest>) (ResponseEntity<?>)
                    ResponseEntity.badRequest().body(errorBody("BAD_REQUEST", outcome.errorMessage(), request));
        };
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private HttpServletRequest getRequest() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
