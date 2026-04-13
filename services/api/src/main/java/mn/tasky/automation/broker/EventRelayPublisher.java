package mn.tasky.automation.broker;

import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Publishes {@link AutomationEventEnvelope} instances to the RabbitMQ event exchange.
 * Called by the outbox relay path after an event is persisted. Adds correlation
 * headers to the AMQP message properties so that workers can propagate tracing context.
 */
@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class EventRelayPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventRelayPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tasky.automation.broker.exchange:tasky.events}")
    private String eventExchange;

    public EventRelayPublisher(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Publishes the given event envelope to the RabbitMQ exchange.
     * The message is fire-and-forget at this level; durability is guaranteed
     * by the fact that the event was already persisted to the outbox table.
     */
    public void publish(AutomationEventEnvelope envelope) {
        try {
            byte[] body = objectMapper.writeValueAsBytes(envelope);
            org.springframework.amqp.core.MessageProperties props =
                    new org.springframework.amqp.core.MessageProperties();
            props.setContentType("application/json");
            props.setContentEncoding("UTF-8");
            props.setMessageId(envelope.eventId());
            props.setType(envelope.eventType());
            if (envelope.correlationId() != null) {
                props.setHeader("correlation_id", envelope.correlationId());
            }
            if (envelope.causationId() != null) {
                props.setHeader("causation_id", envelope.causationId());
            }
            if (envelope.commandId() != null) {
                props.setHeader("command_id", envelope.commandId());
            }
            if (envelope.workflowId() != null) {
                props.setHeader("workflow_id", envelope.workflowId());
            }
            if (envelope.actorId() != null) {
                props.setHeader("actor_id", envelope.actorId());
            }
            org.springframework.amqp.core.Message message = new org.springframework.amqp.core.Message(body, props);
            rabbitTemplate.send(eventExchange, "", message);
            log.info("Published event to broker: eventId={} type={}", envelope.eventId(), envelope.eventType());
        } catch (Exception exception) {
            // The event is already persisted to the outbox table, so this failure
            // is recoverable by the outbox relay retry path.
            log.error(
                    "Failed to publish event to broker: eventId={} type={} error={}",
                    envelope.eventId(),
                    envelope.eventType(),
                    exception.getMessage());
            throw new RuntimeException("Failed to relay event to broker", exception);
        }
    }
}
