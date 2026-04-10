package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import mn.tasky.location.application.GeocodingProvider;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LocationFuzzingTests {

    @Test
    @DisplayName("reverseGeocode is deterministic: same input always returns same district")
    void reverseGeocodeIsDeterministic() {
        GeocodingProvider provider = mock(GeocodingProvider.class);
        when(provider.reverseGeocode(anyDouble(), anyDouble()))
                .thenReturn(new ReverseGeocodeResponse(
                        "Sukhbaatar, Ulaanbaatar", "Sukhbaatar", "Сүхбаатар",
                        47.9213, 106.9197));

        var r1 = provider.reverseGeocode(47.9200, 106.9200);
        var r2 = provider.reverseGeocode(47.9200, 106.9200);

        assertThat(r1.approximateLat()).isEqualTo(r2.approximateLat());
        assertThat(r1.approximateLng()).isEqualTo(r2.approximateLng());
        assertThat(r1.formattedAddress()).isEqualTo(r2.formattedAddress());
        assertThat(r1.formattedAddress()).doesNotContain("Fuzzed");
    }
}
