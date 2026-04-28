package mn.tasky.admin.application.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import mn.tasky.common.audit.AuditEventDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuditQueryHandlerTest {

    @Mock
    private AuditEventDao auditEventDao;

    @InjectMocks
    private AdminAuditQueryHandler handler;

    @Test
    void hasActionForResourceReturnsTrueWhenExists() {
        when(auditEventDao.existsByActionAndResourceId("BAN_USER", "user-123")).thenReturn(true);

        boolean result = handler.hasActionForResource("BAN_USER", "user-123");

        assertThat(result).isTrue();
        verify(auditEventDao).existsByActionAndResourceId("BAN_USER", "user-123");
    }

    @Test
    void hasActionForResourceReturnsFalseWhenNotExists() {
        when(auditEventDao.existsByActionAndResourceId("UNBAN_USER", "user-456"))
                .thenReturn(false);

        boolean result = handler.hasActionForResource("UNBAN_USER", "user-456");

        assertThat(result).isFalse();
    }
}
