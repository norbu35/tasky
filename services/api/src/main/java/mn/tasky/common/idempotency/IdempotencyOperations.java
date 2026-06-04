package mn.tasky.common.idempotency;

public final class IdempotencyOperations {

    public static final String ACCEPT_APPLICATION = "task.accept_application";
    public static final String CANCEL_BOOKING = "booking.cancel";
    public static final String COMPLETE_BOOKING = "booking.complete";
    public static final String MARK_BOOKING_DONE = "booking.mark_done";
    public static final String RAISE_DISPUTE = "dispute.raise";
    public static final String RESOLVE_DISPUTE = "dispute.resolve";
    public static final String INITIATE_PAYMENT = "payment.initiate";
    public static final String REQUEST_PAYOUT = "wallet.request_payout";
    public static final String PROCESS_PAYOUT = "wallet.process_payout";
    public static final String CONCIERGE_ASSIGN = "admin.concierge_assign";
    public static final String NO_SHOW_FLAG = "booking.no_show_flag";
    public static final String RESCHEDULE_REQUEST = "booking.reschedule_request";
    public static final String RESCHEDULE_RESPOND = "booking.reschedule_respond";
    public static final String CREATE_BOOKING_INTENT = "booking.create_intent";
    public static final String CONFIRM_BOOKING_INTENT = "booking.confirm_intent";
    public static final String DECLINE_BOOKING_INTENT = "booking.decline_intent";

    private IdempotencyOperations() {}
}
