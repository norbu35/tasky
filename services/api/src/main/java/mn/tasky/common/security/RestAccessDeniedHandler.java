package mn.tasky.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonSecurityResponseWriter responseWriter;

    public RestAccessDeniedHandler(JsonSecurityResponseWriter responseWriter) {
        this.responseWriter = responseWriter;
    }

    @Override
    public void handle(
            HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        responseWriter.write(
                request,
                response,
                HttpStatus.FORBIDDEN.value(),
                "FORBIDDEN",
                "Insufficient permissions for this action.");
    }
}
