package mn.tasky.booking.api;

import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.booking.dto.BookingState;

public final class BookingResponseMapper {

    private BookingResponseMapper() {}

    public static Map<String, Object> withCancellationFee(BookingState booking) {
        Map<String, Object> response = basic(booking);
        response.put("cancellation_fee", booking.cancellationFee());
        return response;
    }

    public static Map<String, Object> basic(BookingState booking) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", booking.id());
        response.put("task_id", booking.taskId());
        response.put("tasker_id", booking.taskerId());
        response.put("customer_id", booking.customerId());
        response.put("price", booking.price());
        response.put("status", booking.status());
        response.put("created_at", booking.createdAt().toString());
        response.put("updated_at", booking.updatedAt().toString());
        return response;
    }
}
