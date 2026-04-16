package mn.tasky.common.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfig {

    /**
     * Per-request user status cache (MED-3).
     * TTL 60 s — bans still take effect within one minute, far better than per-request DB round trip.
     */
    public static final String USER_STATUS_CACHE = "userStatus";

    /**
     * Revoked token blacklist (MED-1).
     * TTL matches the access token lifetime (15 min) so entries auto-expire once the token
     * would have been invalid anyway. Record the jti claim on explicit logout or ban.
     */
    public static final String TOKEN_BLACKLIST_CACHE = "tokenBlacklist";

    @Bean
    CacheManager cacheManager() {
        CaffeineCache userStatus = new CaffeineCache(
                USER_STATUS_CACHE,
                Caffeine.newBuilder()
                        .expireAfterWrite(Duration.ofSeconds(60))
                        .maximumSize(10_000)
                        .build());

        CaffeineCache tokenBlacklist = new CaffeineCache(
                TOKEN_BLACKLIST_CACHE,
                Caffeine.newBuilder()
                        .expireAfterWrite(Duration.ofMinutes(15))
                        .maximumSize(50_000)
                        .build());

        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(userStatus, tokenBlacklist));
        return manager;
    }
}
