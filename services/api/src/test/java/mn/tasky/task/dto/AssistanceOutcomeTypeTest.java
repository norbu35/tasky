package mn.tasky.task.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AssistanceOutcomeTypeTest {

    @Test
    @DisplayName("defines the three launch assistance outcome buckets")
    void definesLaunchAssistanceOutcomeBuckets() {
        assertThat(AssistanceOutcomeType.values())
                .containsExactly(
                        AssistanceOutcomeType.SELF_SERVE,
                        AssistanceOutcomeType.SYSTEM_ASSISTED,
                        AssistanceOutcomeType.MANUAL_ASSISTED);
    }
}
