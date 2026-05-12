package mn.tasky.auth.dao;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.UUID;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ConsentDao")
class ConsentDaoTest {

    @Test
    @DisplayName("recordConsent is annotated with SqlUpdate")
    void recordConsentHasAnnotation() throws NoSuchMethodException {
        Method m = ConsentDao.class.getMethod("recordConsent", UUID.class, String.class, String.class);
        assertThat(m.isAnnotationPresent(SqlUpdate.class)).isTrue();
    }

    @Test
    @DisplayName("hasConsented is annotated with SqlQuery")
    void hasConsentedHasAnnotation() throws NoSuchMethodException {
        Method m = ConsentDao.class.getMethod("hasConsented", UUID.class, String.class, String.class);
        assertThat(m.isAnnotationPresent(SqlQuery.class)).isTrue();
    }

    @Test
    @DisplayName("recordConsent SQL contains ON CONFLICT for idempotency")
    void recordConsentSqlIsIdempotent() throws NoSuchMethodException {
        Method m = ConsentDao.class.getMethod("recordConsent", UUID.class, String.class, String.class);
        String sql = m.getAnnotation(SqlUpdate.class).value();
        assertThat(sql).containsIgnoringCase("ON CONFLICT");
    }
}
