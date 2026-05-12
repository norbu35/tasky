package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.time.Instant;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("TokenBlacklistDao")
class TokenBlacklistDaoTest {

    @Test
    @DisplayName("insert is annotated with SqlUpdate")
    void insertHasAnnotation() throws NoSuchMethodException {
        Method m = TokenBlacklistDao.class.getMethod("insert", String.class, Instant.class);
        assertThat(m.isAnnotationPresent(SqlUpdate.class)).isTrue();
    }

    @Test
    @DisplayName("exists is annotated with SqlQuery")
    void existsHasAnnotation() throws NoSuchMethodException {
        Method m = TokenBlacklistDao.class.getMethod("exists", String.class);
        assertThat(m.isAnnotationPresent(SqlQuery.class)).isTrue();
    }

    @Test
    @DisplayName("deleteExpired is annotated with SqlUpdate")
    void deleteExpiredHasAnnotation() throws NoSuchMethodException {
        Method m = TokenBlacklistDao.class.getMethod("deleteExpired", Instant.class);
        assertThat(m.isAnnotationPresent(SqlUpdate.class)).isTrue();
    }

    @Test
    @DisplayName("insert SQL contains ON CONFLICT for idempotency")
    void insertSqlIsIdempotent() throws NoSuchMethodException {
        Method m = TokenBlacklistDao.class.getMethod("insert", String.class, Instant.class);
        String sql = m.getAnnotation(SqlUpdate.class).value();
        assertThat(sql).containsIgnoringCase("ON CONFLICT");
    }
}
