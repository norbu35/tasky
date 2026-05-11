package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import mn.tasky.common.config.CacheConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

@ExtendWith(MockitoExtension.class)
@DisplayName("TokenBlacklistService")
class TokenBlacklistServiceTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @Mock
    private TokenBlacklistDao tokenBlacklistDao;

    private TokenBlacklistService service;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.when(cacheManager.getCache(CacheConfig.TOKEN_BLACKLIST_CACHE))
                .thenReturn(cache);
        service = new TokenBlacklistService(cacheManager, tokenBlacklistDao);
    }

    @Test
    @DisplayName("constructor throws when cache not configured")
    void constructorThrowsOnMissingCache() {
        org.mockito.Mockito.when(cacheManager.getCache(CacheConfig.TOKEN_BLACKLIST_CACHE))
                .thenReturn(null);
        assertThatThrownBy(() -> new TokenBlacklistService(cacheManager, tokenBlacklistDao))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(CacheConfig.TOKEN_BLACKLIST_CACHE);
    }

    @Test
    @DisplayName("revoke stores jti in cache")
    void revokeStoresJti() {
        service.revoke("jti-123");
        verify(cache).put("jti-123", Boolean.TRUE);
    }

    @Test
    @DisplayName("revoke is no-op for null jti")
    void revokeNullNoop() {
        service.revoke(null);
        verifyNoInteractions(cache);
    }

    @Test
    @DisplayName("revoke is no-op for blank jti")
    void revokeBlankNoop() {
        service.revoke("   ");
        verifyNoInteractions(cache);
    }

    @Test
    @DisplayName("isRevoked returns true when cache contains jti")
    void isRevokedTrue() {
        org.mockito.Mockito.when(cache.get("jti-123")).thenReturn(() -> Boolean.TRUE);
        assertThat(service.isRevoked("jti-123")).isTrue();
    }

    @Test
    @DisplayName("isRevoked returns false when cache does not contain jti")
    void isRevokedFalse() {
        org.mockito.Mockito.when(cache.get("jti-123")).thenReturn(null);
        assertThat(service.isRevoked("jti-123")).isFalse();
    }

    @Test
    @DisplayName("isRevoked returns false for null jti")
    void isRevokedNull() {
        assertThat(service.isRevoked(null)).isFalse();
    }

    @Test
    @DisplayName("isRevoked returns false for blank jti")
    void isRevokedBlank() {
        assertThat(service.isRevoked("   ")).isFalse();
    }
}
