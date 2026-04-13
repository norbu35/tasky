package mn.tasky.wallet.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.dto.WalletBalance;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.springframework.stereotype.Service;

@Service
public class WalletQueryHandler implements WalletQueryPort {
    private final WalletService walletService;

    public WalletQueryHandler(WalletService walletService) {
        this.walletService = walletService;
    }

    @Override
    public WalletBalance getBalance(String userId) {
        return walletService.getBalance(userId);
    }

    @Override
    public List<LedgerEntry> listTransactions(String userId) {
        return walletService.listTransactions(userId);
    }

    @Override
    public Optional<PayoutRequest> getPayout(String payoutId) {
        return walletService.getPayout(payoutId);
    }

    @Override
    public List<PayoutRequest> listPendingPayouts() {
        return walletService.listPendingPayouts();
    }
}
