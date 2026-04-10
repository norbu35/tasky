package mn.tasky.location.application;

import mn.tasky.location.dto.LocationSearchResponse;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

    private final GeocodingProvider geocodingProvider;

    public LocationService(GeocodingProvider geocodingProvider) {
        this.geocodingProvider = geocodingProvider;
    }

    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        return geocodingProvider.reverseGeocode(lat, lng);
    }

    public LocationSearchResponse search(String query, Double biasLat, Double biasLng) {
        return new LocationSearchResponse(geocodingProvider.search(query, biasLat, biasLng));
    }
}
