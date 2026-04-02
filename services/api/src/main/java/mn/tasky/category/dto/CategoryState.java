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
        @Nullable Integer intakeSchemaVersion,
        @Nullable String intakeSchemaJson,
        @Nullable Integer lastKnownGoodSchemaVersion) {}
