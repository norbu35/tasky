package mn.tasky.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class MinClientVersionFilter extends OncePerRequestFilter {

    private final String minVersion;

    public MinClientVersionFilter(@Value("${tasky.client.min-version:}") String minVersion) {
        this.minVersion = (minVersion != null && !minVersion.isBlank()) ? minVersion : null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (minVersion != null) {
            response.setHeader("X-Minimum-Client-Version", minVersion);
        }
        filterChain.doFilter(request, response);
    }
}
