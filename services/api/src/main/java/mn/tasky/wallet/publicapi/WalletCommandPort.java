package mn.tasky.wallet.publicapi;

public interface WalletCommandPort {
    String requestPayout(String userId, int amount);

    void processPayout(String actorUserId, String payoutId, String reason);

    /**
     * Credit tasker wallet for task completion, applying platform fee.
     */
    void creditTaskCompletion(String taskerId, String bookingId, int price, int platformFeeBasisPoints);
}
