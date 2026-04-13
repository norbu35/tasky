package mn.tasky.automation.broker;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;

/**
 * Simple JSON-based message converter using the application's ObjectMapper.
 * Wraps Java objects in AMQP messages with a content-type header.
 */
public class JsonMessageConverter implements MessageConverter {

    private final ObjectMapper objectMapper;

    public JsonMessageConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Message toMessage(Object object, MessageProperties messageProperties) {
        try {
            byte[] body = objectMapper.writeValueAsBytes(object);
            messageProperties.setContentType("application/json");
            messageProperties.setContentEncoding("UTF-8");
            return new Message(body, messageProperties);
        } catch (Exception exception) {
            throw new MessageConversionException("Failed to convert to JSON message", exception);
        }
    }

    @Override
    public Object fromMessage(Message message) throws MessageConversionException {
        throw new UnsupportedOperationException("Use fromMessage(message, targetClass) instead");
    }

    public <T> T fromMessage(Message message, Class<T> targetClass) {
        try {
            byte[] body = message.getBody();
            return objectMapper.readValue(body, targetClass);
        } catch (Exception exception) {
            throw new MessageConversionException("Failed to convert from JSON message", exception);
        }
    }
}
