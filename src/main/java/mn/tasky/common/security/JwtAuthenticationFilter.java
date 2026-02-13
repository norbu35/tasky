package mn.tasky.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final List<String> PUBLIC_PATHS = List.of(
        "/error",
        "/actuator/health",
        "/actuator/info",
        "/actuator/prometheus",
        "/api/v1/system/version",
        "/api/v1/auth/otp/request",
        "/api/v1/auth/otp/verify",
        "/api/v1/auth/token/refresh"
    );

    private final JwtTokenService jwtTokenService;
    private final JsonSecurityResponseWriter responseWriter;

    public JwtAuthenticationFilter(
        JwtTokenService jwtTokenService,
        JsonSecurityResponseWriter responseWriter
    ) {
        this.jwtTokenService = jwtTokenService;
        this.responseWriter = responseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/actuator/")) {
            return true;
        }
        return PUBLIC_PATHS.contains(path);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        JwtPrincipal principal = jwtTokenService.parse(token).orElse(null);
        if (principal == null) {
            responseWriter.write(
                request,
                response,
                HttpStatus.UNAUTHORIZED.value(),
                "INVALID_TOKEN",
                "The provided JWT is invalid or expired."
            );
            return;
        }

        if ("BANNED".equals(principal.status())) {
            responseWriter.write(
                request,
                response,
                HttpStatus.FORBIDDEN.value(),
                "USER_BANNED",
                "This account has been banned."
            );
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + principal.role()))
            );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
