package mn.tasky.category.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

/**
 * Manages the lifecycle of category intake schema versions.
 * Supports creating draft schemas, activating versions, listing versions,
 * and rolling back to the last known good version.
 */
@Service
public class CategorySchemaVersionService {

    private static final Set<String> SUPPORTED_FIELD_TYPES =
            Set.of("single_select", "multi_select", "dropdown", "yes_no", "numeric_counter");

    private static final Set<String> OPTION_REQUIRED_TYPES = Set.of("single_select", "multi_select", "dropdown");

    private static final int MIN_FIELDS = 3;
    private static final int MAX_FIELDS = 5;

    private final CategorySchemaVersionDao schemaVersionDao;
    private final CategoryDao categoryDao;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public CategorySchemaVersionService(
            CategorySchemaVersionDao schemaVersionDao,
            CategoryDao categoryDao,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper) {
        this.schemaVersionDao = schemaVersionDao;
        this.categoryDao = categoryDao;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
    }

    /**
     * Creates a new draft schema version for the given category.
     *
     * @param categoryId the category to create a schema version for
     * @param schemaJson the JSON array of field definitions
     * @param createdBy  the user ID of the creator
     * @return the created schema version in DRAFT status
     * @throws IllegalArgumentException if schema validation fails
     */
    public CategorySchemaVersion createVersion(String categoryId, String schemaJson, String createdBy) {
        validateSchemaJson(schemaJson);

        int nextVersion = schemaVersionDao.findMaxVersion(categoryId).orElse(0) + 1;
        String id = UUID.randomUUID().toString();

        schemaVersionDao.insert(id, categoryId, nextVersion, schemaJson, "DRAFT", createdBy);

        auditEventDao.insert(
                createdBy,
                "SCHEMA_VERSION_CREATED",
                "category_schema_version",
                id,
                String.format("{\"category_id\":\"%s\",\"version\":%d}", categoryId, nextVersion));

        return schemaVersionDao
                .findByCategoryIdAndVersion(categoryId, nextVersion)
                .orElseThrow(
                        () -> new IllegalStateException("Schema version was inserted but could not be retrieved."));
    }

    /**
     * Activates a specific schema version for a category.
     * The current active version (if any) is rolled back, and the target version becomes ACTIVE.
     *
     * @param categoryId the category ID
     * @param version    the version number to activate
     * @return the activated schema version
     * @throws IllegalArgumentException if the version does not exist or is already active
     * @throws IllegalStateException    if the version is in an invalid status for activation
     */
    public CategorySchemaVersion activate(String categoryId, int version) {
        CategorySchemaVersion target = schemaVersionDao
                .findByCategoryIdAndVersion(categoryId, version)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Schema version " + version + " not found for category " + categoryId));

        String status = target.status();
        if ("ACTIVE".equals(status)) {
            throw new IllegalStateException("Schema version " + version + " is already active.");
        }
        if (!"DRAFT".equals(status) && !"CANARY".equals(status)) {
            throw new IllegalStateException("Schema version " + version + " cannot be activated from status " + status);
        }

        // Roll back current active version if one exists
        schemaVersionDao
                .findActiveByCategoryId(categoryId)
                .ifPresent(active -> schemaVersionDao.updateStatus(active.id(), "ROLLED_BACK"));

        // Activate the target version
        schemaVersionDao.updateStatusAndActivatedAt(target.id(), "ACTIVE");

        // Update the category with the activated schema
        CategoryState category = categoryDao
                .findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category " + categoryId + " not found."));

        categoryDao.update(
                category.id(),
                category.name(),
                category.nameMn(),
                category.iconUrl(),
                category.isActive(),
                category.sortOrder(),
                category.intakeEnabled(),
                version,
                target.schemaJson());

        return schemaVersionDao
                .findByCategoryIdAndVersion(categoryId, version)
                .orElseThrow(() -> new IllegalStateException("Activated version could not be retrieved."));
    }

    /**
     * Lists all schema versions for a category, ordered by version descending.
     *
     * @param categoryId the category ID
     * @return list of schema versions
     */
    public List<CategorySchemaVersion> listVersions(String categoryId) {
        return schemaVersionDao.findByCategoryId(categoryId);
    }

    private void validateSchemaJson(String schemaJson) {
        JsonNode root;
        try {
            root = objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Schema JSON is not valid JSON: " + e.getMessage(), e);
        }

        if (!root.isArray()) {
            throw new IllegalArgumentException("Schema JSON must be a JSON array of field definitions.");
        }

        int fieldCount = root.size();
        if (fieldCount < MIN_FIELDS || fieldCount > MAX_FIELDS) {
            throw new IllegalArgumentException("Schema must have between " + MIN_FIELDS + " and " + MAX_FIELDS
                    + " fields, got " + fieldCount + ".");
        }

        for (int i = 0; i < root.size(); i++) {
            JsonNode field = root.get(i);
            validateField(field, i);
        }
    }

    private void validateField(JsonNode field, int index) {
        if (!field.isObject()) {
            throw new IllegalArgumentException("Field at index " + index + " must be a JSON object.");
        }

        String key = requireString(field, "key", index);
        requireString(field, "label", index);

        String type = requireString(field, "type", index);
        if (!SUPPORTED_FIELD_TYPES.contains(type)) {
            throw new IllegalArgumentException("Field '" + key + "' has unsupported type '" + type
                    + "'. Supported types: " + SUPPORTED_FIELD_TYPES);
        }

        if (!field.has("required") || !field.get("required").isBoolean()) {
            throw new IllegalArgumentException("Field '" + key + "' must have a boolean 'required' property.");
        }

        if (OPTION_REQUIRED_TYPES.contains(type)) {
            JsonNode options = field.get("options");
            if (options == null || !options.isArray() || options.isEmpty()) {
                throw new IllegalArgumentException(
                        "Field '" + key + "' of type '" + type + "' must have a non-empty 'options' array.");
            }
        }
    }

    private String requireString(JsonNode field, String property, int index) {
        JsonNode node = field.get(property);
        if (node == null || !node.isTextual() || node.asText().isBlank()) {
            throw new IllegalArgumentException(
                    "Field at index " + index + " must have a non-blank string '" + property + "' property.");
        }
        return node.asText();
    }
}
