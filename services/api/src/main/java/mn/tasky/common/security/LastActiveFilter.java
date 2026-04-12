package mn.tasky.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import mn.tasky.auth.dao.ProfileDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Updates {@code profiles.last_active_at} on authenticated API requests.
 *
 * <p>The DB query includes a 2-minute throttle in its WHERE clause so repeated
 * requests within that window are no-ops. Errors are logged but never block the
 * request chain.
 */
@Component
public class LastActiveFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LastActiveFilter.class);

    private final ProfileDao profileDao;

    public LastActiveFilter(ProfileDao profileDao) {
        this.profileDao = profileDao;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/") || path.startsWith("/ws/") || "/ws".equals(path);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null
                    && authentication.isAuthenticated()
                    && authentication.getPrincipal() instanceof JwtPrincipal principal) {
                profileDao.touchLastActive(UUID.fromString(principal.userId()));
            }
        } catch (Exception e) {
            log.warn("Failed to update last_active_at: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
