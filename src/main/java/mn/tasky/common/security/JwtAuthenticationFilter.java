package mn.tasky.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mn.tasky.auth.application.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/error",
        "/actuator/health",
        "/actuator/info",
        "/api/v1/system/version",
        "/api/v1/auth/facebook",
        "/api/v1/auth/otp/request",
        "/api/v1/auth/otp/verify",
        "/api/v1/auth/token/refresh");
    private static final String DEV_AUTH_LOGIN_PATH = "/api/v1/auth/dev/login";

    private final JwtTokenService jwtTokenService;
    private final JsonSecurityResponseWriter responseWriter;
    private final AuthService authService;
    private final boolean devAuthEnabled;

    public JwtAuthenticationFilter(
        JwtTokenService jwtTokenService,
        JsonSecurityResponseWriter responseWriter,
        AuthService authService,
        @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled) {
        this.jwtTokenService = jwtTokenService;
        this.responseWriter = responseWriter;
        this.authService = authService;
        this.devAuthEnabled = devAuthEnabled;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return PUBLIC_PATHS.contains(path) || (devAuthEnabled && DEV_AUTH_LOGIN_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
        throws ServletException, IOException {
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
                "The provided JWT is invalid or expired.");
            return;
        }

        String effectiveStatus =
            authService.currentUserStatus(principal.userId()).orElse(principal.status());

        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            responseWriter.write(
                request,
                response,
                HttpStatus.FORBIDDEN.value(),
                "USER_BANNED",
                "This account is suspended or banned.");
            return;
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + principal.role())));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
