package mn.tasky.task.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AssistanceEvaluationTest {

    @Test
    @DisplayName("stores external distribution decision and reason")
    void storesExternalDistributionDecisionAndReason() {
        AssistanceEvaluation evaluation = new AssistanceEvaluation(false, AssistanceEvaluation.TOO_EARLY);

        assertThat(evaluation.externalDistributionAllowed()).isFalse();
        assertThat(evaluation.reason()).isEqualTo(AssistanceEvaluation.TOO_EARLY);
    }
}
