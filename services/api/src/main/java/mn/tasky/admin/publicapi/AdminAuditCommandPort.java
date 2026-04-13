package mn.tasky.admin.publicapi;

public interface AdminAuditCommandPort {
    /**
     * Record a durable admin audit event.
     * Used for operator actions like concierge assignment that require evidence retention.
     */
    void recordAdminAction(String adminId, String actionType, String entityType, String entityId, String metadataJson);
}
