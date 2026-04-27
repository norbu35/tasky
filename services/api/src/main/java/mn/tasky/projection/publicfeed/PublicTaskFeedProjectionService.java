package mn.tasky.projection.publicfeed;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PublicTaskFeedProjectionService {

    private final PublicTaskFeedProjectionDao projectionDao;

    public PublicTaskFeedProjectionService(PublicTaskFeedProjectionDao projectionDao) {
        this.projectionDao = projectionDao;
    }

    public PublicTaskFeedPage listOpenFeed(
            String categoryId, Double lat, Double lng, Double radiusKm, String cursor, int limit) {
        FeedCursor cursorState = decodeCursor(cursor);
        Instant cursorCreatedAt = cursorState != null ? cursorState.createdAt() : null;
        UUID cursorId = cursorState != null ? cursorState.id() : null;
        Double radiusMeters = lat != null && lng != null && radiusKm != null ? radiusKm * 1000 : null;

        List<PublicTaskFeedRow> rows =
                projectionDao.findOpenFeed(categoryId, lat, lng, radiusMeters, cursorCreatedAt, cursorId, limit + 1);
        boolean hasMore = rows.size() > limit;
        List<PublicTaskFeedRow> pageData = hasMore ? rows.subList(0, limit) : rows;
        String nextCursor = hasMore ? encodeCursor(pageData.getLast()) : null;
        return new PublicTaskFeedPage(List.copyOf(pageData), nextCursor, hasMore);
    }

    private FeedCursor decodeCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Cursor payload is malformed.");
            }
            return new FeedCursor(Instant.parse(parts[0]), UUID.fromString(parts[1]));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Cursor is invalid.", exception);
        }
    }

    private String encodeCursor(PublicTaskFeedRow lastRow) {
        String payload = lastRow.createdAt() + "|" + lastRow.id();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private record FeedCursor(Instant createdAt, UUID id) {}
}
