package mn.tasky.review.dto;

import java.time.Instant;

public record Review(
        String id,
        String bookingId,
        String reviewerId,
        String revieweeId,
        Integer qualityRating,
        Integer punctualityRating,
        Integer communicationRating,
        Integer clarityRating,
        Integer respectfulnessRating,
        String comment,
        Instant createdAt) {}
