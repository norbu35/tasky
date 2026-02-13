package mn.tasky.review;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.auth.AuthService;
import mn.tasky.booking.BookingService;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    private final BookingService bookingService;
    private final AuthService authService;
    private final ConcurrentHashMap<String, Review> reviewsById = new ConcurrentHashMap<>();

    public ReviewService(BookingService bookingService, AuthService authService) {
        this.bookingService = bookingService;
        this.authService = authService;
    }

    public ReviewSubmitResult submitReview(String authorId, String bookingId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            return new ReviewSubmitResult(null, "INVALID_RATING");
        }

        // 1. Verify booking
        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        // 2. Verify completed status
        if (!"COMPLETED".equals(booking.status())) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_COMPLETED");
        }

        // 3. Determine target user (reviewee)
        String targetUserId;
        if (booking.customerId().equals(authorId)) {
            targetUserId = booking.taskerId();
        } else if (booking.taskerId().equals(authorId)) {
            targetUserId = booking.customerId();
        } else {
            return new ReviewSubmitResult(null, "NOT_PARTICIPANT");
        }

        // 4. Check for existing review by author for this booking
        boolean alreadyReviewed = reviewsById.values().stream()
            .anyMatch(r -> r.bookingId().equals(bookingId) && r.authorId().equals(authorId));
        if (alreadyReviewed) {
            return new ReviewSubmitResult(null, "ALREADY_REVIEWED");
        }

        // 5. Create review
        Review review = new Review(
            UUID.randomUUID().toString(),
            bookingId,
            authorId,
            targetUserId,
            rating,
            comment,
            Instant.now()
        );
        reviewsById.put(review.id(), review);

        // 6. Update user stats
        // If author is customer, we increment tasker's completed count (only once per booking usually, 
        // but here let's stick to the requirement: "Pro badge assignment follows completed-count". 
        // Usually completion is recorded at booking completion time.
        // Let's assume completed count is updated at booking completion (not here), 
        // but rating is updated here.
        // Wait, AuthService.updateUserStats updates both. 
        // Let's just update rating here.
        authService.updateUserStats(targetUserId, rating, false);

        return new ReviewSubmitResult(review, null);
    }

    public List<Review> listReviews(String userId) {
        return reviewsById.values().stream()
            .filter(r -> r.targetUserId().equals(userId))
            .sorted(Comparator.comparing(Review::createdAt).reversed())
            .toList();
    }

    public record Review(
        String id,
        String bookingId,
        String authorId,
        String targetUserId,
        int rating,
        String comment,
        Instant createdAt
    ) {}

    public record ReviewSubmitResult(Review review, String error) {
        public boolean isSuccess() {
            return review != null;
        }
    }
}
