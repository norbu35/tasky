package mn.tasky.projection.publicfeed;

import java.time.Instant;

public record PublicTaskFeedRow(
        String id,
        String categoryId,
        String categoryName,
        String categoryNameMn,
        String categoryIconUrl,
        String description,
        Integer budget,
        String pricingMode,
        String approximateLocation,
        double approximateLat,
        double approximateLng,
        String status,
        Instant scheduledAt,
        Instant createdAt) {}
