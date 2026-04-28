package mn.tasky.category.dto;

public record UpdateCategory(
        String name,
        String nameMn,
        String iconUrl,
        Boolean isActive,
        Integer sortOrder,
        Boolean intakeEnabled,
        Boolean assistedDistributionEnabled) {}
