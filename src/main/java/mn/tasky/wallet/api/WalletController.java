package mn.tasky.wallet.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.CreatePayoutRequest;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallet")
@Validated
public class WalletController {

    private final WalletService walletService;
    private final boolean monetizationEnabled;

    public WalletController(
        WalletService walletService,
        @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled
    ) {
        this.walletService = walletService;
        this.monetizationEnabled = monetizationEnabled;
    }

    @GetMapping
    public ResponseEntity<?> getBalance(
        @AuthenticationPrincipal JwtPrincipal principal,
        HttpServletRequest request
    ) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
        WalletBalance balance = walletService.getBalance(principal.userId());
        return ResponseEntity.ok(Map.of(
            "balance", balance.balance(),
            "pending_payout", balance.pendingPayout(),
            "currency", balance.currency()
        ));
    }

    @PostMapping("/payouts")
    public ResponseEntity<?> requestPayout(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CreatePayoutRequest body,
            HttpServletRequest request) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
        try {
            String payoutId = walletService.requestPayout(principal.userId(), body.amount());
            return ResponseEntity.ok(Map.of("id", payoutId, "status", "PENDING"));
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage();
            if ("Insufficient balance for payout".equals(msg)) msg = "Insufficient balance";
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(
        @AuthenticationPrincipal JwtPrincipal principal,
        HttpServletRequest request
    ) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
        List<LedgerEntry> transactions = walletService.listTransactions(principal.userId());
        
        List<Map<String, Object>> data = transactions.stream()
            .map(this::toLedgerResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                new CursorPagination(null, false)
            )
        );
    }

    private Map<String, Object> toLedgerResponse(LedgerEntry entry) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", entry.id());
        response.put("amount", entry.amount());
        response.put("type", entry.type());
        response.put("reference_id", entry.referenceId());
        response.put("description", entry.description());
        response.put("created_at", entry.createdAt().toString());
        return response;
    }

    private ResponseEntity<Map<String, Object>> deferredResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            Map.of(
                "code", "FEATURE_DEFERRED",
                "message", "Wallet and payouts are deferred during the liquidity-first MVP phase.",
                "trace_id", resolveTraceId(request)
            )
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

}
