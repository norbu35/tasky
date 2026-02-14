package mn.tasky.review.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ReviewRequest(
    @JsonProperty("booking_id") String bookingId, 
    int rating, 
    String comment
) {}
