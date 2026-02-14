package mn.tasky.admin.api;

import mn.tasky.admin.dto.ResolveRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/disputes")
public class AdminDisputeController {

    private final DisputeService disputeService;

    public AdminDisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPending() {
        List<Dispute> pending = disputeService.listPendingDisputes();
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
            if ("NOT_FOUND".equals(result.error())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", result.error()));
        }
        return ResponseEntity.ok(toDisputeResponse(result.dispute()));
    }

    private Map<String, Object> toDisputeResponse(Dispute d) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", d.id());
        res.put("booking_id", d.bookingId());
        res.put("status", d.status());
        res.put("outcome", d.outcome());
        res.put("created_at", d.createdAt().toString());
        return res;
    }
}
