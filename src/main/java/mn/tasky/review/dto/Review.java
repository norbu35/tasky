package mn.tasky.review.dto;

import java.time.Instant;

public record Review(
    String id,
    String bookingId,
    String authorId,
    String targetUserId,
    int rating,
    String comment,
    Instant createdAt
) {}
