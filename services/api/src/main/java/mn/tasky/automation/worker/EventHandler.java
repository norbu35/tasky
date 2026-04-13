package mn.tasky.automation.worker;

import mn.tasky.automation.event.AutomationEventEnvelope;

/**
 * Base interface for event-driven automation workers.
 * Each implementation handles one or more event types from the automation event bus.
 */
public interface EventHandler {

    /**
     * Returns the event type this handler processes.
     */
    String eventType();

    /**
     * Handles the given event envelope.
     * Throwing a runtime exception signals a processing failure that should be retried.
     */
    void handle(AutomationEventEnvelope envelope);
}
