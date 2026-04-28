package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewEnforcementCase;
import mn.tasky.review.publicapi.ReviewQueryPort;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewPublicCompositionService")
class ReviewPublicCompositionServiceTests {

    @Mock
    private TrustQueryPort trustQueryPort;

    @Mock
    private ReviewQueryPort reviewQueryPort;

    private ReviewPublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new ReviewPublicCompositionService(trustQueryPort, reviewQueryPort);
    }

    private Review review(String id, String bookingId, String reviewerId, String revieweeId) {
        return new Review(id, bookingId, reviewerId, revieweeId, 5, 4, 5, 4, 5, "Great work!", true, Instant.now());
    }

    @Nested
    @DisplayName("listReviews")
    class ListReviews {

        @Test
        @DisplayName("returns page with mapped reviews")
        void returnsPageWithReviews() {
            Review r1 = review("r-1", "b-1", "cust-1", "tasker-1");
            Review r2 = review("r-2", "b-2", "cust-2", "tasker-1");
            when(trustQueryPort.listReviews("tasker-1", null, 11)).thenReturn(List.of(r1, r2));

            ReviewPublicPage page = service.listReviews("tasker-1", null, 10);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("sets hasMore and nextCursor when results exceed limit")
        void setsHasMoreWhenExceedsLimit() {
            Review r1 = review("r-1", "b-1", "cust-1", "tasker-1");
            Review r2 = review("r-2", "b-2", "cust-2", "tasker-1");
            Review r3 = review("r-3", "b-3", "cust-3", "tasker-1");
            when(trustQueryPort.listReviews("tasker-1", null, 3)).thenReturn(List.of(r1, r2, r3));

            ReviewPublicPage page = service.listReviews("tasker-1", null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo("r-2");
        }

        @Test
        @DisplayName("returns empty page when no reviews")
        void returnsEmptyPage() {
            when(trustQueryPort.listReviews("tasker-1", null, 11)).thenReturn(List.of());

            ReviewPublicPage page = service.listReviews("tasker-1", null, 10);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }
    }

    @Nested
    @DisplayName("reviewResponse")
    class ReviewResponse {

        @Test
        @DisplayName("maps all Review fields to response map")
        void mapsAllFields() {
            Instant now = Instant.now();
            Review r = new Review("r-1", "b-1", "cust-1", "tasker-1", 5, 4, 5, 4, 5, "Excellent!", true, now);

            Map<String, Object> response = service.reviewResponse(r);

            assertThat(response).containsEntry("id", "r-1");
            assertThat(response).containsEntry("booking_id", "b-1");
            assertThat(response).containsEntry("reviewer_id", "cust-1");
            assertThat(response).containsEntry("reviewee_id", "tasker-1");
            assertThat(response).containsEntry("quality_rating", 5);
            assertThat(response).containsEntry("punctuality_rating", 4);
            assertThat(response).containsEntry("communication_rating", 5);
            assertThat(response).containsEntry("clarity_rating", 4);
            assertThat(response).containsEntry("respectfulness_rating", 5);
            assertThat(response).containsEntry("comment", "Excellent!");
            assertThat(response).containsEntry("created_at", now.toString());
        }
    }

    @Nested
    @DisplayName("getPendingReviewCases")
    class GetPendingReviewCases {

        @Test
        @DisplayName("returns mapped enforcement cases from port")
        void returnsMappedCases() {
            Instant now = Instant.now();
            ReviewEnforcementCase case1 =
                    new ReviewEnforcementCase("case-1", "b-1", "user-1", "UNPAID_REVIEW", "OPEN", false, now, null);
            when(reviewQueryPort.getOpenCases("user-1")).thenReturn(List.of(case1));

            List<Map<String, Object>> results = service.getPendingReviewCases("user-1");

            assertThat(results).hasSize(1);
            Map<String, Object> mapped = results.get(0);
            assertThat(mapped).containsEntry("id", "case-1");
            assertThat(mapped).containsEntry("booking_id", "b-1");
            assertThat(mapped).containsEntry("user_id", "user-1");
            assertThat(mapped).containsEntry("status", "OPEN");
            assertThat(mapped).containsEntry("triggered_at", now.toString());
            assertThat(mapped).containsEntry("resolved_at", null);
            assertThat(mapped).containsEntry("investigation_active", false);
        }

        @Test
        @DisplayName("returns empty list when no open cases")
        void returnsEmptyList() {
            when(reviewQueryPort.getOpenCases("user-2")).thenReturn(List.of());

            List<Map<String, Object>> results = service.getPendingReviewCases("user-2");

            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("includes resolved_at when case is resolved")
        void includesResolvedAt() {
            Instant now = Instant.now();
            Instant resolvedAt = now.plusSeconds(3600);
            ReviewEnforcementCase resolvedCase = new ReviewEnforcementCase(
                    "case-2", "b-2", "user-3", "UNPAID_REVIEW", "RESOLVED", false, now, resolvedAt);
            when(reviewQueryPort.getOpenCases("user-3")).thenReturn(List.of(resolvedCase));

            List<Map<String, Object>> results = service.getPendingReviewCases("user-3");

            assertThat(results.get(0)).containsEntry("resolved_at", resolvedAt.toString());
        }
    }
}
