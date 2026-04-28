package mn.tasky.admin.application.command;

import static org.mockito.Mockito.verify;

import mn.tasky.common.audit.AuditEventDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuditCommandHandlerTest {

    @Mock
    private AuditEventDao auditEventDao;

    @InjectMocks
    private AdminAuditCommandHandler handler;

    @Test
    void recordAdminActionDelegatesToDao() {
        handler.recordAdminAction("admin-1", "BAN_USER", "user", "user-2", "{\"reason\":\"spam\"}");

        verify(auditEventDao).insert("admin-1", "BAN_USER", "user", "user-2", "{\"reason\":\"spam\"}");
    }

    @Test
    void recordAdminActionWithNullMetadata() {
        handler.recordAdminAction("admin-1", "APPROVE", "verification", "v-3", null);

        verify(auditEventDao).insert("admin-1", "APPROVE", "verification", "v-3", null);
    }
}
