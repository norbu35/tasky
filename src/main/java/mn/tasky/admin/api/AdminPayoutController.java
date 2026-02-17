package mn.tasky.admin.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.PayoutRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

@RestController
@RequestMapping("/api/v1/admin/payouts")
public class AdminPayoutController {

    private final WalletService walletService;
    private final boolean monetizationEnabled;
    private final IdempotencyService idempotencyService;

    public AdminPayoutController(
            WalletService walletService,
            IdempotencyService idempotencyService,
            @Value("${tasky.features.monetization-enabled:false}") boolean monetizationEnabled
    ) {
        this.walletService       = walletService;
        this.idempotencyService  = idempotencyService;
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
                        new CursorPagination(null,
                                             false)
                )
        );
    }

    private ResponseEntity<Map<String, Object>> deferredResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(
                        Map.of(
                                "code",
                                "FEATURE_DEFERRED",
                                "message",
                                "Payout operations are deferred during the liquidity-first MVP " +
                                        "phase.",
                                "trace_id",
                                resolveTraceId(request)
                        )
                );
    }

    private Map<String, Object> toPayoutResponse(PayoutRequest p) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id",
                p.id());
        res.put("user_id",
                p.userId());
        res.put("amount",
                p.amount());
        res.put("status",
                p.status());
        res.put("created_at",
                p.createdAt()
                        .toString());
        return res;
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> processPayout(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request
    ) {
        String actorId = principal.userId();
        IdempotencyClaim claim = idempotencyService.claim(
                actorId,
                IdempotencyOperations.PROCESS_PAYOUT,
                idempotencyKey
        );
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                    .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String payoutId = claim.record()
                    .resourceId()
                    .toString();
            return walletService.getPayout(payoutId)
                    .<ResponseEntity<?>>map(payout -> ResponseEntity.ok(Map.of("status",
                                                                               payout.status())))
                    .orElseGet(() -> idempotencyReplayMissing(request));
        }

        if (!monetizationEnabled) {
            idempotencyService.abandon(actorId,
                                       IdempotencyOperations.PROCESS_PAYOUT,
                                       idempotencyKey);
            return deferredResponse(request);
        }
        DayOfWeek today = LocalDate.now()
                .getDayOfWeek();
        if (today != DayOfWeek.TUESDAY && today != DayOfWeek.FRIDAY) {
            idempotencyService.abandon(actorId,
                                       IdempotencyOperations.PROCESS_PAYOUT,
                                       idempotencyKey);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "Payouts can only be processed on Tuesday and Friday. Today is " + today
                    ));
        }

        try {
            walletService.processPayout(id);
            idempotencyService.completeWithResource(
                    actorId,
                    IdempotencyOperations.PROCESS_PAYOUT,
                    idempotencyKey,
                    "PAYOUT",
                    id
            );
            return ResponseEntity.ok(Map.of("status",
                                            "PROCESSED"));
        } catch (IllegalArgumentException e) {
            idempotencyService.abandon(actorId,
                                       IdempotencyOperations.PROCESS_PAYOUT,
                                       idempotencyKey);
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                                 e.getMessage()));
        } catch (RuntimeException e) {
            idempotencyService.abandon(actorId,
                                       IdempotencyOperations.PROCESS_PAYOUT,
                                       idempotencyKey);
            throw e;
        }
    }
}
