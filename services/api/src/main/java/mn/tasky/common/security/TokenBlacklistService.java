package mn.tasky.common.security;

import mn.tasky.common.config.CacheConfig;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

/**
 * In-memory token revocation list backed by Caffeine (MED-1).
 *
 * <p>Stores revoked JWT token IDs (jti claims) with a 15-minute TTL that matches
 * the access token lifetime. Once the token would have naturally expired the
 * blacklist entry auto-evicts.
 *
 * <p>Scale note: this is a single-instance in-memory store. Migrate to a Redis
 * Set (bucket4j-redis or Spring Data Redis) if the deployment becomes multi-instance.
 */
@Service
public class TokenBlacklistService {

    private static final Object PRESENT = Boolean.TRUE;

    private final Cache cache;

    public TokenBlacklistService(CacheManager cacheManager) {
        this.cache = cacheManager.getCache(CacheConfig.TOKEN_BLACKLIST_CACHE);
        if (this.cache == null) {
            throw new IllegalStateException("Cache '" + CacheConfig.TOKEN_BLACKLIST_CACHE + "' not configured");
        }
    }

    /** Records a jti as revoked. No-op if jti is null or blank. */
    public void revoke(String jti) {
        if (jti != null && !jti.isBlank()) {
            cache.put(jti, PRESENT);
        }
    }

    /** Returns {@code true} if the given jti has been explicitly revoked. */
    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        return cache.get(jti) != null;
    }
}
