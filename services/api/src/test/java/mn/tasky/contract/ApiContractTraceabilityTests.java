package mn.tasky.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ApiContractTraceabilityTests {

    @Test
    @DisplayName("TID-TASK-002-API-VALIDATE OpenAPI contract baseline exists and declares " + "pagination primitives")
    void openApiContractBaselineIsPresent() throws Exception {
        Path apiPath = OpenApiContractTestSupport.resolveFromRepoRoot("docs/API.yaml");
        assertThat(apiPath).exists();

        String api = Files.readString(apiPath);
        assertThat(api)
                .contains("openapi: 3.0.3")
                .contains("servers:")
                .contains("- url: /api/v1")
                .contains("CursorParam:")
                .contains("LimitParam:");
    }

    @Test
    @DisplayName("TID-TASK-002-SDK-GENERATE generated TypeScript SDK is wired to OpenAPI outputs")
    void sdkGeneratedOutputsAreWired() throws Exception {
        Path generatedTypes = OpenApiContractTestSupport.resolveFromRepoRoot("packages/sdk/src/generated/api-types.ts");
        Path sdkIndex = OpenApiContractTestSupport.resolveFromRepoRoot("packages/sdk/src/index.ts");

        assertThat(generatedTypes).exists();
        assertThat(sdkIndex).exists();
        assertThat(Files.readString(sdkIndex)).contains("export * from \"./generated/api-types\"");
    }

    @Test
    @DisplayName("TID-TASK-002-CI-CONTRACT-DRIFT CI drift gate script enforces generated SDK " + "parity")
    void contractDriftGateScriptExists() throws Exception {
        Path driftScript =
                OpenApiContractTestSupport.resolveFromRepoRoot("tooling/scripts/validate-sdk-contract-drift.sh");
        assertThat(driftScript).exists();

        String script = Files.readString(driftScript);
        assertThat(script)
                .contains("target_file=\"packages/sdk/src/generated/api-types.ts\"")
                .contains("pnpm sdk:generate")
                .contains("SDK contract drift detected");
    }

    @Test
    @DisplayName("TID-TASK-065-CONTRACT-LIST-ENDPOINTS list endpoints expose cursor + limit " + "contract parameters")
    void listEndpointsExposeCursorAndLimitContract() throws Exception {
        String api = OpenApiContractTestSupport.readOpenApi();

        List<String> listEndpoints = List.of(
                "/categories",
                "/tasks",
                "/bookings",
                "/users/{id}/reviews",
                "/conversations",
                "/conversations/{id}/messages",
                "/admin/users",
                "/admin/verifications/pending",
                "/admin/disputes",
                "/admin/categories");

        for (String endpoint : listEndpoints) {
            String block = endpointBlock(api, endpoint);
            assertThat(block)
                    .as("endpoint %s must include cursor parameter", endpoint)
                    .contains("#/components/parameters/CursorParam");
            assertThat(block)
                    .as("endpoint %s must include limit parameter", endpoint)
                    .contains("#/components/parameters/LimitParam");
        }
    }

    @Test
    @DisplayName("TID-TASK-112-CONTRACT-DEFERRED-METADATA spec-only endpoints declare explicit deferral metadata")
    void specOnlyEndpointsDeclareExplicitDeferralMetadata() throws Exception {
        String api = OpenApiContractTestSupport.readOpenApi();
        var deferredPaths = OpenApiContractTestSupport.documentedPaths(api);
        deferredPaths.removeAll(OpenApiContractTestSupport.liveApiPaths());

        assertThat(deferredPaths)
                .as("expected at least one deferred endpoint in the OpenAPI spec")
                .isNotEmpty();

        for (String path : deferredPaths) {
            String block = OpenApiContractTestSupport.endpointBlock(api, path);
            assertThat(block)
                    .as("deferred endpoint %s must declare x-tasky-status", path)
                    .contains("x-tasky-status: deferred");
            assertThat(block)
                    .as("deferred endpoint %s must declare x-tasky-target-phase", path)
                    .contains("x-tasky-target-phase:");
        }
    }

    private String endpointBlock(String api, String endpoint) {
        return OpenApiContractTestSupport.endpointBlock(api, endpoint);
    }
}
