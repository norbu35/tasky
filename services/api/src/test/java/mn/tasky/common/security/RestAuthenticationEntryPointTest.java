package mn.tasky.common.security;

import static org.mockito.Mockito.verify;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RestAuthenticationEntryPoint")
class RestAuthenticationEntryPointTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private JsonSecurityResponseWriter responseWriter;

    private RestAuthenticationEntryPoint entryPoint;

    @BeforeEach
    void setUp() {
        entryPoint = new RestAuthenticationEntryPoint(responseWriter);
    }

    @Test
    @DisplayName("writes UNAUTHORIZED response via responseWriter")
    void writesUnauthorizedResponse() throws Exception {
        AuthenticationException exception = new AuthenticationException("Not authenticated") {};

        entryPoint.commence(request, response, exception);

        verify(responseWriter)
                .write(
                        request,
                        response,
                        HttpStatus.UNAUTHORIZED.value(),
                        "UNAUTHORIZED",
                        "Authentication is required.");
    }
}
