package mn.tasky.task.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskOutcomeClassificationTest {

    @Test
    @DisplayName("stores outcome bucket and reporting eligibility flags")
    void storesOutcomeBucketAndReportingEligibilityFlags() {
        TaskOutcomeClassification classification =
                new TaskOutcomeClassification(AssistanceOutcomeType.SYSTEM_ASSISTED, false, true);

        assertThat(classification.outcomeType()).isEqualTo(AssistanceOutcomeType.SYSTEM_ASSISTED);
        assertThat(classification.includedInSelfServeFulfillmentReporting()).isFalse();
        assertThat(classification.includedInAssistedOutcomeReporting()).isTrue();
    }
}
