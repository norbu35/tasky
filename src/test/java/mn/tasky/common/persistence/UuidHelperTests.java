package mn.tasky.common.persistence;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UuidHelperTests {

    @Test
    void requiredReturnsUuidWhenValid() {
        String id = UUID.randomUUID()
            .toString();

        UUID result = UuidHelper.required(id,
            "userId");

        assertThat(result).isEqualTo(UUID.fromString(id));
    }

    @Test
    void requiredThrowsWhenMissing() {
        assertThatThrownBy(() -> UuidHelper.required(null,
            "userId"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Missing UUID for userId.");
    }

    @Test
    void requiredThrowsWhenInvalid() {
        assertThatThrownBy(() -> UuidHelper.required("not-a-uuid",
            "userId"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid UUID for userId: not-a-uuid");
    }

    @Test
    void optionalReturnsNullForMissingOrBlank() {
        assertThat(UuidHelper.optional(null)).isNull();
        assertThat(UuidHelper.optional("   ")).isNull();
    }

    @Test
    void optionalReturnsUuidWhenValid() {
        String id = UUID.randomUUID()
            .toString();

        UUID result = UuidHelper.optional(id);

        assertThat(result).isEqualTo(UUID.fromString(id));
    }

    @Test
    void optionalThrowsWhenInvalid() {
        assertThatThrownBy(() -> UuidHelper.optional("invalid"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid UUID: invalid");
    }
}
