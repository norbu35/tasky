package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class DisputePublicCompositionService {

    private final TrustQueryPort trustQueryPort;

    public DisputePublicCompositionService(TrustQueryPort trustQueryPort) {
        this.trustQueryPort = trustQueryPort;
    }

    public Map<String, Object> disputeSummary(Dispute dispute) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", dispute.id());
        response.put("booking_id", dispute.bookingId());
        response.put("status", dispute.status());
        response.put("reason", dispute.reason());
        response.put("created_at", dispute.createdAt().toString());
        response.put(
                "evidence_reminder_sent_at",
                dispute.evidenceReminderSentAt() != null
                        ? dispute.evidenceReminderSentAt().toString()
                        : null);
        response.put(
                "evidence_due_at",
                dispute.evidenceDueAt() != null ? dispute.evidenceDueAt().toString() : null);
        return response;
    }

    public Map<String, Object> disputeSummaryWithEvidence(Dispute dispute, List<DisputeEvidence> evidenceList) {
        Map<String, Object> response = disputeSummary(dispute);
        response.put(
                "evidence", evidenceList.stream().map(this::evidenceResponse).toList());
        return response;
    }

    public Optional<Map<String, Object>> disputeDetail(String disputeId, String userId, boolean admin) {
        return (admin ? trustQueryPort.getDispute(disputeId) : trustQueryPort.getDisputeForUser(disputeId, userId))
                .map(dispute -> disputeSummaryWithEvidence(dispute, trustQueryPort.getDisputeEvidence(dispute.id())));
    }

    private Map<String, Object> evidenceResponse(DisputeEvidence evidence) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", evidence.id());
        response.put("type", evidence.type());
        response.put("storage_key", evidence.storageKey());
        response.put("text_payload", evidence.textPayload());
        response.put(
                "created_at",
                evidence.createdAt() != null ? evidence.createdAt().toString() : null);
        return response;
    }
}
