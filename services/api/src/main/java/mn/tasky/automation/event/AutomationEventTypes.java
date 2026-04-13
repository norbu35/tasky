package mn.tasky.automation.event;

/**
 * Canonical event type constants for the automation event bus.
 * These replace the legacy {@code mn.tasky.common.outbox.OutboxEventTypes} constants
 * once the outbox processor migration is complete.
 */
public final class AutomationEventTypes {
    private AutomationEventTypes() {}

    // Task marketplace aftermath
    public static final String TASK_APPLICATION_ACCEPTED = "TASK_APPLICATION_ACCEPTED";

    // Payment aftermath
    public static final String PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";

    // Booking aftermath
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";
}
