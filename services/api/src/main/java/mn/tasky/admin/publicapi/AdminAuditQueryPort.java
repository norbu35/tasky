package mn.tasky.admin.publicapi;

/**
 * Read-only access to admin audit events.
 * Used by workflow handlers to check for operator interventions like concierge assignment.
 */
public interface AdminAuditQueryPort {

    /**
     * Check whether a specific action was recorded for the given resource.
     *
     * @param action     The action type (e.g., "CONCIERGE_ASSIGN").
     * @param resourceId The resource identifier (e.g., bookingId).
     * @return true if at least one matching audit event exists.
     */
    boolean hasActionForResource(String action, String resourceId);
}
