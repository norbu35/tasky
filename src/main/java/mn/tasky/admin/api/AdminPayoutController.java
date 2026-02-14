package mn.tasky.admin.api;

import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.wallet.application.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/payouts")
public class AdminPayoutController {

    private final WalletService walletService;

    public AdminPayoutController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPendingPayouts() {
        List<WalletService.PayoutRequest> pending = walletService.listPendingPayouts();
        
        List<Map<String, Object>> data = pending.stream()
            .map(this::toPayoutResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                new CursorPagination(null, false)
            )
        );
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> processPayout(@PathVariable String id) {
        DayOfWeek today = LocalDate.now().getDayOfWeek();
        if (today != DayOfWeek.TUESDAY && today != DayOfWeek.FRIDAY) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Payouts can only be processed on Tuesday and Friday. Today is " + today
            ));
        }

        try {
            walletService.processPayout(id);
            return ResponseEntity.ok(Map.of("status", "PROCESSED"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toPayoutResponse(WalletService.PayoutRequest p) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", p.id());
        res.put("user_id", p.userId());
        res.put("amount", p.amount());
        res.put("status", p.status());
        res.put("created_at", p.createdAt().toString());
        return res;
    }
}
