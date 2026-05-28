package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.projection.publicfeed.PublicTaskFeedProjectionService;
import mn.tasky.projection.publicfeed.PublicTaskFeedRow;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class PublicTaskFeedCompositionService {

    private final PublicTaskFeedProjectionService projectionService;

    public PublicTaskFeedCompositionService(PublicTaskFeedProjectionService projectionService) {
        this.projectionService = projectionService;
    }

    public PublicTaskFeedPage listTaskFeed(
            String category, Double lat, Double lng, Double radiusKm, String cursor, int limit) {
        mn.tasky.projection.publicfeed.PublicTaskFeedPage page =
                projectionService.listOpenFeed(category, lat, lng, radiusKm, cursor, limit);
        List<Map<String, Object>> data =
                page.data().stream().map(this::toFeedItem).toList();
        return new PublicTaskFeedPage(data, page.nextCursor(), page.hasMore());
    }

    private Map<String, Object> toFeedItem(PublicTaskFeedRow row) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", row.id());
        response.put("category", toCategory(row));
        response.put("description", sanitize(row.description()));
        response.put("pricing_mode", row.pricingMode());
        response.put("budget", row.budget());
        response.put("approximate_location", row.approximateLocation());
        response.put("approximate_lat", row.approximateLat());
        response.put("approximate_lng", row.approximateLng());
        response.put("status", row.status());
        response.put(
                "scheduled_at", row.scheduledAt() != null ? row.scheduledAt().toString() : null);
        response.put("created_at", row.createdAt().toString());
        return response;
    }

    private Map<String, Object> toCategory(PublicTaskFeedRow row) {
        Map<String, Object> category = new LinkedHashMap<>();
        category.put("id", row.categoryId());
        category.put("name", sanitize(row.categoryName()));
        category.put("name_mn", sanitize(row.categoryNameMn()));
        category.put("icon_url", sanitize(row.categoryIconUrl()));
        return category;
    }

    private String sanitize(String value) {
        return value == null ? null : HtmlUtils.htmlEscape(value);
    }
}
