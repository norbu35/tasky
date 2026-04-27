package mn.tasky.runtime.publicapi.composition;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Component;

@Component
public class BookingResponseCompositionService {

    public Map<String, Object> basicBookingResponse(BookingState booking) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", booking.id());
        response.put("task_id", booking.taskId());
        response.put("tasker_id", booking.taskerId());
        response.put("customer_id", booking.customerId());
        response.put("price", booking.price());
        response.put("status", booking.status());
        response.put(
                "confirmed_scheduled_at",
                booking.confirmedScheduledAt() != null
                        ? booking.confirmedScheduledAt().toString()
                        : null);
        response.put("liability_disclaimer_accepted", booking.liabilityDisclaimerAccepted());
        response.put(
                "liability_disclaimer_accepted_at",
                booking.liabilityDisclaimerAcceptedAt() != null
                        ? booking.liabilityDisclaimerAcceptedAt().toString()
                        : null);
        response.put("settlement_mode", booking.settlementMode());
        response.put("late_cancel_incident", booking.lateCancelIncident());
        response.put("completion_reminder_count", booking.completionReminderCount());
        response.put(
                "completion_reminder_last_at",
                booking.completionReminderLastAt() != null
                        ? booking.completionReminderLastAt().toString()
                        : null);
        response.put("created_at", booking.createdAt().toString());
        response.put("updated_at", booking.updatedAt().toString());
        return response;
    }

    public Map<String, Object> bookingResponse(BookingState booking) {
        Map<String, Object> response = basicBookingResponse(booking);
        response.put("cancellation_fee", booking.cancellationFee());
        return response;
    }

    public Map<String, Object> markDoneResponse(BookingState booking, Instant markedDoneAt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("booking", bookingResponse(booking));
        body.put("tasker_marked_done_at", markedDoneAt != null ? markedDoneAt.toString() : null);
        return body;
    }

    public Map<String, Object> scheduleEventResponse(BookingScheduleEvent event) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", event.id());
        response.put("booking_id", event.bookingId());
        response.put("actor_user_id", event.actorUserId());
        response.put("event_type", event.eventType());
        response.put(
                "proposed_scheduled_at",
                event.proposedScheduledAt() != null
                        ? event.proposedScheduledAt().toString()
                        : null);
        response.put("reason", event.reason());
        response.put("created_at", event.createdAt().toString());
        return response;
    }

    public Map<String, Object> rebookTaskResponse(TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", task.id());
        response.put("customer_id", task.customerId());
        response.put("category_id", task.categoryId());
        response.put("description", task.description());
        response.put("budget", task.budget());
        response.put("location_lat", task.locationLat());
        response.put("location_lng", task.locationLng());
        response.put("location_text", task.locationText());
        response.put("status", task.status());
        response.put("created_at", task.createdAt().toString());
        response.put("updated_at", task.updatedAt().toString());
        return response;
    }
}
