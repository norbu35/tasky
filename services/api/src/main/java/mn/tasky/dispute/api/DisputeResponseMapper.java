package mn.tasky.dispute.api;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;

public final class DisputeResponseMapper {

    private DisputeResponseMapper() {}

    public static Map<String, Object> admin(Dispute dispute) {
        Map<String, Object> response = summary(dispute);
        response.put("raised_by", dispute.raisedBy());
        response.put("resolution_action", dispute.resolutionAction());
        response.put("wrongful_party_user_id", dispute.wrongfulPartyUserId());
        response.put("resolution_notes", dispute.resolutionNotes());
        response.put(
                "resolved_at",
                dispute.resolvedAt() != null ? dispute.resolvedAt().toString() : null);
        return response;
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

    public static Map<String, Object> summaryWithEvidence(Dispute dispute, List<DisputeEvidence> evidenceList) {
        Map<String, Object> response = summary(dispute);
        response.put(
                "evidence",
                evidenceList.stream().map(DisputeResponseMapper::evidence).toList());
        return response;
    }

    public static Map<String, Object> evidence(DisputeEvidence ev) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", ev.id());
        response.put("type", ev.type());
        response.put("storage_key", ev.storageKey());
        response.put("text_payload", ev.textPayload());
        response.put("created_at", ev.createdAt() != null ? ev.createdAt().toString() : null);
        return response;
    }
}
