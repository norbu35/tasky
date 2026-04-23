package mn.tasky.kernel.logging;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LogFieldTest {

    @Test
    void allEnumValuesHaveExpectedKeys() {
        assertThat(LogField.CORRELATION_ID.key()).isEqualTo("correlation_id");
        assertThat(LogField.TRACE_ID.key()).isEqualTo("trace_id");
        assertThat(LogField.CAUSATION_ID.key()).isEqualTo("causation_id");
        assertThat(LogField.COMMAND_ID.key()).isEqualTo("command_id");
        assertThat(LogField.WORKFLOW_ID.key()).isEqualTo("workflow_id");
        assertThat(LogField.JOB_ID.key()).isEqualTo("job_id");
        assertThat(LogField.ACTOR_ID.key()).isEqualTo("actor_id");
        assertThat(LogField.LOCALE.key()).isEqualTo("locale");
        assertThat(LogField.PLATFORM.key()).isEqualTo("platform");
        assertThat(LogField.RUNTIME_SURFACE.key()).isEqualTo("runtime_surface");
    }

    @Test
    void enumCoversAllExpectedFields() {
        assertThat(LogField.values()).hasSize(10);
    }

    @Test
    void valueOfReturnsCorrectConstant() {
        assertThat(LogField.valueOf("CORRELATION_ID")).isEqualTo(LogField.CORRELATION_ID);
        assertThat(LogField.valueOf("TRACE_ID")).isEqualTo(LogField.TRACE_ID);
    }
}
