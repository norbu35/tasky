package mn.tasky.runtime.adminapi.composition;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Component;

@Component
public class AdminTaskCompositionService {

    private final MarketplaceQueryPort marketplaceQueryPort;

    public AdminTaskCompositionService(MarketplaceQueryPort marketplaceQueryPort) {
        this.marketplaceQueryPort = marketplaceQueryPort;
    }

    public Optional<Map<String, Object>> taskDetail(String taskId) {
        return marketplaceQueryPort.getTask(taskId).map(this::toTaskDetailResponse);
    }

    private Map<String, Object> toTaskDetailResponse(TaskState task) {
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
        response.put("scheduled_at", task.scheduledAt().toString());
        response.put("pricing_mode", task.pricingMode());
        response.put("photo_keys", task.photoKeys());
        response.put("intake_answers_json", task.intakeAnswersJson());
        response.put("intake_schema_version", task.intakeSchemaVersion());
        response.put("scope_summary", task.scopeSummarySource());
        response.put("created_at", task.createdAt().toString());
        response.put("updated_at", task.updatedAt().toString());
        return response;
    }
}
