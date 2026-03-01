package mn.tasky.category.dto;

public record CategoryState(
    String id,
    String name,
    String nameMn,
    String iconUrl,
    boolean isActive,
    int sortOrder
) {

}
