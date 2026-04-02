package mn.tasky.dispute.dto;

public record DisputeResolutionResult(Dispute dispute, String error) {

    public static DisputeResolutionResult success(Dispute d) {
        return new DisputeResolutionResult(d, null);
    }

    public static DisputeResolutionResult error(String e) {
        return new DisputeResolutionResult(null, e);
    }

    public boolean isSuccess() {
        return dispute != null;
    }
}
