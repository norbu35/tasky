package mn.tasky.automation.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("AbstractEventHandler")
class AbstractEventHandlerTest {

    @Mock
    private WorkflowIdempotencyGuard idempotencyGuard;

    private AutomationEventEnvelope testEnvelope() {
        return AutomationEventEnvelope.builder()
                .eventId("evt-1")
                .eventType("TEST")
                .build();
    }

    private AbstractEventHandler createHandler(WorkflowIdempotencyGuard guard) {
        AbstractEventHandler handler = new AbstractEventHandler() {
            @Override
            public String eventType() {
                return "TEST";
            }

            @Override
            public void handle(AutomationEventEnvelope envelope) {}
        };
        ReflectionTestUtils.setField(handler, "idempotencyGuard", guard);
        return handler;
    }

    @Test
    @DisplayName("tryClaimEvent returns true when idempotencyGuard is null")
    void tryClaimEventReturnsTrueWhenNoGuard() {
        AbstractEventHandler handler = createHandler(null);
        assertThat(handler.tryClaimEvent(testEnvelope())).isTrue();
    }

    @Test
    @DisplayName("tryClaimEvent delegates to guard when present")
    void tryClaimEventDelegatesToGuard() {
        when(idempotencyGuard.claim("TEST", "evt-1")).thenReturn(true);
        AbstractEventHandler handler = createHandler(idempotencyGuard);

        assertThat(handler.tryClaimEvent(testEnvelope())).isTrue();
        verify(idempotencyGuard).claim("TEST", "evt-1");
    }

    @Test
    @DisplayName("tryClaimEvent returns false when guard rejects")
    void tryClaimEventReturnsFalseWhenGuardRejects() {
        when(idempotencyGuard.claim("TEST", "evt-1")).thenReturn(false);
        AbstractEventHandler handler = createHandler(idempotencyGuard);

        assertThat(handler.tryClaimEvent(testEnvelope())).isFalse();
    }

    @Test
    @DisplayName("tryClaimEventComplete delegates to guard when present")
    void tryClaimEventCompleteDelegatesToGuard() {
        AbstractEventHandler handler = createHandler(idempotencyGuard);
        handler.tryClaimEventComplete(testEnvelope());

        verify(idempotencyGuard).complete("evt-1");
    }

    @Test
    @DisplayName("tryClaimEventComplete is no-op when guard is null")
    void tryClaimEventCompleteNoOpWhenNull() {
        AbstractEventHandler handler = createHandler(null);
        handler.tryClaimEventComplete(testEnvelope());
    }

    @Test
    @DisplayName("withObservability copies correlation_id, locale, platform from payload")
    void withObservabilityCopiesFields() {
        AbstractEventHandler handler = createHandler(null);

        Map<String, Object> payload = Map.of(
                "correlation_id", "corr-1",
                "locale", "mn",
                "platform", "android",
                "other_key", "ignored");
        Map<String, Object> base = Map.of("existing", "value");

        Map<String, Object> result = handler.withObservability(payload, base);

        assertThat(result).containsEntry("existing", "value");
        assertThat(result).containsEntry("correlation_id", "corr-1");
        assertThat(result).containsEntry("locale", "mn");
        assertThat(result).containsEntry("platform", "android");
        assertThat(result).doesNotContainKey("other_key");
    }

    @Test
    @DisplayName("withObservability does not overwrite existing values in base")
    void withObservabilityDoesNotOverwrite() {
        AbstractEventHandler handler = createHandler(null);

        Map<String, Object> payload = Map.of("correlation_id", "from-payload");
        Map<String, Object> base = new java.util.LinkedHashMap<>();
        base.put("correlation_id", "from-base");

        Map<String, Object> result = handler.withObservability(payload, base);

        assertThat(result.get("correlation_id")).isEqualTo("from-base");
    }

    @Test
    @DisplayName("withObservability skips null values from payload")
    void withObservabilitySkipsNulls() {
        AbstractEventHandler handler = createHandler(null);

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("correlation_id", null);
        Map<String, Object> base = Map.of("existing", "value");

        Map<String, Object> result = handler.withObservability(payload, base);

        assertThat(result).doesNotContainKey("correlation_id");
    }

    @Test
    @DisplayName("requiredString returns value when present")
    void requiredStringReturnsValue() {
        AbstractEventHandler handler = createHandler(null);
        Map<String, Object> payload = Map.of("key", "value");

        String result = handler.requiredString(payload, "key");
        assertThat(result).isEqualTo("value");
    }

    @Test
    @DisplayName("requiredString throws for missing key")
    void requiredStringThrowsForMissing() {
        AbstractEventHandler handler = createHandler(null);
        Map<String, Object> payload = Map.of();

        assertThatThrownBy(() -> handler.requiredString(payload, "missing"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Missing payload field: missing");
    }
}
