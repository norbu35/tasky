package mn.tasky.common.outbox;

public final class OutboxEventTypes {

    public static final String TASK_APPLICATION_ACCEPTED = "TASK_APPLICATION_ACCEPTED";
    public static final String PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";

    private OutboxEventTypes() {}
}
