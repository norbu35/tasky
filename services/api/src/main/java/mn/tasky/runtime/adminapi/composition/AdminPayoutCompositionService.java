package mn.tasky.runtime.adminapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.wallet.dto.PayoutRequest;
import org.springframework.stereotype.Component;

@Component
public class AdminPayoutCompositionService {

    public List<Map<String, Object>> payoutResponses(List<PayoutRequest> payouts) {
        return payouts.stream().map(this::payoutResponse).toList();
    }

    private Map<String, Object> payoutResponse(PayoutRequest payout) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", payout.id());
        response.put("user_id", payout.userId());
        response.put("amount", payout.amount());
        response.put("status", payout.status());
        response.put("created_at", payout.createdAt().toString());
        return response;
    }
}
