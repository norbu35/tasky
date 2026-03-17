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

    private IdempotencyOperations() {}
}
