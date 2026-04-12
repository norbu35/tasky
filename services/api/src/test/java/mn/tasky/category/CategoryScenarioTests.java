package mn.tasky.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.category.application.CategorySchemaVersionService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.dto.CreateCategory;
import mn.tasky.category.dto.UpdateCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for category management scenarios SCN-CATEGORY-001 through SCN-CATEGORY-011.
 */
class CategoryScenarioTests {

    // Three valid required fields — minimal passing schema (new contract with label_mn + structured options)
    private static final String VALID_3_FIELD_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String TOO_FEW_FIELDS_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String TOO_MANY_FIELDS_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"d\",\"label\":\"D\",\"label_mn\":\"D_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"e\",\"label\":\"E\",\"label_mn\":\"E_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"f\",\"label\":\"F\",\"label_mn\":\"F_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String UNSUPPORTED_TYPE_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"free_text\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String MISSING_LABEL_MN_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String VALID_TEXT_TEXTAREA_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"text\",\"required\":true,\"max_length\":200},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"textarea\",\"required\":false,\"max_length\":2000},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String TEXT_MISSING_MAX_LENGTH_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"text\",\"required\":true},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String INVALID_OPTIONS_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"label_mn\":\"A_mn\",\"type\":\"single_select\",\"required\":true,"
                    + "\"options\":[{\"value\":\"x\",\"label\":\"X\"}]},"
                    + "{\"key\":\"b\",\"label\":\"B\",\"label_mn\":\"B_mn\",\"type\":\"yes_no\",\"required\":true},"
                    + "{\"key\":\"c\",\"label\":\"C\",\"label_mn\":\"C_mn\",\"type\":\"yes_no\",\"required\":true}]";

    private CategoryDao categoryDao;
    private CategorySchemaVersionDao schemaVersionDao;
    private CategoryService categoryService;
    private CategorySchemaVersionService schemaVersionService;

    private static final String CAT_ID = UUID.randomUUID().toString();
    private static final String ADMIN_ID = "admin-1";

    @BeforeEach
    void setUp() {
        categoryDao = mock(CategoryDao.class);
        schemaVersionDao = mock(CategorySchemaVersionDao.class);
        categoryService = new CategoryService(categoryDao);
        schemaVersionService = new CategorySchemaVersionService(
                schemaVersionDao, categoryDao, mock(mn.tasky.common.audit.AuditEventDao.class), new ObjectMapper());
    }

    private CategoryState activeCategory() {
        return new CategoryState(
                CAT_ID, "Test", "Тест", "https://example.com/icon.png", true, 1, true, 1, VALID_3_FIELD_SCHEMA);
    }

    private CategorySchemaVersion schemaVersion(int version, String status) {
        return new CategorySchemaVersion(
                UUID.randomUUID().toString(),
                CAT_ID,
                version,
                VALID_3_FIELD_SCHEMA,
                status,
                ADMIN_ID,
                Instant.now(),
                null);
    }

    // ── SCN-CATEGORY-001 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-001: Admin can add a new service category")
    void adminCanAddNewCategory() {
        CategoryState result =
                categoryService.createCategory(new CreateCategory("Test", "Тест", "https://example.com/icon.png", 1));

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Test");
        assertThat(result.isActive()).isTrue();
    }

    // ── SCN-CATEGORY-002 ─────────────────────────────────────────────────────

    @Test
    @DisplayName(
            "SCN-CATEGORY-002: Admin can edit, deactivate, and reorder categories with immediate picker propagation")
    void adminCanEditAndDeactivateCategory() {
        CategoryState current = activeCategory();
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(current));

        Optional<CategoryState> result = categoryService.updateCategory(
                CAT_ID, new UpdateCategory("Updated", "Шинэчлэгдсэн", "https://example.com/icon2.png", false, 5));

        assertThat(result).isPresent();
        assertThat(result.get().isActive()).isFalse();
        assertThat(result.get().sortOrder()).isEqualTo(5);
        assertThat(result.get().name()).isEqualTo("Updated");
    }

    // ── SCN-CATEGORY-003 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-003: Schema lint rejects activation candidates with fewer than 3 required questions")
    void schemaWithTooFewFieldsRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, TOO_FEW_FIELDS_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between");
    }

    // ── SCN-CATEGORY-004 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-004: Schema lint rejects activation candidates with more than 5 required questions")
    void schemaWithTooManyFieldsRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, TOO_MANY_FIELDS_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between");
    }

    // ── SCN-CATEGORY-005 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-005: Schema lint rejects unsupported field types")
    void schemaWithUnsupportedFieldTypeRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, UNSUPPORTED_TYPE_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unsupported type");
    }

    // ── SCN-CATEGORY-006 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-006: Admin can activate a schema version, including from ROLLED_BACK status")
    void activationFromRolledBackStatusSucceeds() {
        CategorySchemaVersion rolledBack = schemaVersion(1, "ROLLED_BACK");
        when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 1)).thenReturn(Optional.of(rolledBack));
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
        when(schemaVersionDao.findActiveByCategoryId(CAT_ID)).thenReturn(Optional.of(schemaVersion(2, "ACTIVE")));

        schemaVersionService.activate(CAT_ID, 1);

        verify(schemaVersionDao).updateStatusAndActivatedAt(eq(rolledBack.id()), eq("ACTIVE"));
    }

    // ── SCN-CATEGORY-007 (new) ──────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-007: Schema with missing label_mn is rejected")
    void schemaWithMissingLabelMnRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, MISSING_LABEL_MN_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("label_mn");
    }

    // ── SCN-CATEGORY-008 (new) ──────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-008: Schema with text and textarea field types is accepted")
    void schemaWithTextAndTextareaTypesAccepted() {
        when(schemaVersionDao.findMaxVersion(CAT_ID)).thenReturn(Optional.of(0));
        when(schemaVersionDao.findByCategoryIdAndVersion(eq(CAT_ID), eq(1)))
                .thenReturn(Optional.of(schemaVersion(1, "DRAFT")));

        CategorySchemaVersion result = schemaVersionService.createVersion(CAT_ID, VALID_TEXT_TEXTAREA_SCHEMA, ADMIN_ID);

        assertThat(result).isNotNull();
    }

    // ── SCN-CATEGORY-009 ────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-009: Text field without max_length is rejected")
    void textFieldWithoutMaxLengthRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, TEXT_MISSING_MAX_LENGTH_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("max_length");
    }

    // ── SCN-CATEGORY-010 ────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-010: Activation from ROLLED_BACK status succeeds")
    void activateFromRolledBackStatus() {
        CategorySchemaVersion target = schemaVersion(1, "ROLLED_BACK");
        when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 1)).thenReturn(Optional.of(target));
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
        when(schemaVersionDao.findActiveByCategoryId(CAT_ID)).thenReturn(Optional.empty());

        schemaVersionService.activate(CAT_ID, 1);

        verify(schemaVersionDao).updateStatusAndActivatedAt(eq(target.id()), eq("ACTIVE"));
    }

    // ── SCN-CATEGORY-011 ────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-011: Option objects missing label_mn are rejected")
    void optionWithMissingLabelMnRejected() {
        assertThatThrownBy(() -> schemaVersionService.createVersion(CAT_ID, INVALID_OPTIONS_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("label_mn");
    }
}
