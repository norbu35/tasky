package mn.tasky.common;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
                    DockerImageName.parse("postgis/postgis:16-3.4").asCompatibleSubstituteFor("postgres"))
            .withDatabaseName("tasky_test")
            .withUsername("tasky")
            .withPassword("tasky");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void registerDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanTestState() {
        // Truncate all transactional tables before each test so that Gradle-daemon
        // or @DirtiesContext context restarts never carry over state from prior runs.
        // Flyway is schema-only in pre-production, so launch catalog/config fixtures
        // are recreated explicitly in test code after the reset.
        jdbcTemplate.execute("DO $$ DECLARE t text; BEGIN "
                + "SELECT string_agg(quote_ident(tablename), ', ') INTO t "
                + "FROM pg_tables WHERE schemaname = 'public' "
                + "AND tablename NOT IN ("
                + "'flyway_schema_history',"
                + "'spatial_ref_sys');"
                + "IF t IS NOT NULL THEN "
                + "EXECUTE 'TRUNCATE TABLE ' || t || ' RESTART IDENTITY CASCADE'; "
                + "END IF; END $$");
        seedLaunchCatalogFixtures();
        seedDistrictFixtures();
        seedConfigFixtures();
    }

    private void seedLaunchCatalogFixtures() {
        jdbcTemplate.execute(
                """
                WITH fixture_categories(id, name, name_mn, icon_url, sort_order, schema_json) AS (
                    VALUES
                    (
                        '00000000-0000-0000-0000-000000000101'::uuid,
                        'Cleaning',
                        'Цэвэрлэгээ',
                        'https://img.tasky.mn/cat/cleaning.svg',
                        1,
                        $$[
                          {
                            "key": "property_type",
                            "label": "Property type",
                            "label_mn": "Байрны төрөл",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {"value": "apartment", "label": "Apartment", "label_mn": "Орон сууц"},
                              {"value": "ger", "label": "Ger", "label_mn": "Гэр"},
                              {"value": "office", "label": "Office", "label_mn": "Оффис"},
                              {"value": "house", "label": "House", "label_mn": "Байшин"}
                            ]
                          },
                          {
                            "key": "size_or_rooms",
                            "label": "Number of rooms",
                            "label_mn": "Өрөөний тоо",
                            "type": "numeric_counter",
                            "required": true,
                            "min": 1,
                            "max": 10
                          },
                          {
                            "key": "cleaning_type",
                            "label": "Cleaning type",
                            "label_mn": "Цэвэрлэгээний төрөл",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {"value": "standard", "label": "Standard", "label_mn": "Стандарт"},
                              {"value": "deep_clean", "label": "Deep Clean", "label_mn": "Гүнзгий цэвэрлэгээ"}
                            ]
                          },
                          {
                            "key": "supplies_provided",
                            "label": "Supplies provided by customer",
                            "label_mn": "Хэрэглэгч тоног хэрэгсэл авчрах",
                            "type": "yes_no",
                            "required": true
                          }
                        ]$$::jsonb
                    ),
                    (
                        '00000000-0000-0000-0000-000000000102'::uuid,
                        'Furniture Assembly',
                        'Тавилга угсралт',
                        'https://img.tasky.mn/cat/furniture.svg',
                        2,
                        $$[
                          {
                            "key": "furniture_type",
                            "label": "Furniture type",
                            "label_mn": "Тавилгын төрөл",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {"value": "bed", "label": "Bed", "label_mn": "Ор"},
                              {"value": "wardrobe", "label": "Wardrobe", "label_mn": "Шкаф"}
                            ]
                          },
                          {
                            "key": "item_count",
                            "label": "Number of items",
                            "label_mn": "Эд зүйлийн тоо",
                            "type": "numeric_counter",
                            "required": true,
                            "min": 1,
                            "max": 10
                          },
                          {
                            "key": "delivered",
                            "label": "Is the furniture already delivered?",
                            "label_mn": "Тавилга хүргэгдсэн үү?",
                            "type": "yes_no",
                            "required": true
                          }
                        ]$$::jsonb
                    ),
                    (
                        '00000000-0000-0000-0000-000000000103'::uuid,
                        'Moving & Hauling',
                        'Зөөвөрлөлт',
                        'https://img.tasky.mn/cat/moving.svg',
                        3,
                        $$[
                          {
                            "key": "moving_scope",
                            "label": "Moving scope",
                            "label_mn": "Нүүлтийн хэмжээ",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {"value": "few_items", "label": "A few items", "label_mn": "Хэдхэн эд зүйл"},
                              {"value": "apartment", "label": "Apartment", "label_mn": "Орон сууц"}
                            ]
                          },
                          {
                            "key": "origin_floor",
                            "label": "Origin floor access",
                            "label_mn": "Гарах давхрын нэвтрэлт",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {"value": "ground", "label": "Ground", "label_mn": "1-р давхар"},
                              {"value": "elevator", "label": "Elevator", "label_mn": "Лифттэй"}
                            ]
                          },
                          {
                            "key": "heavy_lifting",
                            "label": "Heavy lifting required",
                            "label_mn": "Хүнд зүйл зөөх шаардлагатай",
                            "type": "yes_no",
                            "required": true
                          }
                        ]$$::jsonb
                    ),
                    (
                        '00000000-0000-0000-0000-000000000104'::uuid,
                        'Handyman',
                        'Гар ажил',
                        'https://img.tasky.mn/cat/handyman.svg',
                        4,
                        $$[
                          {
                            "key": "issue_type",
                            "label": "Type of work",
                            "label_mn": "Ажлын төрөл",
                            "type": "single_select",
                            "required": true,
                            "options": [
                              {
                                "value": "furniture_assembly",
                                "label": "Furniture assembly",
                                "label_mn": "Тавилга угсралт"
                              },
                              {"value": "wall_repair", "label": "Wall repair", "label_mn": "Хана засвар"}
                            ]
                          },
                          {
                            "key": "tools_needed",
                            "label": "Special tools needed",
                            "label_mn": "Тусгай хэрэгсэл шаардлагатай",
                            "type": "yes_no",
                            "required": true
                          },
                          {
                            "key": "estimated_hours",
                            "label": "Estimated hours",
                            "label_mn": "Тооцоолсон цаг",
                            "type": "numeric_counter",
                            "required": true,
                            "min": 1,
                            "max": 8
                          }
                        ]$$::jsonb
                    )
                )
                INSERT INTO categories (
                    id, name, name_mn, icon_url, is_active, sort_order,
                    intake_enabled, intake_schema_version, intake_schema_json,
                    assisted_distribution_enabled
                )
                SELECT id, name, name_mn, icon_url, true, sort_order, true, 1, schema_json, true
                FROM fixture_categories;

                INSERT INTO category_schema_versions (
                    category_id, version, schema_json, status, created_by, activated_at
                )
                SELECT id, 1, intake_schema_json, 'ACTIVE', null, now()
                FROM categories;
                """);
    }

    private void seedDistrictFixtures() {
        jdbcTemplate.execute(
                """
                INSERT INTO districts (name, name_mn, slug, centroid_lat, centroid_lng)
                VALUES
                    ('Bayangol', 'Баянгол', 'bayangol', 47.9133, 106.8684),
                    ('Bayanzurkh', 'Баянзүрх', 'bayanzurkh', 47.9322, 106.9856),
                    ('Chingeltei', 'Чингэлтэй', 'chingeltei', 47.9379, 106.8919),
                    ('Khan-Uul', 'Хан-Уул', 'khan-uul', 47.8766, 106.9782),
                    ('Songinokhairkhan', 'Сонгинохайрхан', 'songinokhairkhan', 47.9057, 106.7674),
                    ('Sukhbaatar', 'Сүхбаатар', 'sukhbaatar', 47.9213, 106.9197),
                    ('Nalaikh', 'Налайх', 'nalaikh', 47.7531, 107.3484),
                    ('Bagakhangai', 'Багахангай', 'bagakhangai', 47.8330, 108.3577),
                    ('Baganuur', 'Багануур', 'baganuur', 47.7597, 108.3512);
                """);
    }

    private void seedConfigFixtures() {
        jdbcTemplate.execute(
                """
                INSERT INTO moderation_policy (
                    id, strike_window_days, strike_threshold, first_suspension_days,
                    repeat_suspension_days, repeat_offense_window_days,
                    auto_unsuspend_enabled, updated_at
                )
                VALUES (1, 30, 3, 7, 14, 180, true, now());

                INSERT INTO feature_toggles (feature_name, is_enabled)
                VALUES
                    ('ai_scope_summary_enabled', false),
                    ('data_retention_dry_run', true),
                    ('escrow_enabled', false),
                    ('lead_fee_enabled', false),
                    ('subscription_enabled', false);
                """);
    }
}
