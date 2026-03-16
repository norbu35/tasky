package mn.tasky.wallet.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.CreatePayoutRequest;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static mn.tasky.common.api.ApiResponseSupport.*;

@RestController
@RequestMapping("/api/v1/wallet")
@Validated
public class WalletController {

    private final WalletService walletService;
    private final FeatureToggleService featureToggleService;
    private final IdempotencyService idempotencyService;

    public WalletController(
        WalletService walletService,
        IdempotencyService idempotencyService,
        FeatureToggleService featureToggleService) {
        this.walletService = walletService;
        this.idempotencyService = idempotencyService;
        this.featureToggleService = featureToggleService;
    }

    @GetMapping
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return deferredResponse(request);
        }
        WalletBalance balance = walletService.getBalance(principal.userId());
        return ResponseEntity.ok(Map.of(
            "balance",
            balance.balance(),
            "pending_payout",
            balance.pendingPayout(),
            "currency",
            balance.currency()));
    }

    private ResponseEntity<Map<String, Object>> deferredResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "code",
                "FEATURE_DEFERRED",
                "message",
                "Wallet and payouts are deferred during the liquidity-first MVP " + "phase.",
                "trace_id",
                resolveTraceId(request)));
    }

    @PostMapping("/payouts")
    public ResponseEntity<?> requestPayout(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody CreatePayoutRequest body,
        @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest request) {
        IdempotencyClaim claim =
            idempotencyService.claim(principal.userId(),
                IdempotencyOperations.REQUEST_PAYOUT,
                idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            return walletService
                .getPayout(claim.record()
                    .resourceId()
                    .toString())
                .<ResponseEntity<?>>map(
                    payout -> ResponseEntity.ok(Map.of("id",
                        payout.id(),
                        "status",
                        payout.status())))
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            if (!featureToggleService.isEnabled("escrow_enabled")) {
                idempotencyService.abandon(principal.userId(),
                    IdempotencyOperations.REQUEST_PAYOUT,
                    idempotencyKey);
                return deferredResponse(request);
            }
            String payoutId = walletService.requestPayout(principal.userId(),
                body.amount());
            idempotencyService.completeWithResource(
                principal.userId(),
                IdempotencyOperations.REQUEST_PAYOUT,
                idempotencyKey,
                "PAYOUT",
                payoutId);
            return ResponseEntity.ok(Map.of("id",
                payoutId,
                "status",
                "PENDING"));
        } catch (IllegalArgumentException e) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.REQUEST_PAYOUT,
                idempotencyKey);
            String msg = e.getMessage();
            if ("Insufficient balance for payout".equals(msg)) {
                msg = "Insufficient balance";
            }
            return ResponseEntity.badRequest()
                .body(Map.of("error",
                    msg));
        } catch (RuntimeException e) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.REQUEST_PAYOUT,
                idempotencyKey);
            throw e;
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(
        @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!featureToggleService.isEnabled("escrow_enabled")) {
            return deferredResponse(request);
        }
        List<LedgerEntry> transactions = walletService.listTransactions(principal.userId());

        List<Map<String, Object>> data =
            transactions.stream()
                .map(this::toLedgerResponse)
                .toList();

        return ResponseEntity.ok(new PagedResponse<>(data,
            new CursorPagination(null,
                false)));
    }

    private Map<String, Object> toLedgerResponse(LedgerEntry entry) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id",
            entry.id());
        response.put("amount",
            entry.amount());
        response.put("type",
            entry.type());
        response.put("reference_id",
            entry.referenceId());
        response.put("description",
            entry.description());
        response.put("created_at",
            entry.createdAt()
                .toString());
        return response;
    }
}
