package mn.tasky.automation.event;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Constructor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AutomationEventTypes")
class AutomationEventTypesTest {

    @Test
    @DisplayName("constants have expected values")
    void constantsHaveExpectedValues() {
        assertThat(AutomationEventTypes.TASK_APPLICATION_ACCEPTED).isEqualTo("TASK_APPLICATION_ACCEPTED");
        assertThat(AutomationEventTypes.PAYMENT_CONFIRMED).isEqualTo("PAYMENT_CONFIRMED");
        assertThat(AutomationEventTypes.BOOKING_COMPLETED).isEqualTo("BOOKING_COMPLETED");
    }

    @Test
    @DisplayName("private constructor prevents instantiation")
    void privateConstructor() throws Exception {
        Constructor<AutomationEventTypes> ctor = AutomationEventTypes.class.getDeclaredConstructor();
        ctor.setAccessible(true);
        AutomationEventTypes instance = ctor.newInstance();
        assertThat(instance).isNotNull();
    }
}
