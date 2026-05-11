package mn.tasky.common.security;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.time.Duration;
import java.time.Instant;
import mn.tasky.common.config.CacheConfig;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

/**
 * Token revocation list backed by Caffeine (hot path) + PostgreSQL (persistence).
 *
 * <p>Stores revoked JWT token IDs (jti claims). The Caffeine TTL matches the access
 * token lifetime (15 min). PostgreSQL provides durability across restarts and serves
 * as the source of truth when the in-memory cache is cold.
 */
@Service
public class TokenBlacklistService {

    private static final Object PRESENT = Boolean.TRUE;
    private static final Duration BLACKLIST_TTL = Duration.ofMinutes(15);

    private final Cache cache;
    private final TokenBlacklistDao dao;

    @SuppressFBWarnings(
            value = "CT_CONSTRUCTOR_THROW",
            justification = "Constructor validates required cache bean and must fail fast when misconfigured.")
    public TokenBlacklistService(CacheManager cacheManager, TokenBlacklistDao dao) {
        this.cache = cacheManager.getCache(CacheConfig.TOKEN_BLACKLIST_CACHE);
        if (this.cache == null) {
            throw new IllegalStateException("Cache '" + CacheConfig.TOKEN_BLACKLIST_CACHE + "' not configured");
        }
        this.dao = dao;
    }

    /** Records a jti as revoked in both Caffeine and PostgreSQL. No-op if jti is null or blank. */
    public void revoke(String jti) {
        if (jti != null && !jti.isBlank()) {
            cache.put(jti, PRESENT);
            dao.insert(jti, Instant.now().plus(BLACKLIST_TTL));
        }
    }

    /**
     * Returns {@code true} if the given jti has been explicitly revoked.
     * Checks Caffeine first (hot path); on cache miss falls through to PostgreSQL.
     */
    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        if (cache.get(jti) != null) {
            return true;
        }
        if (dao.exists(jti)) {
            cache.put(jti, PRESENT);
            return true;
        }
        return false;
    }
}
