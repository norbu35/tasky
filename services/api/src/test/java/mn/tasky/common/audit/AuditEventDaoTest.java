package mn.tasky.common.audit;

import static org.mockito.Mockito.verify;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditEventDaoTest {

    private final AuditEventDao dao =
            Mockito.mock(AuditEventDao.class, Mockito.withSettings().defaultAnswer(Mockito.CALLS_REAL_METHODS));

    @Test
    void insertStringDelegatesToUuidOverload() {
        String actorId = UUID.randomUUID().toString();
        String resourceId = UUID.randomUUID().toString();

        dao.insert(actorId, "BAN", "user", resourceId, "{\"reason\":\"spam\"}");

        verify(dao)
                .insert(UUID.fromString(actorId), "BAN", "user", UUID.fromString(resourceId), "{\"reason\":\"spam\"}");
    }

    @Test
    void insertHandlesNullIds() {
        dao.insert((String) null, "ACTION", "type", (String) null, "{}");

        verify(dao).insert((UUID) null, "ACTION", "type", (UUID) null, "{}");
    }

    @Test
    void existsByActionAndResourceIdDelegatesToUuidOverload() {
        String resourceId = UUID.randomUUID().toString();

        dao.existsByActionAndResourceId("BAN", resourceId);

        verify(dao).existsByActionAndResourceId("BAN", UUID.fromString(resourceId));
    }

    @Test
    void existsByActionAndResourceIdHandlesNullResourceId() {
        dao.existsByActionAndResourceId("UNBAN", (String) null);

        verify(dao).existsByActionAndResourceId("UNBAN", (UUID) null);
    }
}
