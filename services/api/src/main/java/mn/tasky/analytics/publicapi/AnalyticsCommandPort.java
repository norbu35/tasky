package mn.tasky.analytics.publicapi;

import java.util.Map;

public interface AnalyticsCommandPort {
    // Event name constants (mirrors AnalyticsService)
    String EVENT_DISPUTE_RAISED = "DISPUTE_RAISED";
    String PROPERTY_BOOKING_ID = "booking_id";
    String PROPERTY_TASK_ID = "task_id";

    void track(String eventName, String userId, Map<String, Object> properties);
}
