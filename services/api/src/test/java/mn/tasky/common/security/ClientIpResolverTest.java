package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClientIpResolver")
class ClientIpResolverTest {

    @Mock
    private HttpServletRequest request;

    @Test
    @DisplayName("returns remote addr when trustedProxyDepth is 0")
    void depth0FallsBack() {
        ClientIpResolver resolver = new ClientIpResolver(0);
        when(request.getRemoteAddr()).thenReturn("1.2.3.4");

        assertThat(resolver.resolve(request)).isEqualTo("1.2.3.4");
    }

    @Test
    @DisplayName("returns remote addr when X-Forwarded-For is missing")
    void missingHeaderFallsBack() {
        ClientIpResolver resolver = new ClientIpResolver(1);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("5.6.7.8");

        assertThat(resolver.resolve(request)).isEqualTo("5.6.7.8");
    }

    @Test
    @DisplayName("returns remote addr when chain is shorter than proxy depth")
    void shortChainFallsBack() {
        ClientIpResolver resolver = new ClientIpResolver(3);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4, 5.6.7.8");
        when(request.getRemoteAddr()).thenReturn("9.9.9.9");

        assertThat(resolver.resolve(request)).isEqualTo("9.9.9.9");
    }

    @Test
    @DisplayName("extracts client IP from X-Forwarded-For with depth=1")
    void extractsClientIp() {
        ClientIpResolver resolver = new ClientIpResolver(1);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4, 5.6.7.8, proxy");

        assertThat(resolver.resolve(request)).isEqualTo("proxy");
    }

    @Test
    @DisplayName("extracts client IP from X-Forwarded-For with depth=2")
    void extractsClientIpDepth2() {
        ClientIpResolver resolver = new ClientIpResolver(2);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4, 5.6.7.8, proxy");

        assertThat(resolver.resolve(request)).isEqualTo("5.6.7.8");
    }

    @Test
    @DisplayName("falls back when extracted IP is blank")
    void blankExtractedFallsBack() {
        ClientIpResolver resolver = new ClientIpResolver(1);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4,  ");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(resolver.resolve(request)).isEqualTo("10.0.0.1");
    }

    @Test
    @DisplayName("returns unknown when remote addr is blank")
    void unknownWhenRemoteAddrBlank() {
        ClientIpResolver resolver = new ClientIpResolver(0);
        when(request.getRemoteAddr()).thenReturn("");

        assertThat(resolver.resolve(request)).isEqualTo("unknown");
    }
}
