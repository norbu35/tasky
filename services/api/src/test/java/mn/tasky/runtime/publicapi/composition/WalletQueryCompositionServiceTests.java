package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.WalletBalance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("WalletQueryCompositionService")
class WalletQueryCompositionServiceTests {

    private WalletQueryCompositionService service;

    @BeforeEach
    void setUp() {
        service = new WalletQueryCompositionService();
    }

    @Nested
    @DisplayName("balanceResponse")
    class BalanceResponse {

        @Test
        @DisplayName("maps WalletBalance fields to response map")
        void mapsAllFields() {
            WalletBalance balance = new WalletBalance(15000, 3000, "MNT");

            Map<String, Object> response = service.balanceResponse(balance);

            assertThat(response).containsEntry("balance", 15000L);
            assertThat(response).containsEntry("pending_payout", 3000L);
            assertThat(response).containsEntry("currency", "MNT");
        }

        @Test
        @DisplayName("handles zero balances")
        void handlesZeroBalances() {
            WalletBalance balance = new WalletBalance(0, 0, "MNT");

            Map<String, Object> response = service.balanceResponse(balance);

            assertThat(response).containsEntry("balance", 0L);
            assertThat(response).containsEntry("pending_payout", 0L);
        }
    }

    @Nested
    @DisplayName("ledgerResponses")
    class LedgerResponses {

        @Test
        @DisplayName("maps list of LedgerEntry to list of response maps")
        void mapsListOfEntries() {
            Instant now = Instant.now();
            List<LedgerEntry> entries = List.of(
                    new LedgerEntry("l-1", "u-1", 5000, "CREDIT", "booking-1", "Payment received", now),
                    new LedgerEntry("l-2", "u-1", -1000, "DEBIT", "payout-1", "Payout processed", now));

            List<Map<String, Object>> responses = service.ledgerResponses(entries);

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0)).containsEntry("id", "l-1");
            assertThat(responses.get(0)).containsEntry("amount", 5000);
            assertThat(responses.get(0)).containsEntry("type", "CREDIT");
            assertThat(responses.get(0)).containsEntry("reference_id", "booking-1");
            assertThat(responses.get(0)).containsEntry("description", "Payment received");
            assertThat(responses.get(0)).containsEntry("created_at", now.toString());

            assertThat(responses.get(1)).containsEntry("id", "l-2");
            assertThat(responses.get(1)).containsEntry("amount", -1000);
            assertThat(responses.get(1)).containsEntry("type", "DEBIT");
        }

        @Test
        @DisplayName("returns empty list for empty input")
        void returnsEmptyList() {
            List<Map<String, Object>> responses = service.ledgerResponses(List.of());

            assertThat(responses).isEmpty();
        }
    }
}
