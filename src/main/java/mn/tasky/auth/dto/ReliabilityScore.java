package mn.tasky.auth.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record ReliabilityScore(
        String taskerId,
        double score,
        @Nullable Double completionRate,
        @Nullable Double punctualityRate,
        @Nullable Double cancellationRate,
        @Nullable Double reviewAvg,
        int windowDays,
        Instant computedAt) {}
