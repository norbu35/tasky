package mn.tasky.admin.application.command;

import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditCommandHandler implements AdminAuditCommandPort {

    private final AuditEventDao auditEventDao;

    public AdminAuditCommandHandler(AuditEventDao auditEventDao) {
        this.auditEventDao = auditEventDao;
    }

    @Override
    public void recordAdminAction(String adminId, String actionType, String entityType, String entityId, String metadataJson) {
        auditEventDao.insert(adminId, actionType, entityType, entityId, metadataJson);
    }
}
