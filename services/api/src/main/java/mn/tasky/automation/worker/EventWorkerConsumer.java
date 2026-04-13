package mn.tasky.automation.worker;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ consumer that receives {@link AutomationEventEnvelope}
 * instances and dispatches them to the registered {@link EventHandler} implementations.
 * Handles retry routing via x-death headers and MDC context propagation.
 */
@Component
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class EventWorkerConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventWorkerConsumer.class);

    private final Map<String, EventHandler> handlersByEventType;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tasky.automation.broker.retry-exchange:tasky.events.retry}")
    private String retryExchange;

    @Value("${tasky.automation.broker.dlq-exchange:tasky.events.dlq}")
    private String dlqExchange;

    @Value("${tasky.automation.worker.max-retries:3}")
    private int maxRetries;

    public EventWorkerConsumer(List<EventHandler> handlers, RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.handlersByEventType =
                handlers.stream().collect(Collectors.toMap(EventHandler::eventType, Function.identity()));
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
        log.info("EventWorkerConsumer registered for event types: {}", handlersByEventType.keySet());
    }

    @RabbitListener(queues = "automation.worker")
    public void onMessage(org.springframework.amqp.core.Message message) {
        AutomationEventEnvelope envelope = null;

        try {
            envelope = parseEnvelope(message);
            if (envelope == null) {
                log.warn(
                        "Received unparseable message on automation worker queue, rejecting: messageId={}",
                        message.getMessageProperties().getMessageId());
                return;
            }

            propagateMdc(envelope);
            EventHandler handler = handlersByEventType.get(envelope.eventType());
            if (handler == null) {
                log.warn("No handler registered for event type: {}", envelope.eventType());
                return;
            }

            log.info(
                    "Processing event: eventId={} type={} correlationId={}",
                    envelope.eventId(),
                    envelope.eventType(),
                    envelope.correlationId());
            handler.handle(envelope);
            log.info("Event processed successfully: eventId={} type={}", envelope.eventId(), envelope.eventType());
        } catch (RuntimeException exception) {
            handleProcessingFailure(message, envelope, exception);
            throw exception;
        } finally {
            clearMdc();
        }
    }

    private AutomationEventEnvelope parseEnvelope(org.springframework.amqp.core.Message message) {
        try {
            return objectMapper.readValue(message.getBody(), AutomationEventEnvelope.class);
        } catch (Exception exception) {
            log.error("Failed to parse event envelope: error={}", exception.getMessage());
            return null;
        }
    }

    private void propagateMdc(AutomationEventEnvelope envelope) {
        if (envelope.correlationId() != null) {
            MDC.put("correlation_id", envelope.correlationId());
        }
        if (envelope.causationId() != null) {
            MDC.put("causation_id", envelope.causationId());
        }
        if (envelope.commandId() != null) {
            MDC.put("command_id", envelope.commandId());
        }
        if (envelope.workflowId() != null) {
            MDC.put("workflow_id", envelope.workflowId());
        }
        if (envelope.actorId() != null) {
            MDC.put("actor_id", envelope.actorId());
        }
    }

    private void clearMdc() {
        MDC.remove("correlation_id");
        MDC.remove("causation_id");
        MDC.remove("command_id");
        MDC.remove("workflow_id");
        MDC.remove("actor_id");
    }

    @SuppressWarnings("unchecked")
    private void handleProcessingFailure(
            org.springframework.amqp.core.Message message,
            AutomationEventEnvelope envelope,
            RuntimeException exception) {
        String eventId = envelope != null ? envelope.eventId() : "unknown";
        String eventType = envelope != null ? envelope.eventType() : "unknown";
        log.error("Event processing failed: eventId={} type={} error={}", eventId, eventType, exception.getMessage());

        int attempt = extractDeathCount(message);
        if (attempt >= maxRetries) {
            log.warn(
                    "Event exceeded max retries ({} deaths), sending to DLQ: eventId={} type={}",
                    attempt,
                    eventId,
                    eventType);
            rabbitTemplate.send(dlqExchange, "", message);
        } else {
            log.info("Routing event to retry exchange (death {} of {}): eventId={}", attempt, maxRetries, eventId);
            rabbitTemplate.send(retryExchange, "", message);
        }
    }

    /**
     * Extracts the total death count from the x-death header.
     * RabbitMQ automatically populates x-death when a message is dead-lettered
     * (e.g., TTL expiration on the retry queue). Each entry in the list represents
     * a different queue the message was routed from; the "count" field tracks
     * how many times the message has been dead-lettered from that queue.
     */
    @SuppressWarnings("unchecked")
    private int extractDeathCount(org.springframework.amqp.core.Message message) {
        Map<String, Object> headers = message.getMessageProperties().getHeaders();
        Object xDeath = headers.get("x-death");
        if (!(xDeath instanceof List<?> deaths)) {
            return 0;
        }
        int total = 0;
        for (Object entry : deaths) {
            if (entry instanceof Map<?, ?> deathEntry) {
                Object count = deathEntry.get("count");
                if (count instanceof Number number) {
                    total += number.intValue();
                }
            }
        }
        return total;
    }
}
