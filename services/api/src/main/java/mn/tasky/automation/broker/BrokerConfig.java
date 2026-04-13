package mn.tasky.automation.broker;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares RabbitMQ exchanges, queues, and bindings for the automation event bus.
 * The topology is:
 *   fanout exchange (tasky.events) -> per-event-type queues
 *   with a retry exchange and DLQ for failed processing.
 */
@Configuration
@ConditionalOnProperty(name = "tasky.automation.broker.enabled", havingValue = "true")
public class BrokerConfig {

    @Value("${tasky.automation.broker.exchange:tasky.events}")
    private String eventExchange;

    @Value("${tasky.automation.broker.retry-exchange:tasky.events.retry}")
    private String retryExchange;

    @Value("${tasky.automation.broker.dlq-exchange:tasky.events.dlq}")
    private String dlqExchange;

    @Bean
    FanoutExchange eventExchange() {
        return new FanoutExchange(eventExchange, true, false);
    }

    @Bean
    FanoutExchange retryExchange() {
        return new FanoutExchange(retryExchange, true, false);
    }

    @Bean
    FanoutExchange dlqExchange() {
        return new FanoutExchange(dlqExchange, true, false);
    }

    /**
     * The main automation worker queue bound to the event exchange.
     * Uses a dead-letter routing path via the retry exchange for failed messages.
     */
    @Bean
    Queue automationWorkerQueue() {
        return QueueBuilder.durable("automation.worker")
                .withArgument("x-dead-letter-exchange", retryExchange)
                .withArgument("x-message-ttl", 60000)
                .build();
    }

    @Bean
    Binding bindAutomationWorker(FanoutExchange eventExchange, Queue automationWorkerQueue) {
        return BindingBuilder.bind(automationWorkerQueue).to(eventExchange);
    }

    /**
     * Retry queue with exponential back-off via TTL. Messages that fail processing
     * are republished here, then dead-lettered back to the worker queue after the TTL.
     */
    @Bean
    Queue automationRetryQueue() {
        return QueueBuilder.durable("automation.worker.retry")
                .withArgument("x-dead-letter-exchange", eventExchange)
                .withArgument("x-dead-letter-routing-key", "")
                .withArgument("x-message-ttl", 30000)
                .build();
    }

    @Bean
    Binding bindRetryQueue(FanoutExchange retryExchange, Queue automationRetryQueue) {
        return BindingBuilder.bind(automationRetryQueue).to(retryExchange);
    }

    /**
     * Dead-letter queue for events that exceed max retries.
     */
    @Bean
    Queue automationDlq() {
        return QueueBuilder.durable("automation.worker.dlq").build();
    }

    @Bean
    Binding bindDlq(FanoutExchange dlqExchange, Queue automationDlq) {
        return BindingBuilder.bind(automationDlq).to(dlqExchange);
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setExchange(eventExchange);
        template.setMessageConverter(new JsonMessageConverter(objectMapper));
        return template;
    }

    @Bean
    RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }
}
