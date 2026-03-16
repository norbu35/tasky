package mn.tasky.payment.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface PaymentIntentDao {

    default void insert(String paymentId, String bookingId) {
        insert(required(paymentId, "paymentId"), required(bookingId, "bookingId"));
    }

    @SqlUpdate("INSERT INTO payment_intents (payment_id, booking_id, processed) VALUES "
            + "(:paymentId, :bookingId, false)")
    void insert(@Bind("paymentId") UUID paymentId, @Bind("bookingId") UUID bookingId);

    default Optional<String> findBookingIdByPaymentId(String paymentId) {
        UUID paymentUuid = optional(paymentId);
        if (paymentUuid == null) {
            return Optional.empty();
        }
        return findBookingIdByPaymentId(paymentUuid).map(UUID::toString);
    }

    @SqlQuery("SELECT booking_id FROM payment_intents WHERE payment_id = :paymentId")
    Optional<UUID> findBookingIdByPaymentId(@Bind("paymentId") UUID paymentId);

    default int markProcessed(String paymentId) {
        UUID paymentUuid = optional(paymentId);
        if (paymentUuid == null) {
            return 0;
        }
        return markProcessed(paymentUuid);
    }

    @SqlUpdate("UPDATE payment_intents SET processed = true WHERE payment_id = :paymentId AND " + "processed = false")
    int markProcessed(@Bind("paymentId") UUID paymentId);
}
