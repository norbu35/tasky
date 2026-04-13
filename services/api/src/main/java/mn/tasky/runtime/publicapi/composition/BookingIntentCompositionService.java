package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.booking.dto.BookingIntentState;
import org.springframework.stereotype.Component;

@Component
public class BookingIntentCompositionService {

    public Map<String, Object> bookingIntentResponse(BookingIntentState intent) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", intent.id());
        body.put("task_id", intent.taskId());
        body.put("tasker_id", intent.taskerId());
        body.put("customer_id", intent.customerId());
        body.put("source", intent.source());
        body.put("status", intent.status());
        body.put("original_booking_id", intent.originalBookingId());
        body.put("offer_id", intent.offerId());
        body.put("expires_at", intent.expiresAt() != null ? intent.expiresAt().toString() : null);
        body.put("confirmed_booking_id", intent.confirmedBookingId());
        body.put(
                "confirmed_at",
                intent.confirmedAt() != null ? intent.confirmedAt().toString() : null);
        body.put("created_at", intent.createdAt().toString());
        body.put("updated_at", intent.updatedAt().toString());
        return body;
    }
}
