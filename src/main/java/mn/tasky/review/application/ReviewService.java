package mn.tasky.review.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private final BookingService bookingService;
    private final AuthService authService;
    private final ReviewDao reviewDao;

    public ReviewService(BookingService bookingService,
                         AuthService authService,
                         ReviewDao reviewDao) {
        this.bookingService = bookingService;
        this.authService    = authService;
        this.reviewDao      = reviewDao;
    }

    public ReviewSubmitResult submitReview(String authorId,
                                           String bookingId,
                                           int rating,
                                           String comment) {
        if (rating < 1 || rating > 5) {
            return new ReviewSubmitResult(null,
                                          "INVALID_RATING");
        }

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return new ReviewSubmitResult(null,
                                          "BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        if (!"COMPLETED".equals(booking.status())) {
            return new ReviewSubmitResult(null,
                                          "BOOKING_NOT_COMPLETED");
        }

        String targetUserId;
        if (booking.customerId()
                .equals(authorId)) {
            targetUserId = booking.taskerId();
        } else if (booking.taskerId()
                .equals(authorId)) {
            targetUserId = booking.customerId();
        } else {
            return new ReviewSubmitResult(null,
                                          "NOT_PARTICIPANT");
        }

        if (reviewDao.existsByBookingIdAndAuthorId(bookingId,
                                                   authorId)) {
            return new ReviewSubmitResult(null,
                                          "ALREADY_REVIEWED");
        }

        String id = UUID.randomUUID()
                .toString();
        Instant now = Instant.now();
        String sanitizedComment = TextSanitizer.plainText(comment);
        Review review = new Review(id,
                                   bookingId,
                                   authorId,
                                   targetUserId,
                                   rating,
                                   sanitizedComment,
                                   now);
        reviewDao.insert(id,
                         bookingId,
                         authorId,
                         targetUserId,
                         rating,
                         sanitizedComment,
                         now);

        authService.updateUserStats(targetUserId,
                                    rating,
                                    false);

        return new ReviewSubmitResult(review,
                                      null);
    }

    public List<Review> listReviews(String userId,
                                    String cursor,
                                    int limit) {
        return reviewDao.findByTargetUserId(userId,
                                            cursor,
                                            limit);
    }
}
