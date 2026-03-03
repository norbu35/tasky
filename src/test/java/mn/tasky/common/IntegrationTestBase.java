package mn.tasky.common;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
        DockerImageName.parse("postgis/postgis:16-3.4")
            .asCompatibleSubstituteFor("postgres"))
        .withDatabaseName("tasky_test")
        .withUsername("tasky")
        .withPassword("tasky");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void registerDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
            POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username",
            POSTGRES::getUsername);
        registry.add("spring.datasource.password",
            POSTGRES::getPassword);
    }
}
