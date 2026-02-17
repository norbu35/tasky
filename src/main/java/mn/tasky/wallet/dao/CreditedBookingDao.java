package mn.tasky.wallet.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface CreditedBookingDao {

    @SqlUpdate("INSERT INTO credited_bookings (booking_id) VALUES (:bookingId) ON CONFLICT DO NOTHING")
    int tryInsert(@Bind("bookingId") String bookingId);
}
