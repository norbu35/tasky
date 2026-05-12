package mn.tasky.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("BackupMetricsConfig")
class BackupMetricsConfigTest {

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("gauge returns 0 when metric file does not exist")
    void gaugeReturnsZeroWhenFileMissing() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        BackupMetricsConfig config = new BackupMetricsConfig(registry);
        ReflectionTestUtils.setField(config, "metricFilePath", tempDir.resolve("nonexistent"));
        config.registerBackupGauge();

        Double value =
                registry.get("tasky_backup_last_success_unixtime").gauge().value();
        assertThat(value).isEqualTo(0.0);
    }

    @Test
    @DisplayName("gauge reads timestamp from metric file")
    void gaugeReadsTimestamp() throws IOException {
        Path file = tempDir.resolve(".backup_success_timestamp");
        Files.writeString(file, "1715000000");

        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        BackupMetricsConfig config = new BackupMetricsConfig(registry);
        ReflectionTestUtils.setField(config, "metricFilePath", file);
        config.registerBackupGauge();

        Double value =
                registry.get("tasky_backup_last_success_unixtime").gauge().value();
        assertThat(value).isEqualTo(1715000000.0);
    }

    @Test
    @DisplayName("gauge returns 0 for unreadable content")
    void gaugeReturnsZeroForBadContent() throws IOException {
        Path file = tempDir.resolve(".backup_success_timestamp");
        Files.writeString(file, "not-a-number");

        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        BackupMetricsConfig config = new BackupMetricsConfig(registry);
        ReflectionTestUtils.setField(config, "metricFilePath", file);
        config.registerBackupGauge();

        Double value =
                registry.get("tasky_backup_last_success_unixtime").gauge().value();
        assertThat(value).isEqualTo(0.0);
    }
}
