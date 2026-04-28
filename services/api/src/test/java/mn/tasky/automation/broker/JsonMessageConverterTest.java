package mn.tasky.automation.broker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.MessageConversionException;

@DisplayName("JsonMessageConverter")
class JsonMessageConverterTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private JsonMessageConverter converter;

    @BeforeEach
    void setUp() {
        converter = new JsonMessageConverter(objectMapper);
    }

    @Test
    @DisplayName("toMessage serializes object to JSON with correct headers")
    void toMessageSerializesToJson() {
        AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                .eventId("e-1")
                .eventType("TEST")
                .build();

        MessageProperties props = new MessageProperties();
        Message message = converter.toMessage(envelope, props);

        assertThat(message.getBody()).isNotEmpty();
        assertThat(props.getContentType()).isEqualTo("application/json");
        assertThat(props.getContentEncoding()).isEqualTo("UTF-8");
    }

    @Test
    @DisplayName("fromMessage without targetClass throws UnsupportedOperationException")
    void fromMessageWithoutTargetClassThrows() {
        Message message = new Message("{}".getBytes(), new MessageProperties());

        assertThatThrownBy(() -> converter.fromMessage(message))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("targetClass");
    }

    @Test
    @DisplayName("fromMessage with targetClass deserializes correctly")
    void fromMessageWithTargetClassDeserializes() {
        AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                .eventId("e-2")
                .eventType("TASK_CREATED")
                .aggregateType("task")
                .aggregateId("agg-2")
                .build();

        MessageProperties props = new MessageProperties();
        Message message = converter.toMessage(envelope, props);

        AutomationEventEnvelope result = converter.fromMessage(message, AutomationEventEnvelope.class);

        assertThat(result.eventId()).isEqualTo("e-2");
        assertThat(result.eventType()).isEqualTo("TASK_CREATED");
        assertThat(result.aggregateType()).isEqualTo("task");
        assertThat(result.aggregateId()).isEqualTo("agg-2");
    }

    @Test
    @DisplayName("toMessage wraps serialization failure in MessageConversionException")
    void toMessageWrapsFailure() {
        ObjectMapper failingMapper = new ObjectMapper() {
            @Override
            public byte[] writeValueAsBytes(Object value) {
                throw new RuntimeException("boom");
            }
        };
        JsonMessageConverter failingConverter = new JsonMessageConverter(failingMapper);

        assertThatThrownBy(() -> failingConverter.toMessage("test", new MessageProperties()))
                .isInstanceOf(MessageConversionException.class);
    }

    @Test
    @DisplayName("fromMessage with targetClass wraps deserialization failure")
    void fromMessageWrapsFailure() {
        Message badMessage = new Message("not valid json!!!".getBytes(), new MessageProperties());

        assertThatThrownBy(() -> converter.fromMessage(badMessage, AutomationEventEnvelope.class))
                .isInstanceOf(MessageConversionException.class);
    }
}
