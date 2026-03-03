package mn.tasky.contract;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ApiContractTraceabilityTests {

    @Test
    @DisplayName("TID-TASK-002-API-VALIDATE OpenAPI contract baseline exists and declares " + "pagination primitives")
    void openApiContractBaselineIsPresent() throws Exception {
        Path apiPath = Path.of("docs/API.yaml");
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
        Path generatedTypes = Path.of("packages/sdk/src/generated/api-types.ts");
        Path sdkIndex = Path.of("packages/sdk/src/index.ts");

        assertThat(generatedTypes).exists();
        assertThat(sdkIndex).exists();
        assertThat(Files.readString(sdkIndex)).contains("export * from \"./generated/api-types\"");
    }

    @Test
    @DisplayName("TID-TASK-002-CI-CONTRACT-DRIFT CI drift gate script enforces generated SDK " + "parity")
    void contractDriftGateScriptExists() throws Exception {
        Path driftScript = Path.of("scripts/validate-sdk-contract-drift.sh");
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
        String api = Files.readString(Path.of("docs/API.yaml"));

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
            String block = endpointBlock(api,
                endpoint);
            assertThat(block)
                .as("endpoint %s must include cursor parameter",
                    endpoint)
                .contains("#/components/parameters/CursorParam");
            assertThat(block)
                .as("endpoint %s must include limit parameter",
                    endpoint)
                .contains("#/components/parameters/LimitParam");
        }
    }

    private String endpointBlock(String api, String endpoint) {
        String marker = "  " + endpoint + ":";
        int start = api.indexOf(marker);
        assertThat(start).as("endpoint marker should exist: %s",
                endpoint)
            .isGreaterThanOrEqualTo(0);

        int next = api.indexOf("\n  /",
            start + marker.length());
        if (next < 0) {
            return api.substring(start);
        }
        return api.substring(start,
            next);
    }
}
