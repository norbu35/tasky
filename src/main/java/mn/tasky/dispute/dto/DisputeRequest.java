package mn.tasky.dispute.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DisputeRequest(@JsonProperty("booking_id") String bookingId, String reason) {}
