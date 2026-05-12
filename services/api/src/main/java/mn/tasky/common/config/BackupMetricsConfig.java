package mn.tasky.common.config;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BackupMetricsConfig {

    private static final Logger log = LoggerFactory.getLogger(BackupMetricsConfig.class);

    private final MeterRegistry registry;

    @Value("${tasky.backup.metric-file:/backups/.backup_success_timestamp}")
    private Path metricFilePath;

    public BackupMetricsConfig(MeterRegistry registry) {
        this.registry = registry;
    }

    @PostConstruct
    void registerBackupGauge() {
        Gauge.builder("tasky_backup_last_success_unixtime", this, cfg -> {
                    try {
                        if (Files.exists(cfg.metricFilePath)) {
                            String content =
                                    Files.readString(cfg.metricFilePath).trim();
                            return Double.parseDouble(content);
                        }
                    } catch (Exception e) {
                        log.debug("Backup metric file not readable: {}", e.getMessage());
                    }
                    return 0.0;
                })
                .description("Unix timestamp of last successful backup")
                .register(registry);
    }
}
