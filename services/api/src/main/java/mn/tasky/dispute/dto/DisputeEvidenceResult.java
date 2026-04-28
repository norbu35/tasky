package mn.tasky.dispute.dto;

public record DisputeEvidenceResult(Dispute dispute, String error) {

    public static DisputeEvidenceResult success(Dispute dispute) {
        return new DisputeEvidenceResult(dispute, null);
    }

    public static DisputeEvidenceResult error(String error) {
        return new DisputeEvidenceResult(null, error);
    }

    public boolean isSuccess() {
        return dispute != null;
    }
}
