package mn.tasky.location.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/reverse-geocode")
    public ResponseEntity<ReverseGeocodeResponse> reverseGeocode(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double lat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double lng) {
        return ResponseEntity.ok(locationService.reverseGeocode(lat, lng));
    }

    @GetMapping("/search")
    public ResponseEntity<LocationSearchResponse> search(
            @RequestParam @NotBlank String q,
            @RequestParam(value = "bias_lat", required = false) Double biasLat,
            @RequestParam(value = "bias_lng", required = false) Double biasLng) {
        return ResponseEntity.ok(locationService.search(q, biasLat, biasLng));
    }
}
