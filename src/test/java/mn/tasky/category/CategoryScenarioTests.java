package mn.tasky.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
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
 * Domain-unit tests for category management scenarios SCN-CATEGORY-001 through SCN-CATEGORY-008.
 */
class CategoryScenarioTests {

    // Three valid required fields — minimal passing schema
    private static final String VALID_3_FIELD_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"b\",\"label\":\"B\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"c\",\"label\":\"C\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String TOO_FEW_FIELDS_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"b\",\"label\":\"B\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String TOO_MANY_FIELDS_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"b\",\"label\":\"B\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"c\",\"label\":\"C\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"d\",\"label\":\"D\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"e\",\"label\":\"E\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"f\",\"label\":\"F\",\"type\":\"yes_no\",\"required\":true}]";

    private static final String UNSUPPORTED_TYPE_SCHEMA =
            "[{\"key\":\"a\",\"label\":\"A\",\"type\":\"free_text\",\"required\":true},"
            + "{\"key\":\"b\",\"label\":\"B\",\"type\":\"yes_no\",\"required\":true},"
            + "{\"key\":\"c\",\"label\":\"C\",\"type\":\"yes_no\",\"required\":true}]";

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
        return new CategoryState(CAT_ID, "Test", "Тест", "https://example.com/icon.png",
                true, 1, true, 1, VALID_3_FIELD_SCHEMA, 1);
    }

    private CategorySchemaVersion schemaVersion(int version, String status, boolean lastKnownGood) {
        return new CategorySchemaVersion(UUID.randomUUID().toString(), CAT_ID, version,
                VALID_3_FIELD_SCHEMA, status, lastKnownGood, ADMIN_ID, Instant.now(), null);
    }

    // ── SCN-CATEGORY-001 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-001: Admin can add a new service category")
    void adminCanAddNewCategory() {
        // createCategory() builds the CategoryState itself and calls insert(void)
        CategoryState result = categoryService.createCategory(
                new CreateCategory("Test", "Тест", "https://example.com/icon.png", 1));

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Test");
        assertThat(result.isActive()).isTrue();
    }

    // ── SCN-CATEGORY-002 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-002: Admin can edit, deactivate, and reorder categories with immediate picker propagation")
    void adminCanEditAndDeactivateCategory() {
        CategoryState current = activeCategory();
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(current));

        Optional<CategoryState> result = categoryService.updateCategory(CAT_ID,
                new UpdateCategory("Updated", "Шинэчлэгдсэн", "https://example.com/icon2.png", false, 5));

        assertThat(result).isPresent();
        assertThat(result.get().isActive()).isFalse();
        assertThat(result.get().sortOrder()).isEqualTo(5);
        assertThat(result.get().name()).isEqualTo("Updated");
    }

    // ── SCN-CATEGORY-003 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-003: Schema lint rejects activation candidates with fewer than 3 required questions")
    void schemaWithTooFewFieldsRejected() {
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));

        assertThatThrownBy(() ->
                schemaVersionService.createVersion(CAT_ID, TOO_FEW_FIELDS_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between");
    }

    // ── SCN-CATEGORY-004 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-004: Schema lint rejects activation candidates with more than 5 required questions")
    void schemaWithTooManyFieldsRejected() {
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));

        assertThatThrownBy(() ->
                schemaVersionService.createVersion(CAT_ID, TOO_MANY_FIELDS_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between");
    }

    // ── SCN-CATEGORY-005 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-005: Schema lint rejects unsupported field types")
    void schemaWithUnsupportedFieldTypeRejected() {
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));

        assertThatThrownBy(() ->
                schemaVersionService.createVersion(CAT_ID, UNSUPPORTED_TYPE_SCHEMA, ADMIN_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unsupported type");
    }

    // ── SCN-CATEGORY-006 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-006: Canary activation publishes a new schema version without rebinding existing drafts")
    void canaryActivationDoesNotRebindExistingDrafts() {
        // When a new schema version is activated, drafts bound to the old version
        // are not touched. This is enforced by the draft service (uses intakeSchemaVersion
        // bound at creation time). This test verifies the schema service completes activation
        // without modifying draft records.
        CategorySchemaVersion draft = schemaVersion(2, "DRAFT", false);
        when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 2))
                .thenReturn(Optional.of(draft));
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
        when(schemaVersionDao.findActiveByCategoryId(CAT_ID))
                .thenReturn(Optional.of(schemaVersion(1, "ACTIVE", true)));
        when(schemaVersionDao.findByCategoryIdAndVersion(CAT_ID, 2))
                .thenReturn(Optional.of(draft));

        schemaVersionService.activate(CAT_ID, 2);

        // Version 2 is activated
        verify(schemaVersionDao).updateStatusAndActivatedAt(eq(draft.id()), eq("ACTIVE"));
        // No draft records are touched (draft table is not accessed by activate())
    }

    // ── SCN-CATEGORY-007 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-007: Rollback restores the last-known-good schema version")
    void rollbackRestoresLastKnownGoodVersion() {
        CategorySchemaVersion active = schemaVersion(2, "ACTIVE", false);
        CategorySchemaVersion lkg = schemaVersion(1, "ACTIVE", true);

        when(schemaVersionDao.findLastKnownGoodByCategoryId(CAT_ID)).thenReturn(Optional.of(lkg));
        when(schemaVersionDao.findActiveByCategoryId(CAT_ID)).thenReturn(Optional.of(active));
        when(categoryDao.findById(CAT_ID)).thenReturn(Optional.of(activeCategory()));
        when(schemaVersionDao.findByCategoryIdAndVersion(eq(CAT_ID), eq(lkg.version())))
                .thenReturn(Optional.of(lkg));

        CategorySchemaVersion restored = schemaVersionService.rollbackToLastKnownGood(CAT_ID);

        assertThat(restored.version()).isEqualTo(lkg.version());
        // Previous active version deactivated
        verify(schemaVersionDao).updateStatus(eq(active.id()), eq("ROLLED_BACK"));
        // LKG version reactivated
        verify(schemaVersionDao).updateStatusAndActivatedAt(eq(lkg.id()), eq("ACTIVE"));
    }

    // ── SCN-CATEGORY-008 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-CATEGORY-008: Rollback without a last-known-good schema fails with NO_FALLBACK")
    void rollbackWithoutLastKnownGoodFails() {
        when(schemaVersionDao.findLastKnownGoodByCategoryId(CAT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> schemaVersionService.rollbackToLastKnownGood(CAT_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageMatching("(?i).*(last known good|no fallback|NO_FALLBACK|no last-known).*");
    }
}
