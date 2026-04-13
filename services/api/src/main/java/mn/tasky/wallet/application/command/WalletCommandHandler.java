package mn.tasky.wallet.application.command;

import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import org.springframework.stereotype.Service;

@Service
public class WalletCommandHandler implements WalletCommandPort {
    private final WalletService walletService;

    public WalletCommandHandler(WalletService walletService) {
        this.walletService = walletService;
    }

    @Override
    public String requestPayout(String userId, int amount) {
        return walletService.requestPayout(userId, amount);
    }

    @Override
    public void processPayout(String actorUserId, String payoutId, String reason) {
        walletService.processPayout(actorUserId, payoutId, reason);
    }
}
