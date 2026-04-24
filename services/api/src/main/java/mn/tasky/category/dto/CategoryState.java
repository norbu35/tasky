package mn.tasky.category.dto;

import org.springframework.lang.Nullable;

public record CategoryState(
        String id,
        String name,
        String nameMn,
        String iconUrl,
        boolean isActive,
        int sortOrder,
        @Nullable Boolean intakeEnabled,
        @Nullable Boolean assistedDistributionEnabled,
        @Nullable Integer intakeSchemaVersion,
        @Nullable String intakeSchemaJson) {}
