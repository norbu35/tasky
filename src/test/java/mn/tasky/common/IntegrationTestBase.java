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
        // Seed/config tables (categories, category_schema_versions, moderation_policy,
        // feature_toggles) and the Flyway history table are intentionally excluded.
        // The table list is resolved dynamically so schema changes don't break this.
        jdbcTemplate.execute(
                "DO $$ DECLARE t text; BEGIN "
                        + "SELECT string_agg(quote_ident(tablename), ', ') INTO t "
                        + "FROM pg_tables WHERE schemaname = 'public' "
                        + "AND tablename NOT IN ("
                        + "'flyway_schema_history','categories','category_schema_versions',"
                        + "'moderation_policy','feature_toggles',"
                        + "'districts',"
                        + "'spatial_ref_sys');"
                        + "IF t IS NOT NULL THEN "
                        + "EXECUTE 'TRUNCATE TABLE ' || t || ' RESTART IDENTITY CASCADE'; "
                        + "END IF; END $$");
    }
}
