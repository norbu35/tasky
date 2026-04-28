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
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RestAccessDeniedHandler")
class RestAccessDeniedHandlerTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private JsonSecurityResponseWriter responseWriter;

    private RestAccessDeniedHandler handler;

    @BeforeEach
    void setUp() {
        handler = new RestAccessDeniedHandler(responseWriter);
    }

    @Test
    @DisplayName("writes FORBIDDEN response via responseWriter")
    void writesForbiddenResponse() throws Exception {
        AccessDeniedException exception = new AccessDeniedException("Access denied");

        handler.handle(request, response, exception);

        verify(responseWriter)
                .write(
                        request,
                        response,
                        HttpStatus.FORBIDDEN.value(),
                        "FORBIDDEN",
                        "Insufficient permissions for this action.");
    }
}
