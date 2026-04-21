package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewEnforcementCase;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class ReviewPublicCompositionService {

    private final TrustQueryPort trustQueryPort;
    private final ReviewEnforcementService reviewEnforcementService;

    public ReviewPublicCompositionService(
            TrustQueryPort trustQueryPort, ReviewEnforcementService reviewEnforcementService) {
        this.trustQueryPort = trustQueryPort;
        this.reviewEnforcementService = reviewEnforcementService;
    }

    public ReviewPublicPage listReviews(String revieweeId, String cursor, int limit) {
        List<Review> reviews = trustQueryPort.listReviews(revieweeId, cursor, limit + 1);
        boolean hasMore = reviews.size() > limit;
        List<Review> pageReviews = hasMore ? reviews.subList(0, limit) : reviews;
        List<Map<String, Object>> data =
                pageReviews.stream().map(this::reviewResponse).toList();
        String nextCursor = hasMore ? pageReviews.getLast().id() : null;
        return new ReviewPublicPage(data, nextCursor, hasMore);
    }

    public Map<String, Object> reviewResponse(Review review) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", review.id());
        response.put("booking_id", review.bookingId());
        response.put("reviewer_id", review.reviewerId());
        response.put("reviewee_id", review.revieweeId());
        response.put("quality_rating", review.qualityRating());
        response.put("punctuality_rating", review.punctualityRating());
        response.put("communication_rating", review.communicationRating());
        response.put("clarity_rating", review.clarityRating());
        response.put("respectfulness_rating", review.respectfulnessRating());
        response.put("comment", review.comment());
        response.put("created_at", review.createdAt().toString());
        return response;
    }

    public List<Map<String, Object>> getPendingReviewCases(String userId) {
        List<ReviewEnforcementCase> cases = reviewEnforcementService.getOpenCases(userId);
        return cases.stream()
                .map(c -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", c.id());
                    map.put("booking_id", c.bookingId());
                    map.put("user_id", c.userId());
                    map.put("status", c.status());
                    map.put("triggered_at", c.triggeredAt().toString());
                    map.put(
                            "resolved_at",
                            c.resolvedAt() != null ? c.resolvedAt().toString() : null);
                    map.put("investigation_active", c.investigationActive());
                    return map;
                })
                .toList();
    }
}
