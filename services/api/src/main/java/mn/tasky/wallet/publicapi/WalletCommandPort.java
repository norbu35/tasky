package mn.tasky.wallet.publicapi;

public interface WalletCommandPort {
    String requestPayout(String userId, int amount);

    void processPayout(String actorUserId, String payoutId, String reason);
}
