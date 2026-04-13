package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.review.dto.Review;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class ReviewPublicCompositionService {

    private final TrustQueryPort trustQueryPort;

    public ReviewPublicCompositionService(TrustQueryPort trustQueryPort) {
        this.trustQueryPort = trustQueryPort;
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
}
