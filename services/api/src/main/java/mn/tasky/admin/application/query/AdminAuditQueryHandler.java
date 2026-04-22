package mn.tasky.admin.application.query;

import mn.tasky.admin.publicapi.AdminAuditQueryPort;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditQueryHandler implements AdminAuditQueryPort {

    private final AuditEventDao auditEventDao;

    public AdminAuditQueryHandler(AuditEventDao auditEventDao) {
        this.auditEventDao = auditEventDao;
    }

    @Override
    public boolean hasActionForResource(String action, String resourceId) {
        return auditEventDao.existsByActionAndResourceId(action, resourceId);
    }
}
