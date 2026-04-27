package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class DisputeEvidenceOutcomeTest {

    @Test
    void successCarriesResponseBodyOnly() {
        Map<String, Object> body = Map.of("id", "dispute-1", "status", "OPEN");

        DisputeEvidenceOutcome outcome = DisputeEvidenceOutcome.success(body);

        assertThat(outcome.status()).isEqualTo(DisputeEvidenceOutcome.Status.SUCCESS);
        assertThat(outcome.body()).isSameAs(body);
        assertThat(outcome.errorCode()).isNull();
        assertThat(outcome.errorMessage()).isNull();
    }

    @Test
    void failureCarriesStatusAndErrorOnly() {
        DisputeEvidenceOutcome outcome = DisputeEvidenceOutcome.failure(
                DisputeEvidenceOutcome.Status.INVALID_EVIDENCE,
                "INVALID_EVIDENCE",
                "At least one evidence item is required");

        assertThat(outcome.status()).isEqualTo(DisputeEvidenceOutcome.Status.INVALID_EVIDENCE);
        assertThat(outcome.body()).isNull();
        assertThat(outcome.errorCode()).isEqualTo("INVALID_EVIDENCE");
        assertThat(outcome.errorMessage()).isEqualTo("At least one evidence item is required");
    }

    @Test
    void internalErrorCarriesInternalErrorStatusWithoutPublicDetails() {
        DisputeEvidenceOutcome outcome = DisputeEvidenceOutcome.internalError();

        assertThat(outcome.status()).isEqualTo(DisputeEvidenceOutcome.Status.INTERNAL_ERROR);
        assertThat(outcome.body()).isNull();
        assertThat(outcome.errorCode()).isNull();
        assertThat(outcome.errorMessage()).isNull();
    }

    @Test
    void sameValuesAreEqual() {
        DisputeEvidenceOutcome first =
                DisputeEvidenceOutcome.failure(DisputeEvidenceOutcome.Status.FORBIDDEN, "FORBIDDEN", "Not allowed");
        DisputeEvidenceOutcome second =
                DisputeEvidenceOutcome.failure(DisputeEvidenceOutcome.Status.FORBIDDEN, "FORBIDDEN", "Not allowed");

        assertThat(first).isEqualTo(second).hasSameHashCodeAs(second);
    }
}
