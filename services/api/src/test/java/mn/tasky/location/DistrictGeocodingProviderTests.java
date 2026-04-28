package mn.tasky.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.location.application.DistrictGeocodingProvider;
import mn.tasky.location.dao.DistrictGeoDao;
import mn.tasky.location.dao.DistrictGeoDao.DistrictCentroid;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DistrictGeocodingProviderTests {

    private DistrictGeoDao districtGeoDao; // NOPMD SingularField
    private DistrictGeocodingProvider provider;

    @BeforeEach
    void setUp() {
        districtGeoDao = mock(DistrictGeoDao.class);
        provider = new DistrictGeocodingProvider(districtGeoDao);

        when(districtGeoDao.findAllCentroids())
                .thenReturn(List.of(
                        new DistrictCentroid("Sukhbaatar", "Сүхбаатар", 47.9213, 106.9197),
                        new DistrictCentroid("Bayangol", "Баянгол", 47.9133, 106.8684),
                        new DistrictCentroid("Chingeltei", "Чингэлтэй", 47.9379, 106.8919)));
    }

    @Test
    @DisplayName("reverseGeocode returns nearest district for point near Sukhbaatar")
    void reverseGeocodeNearSukhbaatar() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(result.district()).isEqualTo("Sukhbaatar");
        assertThat(result.districtMn()).isEqualTo("Сүхбаатар");
        assertThat(result.formattedAddress()).isEqualTo("Sukhbaatar, Ulaanbaatar");
    }

    @Test
    @DisplayName("reverseGeocode returns nearest district for point near Bayangol")
    void reverseGeocodeNearBayangol() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9100, 106.8700);

        assertThat(result.district()).isEqualTo("Bayangol");
        assertThat(result.formattedAddress()).isEqualTo("Bayangol, Ulaanbaatar");
    }

    @Test
    @DisplayName("approximate location uses district centroid, not original point")
    void approximateLocationUsesDistrictCentroid() {
        ReverseGeocodeResponse result = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(result.approximateLat()).isEqualTo(47.9213);
        assertThat(result.approximateLng()).isEqualTo(106.9197);
    }

    @Test
    @DisplayName("service area accepts coordinates within launch Ulaanbaatar bounds")
    void serviceAreaAcceptsUlaanbaatarCoordinates() {
        assertThat(provider.isWithinServiceArea(47.9200, 106.9200)).isTrue();
    }

    @Test
    @DisplayName("service area rejects coordinates outside launch Ulaanbaatar bounds")
    void serviceAreaRejectsOutsideUlaanbaatarCoordinates() {
        assertThat(provider.isWithinServiceArea(49.4867, 105.9228)).isFalse();
    }

    @Test
    @DisplayName("search filters by name substring (English)")
    void searchFiltersByEnglishName() {
        var results = provider.search("sukh", null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).district()).isEqualTo("Sukhbaatar");
    }

    @Test
    @DisplayName("search returns empty list for no matches")
    void searchReturnsEmptyForNoMatch() {
        var results = provider.search("nomatch", null, null);

        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("search filters by Mongolian name substring")
    void searchFiltersByMongolianName() {
        var results = provider.search("Сүхбаатар", null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).district()).isEqualTo("Sukhbaatar");
    }
}
