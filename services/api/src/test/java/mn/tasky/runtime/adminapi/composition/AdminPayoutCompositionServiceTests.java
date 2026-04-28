package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import mn.tasky.wallet.dto.PayoutRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class AdminPayoutCompositionServiceTests {

    private AdminPayoutCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminPayoutCompositionService();
    }

    @Nested
    @DisplayName("payoutResponses")
    class PayoutResponsesTests {

        @Test
        @DisplayName("maps list of PayoutRequest to response maps")
        void payoutResponses_mapsFields() {
            PayoutRequest payout1 = new PayoutRequest("p1", "user-1", 5000, "PENDING", Instant.now());
            PayoutRequest payout2 = new PayoutRequest("p2", "user-2", 10000, "PROCESSED", Instant.now());

            List<Map<String, Object>> responses = service.payoutResponses(List.of(payout1, payout2));

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0))
                    .containsEntry("id", "p1")
                    .containsEntry("user_id", "user-1")
                    .containsEntry("amount", 5000)
                    .containsEntry("status", "PENDING");
            assertThat(responses.get(1))
                    .containsEntry("id", "p2")
                    .containsEntry("user_id", "user-2")
                    .containsEntry("amount", 10000)
                    .containsEntry("status", "PROCESSED");
        }

        @Test
        @DisplayName("returns empty list when no payouts provided")
        void payoutResponses_emptyList() {
            List<Map<String, Object>> responses = service.payoutResponses(List.of());

            assertThat(responses).isEmpty();
        }

        @Test
        @DisplayName("maps single payout correctly")
        void payoutResponses_singlePayout() {
            PayoutRequest payout =
                    new PayoutRequest("p1", "user-1", 7500, "PENDING", Instant.parse("2025-06-01T10:00:00Z"));

            List<Map<String, Object>> responses = service.payoutResponses(List.of(payout));

            assertThat(responses).hasSize(1);
            assertThat(responses.getFirst())
                    .containsEntry("id", "p1")
                    .containsEntry("user_id", "user-1")
                    .containsEntry("amount", 7500)
                    .containsEntry("status", "PENDING")
                    .containsEntry("created_at", "2025-06-01T10:00:00Z");
        }
    }
}
