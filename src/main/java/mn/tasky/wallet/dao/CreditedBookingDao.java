package mn.tasky.wallet.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

public interface CreditedBookingDao {

    default int tryInsert(String bookingId) {
        return tryInsert(required(bookingId, "bookingId"));
    }

    @SqlUpdate("INSERT INTO credited_bookings (booking_id) VALUES (:bookingId) ON CONFLICT DO " + "NOTHING")
    int tryInsert(@Bind("bookingId") UUID bookingId);
}
