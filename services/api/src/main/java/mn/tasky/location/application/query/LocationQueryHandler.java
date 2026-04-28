package mn.tasky.location.application.query;

import mn.tasky.location.application.LocationService;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import mn.tasky.location.publicapi.LocationQueryPort;
import org.springframework.stereotype.Service;

@Service
public class LocationQueryHandler implements LocationQueryPort {

    private final LocationService locationService;

    public LocationQueryHandler(LocationService locationService) {
        this.locationService = locationService;
    }

    @Override
    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        return locationService.reverseGeocode(lat, lng);
    }

    @Override
    public boolean isWithinServiceArea(double lat, double lng) {
        return locationService.isWithinServiceArea(lat, lng);
    }
}
