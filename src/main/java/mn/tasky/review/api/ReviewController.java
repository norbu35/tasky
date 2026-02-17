package mn.tasky.review.api;

import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<?> submitReview(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody ReviewRequest body) {
        
        var result = reviewService.submitReview(
            principal.userId(), 
            body.bookingId(), 
            body.rating(), 
            body.comment()
        );

        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "INVALID_RATING" -> ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
                case "BOOKING_NOT_FOUND" -> ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
                case "BOOKING_NOT_COMPLETED" -> ResponseEntity.badRequest().body(Map.of("error", "Reviews allowed only on completed bookings"));
                case "NOT_PARTICIPANT" -> ResponseEntity.status(403).body(Map.of("error", "Only booking participants can leave reviews"));
                case "ALREADY_REVIEWED" -> ResponseEntity.status(409).body(Map.of("error", "You have already reviewed this booking"));
                default -> ResponseEntity.internalServerError().build();
            };
        }

        return ResponseEntity.status(201).body(toReviewResponse(result.review()));
    }

    @GetMapping
    public ResponseEntity<?> listReviews(
            @RequestParam(name = "user_id") String userId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        
        List<Review> reviews = reviewService.listReviews(userId, cursor, limit);
        
        List<Map<String, Object>> data = reviews.stream()
            .map(this::toReviewResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                CursorPagination.from(reviews, limit, Review::id)
            )
        );
    }

    private Map<String, Object> toReviewResponse(Review review) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", review.id());
        res.put("booking_id", review.bookingId());
        res.put("author_id", review.authorId());
        res.put("target_user_id", review.targetUserId());
        res.put("rating", review.rating());
        res.put("comment", review.comment());
        res.put("created_at", review.createdAt().toString());
        return res;
    }
}
