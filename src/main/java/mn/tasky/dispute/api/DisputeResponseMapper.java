package mn.tasky.dispute.api;

import mn.tasky.dispute.dto.Dispute;

import java.util.LinkedHashMap;
import java.util.Map;

public final class DisputeResponseMapper {

    private DisputeResponseMapper() {
    }

    public static Map<String, Object> summary(Dispute dispute) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", dispute.id());
        response.put("booking_id", dispute.bookingId());
        response.put("status", dispute.status());
        response.put("reason", dispute.reason());
        response.put("created_at", dispute.createdAt().toString());
        return response;
    }

    public static Map<String, Object> admin(Dispute dispute) {
        Map<String, Object> response = summary(dispute);
        response.put("raiser_id", dispute.raiserId());
        response.put("outcome", dispute.outcome());
        response.put("resolution_notes", dispute.resolutionNotes());
        response.put("resolved_at", dispute.resolvedAt() != null ? dispute.resolvedAt().toString() : null);
        return response;
    }
}
