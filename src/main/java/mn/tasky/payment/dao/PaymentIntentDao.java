package mn.tasky.payment.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.Optional;

public interface PaymentIntentDao {

    @SqlUpdate("INSERT INTO payment_intents (payment_id, booking_id, processed) VALUES (:paymentId, :bookingId, false)")
    void insert(@Bind("paymentId") String paymentId, @Bind("bookingId") String bookingId);

    @SqlQuery("SELECT booking_id FROM payment_intents WHERE payment_id = :paymentId")
    Optional<String> findBookingIdByPaymentId(@Bind("paymentId") String paymentId);

    @SqlUpdate("UPDATE payment_intents SET processed = true WHERE payment_id = :paymentId AND processed = false")
    int markProcessed(@Bind("paymentId") String paymentId);
}
