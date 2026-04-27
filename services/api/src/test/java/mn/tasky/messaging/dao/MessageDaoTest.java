package mn.tasky.messaging.dao;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Locale;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("MessageDao")
class MessageDaoTest {

    @Test
    @DisplayName("orders message pages by sent_at and id for deterministic newest-first history")
    void ordersMessagePagesBySentAtAndId() {
        String firstPageSql = queryFor("findByConversationIdFirstPage");
        String cursorPageSql = queryFor("findByConversationIdAfterCursor");

        assertThat(normalize(firstPageSql)).contains("order by sent_at desc, id desc");
        assertThat(normalize(cursorPageSql))
                .contains("sent_at < :cursorsentat")
                .contains("sent_at = :cursorsentat and id < :cursorid")
                .contains("order by sent_at desc, id desc");
    }

    private static String queryFor(String methodName) {
        return Arrays.stream(MessageDao.class.getDeclaredMethods())
                .filter(method -> method.getName().equals(methodName))
                .findFirst()
                .map(MessageDaoTest::sqlQueryValue)
                .orElseThrow();
    }

    private static String sqlQueryValue(Method method) {
        SqlQuery query = method.getAnnotation(SqlQuery.class);
        assertThat(query).as("Expected @SqlQuery on %s", method.getName()).isNotNull();
        return query.value();
    }

    private static String normalize(String sql) {
        return sql.replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
