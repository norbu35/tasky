package mn.tasky.review.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private ReviewDao reviewDao;

    @Mock
    private ReviewEnforcementService reviewEnforcementService;

    @Mock
    private BadgeEvaluationService badgeEvaluationService;

    private ReviewService reviewService;

    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";
    private static final String BOOKING_ID = "booking-1";

    private BookingState completedBooking;
    private BookingState assignedBooking;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(
                bookingService, userProfileService, reviewDao, reviewEnforcementService, badgeEvaluationService);

        Instant now = Instant.now();
        completedBooking = new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                100,
                "COMPLETED",
                null,
                false,
                null,
                "SPLIT",
                false,
                null,
                0,
                null,
                now.minusSeconds(3600),
                now);

        assignedBooking = new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                100,
                "ASSIGNED",
                null,
                false,
                null,
                "SPLIT",
                false,
                null,
                0,
                null,
                now.minusSeconds(3600),
                now);
    }

    @Nested
    @DisplayName("submitReview")
    class SubmitReview {

        @Test
        @DisplayName("BOOKING_NOT_FOUND when booking does not exist")
        void submitReview_bookingNotFound() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.empty());

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("BOOKING_NOT_FOUND", result.error());
        }

        @Test
        @DisplayName("BOOKING_NOT_COMPLETED when booking is ASSIGNED")
        void submitReview_bookingNotCompleted() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("BOOKING_NOT_COMPLETED", result.error());
        }

        @Test
        @DisplayName("NOT_PARTICIPANT when user is neither customer nor tasker")
        void submitReview_notParticipant() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview("stranger", BOOKING_ID, 5, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("NOT_PARTICIPANT", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when customer omits quality rating")
        void submitReview_customerInvalidQuality() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, null, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when customer gives quality rating 0")
        void submitReview_customerZeroQuality() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 0, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when customer gives quality rating 6")
        void submitReview_customerQualityTooHigh() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 6, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when customer omits punctuality")
        void submitReview_customerMissingPunctuality() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, null, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when customer omits communication")
        void submitReview_customerMissingCommunication() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, 5, null, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when tasker omits clarity rating")
        void submitReview_taskerMissingClarity() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(TASKER_ID, BOOKING_ID, null, 5, null, null, 5, "Nice!", null);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when tasker omits respectfulness rating")
        void submitReview_taskerMissingRespectfulness() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(TASKER_ID, BOOKING_ID, null, 5, null, 5, null, "Nice!", null);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("INVALID_RATING when tasker omits punctuality rating")
        void submitReview_taskerMissingPunctuality() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));

            ReviewSubmitResult result =
                    reviewService.submitReview(TASKER_ID, BOOKING_ID, null, null, null, 5, 5, "Nice!", null);

            assertFalse(result.isSuccess());
            assertEquals("INVALID_RATING", result.error());
        }

        @Test
        @DisplayName("ALREADY_REVIEWED when duplicate review")
        void submitReview_alreadyReviewed() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(reviewDao.existsByBookingIdAndReviewerId(BOOKING_ID, CUSTOMER_ID))
                    .thenReturn(true);

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, 5, 5, null, null, "Great!", true);

            assertFalse(result.isSuccess());
            assertEquals("ALREADY_REVIEWED", result.error());
        }

        @Test
        @DisplayName("Success as customer reviewing tasker")
        void submitReview_successCustomerReviewingTasker() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(reviewDao.existsByBookingIdAndReviewerId(BOOKING_ID, CUSTOMER_ID))
                    .thenReturn(false);

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 4, 5, 4, null, null, "Great work!", true);

            assertTrue(result.isSuccess());
            assertNull(result.error());
            Review review = result.review();
            assertNotNull(review);
            assertEquals(CUSTOMER_ID, review.reviewerId());
            assertEquals(TASKER_ID, review.revieweeId());
            assertEquals(4, review.qualityRating());
            assertEquals(5, review.punctualityRating());
            assertEquals(4, review.communicationRating());
            assertNull(review.clarityRating());
            assertNull(review.respectfulnessRating());
            assertTrue(review.wouldBookAgain());

            verify(reviewDao)
                    .insert(
                            anyString(),
                            eq(BOOKING_ID),
                            eq(CUSTOMER_ID),
                            eq(TASKER_ID),
                            eq(4),
                            eq(5),
                            eq(4),
                            isNull(),
                            isNull(),
                            eq("Great work!"),
                            eq(true),
                            any(Instant.class));
            verify(userProfileService).updateUserStats(eq(TASKER_ID), eq((4 + 5 + 4) / 3.0), eq(false));
            verify(reviewEnforcementService).resolveCase(BOOKING_ID, CUSTOMER_ID);
            verify(badgeEvaluationService).evaluate(TASKER_ID);
        }

        @Test
        @DisplayName("Success as tasker reviewing customer")
        void submitReview_successTaskerReviewingCustomer() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(reviewDao.existsByBookingIdAndReviewerId(BOOKING_ID, TASKER_ID))
                    .thenReturn(false);

            ReviewSubmitResult result =
                    reviewService.submitReview(TASKER_ID, BOOKING_ID, null, 4, null, 5, 3, "Nice client!", null);

            assertTrue(result.isSuccess());
            assertNull(result.error());
            Review review = result.review();
            assertNotNull(review);
            assertEquals(TASKER_ID, review.reviewerId());
            assertEquals(CUSTOMER_ID, review.revieweeId());
            assertNull(review.qualityRating());
            assertEquals(4, review.punctualityRating());
            assertNull(review.communicationRating());
            assertEquals(5, review.clarityRating());
            assertEquals(3, review.respectfulnessRating());
            assertNull(review.wouldBookAgain());

            verify(reviewDao)
                    .insert(
                            anyString(),
                            eq(BOOKING_ID),
                            eq(TASKER_ID),
                            eq(CUSTOMER_ID),
                            isNull(),
                            eq(4),
                            isNull(),
                            eq(5),
                            eq(3),
                            eq("Nice client!"),
                            isNull(),
                            any(Instant.class));
            verify(userProfileService).updateUserStats(eq(CUSTOMER_ID), eq((5 + 3 + 4) / 3.0), eq(false));
            verify(reviewEnforcementService).resolveCase(BOOKING_ID, TASKER_ID);
            verify(badgeEvaluationService).evaluate(CUSTOMER_ID);
        }

        @Test
        @DisplayName("Comment is sanitized for HTML")
        void submitReview_sanitizesComment() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(reviewDao.existsByBookingIdAndReviewerId(BOOKING_ID, CUSTOMER_ID))
                    .thenReturn(false);

            ReviewSubmitResult result = reviewService.submitReview(
                    CUSTOMER_ID, BOOKING_ID, 5, 5, 5, null, null, "<script>alert('xss')</script> Bad comment", true);

            assertTrue(result.isSuccess());
            assertFalse(result.review().comment().contains("<script>"));
        }

        @Test
        @DisplayName("Null comment is accepted")
        void submitReview_nullComment() {
            when(bookingService.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(reviewDao.existsByBookingIdAndReviewerId(BOOKING_ID, CUSTOMER_ID))
                    .thenReturn(false);

            ReviewSubmitResult result =
                    reviewService.submitReview(CUSTOMER_ID, BOOKING_ID, 5, 5, 5, null, null, null, false);

            assertTrue(result.isSuccess());
            assertNull(result.review().comment());
        }
    }

    @Nested
    @DisplayName("listReviews")
    class ListReviews {

        @Test
        @DisplayName("Delegates to DAO with cursor and limit")
        void listReviews_delegatesToDao() {
            List<Review> expected = List.of(new Review(
                    "r-1", BOOKING_ID, CUSTOMER_ID, TASKER_ID, 5, 5, 5, null, null, "Great", true, Instant.now()));
            when(reviewDao.findByRevieweeId(TASKER_ID, "cursor-1", 10)).thenReturn(expected);

            List<Review> result = reviewService.listReviews(TASKER_ID, "cursor-1", 10);
            assertEquals(1, result.size());
            assertEquals("r-1", result.get(0).id());
            verify(reviewDao).findByRevieweeId(TASKER_ID, "cursor-1", 10);
        }

        @Test
        @DisplayName("Returns empty list from DAO")
        void listReviews_emptyList() {
            when(reviewDao.findByRevieweeId(TASKER_ID, null, 20)).thenReturn(List.of());
            List<Review> result = reviewService.listReviews(TASKER_ID, null, 20);
            assertTrue(result.isEmpty());
        }
    }
}
