package mn.tasky.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class LocalizationIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TID-TASK-061-BE-LOCALE-RESOLUTION locale resolution with mn fallback")
    void localeResolution() {
        // 1. Default (should be mn)
        ResponseEntity<Map> res1 =
            restTemplate.getForEntity("http://localhost:" + port + "/api/v1/system/version", Map.class);
        assertThat(res1.getBody().get("status_localized").toString())
            .contains("\u0425\u0443\u0432\u0438\u043b\u0431\u0430" + "\u0440\u044b\u043d"); // Cyrillic

        // 2. Explicit en
        HttpHeaders headers2 = new HttpHeaders();
        headers2.set("Accept-Language", "en-US");
        ResponseEntity<Map> res2 = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
                HttpMethod.GET,
                new HttpEntity<>(headers2),
                Map.class);
        assertThat(res2.getBody().get("status_localized").toString()).contains("healthy");

        // 3. Unknown (should fallback to mn)
        HttpHeaders headers3 = new HttpHeaders();
        headers3.set("Accept-Language", "mn-MN");
        ResponseEntity<Map> res3 = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
                HttpMethod.GET,
                new HttpEntity<>(headers3),
                Map.class);
        assertThat(res3.getBody().get("status_localized").toString())
            .contains("\u0425\u0443\u0432\u0438\u043b\u0431\u0430" + "\u0440\u044b\u043d");
    }

    @Test
    @DisplayName("TID-TASK-061-WEB-MN-DEFAULT web app loads mn as default locale")
    void webDefaultLocale() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept-Language", "mn-MN,mn;q=0.9,en-US;q=0.8");
        ResponseEntity<Map> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class);
        assertThat(response.getBody().get("status_localized").toString())
            .contains("\u0425\u0443\u0432\u0438\u043b\u0431\u0430" + "\u0440\u044b\u043d");
    }

    @Test
    @DisplayName("TID-TASK-061-MOBILE-MN-DEFAULT mobile app loads mn as default locale and " + "cyrillic validated")
    void mobileDefaultLocale() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept-Language", "en-US;q=0.7,mn-MN;q=1.0");
        ResponseEntity<Map> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class);
        assertThat(response.getBody().get("status_localized").toString())
            .contains("\u0425\u0443\u0432\u0438\u043b\u0431\u0430" + "\u0440\u044b\u043d");
    }
}
