package mn.tasky.location.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LocationSearchResult(
        @JsonProperty("formatted_address") String formattedAddress,
        @JsonProperty("lat") double lat,
        @JsonProperty("lng") double lng,
        @JsonProperty("district") String district) {}
