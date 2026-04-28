package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("DisputePublicCompositionService")
class DisputePublicCompositionServiceTests {

    @Mock
    private TrustQueryPort trustQueryPort;

    private DisputePublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new DisputePublicCompositionService(trustQueryPort);
    }

    private Dispute dispute(String id, String bookingId, String status) {
        return new Dispute(id, bookingId, "user-1", "quality issue", status, null, null, null, Instant.now(), null);
    }

    @Nested
    @DisplayName("disputeSummary")
    class DisputeSummary {

        @Test
        @DisplayName("maps core Dispute fields to response map")
        void mapsCoreFields() {
            Instant now = Instant.now();
            Dispute d = new Dispute("d-1", "b-1", "user-1", "quality issue", "OPEN", null, null, null, now, null);

            Map<String, Object> response = service.disputeSummary(d);

            assertThat(response).containsEntry("id", "d-1");
            assertThat(response).containsEntry("booking_id", "b-1");
            assertThat(response).containsEntry("status", "OPEN");
            assertThat(response).containsEntry("reason", "quality issue");
            assertThat(response).containsEntry("created_at", now.toString());
        }
    }

    @Nested
    @DisplayName("disputeSummaryWithEvidence")
    class DisputeSummaryWithEvidence {

        @Test
        @DisplayName("includes evidence list in response")
        void includesEvidence() {
            Dispute d = dispute("d-2", "b-2", "UNDER_REVIEW");
            Instant now = Instant.now();
            DisputeEvidence evidence = new DisputeEvidence("e-1", "d-2", "PHOTO", "storage/key.png", null, now);

            Map<String, Object> response = service.disputeSummaryWithEvidence(d, List.of(evidence));

            assertThat(response).containsEntry("id", "d-2");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> evidenceList = (List<Map<String, Object>>) response.get("evidence");
            assertThat(evidenceList).hasSize(1);
            assertThat(evidenceList.get(0)).containsEntry("id", "e-1");
            assertThat(evidenceList.get(0)).containsEntry("type", "PHOTO");
            assertThat(evidenceList.get(0)).containsEntry("storage_key", "storage/key.png");
        }

        @Test
        @DisplayName("handles empty evidence list")
        void handlesEmptyEvidence() {
            Dispute d = dispute("d-3", "b-3", "RESOLVED");

            Map<String, Object> response = service.disputeSummaryWithEvidence(d, List.of());

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> evidenceList = (List<Map<String, Object>>) response.get("evidence");
            assertThat(evidenceList).isEmpty();
        }
    }

    @Nested
    @DisplayName("disputeDetail")
    class DisputeDetail {

        @Test
        @DisplayName("fetches dispute and evidence for admin user")
        void fetchesForAdmin() {
            Dispute d = dispute("d-4", "b-4", "OPEN");
            DisputeEvidence evidence =
                    new DisputeEvidence("e-2", "d-4", "TEXT", null, "description of issue", Instant.now());
            when(trustQueryPort.getDispute("d-4")).thenReturn(Optional.of(d));
            when(trustQueryPort.getDisputeEvidence("d-4")).thenReturn(List.of(evidence));

            Optional<Map<String, Object>> result = service.disputeDetail("d-4", "admin-1", true);

            assertThat(result).isPresent();
            assertThat(result.get()).containsEntry("id", "d-4");
        }

        @Test
        @DisplayName("fetches dispute for non-admin user via getDisputeForUser")
        void fetchesForNonAdmin() {
            Dispute d = dispute("d-5", "b-5", "OPEN");
            when(trustQueryPort.getDisputeForUser("d-5", "user-1")).thenReturn(Optional.of(d));
            when(trustQueryPort.getDisputeEvidence("d-5")).thenReturn(List.of());

            Optional<Map<String, Object>> result = service.disputeDetail("d-5", "user-1", false);

            assertThat(result).isPresent();
            assertThat(result.get()).containsEntry("id", "d-5");
        }

        @Test
        @DisplayName("returns empty when dispute not found for admin")
        void returnsEmptyWhenNotFoundAdmin() {
            when(trustQueryPort.getDispute("d-missing")).thenReturn(Optional.empty());

            Optional<Map<String, Object>> result = service.disputeDetail("d-missing", "admin-1", true);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when dispute not found for non-admin user")
        void returnsEmptyWhenNotFoundNonAdmin() {
            when(trustQueryPort.getDisputeForUser("d-missing", "user-1")).thenReturn(Optional.empty());

            Optional<Map<String, Object>> result = service.disputeDetail("d-missing", "user-1", false);

            assertThat(result).isEmpty();
        }
    }
}
