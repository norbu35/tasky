package mn.tasky.wallet.publicapi;

import java.util.List;
import java.util.Optional;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.dto.WalletBalance;

public interface WalletQueryPort {
    WalletBalance getBalance(String userId);

    List<LedgerEntry> listTransactions(String userId);

    Optional<PayoutRequest> getPayout(String payoutId);

    List<PayoutRequest> listPendingPayouts();
}
