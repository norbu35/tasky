package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverIntegrationTests {

    @Test
    @DisplayName("trusted proxy mode falls back when forwarded header is missing")
    void fallsBackWhenForwardedHeaderIsMissing() {
        ClientIpResolver resolver = new ClientIpResolver(2);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.30");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.30");
    }

    @Test
    @DisplayName("trusted proxy mode falls back when forwarded chain is shorter than trusted depth")
    void fallsBackWhenForwardedChainIsTooShort() {
        ClientIpResolver resolver = new ClientIpResolver(2);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.31");
        request.addHeader("X-Forwarded-For", "203.0.113.30");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.31");
    }

    @Test
    @DisplayName("trusted proxy mode returns the selected client hop from a valid forwarded chain")
    void returnsSelectedClientHop() {
        ClientIpResolver resolver = new ClientIpResolver(2);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.32");
        request.addHeader("X-Forwarded-For", "203.0.113.40, 198.51.100.40");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.40");
    }

    @Test
    @DisplayName("trusted proxy mode falls back when selected forwarded hop is blank")
    void fallsBackWhenSelectedHopIsBlank() {
        ClientIpResolver resolver = new ClientIpResolver(1);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.33");
        request.addHeader("X-Forwarded-For", "203.0.113.50,   ");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.33");
    }
}
