package mn.tasky.review.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.review.dto.ReviewRequest;
import mn.tasky.runtime.publicapi.composition.ReviewPublicCompositionService;
import mn.tasky.runtime.publicapi.composition.ReviewSubmissionOutcome;
import mn.tasky.runtime.publicapi.composition.ReviewSubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
public class ReviewController {

    private final ReviewPublicCompositionService reviewPublicCompositionService;
    private final ReviewSubmissionService reviewSubmissionService;

    public ReviewController(
            ReviewPublicCompositionService reviewPublicCompositionService,
            ReviewSubmissionService reviewSubmissionService) {
        this.reviewPublicCompositionService = reviewPublicCompositionService;
        this.reviewSubmissionService = reviewSubmissionService;
    }

    @PostMapping("/bookings/{id}/reviews")
    public ResponseEntity<?> submitReview(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ReviewRequest body) {
        ReviewSubmissionOutcome outcome = reviewSubmissionService.submitReview(principal.userId(), id, body);
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.status(201).body(outcome.body());
            case INVALID_RATING, BOOKING_NOT_COMPLETED -> ResponseEntity.badRequest()
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case NOT_FOUND -> ResponseEntity.status(404)
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case FORBIDDEN -> ResponseEntity.status(403)
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case ALREADY_REVIEWED -> ResponseEntity.status(409)
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case INTERNAL_ERROR -> ResponseEntity.internalServerError().build();
        };
    }

    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<?> listReviews(
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {
        var page = reviewPublicCompositionService.listReviews(id, cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }
}
