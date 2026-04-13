package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import org.springframework.stereotype.Component;

@Component
public class WalletQueryCompositionService {

    public Map<String, Object> balanceResponse(WalletBalance balance) {
        return Map.of(
                "balance",
                balance.balance(),
                "pending_payout",
                balance.pendingPayout(),
                "currency",
                balance.currency());
    }

    public List<Map<String, Object>> ledgerResponses(List<LedgerEntry> transactions) {
        return transactions.stream().map(this::ledgerResponse).toList();
    }

    private Map<String, Object> ledgerResponse(LedgerEntry entry) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", entry.id());
        response.put("amount", entry.amount());
        response.put("type", entry.type());
        response.put("reference_id", entry.referenceId());
        response.put("description", entry.description());
        response.put("created_at", entry.createdAt().toString());
        return response;
    }
}
