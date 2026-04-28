package mn.tasky.category.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ActivateSchemaVersionRequestTest {

    @Test
    @DisplayName("stores the requested activation mode")
    void storesRequestedActivationMode() {
        ActivateSchemaVersionRequest request = new ActivateSchemaVersionRequest("ROLLBACK_TO_LAST_KNOWN_GOOD");

        assertThat(request.mode()).isEqualTo("ROLLBACK_TO_LAST_KNOWN_GOOD");
    }
}
