package mn.tasky.location.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ReverseGeocodeResponse(
        @JsonProperty("formatted_address") String formattedAddress,
        @JsonProperty("district") String district,
        @JsonProperty("district_mn") String districtMn,
        @JsonProperty("approximate_lat") double approximateLat,
        @JsonProperty("approximate_lng") double approximateLng) {}
