package mn.tasky.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RestAuthenticationEntryPoint
    implements AuthenticationEntryPoint {

    private final JsonSecurityResponseWriter responseWriter;

    public RestAuthenticationEntryPoint(JsonSecurityResponseWriter responseWriter) {
        this.responseWriter = responseWriter;
    }

    @Override
    public void commence(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException authException
    ) throws IOException {
        responseWriter.write(
            request,
            response,
            HttpStatus.UNAUTHORIZED.value(),
            "UNAUTHORIZED",
            "Authentication is required."
        );
    }
}
