package mn.tasky.review.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTests {

    @Mock
    private BookingService bookingService;

    @Mock
    private AuthService authService;

    @Mock
    private ReviewDao reviewDao;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(bookingService, authService, reviewDao);
    }

    @Test
    void submitReviewRejectsInvalidRating() {
        ReviewSubmitResult result = reviewService.submitReview(
            uuid(),
            uuid(),
            0,
            "comment"
        );

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("INVALID_RATING");
    }

    @Test
    void submitReviewRejectsMissingBooking() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("BOOKING_NOT_FOUND");
    }

    @Test
    void submitReviewRejectsNonCompletedBooking() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking("ASSIGNED")));

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("BOOKING_NOT_COMPLETED");
    }

    @Test
    void submitReviewRejectsNonParticipant() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking("COMPLETED")));

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("NOT_PARTICIPANT");
    }

    @Test
    void submitReviewRejectsDuplicateReview() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndAuthorId(bookingId, booking.customerId())).thenReturn(true);

        ReviewSubmitResult result = reviewService.submitReview(booking.customerId(), bookingId, 5, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("ALREADY_REVIEWED");
    }

    @Test
    void submitReviewPersistsSanitizedCommentAndUpdatesStats() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndAuthorId(bookingId, booking.customerId())).thenReturn(false);

        ReviewSubmitResult result = reviewService.submitReview(
            booking.customerId(),
            bookingId,
            5,
            "  <b>Great</b>   job  "
        );

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.review()).isNotNull();
        assertThat(result.review().comment()).isEqualTo("Great job");
        assertThat(result.review().targetUserId()).isEqualTo(booking.taskerId());

        verify(reviewDao).insert(
            anyString(),
            eq(bookingId),
            eq(booking.customerId()),
            eq(booking.taskerId()),
            eq(5),
            eq("Great job"),
            any(Instant.class)
        );
        verify(authService).updateUserStats(eq(booking.taskerId()), anyInt(), anyBoolean());
    }

    @Test
    void listReviewsDelegatesToDao() {
        String userId = uuid();
        reviewService.listReviews(userId, null, 20);
        verify(reviewDao).findByTargetUserId(userId, null, 20);
    }

    @Test
    void submitReviewAsTaskerTargetsCustomer() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndAuthorId(bookingId, booking.taskerId())).thenReturn(false);

        ReviewSubmitResult result = reviewService.submitReview(booking.taskerId(), bookingId, 4, "Done");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.review().targetUserId()).isEqualTo(booking.customerId());
        verify(authService).updateUserStats(eq(booking.customerId()), anyInt(), anyBoolean());
    }

    @Test
    void invalidRatingDoesNotCallDependencies() {
        reviewService.submitReview(uuid(), uuid(), 9, "bad");

        verify(bookingService, never()).getBooking(anyString());
        verify(reviewDao, never()).insert(anyString(), anyString(), anyString(), anyString(), anyInt(), anyString(), any(Instant.class));
    }

    private BookingState booking(String status) {
        return new BookingState(
            uuid(),
            uuid(),
            uuid(),
            uuid(),
            10_000,
            status,
            null,
            false,
            Instant.now(),
            Instant.now()
        );
    }

    private String uuid() {
        return UUID.randomUUID().toString();
    }
}
