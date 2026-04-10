package mn.tasky.location;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SuppressWarnings({"rawtypes", "unchecked"})
class LocationApiTests extends IntegrationTestBase {

    private final TestRestTemplate http = new TestRestTemplate();

    @LocalServerPort
    private int port;

    private String custToken;

    @BeforeEach
    void auth() {
        custToken = devLogin("+97692000001", "CUSTOMER");
    }

    @Test
    @DisplayName("GET /location/reverse-geocode returns district-level address for UB coordinates")
    void reverseGeocodeReturnsDistrict() {
        ResponseEntity<Map> response = getWithToken("/api/v1/location/reverse-geocode?lat=47.92&lng=106.92");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("formatted_address");
        assertThat(response.getBody()).containsKey("district");
        assertThat(response.getBody().get("formatted_address").toString()).contains("Ulaanbaatar");
    }

    @Test
    @DisplayName("GET /location/reverse-geocode requires authentication")
    void reverseGeocodeRequiresAuth() {
        ResponseEntity<Map> response = http.exchange(
                url("/api/v1/location/reverse-geocode?lat=47.92&lng=106.92"),
                HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("GET /location/search returns results for known district name")
    void searchReturnsDistricts() {
        ResponseEntity<Map> response = getWithToken("/api/v1/location/search?q=sukh");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("results");
    }

    @Test
    @DisplayName("GET /location/search returns empty results for unknown query")
    void searchReturnsEmptyForUnknown() {
        ResponseEntity<Map> response = getWithToken("/api/v1/location/search?q=xxxxunknown");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        var results = (java.util.List) response.getBody().get("results");
        assertThat(results).isEmpty();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String devLogin(String phone, String role) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> resp = http.postForEntity(url("/api/v1/auth/dev/login"),
                new HttpEntity<>(Map.of("phone", phone, "role", role), h), Map.class);
        return (String) resp.getBody().get("access_token");
    }

    private ResponseEntity<Map> getWithToken(String path) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(custToken);
        return http.exchange(url(path), HttpMethod.GET, new HttpEntity<>(h), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
