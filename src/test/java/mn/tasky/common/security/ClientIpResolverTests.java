package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTests {

    @Test
    void resolvesRemoteAddressWhenTrustedProxyDepthIsDisabled() {
        ClientIpResolver resolver = new ClientIpResolver(0);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.10");
        request.addHeader("X-Forwarded-For", "203.0.113.5");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.10");
    }

    @Test
    void fallsBackWhenForwardedHeaderIsMissingOrShorterThanTrustedDepth() {
        ClientIpResolver resolver = new ClientIpResolver(2);

        MockHttpServletRequest missingHeader = new MockHttpServletRequest();
        missingHeader.setRemoteAddr("198.51.100.11");
        assertThat(resolver.resolve(missingHeader)).isEqualTo("198.51.100.11");

        MockHttpServletRequest shortChain = new MockHttpServletRequest();
        shortChain.setRemoteAddr("198.51.100.12");
        shortChain.addHeader("X-Forwarded-For", "203.0.113.7");
        assertThat(resolver.resolve(shortChain)).isEqualTo("198.51.100.12");
    }

    @Test
    void returnsSelectedHopWhenForwardedChainHasTrustedProxyDepth() {
        ClientIpResolver resolver = new ClientIpResolver(2);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.13");
        request.addHeader("X-Forwarded-For", "203.0.113.8, 198.51.100.20");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.8");
    }

    @Test
    void fallsBackWhenSelectedForwardedHopIsBlankOrRemoteAddressMissing() {
        ClientIpResolver resolver = new ClientIpResolver(1);

        MockHttpServletRequest blankHop = new MockHttpServletRequest();
        blankHop.setRemoteAddr("198.51.100.14");
        blankHop.addHeader("X-Forwarded-For", "   ");
        assertThat(resolver.resolve(blankHop)).isEqualTo("198.51.100.14");

        MockHttpServletRequest unknownRemote = new MockHttpServletRequest();
        unknownRemote.setRemoteAddr("");
        unknownRemote.addHeader("X-Forwarded-For", "");
        assertThat(resolver.resolve(unknownRemote)).isEqualTo("unknown");
    }
}
