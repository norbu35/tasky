package mn.tasky.review.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import mn.tasky.api.generated.ReviewsApi;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.dto.ReviewRequest;
import mn.tasky.runtime.publicapi.composition.ReviewPublicCompositionService;
import mn.tasky.runtime.publicapi.composition.ReviewSubmissionOutcome;
import mn.tasky.runtime.publicapi.composition.ReviewSubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1")
@Validated
@SuppressWarnings("unchecked")
public class ReviewController implements ReviewsApi {

    private final ReviewPublicCompositionService reviewPublicCompositionService;
    private final ReviewSubmissionService reviewSubmissionService;
    private final ReviewEnforcementService reviewEnforcementService;

    public ReviewController(
            ReviewPublicCompositionService reviewPublicCompositionService,
            ReviewSubmissionService reviewSubmissionService,
            ReviewEnforcementService reviewEnforcementService) {
        this.reviewPublicCompositionService = reviewPublicCompositionService;
        this.reviewSubmissionService = reviewSubmissionService;
        this.reviewEnforcementService = reviewEnforcementService;
    }

    @Override
    @PostMapping(
            value = "/bookings/{id}/reviews",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.Review> submitReview(
            @PathVariable("id") UUID id,
            @Valid @RequestBody mn.tasky.api.generated.model.SubmitReviewRequest submitReviewRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        ReviewRequest domainBody = new ReviewRequest(
                submitReviewRequest.getQualityRating(),
                submitReviewRequest.getPunctualityRating(),
                submitReviewRequest.getCommunicationRating(),
                submitReviewRequest.getClarityRating(),
                submitReviewRequest.getRespectfulnessRating(),
                submitReviewRequest.getComment());
        ReviewSubmissionOutcome outcome =
                reviewSubmissionService.submitReview(principal.userId(), id.toString(), domainBody);
        return switch (outcome.status()) {
            case SUCCESS -> (ResponseEntity<mn.tasky.api.generated.model.Review>)
                    (ResponseEntity<?>) ResponseEntity.status(201).body(outcome.body());
            case INVALID_RATING, BOOKING_NOT_COMPLETED -> (ResponseEntity<mn.tasky.api.generated.model.Review>)
                    (ResponseEntity<?>) ResponseEntity.badRequest()
                            .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case NOT_FOUND -> (ResponseEntity<mn.tasky.api.generated.model.Review>) (ResponseEntity<?>)
                    ResponseEntity.status(404).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> (ResponseEntity<mn.tasky.api.generated.model.Review>) (ResponseEntity<?>)
                    ResponseEntity.status(403).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case ALREADY_REVIEWED -> (ResponseEntity<mn.tasky.api.generated.model.Review>) (ResponseEntity<?>)
                    ResponseEntity.status(409).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> (ResponseEntity<mn.tasky.api.generated.model.Review>)
                    (ResponseEntity<?>) ResponseEntity.status(500)
                            .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @Override
    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<mn.tasky.api.generated.model.GetUserReviews200Response> getUserReviews(
            @PathVariable("id") UUID id,
            @RequestParam(value = "cursor", required = false) @Nullable String cursor,
            @RequestParam(value = "limit", required = false, defaultValue = "20") @Min(1) @Max(100) Integer limit) {
        var page = reviewPublicCompositionService.listReviews(id.toString(), cursor, limit);
        var result = ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
        return (ResponseEntity<mn.tasky.api.generated.model.GetUserReviews200Response>) (ResponseEntity<?>) result;
    }

    @Override
    @GetMapping("/me/pending-reviews")
    public ResponseEntity<mn.tasky.api.generated.model.GetMyPendingReviews200Response> getMyPendingReviews() {
        JwtPrincipal principal = getPrincipal();
        var cases = reviewEnforcementService.getOpenCases(principal.userId());
        var data = cases.stream()
                .map(c -> {
                    var map = new java.util.LinkedHashMap<String, Object>();
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
                .collect(Collectors.toList());
        return (ResponseEntity<mn.tasky.api.generated.model.GetMyPendingReviews200Response>)
                (ResponseEntity<?>) ResponseEntity.ok(Map.of("data", data));
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private HttpServletRequest getRequest() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
