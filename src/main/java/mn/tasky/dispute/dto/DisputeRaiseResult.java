package mn.tasky.dispute.dto;

public record DisputeRaiseResult(Dispute dispute, String error) {

    public static DisputeRaiseResult success(Dispute d) {
        return new DisputeRaiseResult(d,
            null);
    }

    public static DisputeRaiseResult error(String e) {
        return new DisputeRaiseResult(null,
            e);
    }

    public boolean isSuccess() {
        return dispute != null;
    }
}
