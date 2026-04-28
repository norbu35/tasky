package mn.tasky.location.publicapi;

import mn.tasky.location.dto.ReverseGeocodeResponse;

public interface LocationQueryPort {
    ReverseGeocodeResponse reverseGeocode(double lat, double lng);

    boolean isWithinServiceArea(double lat, double lng);
}
