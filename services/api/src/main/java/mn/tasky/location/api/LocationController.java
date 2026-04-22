package mn.tasky.location.api;

import mn.tasky.api.generated.LocationApi;
import mn.tasky.location.application.LocationService;
import mn.tasky.location.dto.LocationSearchResponse;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// DB errors (DataAccessException and others) propagate to the global handler in
// mn.tasky.common.api.ApiExceptionHandler, which maps them to 500 INTERNAL_ERROR via
// the catch-all @ExceptionHandler(Exception.class). No local try-catch needed here.
@RestController
@RequestMapping("/api/v1/location")
@Validated
@SuppressWarnings("unchecked")
public class LocationController implements LocationApi {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @Override
    @GetMapping("/reverse-geocode")
    public ResponseEntity<mn.tasky.api.generated.model.ReverseGeocodeResponse> reverseGeocode(
            @RequestParam(value = "lat", required = true) Double lat,
            @RequestParam(value = "lng", required = true) Double lng) {
        ReverseGeocodeResponse result = locationService.reverseGeocode(lat, lng);
        return (ResponseEntity<mn.tasky.api.generated.model.ReverseGeocodeResponse>)
                (ResponseEntity<?>) ResponseEntity.ok(result);
    }

    @Override
    @GetMapping("/search")
    public ResponseEntity<mn.tasky.api.generated.model.LocationSearchResponse> searchLocations(
            @RequestParam(value = "q", required = true) String q,
            @RequestParam(value = "bias_lat", required = false) Double biasLat,
            @RequestParam(value = "bias_lng", required = false) Double biasLng) {
        LocationSearchResponse result = locationService.search(q, biasLat, biasLng);
        return (ResponseEntity<mn.tasky.api.generated.model.LocationSearchResponse>)
                (ResponseEntity<?>) ResponseEntity.ok(result);
    }
}
