package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.featureDeferred;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import mn.tasky.admin.dto.AdminActionRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminPayoutCompositionService;
import mn.tasky.runtime.adminapi.composition.AdminPayoutProcessingOutcome;
import mn.tasky.runtime.adminapi.composition.AdminPayoutProcessingService;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/payouts")
public class AdminPayoutController {

    private final WalletQueryPort walletQueryPort;
    private final AdminPayoutCompositionService adminPayoutCompositionService;
    private final AdminPayoutProcessingService adminPayoutProcessingService;
    private final FeatureToggleService featureToggleService;

    public AdminPayoutController(
            WalletQueryPort walletQueryPort,
            AdminPayoutCompositionService adminPayoutCompositionService,
            AdminPayoutProcessingService adminPayoutProcessingService,
            FeatureToggleService featureToggleService) {
        this.walletQueryPort = walletQueryPort;
        this.adminPayoutCompositionService = adminPayoutCompositionService;
        this.adminPayoutProcessingService = adminPayoutProcessingService;
        this.featureToggleService = featureToggleService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPendingPayouts(HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return featureDeferred(request, "Payout operations are deferred during the liquidity-first MVP phase.");
        }
        List<PayoutRequest> pending = walletQueryPort.listPendingPayouts();
        List<Map<String, Object>> data = adminPayoutCompositionService.payoutResponses(pending);
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> processPayout(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        AdminPayoutProcessingOutcome outcome =
                adminPayoutProcessingService.processPayout(principal.userId(), id, body.reason(), idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case FEATURE_DEFERRED -> featureDeferred(request, outcome.errorMessage());
            case INVALID_WEEKDAY, BAD_REQUEST -> ResponseEntity.badRequest()
                    .body(errorBody("BAD_REQUEST", outcome.errorMessage(), request));
            case SUCCESS -> ResponseEntity.ok(outcome.body());
        };
    }
}
