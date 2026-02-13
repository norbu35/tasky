package mn.tasky.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.DisputeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/disputes")
public class AdminDisputeController {

    private final DisputeService disputeService;

    public AdminDisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPending() {
        List<DisputeService.Dispute> pending = disputeService.listPendingDisputes();
        List<Map<String, Object>> data = pending.stream()
            .map(this::toDisputeResponse)
            .toList();
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestBody ResolveRequest body) {
        
        var result = disputeService.resolveDispute(principal.userId(), id, body.outcome(), body.notes());
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(Map.of("error", result.error()));
        }
        return ResponseEntity.ok(toDisputeResponse(result.dispute()));
    }

    private Map<String, Object> toDisputeResponse(DisputeService.Dispute d) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", d.id());
        res.put("booking_id", d.bookingId());
        res.put("status", d.status());
        res.put("outcome", d.outcome());
        res.put("created_at", d.createdAt().toString());
        return res;
    }

    public record ResolveRequest(String outcome, String notes) {}
}
