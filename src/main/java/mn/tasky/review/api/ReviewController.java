package mn.tasky.review.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Validated
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/bookings/{id}/reviews")
    public ResponseEntity<?> submitReview(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody ReviewRequest body) {

        var result = reviewService.submitReview(principal.userId(),
            id,
            body.rating(),
            body.comment());

        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "INVALID_RATING" -> ResponseEntity.badRequest()
                    .body(Map.of("code",
                        "INVALID_RATING",
                        "message",
                        "Rating must be between 1 and 5"));
                case "BOOKING_NOT_FOUND" -> ResponseEntity.status(404)
                    .body(Map.of("code",
                        "NOT_FOUND",
                        "message",
                        "Booking not found"));
                case "BOOKING_NOT_COMPLETED" -> ResponseEntity.badRequest()
                    .body(Map.of(
                        "code",
                        "BOOKING_NOT_COMPLETED",
                        "message",
                        "Reviews allowed only on completed bookings"));
                case "NOT_PARTICIPANT" -> ResponseEntity.status(403)
                    .body(Map.of("code",
                        "FORBIDDEN",
                        "message",
                        "Only booking participants can leave reviews"));
                case "ALREADY_REVIEWED" -> ResponseEntity.status(409)
                    .body(Map.of("code",
                        "ALREADY_REVIEWED",
                        "message",
                        "You have already reviewed this booking"));
                default -> ResponseEntity.internalServerError()
                    .build();
            };
        }

        return ResponseEntity.status(201)
            .body(toReviewResponse(result.review()));
    }

    private Map<String, Object> toReviewResponse(Review review) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id",
            review.id());
        res.put("booking_id",
            review.bookingId());
        res.put("author_id",
            review.authorId());
        res.put("target_user_id",
            review.targetUserId());
        res.put("rating",
            review.rating());
        res.put("comment",
            review.comment());
        res.put("created_at",
            review.createdAt()
                .toString());
        return res;
    }

    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<?> listReviews(
        @PathVariable String id,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {

        List<Review> reviews = reviewService.listReviews(id,
            cursor,
            limit + 1);
        boolean hasMore = reviews.size() > limit;
        List<Review> pageReviews = hasMore ? reviews.subList(0,
            limit) : reviews;

        List<Map<String, Object>> data =
            pageReviews.stream()
                .map(this::toReviewResponse)
                .toList();

        return ResponseEntity.ok(new PagedResponse<>(data,
            CursorPagination.from(reviews,
                limit,
                Review::id)));
    }
}
