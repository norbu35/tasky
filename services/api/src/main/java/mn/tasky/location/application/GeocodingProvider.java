package mn.tasky.location.application;

import java.util.List;
import mn.tasky.location.dto.LocationSearchResult;
import mn.tasky.location.dto.ReverseGeocodeResponse;

/**
 * Provider-agnostic geocoding. Launch default: district-centroid lookup.
 * Swap to Google/Geoapify/Mapbox after provider benchmarking by implementing
 * this interface and annotating it @Primary.
 */
public interface GeocodingProvider {

    ReverseGeocodeResponse reverseGeocode(double lat, double lng);

    boolean isWithinServiceArea(double lat, double lng);

    List<LocationSearchResult> search(String query, Double biasLat, Double biasLng);
}
