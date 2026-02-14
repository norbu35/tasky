package mn.tasky.wallet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallet")
@Validated
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal JwtPrincipal principal) {
        WalletService.WalletBalance balance = walletService.getBalance(principal.userId());
        return ResponseEntity.ok(Map.of(
            "balance", balance.balance(),
            "pending_payout", balance.pendingPayout(),
            "currency", balance.currency()
        ));
    }

    @PostMapping("/payouts")
    public ResponseEntity<?> requestPayout(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody PayoutRequest body) {
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
    public ResponseEntity<?> listTransactions(@AuthenticationPrincipal JwtPrincipal principal) {
        List<WalletService.LedgerEntry> transactions = walletService.listTransactions(principal.userId());
        
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

    private Map<String, Object> toLedgerResponse(WalletService.LedgerEntry entry) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", entry.id());
        response.put("amount", entry.amount());
        response.put("type", entry.type());
        response.put("reference_id", entry.referenceId());
        response.put("description", entry.description());
        response.put("created_at", entry.createdAt().toString());
        return response;
    }

    public record PayoutRequest(@Positive int amount) {}
}
