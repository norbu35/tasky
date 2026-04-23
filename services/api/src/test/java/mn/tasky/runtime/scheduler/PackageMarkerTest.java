package mn.tasky.runtime.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

import java.lang.reflect.Constructor;
import org.junit.jupiter.api.Test;

class PackageMarkerTest {

    @Test
    void packageMarkerMethodCanBeInvokedWithoutError() {
        assertThatNoException().isThrownBy(PackageMarker::packageMarker);
    }

    @Test
    void constructorIsPrivate() throws Exception {
        Constructor<PackageMarker> ctor = PackageMarker.class.getDeclaredConstructor();
        assertThat(ctor.canAccess(null)).isFalse();
        ctor.setAccessible(true);
        PackageMarker instance = ctor.newInstance();
        assertThat(instance).isNotNull();
    }
}
