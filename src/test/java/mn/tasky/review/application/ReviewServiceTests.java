package mn.tasky.review.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
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
        // Customer with quality=0 (invalid), punctuality=3, communication=3
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));

        ReviewSubmitResult result =
                reviewService.submitReview(booking.customerId(), bookingId, 0, 3, 3, null, null, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("INVALID_RATING");
    }

    private String uuid() {
        return UUID.randomUUID().toString();
    }

    @Test
    void submitReviewRejectsMissingBooking() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, 4, 5, null, null, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("BOOKING_NOT_FOUND");
    }

    @Test
    void submitReviewRejectsNonCompletedBooking() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking("ASSIGNED")));

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, 4, 5, null, null, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("BOOKING_NOT_COMPLETED");
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
                null,
                "DIRECT",
                false,
                null,
                Instant.now(),
                Instant.now());
    }

    @Test
    void submitReviewRejectsNonParticipant() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking("COMPLETED")));

        ReviewSubmitResult result = reviewService.submitReview(uuid(), bookingId, 5, 4, 5, null, null, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("NOT_PARTICIPANT");
    }

    @Test
    void submitReviewRejectsDuplicateReview() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndReviewerId(bookingId, booking.customerId()))
                .thenReturn(true);

        // Customer reviewing tasker: quality + punctuality + communication
        ReviewSubmitResult result =
                reviewService.submitReview(booking.customerId(), bookingId, 5, 4, 5, null, null, "comment");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("ALREADY_REVIEWED");
    }

    @Test
    void submitReviewPersistsSanitizedCommentAndUpdatesStats() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndReviewerId(bookingId, booking.customerId()))
                .thenReturn(false);

        // Customer reviewing tasker: quality=5, punctuality=4, communication=5
        ReviewSubmitResult result = reviewService.submitReview(
                booking.customerId(), bookingId, 5, 4, 5, null, null, "  <b>Great</b>   job  ");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.review()).isNotNull();
        assertThat(result.review().comment()).isEqualTo("Great job");
        assertThat(result.review().revieweeId()).isEqualTo(booking.taskerId());
        // Non-applicable fields nulled out
        assertThat(result.review().clarityRating()).isNull();
        assertThat(result.review().respectfulnessRating()).isNull();

        verify(reviewDao)
                .insert(
                        anyString(),
                        eq(bookingId),
                        eq(booking.customerId()),
                        eq(booking.taskerId()),
                        eq(5),
                        eq(4),
                        eq(5),
                        isNull(),
                        isNull(),
                        eq("Great job"),
                        any(Instant.class));
        // Average: (5+4+5)/3.0 = 4.666...
        verify(authService)
                .updateUserStats(eq(booking.taskerId()), doubleThat(d -> Math.abs(d - 14.0 / 3.0) < 0.001), eq(false));
    }

    @Test
    void listReviewsDelegatesToDao() {
        String userId = uuid();
        reviewService.listReviews(userId, null, 20);
        verify(reviewDao).findByRevieweeId(userId, null, 20);
    }

    @Test
    void submitReviewAsTaskerTargetsCustomer() {
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(reviewDao.existsByBookingIdAndReviewerId(bookingId, booking.taskerId()))
                .thenReturn(false);

        // Tasker reviewing customer: clarity=4, respectfulness=5, punctuality=4
        ReviewSubmitResult result =
                reviewService.submitReview(booking.taskerId(), bookingId, null, 4, null, 4, 5, "Done");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.review().revieweeId()).isEqualTo(booking.customerId());
        // Non-applicable fields nulled out
        assertThat(result.review().qualityRating()).isNull();
        assertThat(result.review().communicationRating()).isNull();
        // Average: (4+5+4)/3.0 = 4.333...
        verify(authService)
                .updateUserStats(
                        eq(booking.customerId()), doubleThat(d -> Math.abs(d - 13.0 / 3.0) < 0.001), eq(false));
    }

    @Test
    void invalidRatingDoesNotCallDependencies() {
        // Customer with quality=9 (invalid) -- but booking lookup happens first now
        String bookingId = uuid();
        BookingState booking = booking("COMPLETED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));

        reviewService.submitReview(booking.customerId(), bookingId, 9, 4, 5, null, null, "bad");

        verify(reviewDao, never())
                .insert(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        anyString(),
                        any(Instant.class));
    }
}
