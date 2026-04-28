package mn.tasky.dispute.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class DisputeEvidenceResultTest {

    private static final Instant NOW = Instant.parse("2026-04-28T00:00:00Z");

    @Test
    void successCarriesDisputeAndClearsError() {
        Dispute dispute = dispute("OPEN");

        DisputeEvidenceResult result = DisputeEvidenceResult.success(dispute);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.dispute()).isSameAs(dispute);
        assertThat(result.error()).isNull();
    }

    @Test
    void errorCarriesFailureReasonAndClearsDispute() {
        DisputeEvidenceResult result = DisputeEvidenceResult.error("Evidence window has closed");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.dispute()).isNull();
        assertThat(result.error()).isEqualTo("Evidence window has closed");
    }

    @Test
    void sameValuesAreEqual() {
        Dispute dispute = dispute("OPEN");

        DisputeEvidenceResult first = DisputeEvidenceResult.success(dispute);
        DisputeEvidenceResult second = DisputeEvidenceResult.success(dispute);

        assertThat(first).isEqualTo(second).hasSameHashCodeAs(second);
    }

    private static Dispute dispute(String status) {
        return new Dispute(
                "dispute-1",
                "booking-1",
                "customer-1",
                "Tasker did not complete the work",
                status,
                null,
                null,
                null,
                NOW,
                null,
                null,
                NOW.plusSeconds(86_400));
    }
}
