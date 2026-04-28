package mn.tasky.kernel.error;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class KernelErrorTest {

    @Test
    void recordAccessorsReturnConstructorValues() {
        KernelError error = new KernelError("ERR_001", "something broke", "trace-abc", true);

        assertThat(error.code()).isEqualTo("ERR_001");
        assertThat(error.message()).isEqualTo("something broke");
        assertThat(error.traceId()).isEqualTo("trace-abc");
        assertThat(error.retryable()).isTrue();
    }

    @Test
    void nonRetryableError() {
        KernelError error = new KernelError("ERR_002", "permanent failure", "trace-def", false);

        assertThat(error.retryable()).isFalse();
    }

    @Test
    void equalsAndHashCodeWork() {
        KernelError a = new KernelError("E", "m", "t", false);
        KernelError b = new KernelError("E", "m", "t", false);

        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    void toStringContainsFields() {
        KernelError error = new KernelError("E", "m", "t", true);

        assertThat(error.toString()).contains("E").contains("m").contains("t");
    }
}
