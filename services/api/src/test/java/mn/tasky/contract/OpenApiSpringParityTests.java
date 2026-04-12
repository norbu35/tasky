package mn.tasky.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class OpenApiSpringParityTests {

    @Test
    @DisplayName("TID-TASK-112-CONTRACT-SPRING-PARITY live Spring MVC API paths are documented in OpenAPI")
    void liveSpringMvcApiPathsAreDocumented() throws IOException {
        Set<String> livePaths = OpenApiContractTestSupport.liveApiPaths();
        Set<String> documentedPaths =
                OpenApiContractTestSupport.documentedPaths(OpenApiContractTestSupport.readOpenApi());

        Set<String> undocumentedLivePaths = new TreeSet<>(livePaths);
        undocumentedLivePaths.removeAll(documentedPaths);

        assertThat(undocumentedLivePaths)
                .as("live API paths missing from docs/API.yaml")
                .isEmpty();
    }
}
