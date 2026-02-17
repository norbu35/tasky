package mn.tasky.admin.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.PayoutRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/payouts")
public class AdminPayoutController {

    private final WalletService walletService;
    private final boolean monetizationEnabled;

    public AdminPayoutController(
        WalletService walletService,
        @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled
    ) {
        this.walletService = walletService;
        this.monetizationEnabled = monetizationEnabled;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPendingPayouts(HttpServletRequest request) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
        List<PayoutRequest> pending = walletService.listPendingPayouts();
        
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
    public ResponseEntity<?> processPayout(@PathVariable String id, HttpServletRequest request) {
        if (!monetizationEnabled) {
            return deferredResponse(request);
        }
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

    private Map<String, Object> toPayoutResponse(PayoutRequest p) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", p.id());
        res.put("user_id", p.userId());
        res.put("amount", p.amount());
        res.put("status", p.status());
        res.put("created_at", p.createdAt().toString());
        return res;
    }

    private ResponseEntity<Map<String, Object>> deferredResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            Map.of(
                "code", "FEATURE_DEFERRED",
                "message", "Payout operations are deferred during the liquidity-first MVP phase.",
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
