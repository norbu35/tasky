package mn.tasky.location.application;

import java.util.List;
import java.util.Locale;
import mn.tasky.location.dao.DistrictGeoDao;
import mn.tasky.location.dao.DistrictGeoDao.DistrictCentroid;
import mn.tasky.location.dto.LocationSearchResult;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.stereotype.Component;

/**
 * Launch-default geocoding backed by district centroids.
 * Returns the nearest UB district as the address approximation.
 */
@Component
public class DistrictGeocodingProvider implements GeocodingProvider {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DistrictGeocodingProvider.class);

    private final DistrictGeoDao districtGeoDao;

    public DistrictGeocodingProvider(DistrictGeoDao districtGeoDao) {
        this.districtGeoDao = districtGeoDao;
    }

    @Override
    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        List<DistrictCentroid> districts = districtGeoDao.findAllCentroids();
        DistrictCentroid nearest = findNearest(districts, lat, lng);
        return new ReverseGeocodeResponse(
                nearest.name() + ", Ulaanbaatar",
                nearest.name(),
                nearest.nameMn(),
                nearest.centroidLat(),
                nearest.centroidLng());
    }

    @Override
    public List<LocationSearchResult> search(String query, Double biasLat, Double biasLng) {
        List<DistrictCentroid> districts = districtGeoDao.findAllCentroids();
        String q = query.toLowerCase(Locale.ROOT);
        return districts.stream()
                .filter(d -> d.name().toLowerCase(Locale.ROOT).contains(q)
                        || d.nameMn().contains(query))
                .map(d -> new LocationSearchResult(
                        d.name() + ", Ulaanbaatar", d.centroidLat(), d.centroidLng(), d.name()))
                .toList();
    }

    private DistrictCentroid findNearest(List<DistrictCentroid> districts, double lat, double lng) {
        DistrictCentroid nearest = null;
        double minDist = Double.MAX_VALUE;
        for (DistrictCentroid d : districts) {
            double dLat = d.centroidLat() - lat;
            double dLng = d.centroidLng() - lng;
            double dist = dLat * dLat + dLng * dLng;
            if (dist < minDist) {
                minDist = dist;
                nearest = d;
            }
        }
        if (nearest == null) {
            log.warn("findAllCentroids returned empty list; falling back to UB center coordinates");
            return new DistrictCentroid("Ulaanbaatar", "Улаанбаатар", 47.9184, 106.9177);
        }
        return nearest;
    }
}
