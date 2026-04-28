package mn.tasky.common.feature;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import mn.tasky.common.audit.AuditEventDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeatureToggleServiceTest {

    @Mock
    private FeatureToggleDao featureToggleDao;

    @Mock
    private AuditEventDao auditEventDao;

    private FeatureToggleService service;

    @BeforeEach
    void setUp() {
        service = new FeatureToggleService(featureToggleDao, auditEventDao, new ObjectMapper());
    }

    @Test
    @DisplayName("data_retention_dry_run defaults to enabled when no DB row exists")
    void dataRetentionDryRunDefaultsEnabledWhenMissing() {
        when(featureToggleDao.findByName("data_retention_dry_run")).thenReturn(Optional.empty());

        assertThat(service.isEnabled("data_retention_dry_run")).isTrue();
    }

    @Test
    @DisplayName("escrow_enabled defaults to disabled when no DB row exists")
    void escrowDefaultsDisabledWhenMissing() {
        when(featureToggleDao.findByName("escrow_enabled")).thenReturn(Optional.empty());

        assertThat(service.isEnabled("escrow_enabled")).isFalse();
    }

    @Test
    @DisplayName("persisted toggle rows override built-in defaults")
    void persistedRowsOverrideDefaults() {
        FeatureToggle row = new FeatureToggle(
                "toggle-1",
                "data_retention_dry_run",
                false,
                null,
                Instant.parse("2026-04-01T00:00:00Z"),
                "admin-1",
                Instant.parse("2026-04-01T00:00:00Z"));
        when(featureToggleDao.findByName("data_retention_dry_run")).thenReturn(Optional.of(row));

        assertThat(service.isEnabled("data_retention_dry_run")).isFalse();
    }
}
